package com.reservapp.reserva.repository;

import com.reservapp.reserva.entity.Reserva;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    boolean existsByUsuarioIdAndFecha(Long usuarioId, LocalDate fecha);
    @EntityGraph(attributePaths = {"usuario", "menu", "comidas"})
    Optional<Reserva> findDetalleById(Long id);
    @EntityGraph(attributePaths = {"usuario", "menu", "comidas"})
    Optional<Reserva> findDetalleByIdAndUsuarioCorreo(Long id, String correo);
    @EntityGraph(attributePaths = {"usuario", "menu", "comidas"})
    Page<Reserva> findByUsuarioId(Long usuarioId, Pageable pageable);
}
