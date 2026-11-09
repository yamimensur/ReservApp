package com.reservapp.asistencia.service;

import com.reservapp.asistencia.entity.Asistencia;
import com.reservapp.asistencia.repository.AsistenciaRepository;
import com.reservapp.comida.entity.Comida;
import com.reservapp.comida.entity.TipoComida;
import com.reservapp.exception.ReglaNegocioException;
import com.reservapp.reserva.dto.ReservaDelDiaResponse;
import com.reservapp.reserva.entity.*;
import com.reservapp.reserva.repository.ReservaRepository;
import com.reservapp.usuario.entity.Usuario;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class AsistenciaServiceTest {
    @Mock AsistenciaRepository asistencias;
    @Mock ReservaRepository reservas;
    @Mock UsuarioRepository usuarios;
    @Mock Reserva reserva;
    @Mock Usuario usuario;
    @Mock Comida comida;

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

    @Test
    void listaLasReservasActivasDelDiaConLaHoraDeAsistencia() {
        LocalDate fecha = LocalDate.of(2026, 11, 9);
        when(reserva.getId()).thenReturn(7L);
        when(reserva.getCodigo()).thenReturn("abc-7");
        when(reserva.getUsuario()).thenReturn(usuario);
        when(usuario.getCorreo()).thenReturn("ana@reservapp.demo");
        when(reserva.getFecha()).thenReturn(fecha);
        when(reserva.getEstado()).thenReturn(EstadoReserva.ACTIVA);
        when(comida.getId()).thenReturn(3L);
        when(comida.getNombre()).thenReturn("Curry");
        when(comida.getTipo()).thenReturn(TipoComida.PLATO_PRINCIPAL);
        when(reserva.getComidas()).thenReturn(Set.of(comida));
        when(reservas.findByFechaAndEstado(eq(fecha), eq(EstadoReserva.ACTIVA), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(reserva), PageRequest.of(0, 50), 1));
        Instant confirmada = Instant.parse("2026-11-09T15:10:00Z");
        when(asistencias.findByReservaIdIn(List.of(7L))).thenReturn(List.of(new Asistencia(reserva, usuario, confirmada)));

        var lista = new AsistenciaService(asistencias, reservas, usuarios, Clock.systemUTC())
                .listarDelDia(fecha, PageRequest.of(0, 50));

        assertThat(lista.getContent()).singleElement().satisfies(item -> {
            assertThat(item.correo()).isEqualTo("ana@reservapp.demo");
            assertThat(item.codigo()).isEqualTo("abc-7");
            assertThat(item.comidas()).extracting(ReservaDelDiaResponse.ComidaResponse::nombre).containsExactly("Curry");
            assertThat(item.asistenciaConfirmadaEn()).isEqualTo(confirmada);
        });
    }

    @Test
    void unDiaSinReservasNoConsultaAsistencias() {
        LocalDate fecha = LocalDate.of(2026, 11, 9);
        when(reservas.findByFechaAndEstado(eq(fecha), eq(EstadoReserva.ACTIVA), any(Pageable.class))).thenReturn(Page.empty());

        var lista = new AsistenciaService(asistencias, reservas, usuarios, Clock.systemUTC())
                .listarDelDia(fecha, PageRequest.of(0, 50));

        assertThat(lista.getContent()).isEmpty();
        verify(asistencias, never()).findByReservaIdIn(any());
    }
}
