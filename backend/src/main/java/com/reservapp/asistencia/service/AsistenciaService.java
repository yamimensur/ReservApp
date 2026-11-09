package com.reservapp.asistencia.service;
import com.reservapp.asistencia.dto.AsistenciaResponse;
import com.reservapp.asistencia.entity.Asistencia;
import com.reservapp.asistencia.repository.AsistenciaRepository;
import com.reservapp.comida.entity.Comida;
import com.reservapp.exception.*;
import com.reservapp.reserva.dto.ReservaDelDiaResponse;
import com.reservapp.reserva.entity.EstadoReserva;
import com.reservapp.reserva.entity.Reserva;
import com.reservapp.reserva.repository.ReservaRepository;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

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

    @Transactional(readOnly = true)
    public Page<ReservaDelDiaResponse> listarDelDia(LocalDate fecha, Pageable pageable) {
        Page<Reserva> delDia = reservas.findByFechaAndEstado(fecha, EstadoReserva.ACTIVA, pageable);
        Map<Long, Instant> confirmadas = delDia.isEmpty() ? Map.of()
                : asistencias.findByReservaIdIn(delDia.stream().map(Reserva::getId).toList()).stream()
                .collect(Collectors.toMap(a -> a.getReserva().getId(), Asistencia::getConfirmadaEn, (primera, duplicada) -> primera));
        return delDia.map(reserva -> respuestaDelDia(reserva, confirmadas.get(reserva.getId())));
    }

    private ReservaDelDiaResponse respuestaDelDia(Reserva reserva, Instant confirmadaEn) {
        var comidas = reserva.getComidas().stream()
                .sorted(Comparator.comparing(Comida::getId))
                .map(c -> new ReservaDelDiaResponse.ComidaResponse(c.getId(), c.getNombre(), c.getTipo().name()))
                .toList();
        return new ReservaDelDiaResponse(reserva.getId(), reserva.getCodigo(), reserva.getUsuario().getCorreo(),
                reserva.getFecha(), reserva.getEstado(), comidas, confirmadaEn);
    }
}
