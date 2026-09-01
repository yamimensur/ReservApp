package com.reservapp.reserva.dto;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
public record ModificarReservaRequest(@NotEmpty Set<@NotNull Long> comidaIds) {}
