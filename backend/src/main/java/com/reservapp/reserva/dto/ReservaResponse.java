package com.reservapp.reserva.dto;
import com.reservapp.reserva.entity.EstadoReserva;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
public record ReservaResponse(Long id, String codigo, Long usuarioId, Long menuId, LocalDate fecha,
                              EstadoReserva estado, Instant creadaEn, List<ComidaResponse> comidas) {
    public record ComidaResponse(Long id, String nombre, String tipo) {}
}
