package com.reservapp.asistencia.service;

import com.reservapp.asistencia.repository.AsistenciaRepository;
import com.reservapp.exception.ReglaNegocioException;
import com.reservapp.reserva.entity.*;
import com.reservapp.reserva.repository.ReservaRepository;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import java.time.Clock;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class AsistenciaServiceTest {
    @Mock AsistenciaRepository asistencias;
    @Mock ReservaRepository reservas;
    @Mock UsuarioRepository usuarios;
    @Mock Reserva reserva;

    @Test
    void noConfirmaDosVecesLaMismaAsistencia() {
        when(reservas.findDetalleById(1L)).thenReturn(Optional.of(reserva));
        when(reserva.getEstado()).thenReturn(EstadoReserva.ACTIVA);
        when(asistencias.existsByReservaId(1L)).thenReturn(true);
        AsistenciaService service = new AsistenciaService(asistencias, reservas, usuarios, Clock.systemUTC());

        assertThatThrownBy(() -> service.confirmar(1L, "admin@reservapp.demo"))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("ya fue confirmada");
    }
}
