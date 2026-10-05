package com.reservapp.reserva.service;

import com.reservapp.exception.ReglaNegocioException;
import com.reservapp.notificacion.ComprobanteReserva;
import com.reservapp.notificacion.EstadoNotificacion;
import com.reservapp.notificacion.NotificadorCorreo;
import com.reservapp.reserva.dto.CrearReservaRequest;
import com.reservapp.reserva.dto.ReservaResponse;
import com.reservapp.reserva.entity.EstadoReserva;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CrearReservaConComprobanteTest {
    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final LocalDate FECHA = LocalDate.of(2026, 9, 2);

    @Mock ReservaService reservas;
    @Mock NotificadorCorreo notificador;
    CrearReservaConComprobante altas;

    @BeforeEach
    void setUp() {
        altas = new CrearReservaConComprobante(reservas, notificador,
                Clock.fixed(Instant.parse("2026-09-01T12:00:00Z"), ZONA));
    }

    @Test
    void proveedorOkCreaLaReservaYMarcaEnviada() {
        ReservaResponse guardada = reserva();
        when(reservas.crear(any(), any())).thenReturn(guardada);
        when(notificador.enviar(any())).thenReturn(EstadoNotificacion.ENVIADA);

        ReservaResponse respuesta = altas.crear(pedido(), "empleado@reservapp.demo");

        assertThat(respuesta.codigo()).isEqualTo("RES-1");
        assertThat(respuesta.notificacion()).isEqualTo(EstadoNotificacion.ENVIADA);
        ArgumentCaptor<ComprobanteReserva> comprobante = ArgumentCaptor.forClass(ComprobanteReserva.class);
        verify(notificador).enviar(comprobante.capture());
        assertThat(comprobante.getValue().destinatario()).isEqualTo("empleado@reservapp.demo");
        assertThat(comprobante.getValue().texto())
                .contains("Milanesa con puré", "Ensalada de estación", "Fruta fresca", "Agua mineral")
                .contains("2026-09-02")
                .contains("09:00")
                .contains("RES-1");
    }

    @Test
    void proveedorFallaYLaReservaQuedaIgual() {
        ReservaResponse guardada = reserva();
        when(reservas.crear(any(), any())).thenReturn(guardada);
        when(notificador.enviar(any())).thenReturn(EstadoNotificacion.NO_ENVIADA);

        ReservaResponse respuesta = altas.crear(pedido(), "empleado@reservapp.demo");

        assertThat(respuesta.id()).isEqualTo(guardada.id());
        assertThat(respuesta.codigo()).isEqualTo(guardada.codigo());
        assertThat(respuesta.comidas()).isEqualTo(guardada.comidas());
        assertThat(respuesta.notificacion()).isEqualTo(EstadoNotificacion.NO_ENVIADA);
    }

    @Test
    void reservaRechazadaNoEnviaCorreo() {
        when(reservas.crear(any(), any()))
                .thenThrow(new ReglaNegocioException(HttpStatus.CONFLICT, "Ya existe una reserva para la fecha indicada"));

        assertThatThrownBy(() -> altas.crear(pedido(), "empleado@reservapp.demo"))
                .isInstanceOf(ReglaNegocioException.class);
        verify(notificador, never()).enviar(any());
    }

    private static CrearReservaRequest pedido() {
        return new CrearReservaRequest(1L, FECHA, Set.of(1L, 2L, 4L, 5L));
    }

    private static ReservaResponse reserva() {
        return new ReservaResponse(8L, "RES-1", 1L, 1L, FECHA, EstadoReserva.ACTIVA, Instant.parse("2026-09-01T12:00:00Z"),
                List.of(
                        new ReservaResponse.ComidaResponse(1L, "Ensalada de estación", "ENTRADA"),
                        new ReservaResponse.ComidaResponse(2L, "Milanesa con puré", "PLATO_PRINCIPAL"),
                        new ReservaResponse.ComidaResponse(4L, "Fruta fresca", "POSTRE"),
                        new ReservaResponse.ComidaResponse(5L, "Agua mineral", "BEBIDA")),
                null);
    }
}
