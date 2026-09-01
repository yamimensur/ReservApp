package com.reservapp.asistencia.repository;
import com.reservapp.asistencia.entity.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    boolean existsByReservaId(Long reservaId);
}
