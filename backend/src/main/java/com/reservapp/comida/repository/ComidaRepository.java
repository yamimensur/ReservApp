package com.reservapp.comida.repository;
import com.reservapp.comida.entity.Comida;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
public interface ComidaRepository extends JpaRepository<Comida, Long> {
    @EntityGraph(attributePaths = "restriccionesCompatibles")
    List<Comida> findByIdIn(Collection<Long> ids);
}
