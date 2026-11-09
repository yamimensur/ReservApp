package com.reservapp.asistencia.repository;
import com.reservapp.asistencia.entity.Asistencia;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    boolean existsByReservaId(Long reservaId);
    @EntityGraph(attributePaths = "reserva")
    List<Asistencia> findByReservaIdIn(Collection<Long> reservaIds);
}
