package com.reservapp.exception;

import com.reservapp.asistencia.service.AsistenciaService;
import com.reservapp.auth.controller.AuthController;
import com.reservapp.auth.service.AuthService;
import com.reservapp.config.JwtConfig;
import com.reservapp.config.SecurityConfig;
import com.reservapp.reserva.controller.ReservaController;
import com.reservapp.reserva.service.CrearReservaConComprobante;
import com.reservapp.reserva.service.ReservaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({AuthController.class, ReservaController.class})
@Import({SecurityConfig.class, JwtConfig.class})
@TestPropertySource(properties = "app.jwt.secret=secreto-solo-para-tests-de-al-menos-32-caracteres")
class ManejoDeErroresTest {
    @Autowired MockMvc mvc;
    @MockitoBean AuthService auth;
    @MockitoBean ReservaService reservas;
    @MockitoBean CrearReservaConComprobante altas;
    @MockitoBean AsistenciaService asistencias;

    private static RequestPostProcessor empleado() {
        return jwt().jwt(token -> token.subject("empleado@reservapp.demo"))
                .authorities(new SimpleGrantedAuthority("ROLE_EMPLEADO"));
    }

    @Test
    void unJsonMalEscritoResponde400() throws Exception {
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"empleado@reservapp.demo\""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El cuerpo de la solicitud no es un JSON válido"));
    }

    @Test
    void unIdNoNumericoResponde400() throws Exception {
        mvc.perform(get("/api/v1/reservas/abc").with(empleado()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El parámetro 'id' tiene un formato inválido"));
    }

    @Test
    void unaRutaInexistenteResponde404() throws Exception {
        mvc.perform(get("/api/v1/no-existe").with(empleado()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("La ruta no existe"));
    }
}