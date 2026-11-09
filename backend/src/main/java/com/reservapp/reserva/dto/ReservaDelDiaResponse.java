package com.reservapp.reserva.dto;

import com.reservapp.reserva.entity.EstadoReserva;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Reserva activa de un día, con la hora de asistencia si ya fue confirmada. */
public record ReservaDelDiaResponse(Long id, String codigo, String correo, LocalDate fecha, EstadoReserva estado,
                                    List<ComidaResponse> comidas, Instant asistenciaConfirmadaEn) {
    public record ComidaResponse(Long id, String nombre, String tipo) {}
}
