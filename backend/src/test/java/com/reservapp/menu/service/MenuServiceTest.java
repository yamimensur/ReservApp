package com.reservapp.menu.service;

import com.reservapp.comida.entity.Comida;
import com.reservapp.comida.entity.EstadoComida;
import com.reservapp.comida.entity.TipoComida;
import com.reservapp.exception.RecursoNoEncontradoException;
import com.reservapp.menu.dto.MenuResponse;
import com.reservapp.menu.entity.MenuDiario;
import com.reservapp.menu.repository.MenuDiarioRepository;
import com.reservapp.temporada.entity.*;
import com.reservapp.temporada.repository.SemanaTemporadaRepository;
import com.reservapp.temporada.repository.TemporadaRepository;
import com.reservapp.usuario.entity.*;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class MenuServiceTest {
    @Mock TemporadaRepository temporadas;
    @Mock SemanaTemporadaRepository semanas;
    @Mock MenuDiarioRepository menus;
    @Mock UsuarioRepository usuarios;

    private static final String CORREO = "empleado@reservapp.demo";
    // martes 2026-09-01
    private static final LocalDate FECHA = LocalDate.of(2026, 9, 1);

    private MenuService service() {
        return new MenuService(temporadas, semanas, menus, usuarios);
    }

    @Test
    void devuelveElMenuConCompatibilidadParaElUsuario() {
        RestriccionAlimenticia vegetariana = new RestriccionAlimenticia(1L, "Vegetariana", null);
        Usuario usuario = new Usuario(1L, CORREO, TipoUsuario.EMPLEADO, EstadoUsuario.ACTIVO, null, Set.of(vegetariana));
        Temporada temporada = new Temporada(1L, "Demo", Estacion.INVIERNO, FECHA.minusDays(30), FECHA.plusDays(60), EstadoTemporada.PUBLICADA);
        SemanaTemporada semana = new SemanaTemporada(1L, temporada, (short) 1);
        Comida principal = new Comida(2L, "Milanesa con puré", TipoComida.PLATO_PRINCIPAL, EstadoComida.ACTIVA, Set.of());
        Comida principalVeg = new Comida(3L, "Curry de garbanzos", TipoComida.PLATO_PRINCIPAL, EstadoComida.ACTIVA, Set.of(vegetariana));
        Comida entrada = new Comida(1L, "Ensalada", TipoComida.ENTRADA, EstadoComida.ACTIVA, Set.of(vegetariana));
        MenuDiario menu = new MenuDiario(1L, semana, DayOfWeek.TUESDAY, Set.of(entrada, principal, principalVeg));

        when(usuarios.findByCorreo(CORREO)).thenReturn(Optional.of(usuario));
        when(temporadas.findByEstadoAndFechaDesdeIsLessThanEqualAndFechaHastaIsGreaterThanEqual(
                EstadoTemporada.PUBLICADA, FECHA, FECHA)).thenReturn(Optional.of(temporada));
        when(semanas.findByTemporadaIdAndNumero(1L, (short) 1)).thenReturn(Optional.of(semana));
        when(menus.findBySemanaIdAndDiaSemana(1L, DayOfWeek.TUESDAY)).thenReturn(Optional.of(menu));

        MenuResponse response = service().consultarMenu(FECHA, CORREO);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.fecha()).isEqualTo(FECHA);
        assertThat(response.comidas()).hasSize(3);
        // La entrada (Ensalada) es compatible: tiene la restricción vegetariana
        assertThat(response.comidas()).filteredOn(c -> c.nombre().equals("Ensalada"))
                .singleElement().satisfies(c -> assertThat(c.compatible()).isTrue());
        // El curry es compatible: tiene la restricción vegetariana
        assertThat(response.comidas()).filteredOn(c -> c.nombre().equals("Curry de garbanzos"))
                .singleElement().satisfies(c -> assertThat(c.compatible()).isTrue());
        // La milanesa NO es compatible: no tiene la restricción vegetariana
        assertThat(response.comidas()).filteredOn(c -> c.nombre().equals("Milanesa con puré"))
                .singleElement().satisfies(c -> assertThat(c.compatible()).isFalse());
    }

    @Test
    void paraUnUsuarioSinRestriccionesTodoEsCompatible() {
        Usuario usuario = new Usuario(1L, CORREO, TipoUsuario.EMPLEADO, EstadoUsuario.ACTIVO, null, Set.of());
        Temporada temporada = new Temporada(1L, "Demo", Estacion.INVIERNO, FECHA.minusDays(30), FECHA.plusDays(60), EstadoTemporada.PUBLICADA);
        SemanaTemporada semana = new SemanaTemporada(1L, temporada, (short) 1);
        Comida principal = new Comida(2L, "Milanesa con puré", TipoComida.PLATO_PRINCIPAL, EstadoComida.ACTIVA, Set.of());
        MenuDiario menu = new MenuDiario(1L, semana, DayOfWeek.TUESDAY, Set.of(principal));

        when(usuarios.findByCorreo(CORREO)).thenReturn(Optional.of(usuario));
        when(temporadas.findByEstadoAndFechaDesdeIsLessThanEqualAndFechaHastaIsGreaterThanEqual(
                EstadoTemporada.PUBLICADA, FECHA, FECHA)).thenReturn(Optional.of(temporada));
        when(semanas.findByTemporadaIdAndNumero(1L, (short) 1)).thenReturn(Optional.of(semana));
        when(menus.findBySemanaIdAndDiaSemana(1L, DayOfWeek.TUESDAY)).thenReturn(Optional.of(menu));

        MenuResponse response = service().consultarMenu(FECHA, CORREO);

        assertThat(response.comidas()).allSatisfy(c -> assertThat(c.compatible()).isTrue());
    }

    @Test
    void lanza404SiNoHayTemporadaPublicada() {
        Usuario usuario = new Usuario(1L, CORREO, TipoUsuario.EMPLEADO, EstadoUsuario.ACTIVO, null, Set.of());
        when(usuarios.findByCorreo(CORREO)).thenReturn(Optional.of(usuario));
        when(temporadas.findByEstadoAndFechaDesdeIsLessThanEqualAndFechaHastaIsGreaterThanEqual(
                EstadoTemporada.PUBLICADA, FECHA, FECHA)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().consultarMenu(FECHA, CORREO))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("menú publicado");
    }

    @Test
    void lanza404SiNoExisteElMenuParaElDia() {
        Usuario usuario = new Usuario(1L, CORREO, TipoUsuario.EMPLEADO, EstadoUsuario.ACTIVO, null, Set.of());
        Temporada temporada = new Temporada(1L, "Demo", Estacion.INVIERNO, FECHA.minusDays(30), FECHA.plusDays(60), EstadoTemporada.PUBLICADA);
        SemanaTemporada semana = new SemanaTemporada(1L, temporada, (short) 1);

        when(usuarios.findByCorreo(CORREO)).thenReturn(Optional.of(usuario));
        when(temporadas.findByEstadoAndFechaDesdeIsLessThanEqualAndFechaHastaIsGreaterThanEqual(
                EstadoTemporada.PUBLICADA, FECHA, FECHA)).thenReturn(Optional.of(temporada));
        when(semanas.findByTemporadaIdAndNumero(1L, (short) 1)).thenReturn(Optional.of(semana));
        when(menus.findBySemanaIdAndDiaSemana(1L, DayOfWeek.TUESDAY)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().consultarMenu(FECHA, CORREO))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("menú publicado");
    }

    @Test
    void calculaLaSemanaCorrectaDelCicloCircular() {
        // 4 semanas después del inicio de la temporada → semana (4 % 4 + 1) = 1
        // Pero 5 semanas después → semana (5 % 4 + 1) = 2
        LocalDate inicioTemporada = LocalDate.of(2026, 8, 3); // lunes
        LocalDate fecha5Semanas = inicioTemporada.plusWeeks(5); // 5 semanas después, lunes 2026-09-07
        // semana esperada: (5 % 4 + 1) = 2

        Usuario usuario = new Usuario(1L, CORREO, TipoUsuario.EMPLEADO, EstadoUsuario.ACTIVO, null, Set.of());
        Temporada temporada = new Temporada(1L, "Demo", Estacion.INVIERNO, inicioTemporada, inicioTemporada.plusDays(90), EstadoTemporada.PUBLICADA);
        SemanaTemporada semana2 = new SemanaTemporada(2L, temporada, (short) 2);
        Comida principal = new Comida(1L, "Milanesa", TipoComida.PLATO_PRINCIPAL, EstadoComida.ACTIVA, Set.of());
        MenuDiario menu = new MenuDiario(6L, semana2, DayOfWeek.MONDAY, Set.of(principal));

        when(usuarios.findByCorreo(CORREO)).thenReturn(Optional.of(usuario));
        when(temporadas.findByEstadoAndFechaDesdeIsLessThanEqualAndFechaHastaIsGreaterThanEqual(
                EstadoTemporada.PUBLICADA, fecha5Semanas, fecha5Semanas)).thenReturn(Optional.of(temporada));
        when(semanas.findByTemporadaIdAndNumero(1L, (short) 2)).thenReturn(Optional.of(semana2));
        when(menus.findBySemanaIdAndDiaSemana(2L, DayOfWeek.MONDAY)).thenReturn(Optional.of(menu));

        MenuResponse response = service().consultarMenu(fecha5Semanas, CORREO);

        assertThat(response.id()).isEqualTo(6L);
    }
}
