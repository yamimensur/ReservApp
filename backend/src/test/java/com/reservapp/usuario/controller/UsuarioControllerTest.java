package com.reservapp.usuario.controller;

import com.reservapp.config.JwtConfig;
import com.reservapp.config.SecurityConfig;
import com.reservapp.usuario.dto.UsuarioResponse;
import com.reservapp.usuario.entity.RolNombre;
import com.reservapp.usuario.entity.TipoUsuario;
import com.reservapp.usuario.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UsuarioController.class)
@Import({SecurityConfig.class, JwtConfig.class})
@TestPropertySource(properties = "app.jwt.secret=secreto-solo-para-tests-de-al-menos-32-caracteres")
class UsuarioControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean UsuarioService usuarios;

    @Test
    void conTokenDevuelveElPerfilDelUsuarioDelToken() throws Exception {
        when(usuarios.perfil("empleado@reservapp.demo")).thenReturn(new UsuarioResponse(
                1L, "empleado@reservapp.demo", RolNombre.EMPLEADO, TipoUsuario.EMPLEADO, List.of("Celíaco")));

        mvc.perform(get("/api/v1/usuarios/me")
                        .with(jwt().jwt(t -> t.subject("empleado@reservapp.demo"))
                                .authorities(new SimpleGrantedAuthority("ROLE_EMPLEADO"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correo").value("empleado@reservapp.demo"))
                .andExpect(jsonPath("$.rol").value("EMPLEADO"))
                .andExpect(jsonPath("$.restricciones[0]").value("Celíaco"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void sinTokenResponde401() throws Exception {
        mvc.perform(get("/api/v1/usuarios/me"))
                .andExpect(status().isUnauthorized());
    }
}