package com.reservapp.asistencia.controller;

import com.reservapp.asistencia.service.AsistenciaService;
import com.reservapp.config.JwtConfig;
import com.reservapp.config.SecurityConfig;
import com.reservapp.reserva.dto.ReservaDelDiaResponse;
import com.reservapp.reserva.entity.EstadoReserva;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AsistenciaController.class)
@Import({SecurityConfig.class, JwtConfig.class})
@TestPropertySource(properties = "app.jwt.secret=secreto-solo-para-tests-de-al-menos-32-caracteres")
class AsistenciaControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean AsistenciaService asistencias;

    private static RequestPostProcessor admin() {
        return jwt().jwt(token -> token.subject("admin@reservapp.demo"))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"));
    }

    private static RequestPostProcessor empleado() {
        return jwt().jwt(token -> token.subject("empleado@reservapp.demo"))
                .authorities(new SimpleGrantedAuthority("ROLE_EMPLEADO"));
    }

    @Test
    void administradorListaLasReservasActivasDeLaFecha() throws Exception {
        when(asistencias.listarDelDia(eq(LocalDate.of(2026, 11, 9)), any()))
                .thenReturn(new PageImpl<>(List.of(new ReservaDelDiaResponse(
                        7L, "abc-7", "ana@reservapp.demo", LocalDate.of(2026, 11, 9), EstadoReserva.ACTIVA,
                        List.of(new ReservaDelDiaResponse.ComidaResponse(3L, "Curry", "PLATO_PRINCIPAL")),
                        Instant.parse("2026-11-09T15:10:00Z"))), PageRequest.of(0, 50), 1));

        mvc.perform(get("/api/v1/asistencias").param("fecha", "2026-11-09").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].codigo").value("abc-7"))
                .andExpect(jsonPath("$.content[0].correo").value("ana@reservapp.demo"))
                .andExpect(jsonPath("$.content[0].comidas[0].nombre").value("Curry"))
                .andExpect(jsonPath("$.content[0].asistenciaConfirmadaEn").value("2026-11-09T15:10:00Z"));
    }

    @Test
    void empleadoNoPuedeVerLasReservasDelDia() throws Exception {
        mvc.perform(get("/api/v1/asistencias").param("fecha", "2026-11-09").with(empleado()))
                .andExpect(status().isForbidden());
    }

    @Test
    void sinTokenResponde401() throws Exception {
        mvc.perform(get("/api/v1/asistencias").param("fecha", "2026-11-09"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unaFechaMalEscritaResponde400() throws Exception {
        mvc.perform(get("/api/v1/asistencias").param("fecha", "manana").with(admin()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El parámetro 'fecha' tiene un formato inválido"));
    }
}
