package com.reservapp.notificacion;

import com.reservapp.comida.entity.TipoComida;
import com.reservapp.reserva.dto.ReservaResponse;

import java.time.ZoneId;

public record ComprobanteReserva(String destinatario, String codigo, String texto) {

    public static ComprobanteReserva de(ReservaResponse reserva, String correo, ZoneId zona) {
        StringBuilder cuerpo = new StringBuilder();
        cuerpo.append("Comprobante de tu reserva en ReservApp.\n\n");
        cuerpo.append("Día: ").append(reserva.fecha()).append('\n');
        cuerpo.append("Podés modificar o cancelar hasta las 09:00 del ").append(reserva.fecha());
        cuerpo.append(" (").append(zona).append(").\n\n");
        cuerpo.append("Elegiste:\n");
        for (TipoComida tipo : TipoComida.values()) {
            String nombres = reserva.comidas().stream()
                    .filter(comida -> tipo.name().equals(comida.tipo()))
                    .map(ReservaResponse.ComidaResponse::nombre)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("no elegiste");
            cuerpo.append("- ").append(etiqueta(tipo)).append(": ").append(nombres).append('\n');
        }
        cuerpo.append("\nCódigo de reserva: ").append(reserva.codigo()).append('\n');
        return new ComprobanteReserva(correo, reserva.codigo(), cuerpo.toString());
    }

    private static String etiqueta(TipoComida tipo) {
        return switch (tipo) {
            case ENTRADA -> "Entrada";
            case PLATO_PRINCIPAL -> "Plato principal";
            case POSTRE -> "Postre";
            case BEBIDA -> "Bebida";
        };
    }
}
