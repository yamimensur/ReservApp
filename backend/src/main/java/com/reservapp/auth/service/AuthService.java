package com.reservapp.auth.service;

import com.reservapp.auth.dto.LoginRequest;
import com.reservapp.auth.dto.LoginResponse;
import com.reservapp.exception.CredencialesInvalidasException;
import com.reservapp.usuario.entity.EstadoUsuario;
import com.reservapp.usuario.entity.Usuario;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
public class AuthService {
    // Hash de un texto al azar. Si el correo no existe se compara contra este,
    // para que la respuesta tarde lo mismo que con un correo real.
    private static final String HASH_SENUELO = "$2a$10$inzpoHymC3zEjbgdJicWj.OcWjXl8pOErJ91v6c.CdZ1CwfJkYGky";

    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final Clock clock;
    private final Duration duracion;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
                       Clock clock, @Value("${app.jwt.expiracion-minutos}") long minutos) {
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.clock = clock;
        this.duracion = Duration.ofMinutes(minutos);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarios.findByCorreo(request.correo().trim().toLowerCase()).orElse(null);
        boolean coincide = passwordEncoder.matches(request.password(),
                usuario != null ? usuario.getPasswordHash() : HASH_SENUELO);
        // Mismo error para correo inexistente, contraseña incorrecta o usuario inactivo
        if (usuario == null || !coincide || usuario.getEstado() != EstadoUsuario.ACTIVO)
            throw new CredencialesInvalidasException();

        Instant ahora = clock.instant();
        Instant vence = ahora.plus(duracion);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("reservapp")
                .subject(usuario.getCorreo())
                .issuedAt(ahora)
                .expiresAt(vence)
                .claim("rol", usuario.getRol().getNombre().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new LoginResponse(token, "Bearer", vence);
    }
}