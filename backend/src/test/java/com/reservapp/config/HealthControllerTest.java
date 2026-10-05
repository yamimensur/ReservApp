package com.reservapp.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HealthController.class)
@Import({SecurityConfig.class, JwtConfig.class})
@TestPropertySource(properties = {
        "app.cors.allowed-origins=https://reservapp.vercel.app",
        "app.jwt.secret=secreto-solo-para-tests-de-al-menos-32-caracteres"})
class HealthControllerTest {
    @Autowired MockMvc mockMvc;

    @Test
    void permiteConsultarLaSaludSinAutenticacion() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.application").value("ReservApp API"));
    }

    @Test
    void permiteCorsDesdeElFrontendConfigurado() throws Exception {
        mockMvc.perform(options("/api/v1/health")
                        .header(HttpHeaders.ORIGIN, "https://reservapp.vercel.app")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "https://reservapp.vercel.app"));
    }
}
