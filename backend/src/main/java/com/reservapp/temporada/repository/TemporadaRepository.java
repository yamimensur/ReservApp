package com.reservapp.temporada.repository;

import com.reservapp.temporada.entity.EstadoTemporada;
import com.reservapp.temporada.entity.Temporada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface TemporadaRepository extends JpaRepository<Temporada, Long> {
    Optional<Temporada> findByEstadoAndFechaDesdeIsLessThanEqualAndFechaHastaIsGreaterThanEqual(
            EstadoTemporada estado, LocalDate fecha, LocalDate mismaFecha);
}
