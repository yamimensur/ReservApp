package com.reservapp.asistencia.service;
import com.reservapp.asistencia.dto.AsistenciaResponse;
import com.reservapp.asistencia.entity.Asistencia;
import com.reservapp.asistencia.repository.AsistenciaRepository;
import com.reservapp.exception.*;
import com.reservapp.reserva.entity.EstadoReserva;
import com.reservapp.reserva.repository.ReservaRepository;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;

@Service
public class AsistenciaService {
    private final AsistenciaRepository asistencias; private final ReservaRepository reservas;
    private final UsuarioRepository usuarios; private final Clock clock;
    public AsistenciaService(AsistenciaRepository asistencias, ReservaRepository reservas, UsuarioRepository usuarios, Clock clock) {
        this.asistencias = asistencias; this.reservas = reservas; this.usuarios = usuarios; this.clock = clock;
    }
    @Transactional
    public AsistenciaResponse confirmar(Long reservaId, String correoAdministrador) {
        var reserva = reservas.findDetalleById(reservaId).orElseThrow(() -> new RecursoNoEncontradoException("No existe la reserva"));
        if (reserva.getEstado() != EstadoReserva.ACTIVA)
            throw new ReglaNegocioException(HttpStatus.CONFLICT, "Solo puede confirmarse una reserva activa");
        if (asistencias.existsByReservaId(reservaId))
            throw new ReglaNegocioException(HttpStatus.CONFLICT, "La asistencia ya fue confirmada");
        var admin = usuarios.findByCorreo(correoAdministrador).orElseThrow(() -> new RecursoNoEncontradoException("No existe el administrador autenticado"));
        Asistencia a = asistencias.save(new Asistencia(reserva, admin, clock.instant()));
        return new AsistenciaResponse(a.getId(), reservaId, admin.getId(), a.getConfirmadaEn());
    }
}
