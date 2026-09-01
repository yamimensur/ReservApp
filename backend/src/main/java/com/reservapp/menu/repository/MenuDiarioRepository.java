package com.reservapp.menu.repository;
import com.reservapp.menu.entity.MenuDiario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface MenuDiarioRepository extends JpaRepository<MenuDiario, Long> {
    @EntityGraph(attributePaths = {"comidas", "semana", "semana.temporada"})
    Optional<MenuDiario> findDetalleById(Long id);
}
