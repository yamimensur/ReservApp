package com.reservapp.reserva.dto;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;
public record CrearReservaRequest(
        @NotNull Long menuId,
        @NotNull @FutureOrPresent LocalDate fecha,
        @NotEmpty Set<@NotNull Long> comidaIds) {}
