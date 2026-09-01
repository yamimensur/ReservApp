package com.reservapp.asistencia.dto;
import java.time.Instant;
public record AsistenciaResponse(Long id, Long reservaId, Long administradorId, Instant confirmadaEn) {}
