package com.reservapp.temporada.repository;

import com.reservapp.temporada.entity.SemanaTemporada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SemanaTemporadaRepository extends JpaRepository<SemanaTemporada, Long> {
    Optional<SemanaTemporada> findByTemporadaIdAndNumero(Long temporadaId, Short numero);
}
