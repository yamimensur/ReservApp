package com.reservapp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@ActiveProfiles("demo")
class ModeloDominioIT {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired JdbcTemplate jdbcTemplate;

    @Test
    void aplicaMigracionYCargaFlujoPrincipal() {
        assertThat(count("SELECT COUNT(*) FROM flyway_schema_history WHERE success")).isPositive();
        assertThat(count("SELECT COUNT(*) FROM semana_temporada WHERE temporada_id = 1")).isEqualTo(4);
        assertThat(count("SELECT COUNT(*) FROM reserva WHERE codigo = 'DEMO-RESERVA-001'")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM asistencia WHERE reserva_id = 2")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM liquidacion_mensual WHERE usuario_id = 2")).isEqualTo(1);
    }

    @Test
    void creaIndicesParaForeignKeysConsultadas() {
        assertThat(count("""
                SELECT COUNT(*) FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname IN ('idx_usuario_rol_id', 'idx_reserva_menu_id',
                                    'idx_asistencia_administrador_id', 'idx_asistencia_liquidacion_id')
                """)).isEqualTo(4);
    }

    private int count(String sql) {
        Integer result = jdbcTemplate.queryForObject(sql, Integer.class);
        return result == null ? 0 : result;
    }
}
