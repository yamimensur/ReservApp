package com.reservapp.reserva;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reservapp.notificacion.NotificadorCorreo;
import com.reservapp.reserva.entity.EstadoReserva;
import com.reservapp.reserva.repository.ReservaRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.Properties;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest(properties = "app.jwt.secret=secreto-solo-para-tests-de-al-menos-32-caracteres")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import(ReservaTrasCancelarIT.Reloj.class)
class ReservaTrasCancelarIT {
    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    // La validación @FutureOrPresent del DTO utiliza la fecha del sistema.
    private static final LocalDate FECHA = LocalDate.now(ZONA)
            .with(TemporalAdjusters.next(DayOfWeek.TUESDAY)).plusWeeks(1);
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @TestConfiguration
    static class Reloj {
        @Bean @Primary
        Clock relojDePrueba() {
            return Clock.fixed(FECHA.atTime(8, 0).atZone(ZONA).toInstant(), ZONA);
        }
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired ReservaRepository reservas;
    @MockitoBean NotificadorCorreo notificador;

    @Test
    void actualizaUnaBaseEnV1SinPerderElHistorial() {
        var configuracion = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas("actualizacion").defaultSchema("actualizacion")
                .locations("classpath:db/migration", "classpath:db/seed");
        configuracion.target("1").load().migrate();
        var datasource = new DriverManagerDataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
        Properties propiedades = new Properties();
        propiedades.setProperty("currentSchema", "actualizacion");
        datasource.setConnectionProperties(propiedades);
        JdbcTemplate baseAnterior = new JdbcTemplate(datasource);
        baseAnterior.update("UPDATE reserva SET estado = 'CANCELADA' WHERE id = 1");

        configuracion.target("latest").load().migrate();

        baseAnterior.update("""
                INSERT INTO reserva (codigo, usuario_id, menu_id, fecha, estado, creada_en)
                SELECT 'TRAS-ACTUALIZAR', usuario_id, menu_id, fecha, 'ACTIVA', CURRENT_TIMESTAMP
                FROM reserva WHERE id = 1
                """);
        assertThat(baseAnterior.queryForObject("SELECT estado FROM reserva WHERE id = 1", String.class))
                .isEqualTo("CANCELADA");
        assertThat(baseAnterior.queryForObject("SELECT COUNT(*) FROM reserva WHERE usuario_id = 1", Integer.class))
                .isEqualTo(2);
        assertThat(baseAnterior.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version = '2' AND success",
                Integer.class)).isEqualTo(1);
    }

    @Test
    void cancelarPermiteReservarOtraVezYSeMantieneLaUnicidadDeActivas() throws Exception {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version = '2' AND success",
                Integer.class)).isEqualTo(1);
        jdbc.update("UPDATE temporada SET fecha_desde = ?, fecha_hasta = ? WHERE id = 1", FECHA, FECHA.plusWeeks(4));
        String pedido = """
                {"menuId":2,"fecha":"%s","comidaIds":[3]}
                """.formatted(FECHA);
        var empleado = jwt().jwt(token -> token.subject("empleado@reservapp.demo"))
                .authorities(new SimpleGrantedAuthority("ROLE_EMPLEADO"));

        String primera = mvc.perform(post("/api/v1/reservas").with(empleado)
                        .contentType("application/json").content(pedido))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = mapper.readTree(primera).get("id").asLong();
        mvc.perform(delete("/api/v1/reservas/{id}", id).with(empleado))
                .andExpect(status().isNoContent());
        assertThat(reservas.existsByUsuarioIdAndFechaAndEstado(1L, FECHA, EstadoReserva.ACTIVA))
                .isFalse();

        String segunda = mvc.perform(post("/api/v1/reservas").with(empleado)
                        .contentType("application/json").content(pedido))
                .andExpect(status().isCreated()).andExpect(jsonPath("estado").value("ACTIVA"))
                .andReturn().getResponse().getContentAsString();
        assertThat(mapper.readTree(segunda).get("id").asLong()).isNotEqualTo(id);
        assertThat(reservas.findById(id).orElseThrow().getEstado()).isEqualTo(EstadoReserva.CANCELADA);

        mvc.perform(post("/api/v1/reservas").with(empleado).contentType("application/json").content(pedido))
                .andExpect(status().isConflict());

        // Omite el chequeo del servicio: el índice debe proteger también solicitudes simultáneas.
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO reserva (codigo, usuario_id, menu_id, fecha, estado, creada_en)
                VALUES ('OTRA-ACTIVA', 1, 2, ?, 'ACTIVA', CURRENT_TIMESTAMP)
                """, FECHA))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("uk_reserva_usuario_fecha_activa");
        // Otra fecha sigue admitiendo una reserva activa del mismo usuario.
        jdbc.update("""
                INSERT INTO reserva (codigo, usuario_id, menu_id, fecha, estado, creada_en)
                VALUES ('OTRA-FECHA', 1, 3, ?, 'ACTIVA', CURRENT_TIMESTAMP)
                """, FECHA.plusDays(1));
        assertThat(reservas.existsByUsuarioIdAndFechaAndEstado(1L, FECHA.plusDays(1), EstadoReserva.ACTIVA))
                .isTrue();
    }
}
