package com.reservapp.menu.dto;

import java.time.LocalDate;
import java.util.List;

/** Respuesta de GET /api/v1/menus?fecha=: el menú aplicable a una fecha con sus comidas agrupadas por tipo. */
public record MenuResponse(Long id, LocalDate fecha, List<ComidaMenuResponse> comidas) {
    public record ComidaMenuResponse(Long id, String nombre, String tipo, boolean compatible) {}
}
