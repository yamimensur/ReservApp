package com.reservapp.usuario.dto;

import com.reservapp.usuario.entity.RolNombre;
import com.reservapp.usuario.entity.TipoUsuario;
import java.util.List;

/** Lo que el front necesita saber del usuario logueado. Nunca incluye el hash de la contraseña. */
public record UsuarioResponse(Long id, String correo, RolNombre rol, TipoUsuario tipoUsuario,
                              List<String> restricciones) {}