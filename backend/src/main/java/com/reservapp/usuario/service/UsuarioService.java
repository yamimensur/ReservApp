package com.reservapp.usuario.service;

import com.reservapp.exception.RecursoNoEncontradoException;
import com.reservapp.usuario.dto.UsuarioResponse;
import com.reservapp.usuario.entity.RestriccionAlimenticia;
import com.reservapp.usuario.entity.Usuario;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarios;

    public UsuarioService(UsuarioRepository usuarios) { this.usuarios = usuarios; }

    // readOnly: solo lee. La transacción hace falta porque rol y restricciones son LAZY (open-in-view: false).
    @Transactional(readOnly = true)
    public UsuarioResponse perfil(String correo) {
        Usuario u = usuarios.findByCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario autenticado"));
        var restricciones = u.getRestricciones().stream().map(RestriccionAlimenticia::getNombre).sorted().toList();
        return new UsuarioResponse(u.getId(), u.getCorreo(), u.getRol().getNombre(), u.getTipoUsuario(), restricciones);
    }
}