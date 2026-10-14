package com.reservapp.usuario.controller;

import com.reservapp.usuario.dto.UsuarioResponse;
import com.reservapp.usuario.service.UsuarioService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {
    private final UsuarioService usuarios;

    public UsuarioController(UsuarioService usuarios) { this.usuarios = usuarios; }

    // Sin @PreAuthorize: cualquier rol logueado puede ver SU perfil.
    // La identidad sale del token (auth.getName() = sub = correo), nunca de la URL.
    @GetMapping("/me")
    public UsuarioResponse me(Authentication auth) { return usuarios.perfil(auth.getName()); }
}
