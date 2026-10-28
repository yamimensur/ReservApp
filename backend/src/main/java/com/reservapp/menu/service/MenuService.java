package com.reservapp.menu.service;

import com.reservapp.comida.entity.Comida;
import com.reservapp.comida.entity.EstadoComida;
import com.reservapp.exception.RecursoNoEncontradoException;
import com.reservapp.menu.dto.MenuResponse;
import com.reservapp.menu.dto.MenuResponse.ComidaMenuResponse;
import com.reservapp.menu.entity.MenuDiario;
import com.reservapp.menu.repository.MenuDiarioRepository;
import com.reservapp.temporada.entity.EstadoTemporada;
import com.reservapp.temporada.entity.SemanaTemporada;
import com.reservapp.temporada.entity.Temporada;
import com.reservapp.temporada.repository.SemanaTemporadaRepository;
import com.reservapp.temporada.repository.TemporadaRepository;
import com.reservapp.usuario.entity.RestriccionAlimenticia;
import com.reservapp.usuario.entity.Usuario;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.Set;

@Service
public class MenuService {
    private final TemporadaRepository temporadas;
    private final SemanaTemporadaRepository semanas;
    private final MenuDiarioRepository menus;
    private final UsuarioRepository usuarios;

    public MenuService(TemporadaRepository temporadas, SemanaTemporadaRepository semanas,
                       MenuDiarioRepository menus, UsuarioRepository usuarios) {
        this.temporadas = temporadas;
        this.semanas = semanas;
        this.menus = menus;
        this.usuarios = usuarios;
    }

    @Transactional(readOnly = true)
    public MenuResponse consultarMenu(LocalDate fecha, String correo) {
        Usuario usuario = usuarios.findByCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario autenticado"));

        Temporada temporada = temporadas
                .findByEstadoAndFechaDesdeIsLessThanEqualAndFechaHastaIsGreaterThanEqual(
                        EstadoTemporada.PUBLICADA, fecha, fecha)
                .orElseThrow(() -> new RecursoNoEncontradoException("No hay un menú publicado para la fecha indicada"));

        short semanaNumero = (short) (ChronoUnit.WEEKS.between(temporada.getFechaDesde(), fecha) % 4 + 1);

        SemanaTemporada semana = semanas.findByTemporadaIdAndNumero(temporada.getId(), semanaNumero)
                .orElseThrow(() -> new RecursoNoEncontradoException("No hay un menú publicado para la fecha indicada"));

        MenuDiario menu = menus.findBySemanaIdAndDiaSemana(semana.getId(), fecha.getDayOfWeek())
                .orElseThrow(() -> new RecursoNoEncontradoException("No hay un menú publicado para la fecha indicada"));

        Set<RestriccionAlimenticia> restriccionesUsuario = usuario.getRestricciones();

        var comidas = menu.getComidas().stream()
                .sorted(Comparator.comparing((Comida c) -> c.getTipo().ordinal()).thenComparing(Comida::getNombre))
                .map(c -> new ComidaMenuResponse(
                        c.getId(),
                        c.getNombre(),
                        c.getTipo().name(),
                        esCompatible(c, restriccionesUsuario)))
                .toList();

        return new MenuResponse(menu.getId(), fecha, comidas);
    }

    private boolean esCompatible(Comida comida, Set<RestriccionAlimenticia> restriccionesUsuario) {
        if (comida.getEstado() != EstadoComida.ACTIVA) return false;
        if (restriccionesUsuario.isEmpty()) return true;
        return comida.getRestriccionesCompatibles().containsAll(restriccionesUsuario);
    }
}
