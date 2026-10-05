package com.reservapp.reserva.service;

import com.reservapp.notificacion.ComprobanteReserva;
import com.reservapp.notificacion.EstadoNotificacion;
import com.reservapp.notificacion.NotificadorCorreo;
import com.reservapp.reserva.dto.CrearReservaRequest;
import com.reservapp.reserva.dto.ReservaResponse;
import org.springframework.stereotype.Service;

import java.time.Clock;

/**
 * El alta transaccional vive en {@link ReservaService#crear}. Este método la
 * llama y, recién cuando ese método volvió (la transacción ya hizo commit),
 * pide el comprobante. Si el correo se mandara adentro de la transacción y
 * después el guardado fallara, la persona recibiría un comprobante de una
 * reserva que no existe.
 */
@Service
public class CrearReservaConComprobante {
    private final ReservaService reservas;
    private final NotificadorCorreo notificador;
    private final Clock clock;

    public CrearReservaConComprobante(ReservaService reservas, NotificadorCorreo notificador, Clock clock) {
        this.reservas = reservas;
        this.notificador = notificador;
        this.clock = clock;
    }

    public ReservaResponse crear(CrearReservaRequest request, String correo) {
        ReservaResponse creada = reservas.crear(request, correo);
        EstadoNotificacion notificacion = notificador.enviar(ComprobanteReserva.de(creada, correo, clock.getZone()));
        return creada.conNotificacion(notificacion);
    }
}
