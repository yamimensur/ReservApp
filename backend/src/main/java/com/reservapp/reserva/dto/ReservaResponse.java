package com.reservapp.reserva.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.reservapp.notificacion.EstadoNotificacion;
import com.reservapp.reserva.entity.EstadoReserva;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ReservaResponse(Long id, String codigo, Long usuarioId, Long menuId, LocalDate fecha,
                              EstadoReserva estado, Instant creadaEn, List<ComidaResponse> comidas,
                              @JsonInclude(JsonInclude.Include.NON_NULL) EstadoNotificacion notificacion) {
    public record ComidaResponse(Long id, String nombre, String tipo) {}

    public ReservaResponse conNotificacion(EstadoNotificacion notificacion) {
        return new ReservaResponse(id, codigo, usuarioId, menuId, fecha, estado, creadaEn, comidas, notificacion);
    }
}
