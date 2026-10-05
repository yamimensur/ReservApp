package com.reservapp.notificacion;

public interface NotificadorCorreo {
    EstadoNotificacion enviar(ComprobanteReserva comprobante);
}
