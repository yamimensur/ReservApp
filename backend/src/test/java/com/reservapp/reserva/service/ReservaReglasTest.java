package com.reservapp.reserva.service;

import com.reservapp.comida.entity.Comida;
import com.reservapp.comida.entity.EstadoComida;
import com.reservapp.comida.entity.TipoComida;
import com.reservapp.exception.RecursoNoEncontradoException;
import com.reservapp.exception.ReglaNegocioException;
import com.reservapp.menu.entity.MenuDiario;
import com.reservapp.temporada.entity.Estacion;
import com.reservapp.temporada.entity.EstadoTemporada;
import com.reservapp.temporada.entity.SemanaTemporada;
import com.reservapp.temporada.entity.Temporada;
import com.reservapp.usuario.entity.EstadoUsuario;
import com.reservapp.usuario.entity.RestriccionAlimenticia;
import com.reservapp.usuario.entity.TipoUsuario;
import com.reservapp.usuario.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests de la capa de reglas: sin @Mock, sin Spring, sin base de datos.
 * Las entidades se arman a mano con sus constructores de prueba y se llama
 * a ReservaReglas directamente — es la ventaja de una función pura: no hay
 * nada que levantar antes de correr el test.
 */
class ReservaReglasTest {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    // --- Helpers para armar el escenario típico: martes 2026-09-01, semana 1 de una temporada publicada ---

    private Usuario usuarioSinRestricciones() {
        return new Usuario(1L, "empleado@reservapp.demo", TipoUsuario.EMPLEADO, EstadoUsuario.ACTIVO, null, Set.of());
    }

    private Temporada temporadaPublicada(LocalDate desde, LocalDate hasta) {
        return new Temporada(1L, "Primavera 2026", Estacion.PRIMAVERA, desde, hasta, EstadoTemporada.PUBLICADA);
    }

    private MenuDiario menuValido(LocalDate inicioTemporada, DayOfWeek dia, short numeroSemana, Comida... comidas) {
        Temporada temporada = temporadaPublicada(inicioTemporada, inicioTemporada.plusWeeks(4).minusDays(1));
        SemanaTemporada semana = new SemanaTemporada(1L, temporada, numeroSemana);
        return new MenuDiario(1L, semana, dia, Set.of(comidas));
    }

    private Comida platoPrincipal(long id) {
        return new Comida(id, "Milanesa con puré", TipoComida.PLATO_PRINCIPAL, EstadoComida.ACTIVA, Set.of());
    }

    // --- validarCreacion: ventana de fecha ---

    @Test
    void aceptaUnaFechaDentroDeLosSieteDias() {
        ZonedDateTime ahora = ZonedDateTime.of(2026, 9, 1, 8, 0, 0, 0, ZONA); // martes
        LocalDate fecha = LocalDate.of(2026, 9, 8); // martes siguiente, exactamente 7 días
        Comida principal = platoPrincipal(10L);
        MenuDiario menu = menuValido(LocalDate.of(2026, 9, 1), DayOfWeek.TUESDAY, (short) 2, principal);

        assertThatCode(() -> ReservaReglas.validarCreacion(
                fecha, ahora, usuarioSinRestricciones(), menu, java.util.List.of(principal), Set.of(10L)))
                .doesNotThrowAnyException();
    }

    @Test
    void rechazaUnaFechaAOchoDias() {
        ZonedDateTime ahora = ZonedDateTime.of(2026, 9, 1, 8, 0, 0, 0, ZONA);
        LocalDate fecha = LocalDate.of(2026, 9, 9); // 8 días: un día más allá del límite
        Comida principal = platoPrincipal(10L);
        MenuDiario menu = menuValido(LocalDate.of(2026, 9, 1), DayOfWeek.WEDNESDAY, (short) 2, principal);

        assertThatThrownBy(() -> ReservaReglas.validarCreacion(
                fecha, ahora, usuarioSinRestricciones(), menu, java.util.List.of(principal), Set.of(10L)))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("siete días")
                .extracting(e -> ((ReglaNegocioException) e).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    void rechazaUnaFechaDeFinDeSemana() {
        ZonedDateTime ahora = ZonedDateTime.of(2026, 9, 1, 8, 0, 0, 0, ZONA);
        LocalDate sabado = LocalDate.of(2026, 9, 5);
        Comida principal = platoPrincipal(10L);
        MenuDiario menu = menuValido(LocalDate.of(2026, 9, 1), DayOfWeek.SATURDAY, (short) 1, principal);

        assertThatThrownBy(() -> ReservaReglas.validarCreacion(
                sabado, ahora, usuarioSinRestricciones(), menu, java.util.List.of(principal), Set.of(10L)))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("días laborables");
    }

    // --- validarHorarioLimite: el borde de las 09:00 ---

    @Test
    void aceptaJustoAntesDeLasNueve() {
        LocalDate fecha = LocalDate.of(2026, 9, 8);
        ZonedDateTime unSegundoAntes = ZonedDateTime.of(2026, 9, 8, 8, 59, 59, 0, ZONA);

        assertThatCode(() -> ReservaReglas.validarHorarioLimite(fecha, unSegundoAntes))
                .doesNotThrowAnyException();
    }

    @Test
    void rechazaExactamenteALasNueve() {
        LocalDate fecha = LocalDate.of(2026, 9, 8);
        ZonedDateTime exactamenteNueve = ZonedDateTime.of(2026, 9, 8, 9, 0, 0, 0, ZONA);

        assertThatThrownBy(() -> ReservaReglas.validarHorarioLimite(fecha, exactamenteNueve))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("Venció el horario")
                .extracting(e -> ((ReglaNegocioException) e).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    // --- validarSeleccion: composición y compatibilidad ---

    @Test
    void rechazaSeleccionSinPlatoPrincipal() {
        Comida entrada = new Comida(20L, "Ensalada", TipoComida.ENTRADA, EstadoComida.ACTIVA, Set.of());
        MenuDiario menu = menuValido(LocalDate.of(2026, 9, 1), DayOfWeek.TUESDAY, (short) 1, entrada);

        assertThatThrownBy(() -> ReservaReglas.validarSeleccion(
                usuarioSinRestricciones(), menu, java.util.List.of(entrada), Set.of(20L)))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("plato principal");
    }

    @Test
    void rechazaComidaInactiva() {
        Comida principalInactivo = new Comida(30L, "Tarta", TipoComida.PLATO_PRINCIPAL, EstadoComida.INACTIVA, Set.of());
        MenuDiario menu = menuValido(LocalDate.of(2026, 9, 1), DayOfWeek.TUESDAY, (short) 1, principalInactivo);

        assertThatThrownBy(() -> ReservaReglas.validarSeleccion(
                usuarioSinRestricciones(), menu, java.util.List.of(principalInactivo), Set.of(30L)))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("inactiva o incompatible");
    }

    @Test
    void rechazaComidaIncompatibleConRestriccionDelUsuario() {
        RestriccionAlimenticia celiaquia = new RestriccionAlimenticia(1L, "Celiaquía", null);
        Usuario usuario = new Usuario(1L, "empleado@reservapp.demo", TipoUsuario.EMPLEADO,
                EstadoUsuario.ACTIVO, null, Set.of(celiaquia));
        // comida activa pero sin la compatibilidad que el usuario necesita
        Comida principal = new Comida(40L, "Ñoquis", TipoComida.PLATO_PRINCIPAL, EstadoComida.ACTIVA, Set.of());
        MenuDiario menu = menuValido(LocalDate.of(2026, 9, 1), DayOfWeek.TUESDAY, (short) 1, principal);

        assertThatThrownBy(() -> ReservaReglas.validarSeleccion(
                usuario, menu, java.util.List.of(principal), Set.of(40L)))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("inactiva o incompatible");
    }

    @Test
    void aceptaComidaCompatibleConLaRestriccionDelUsuario() {
        RestriccionAlimenticia celiaquia = new RestriccionAlimenticia(1L, "Celiaquía", null);
        Usuario usuario = new Usuario(1L, "empleado@reservapp.demo", TipoUsuario.EMPLEADO,
                EstadoUsuario.ACTIVO, null, Set.of(celiaquia));
        Comida principal = new Comida(41L, "Milanesa sin TACC", TipoComida.PLATO_PRINCIPAL,
                EstadoComida.ACTIVA, Set.of(celiaquia));
        MenuDiario menu = menuValido(LocalDate.of(2026, 9, 1), DayOfWeek.TUESDAY, (short) 1, principal);

        assertThatCode(() -> ReservaReglas.validarSeleccion(usuario, menu, java.util.List.of(principal), Set.of(41L)))
                .doesNotThrowAnyException();
    }

    @Test
    void rechazaComidaQueNoPerteneceAlMenu() {
        Comida principalDelMenu = platoPrincipal(50L);
        Comida comidaAjena = platoPrincipal(51L);
        MenuDiario menu = menuValido(LocalDate.of(2026, 9, 1), DayOfWeek.TUESDAY, (short) 1, principalDelMenu);

        assertThatThrownBy(() -> ReservaReglas.validarSeleccion(
                usuarioSinRestricciones(), menu, java.util.List.of(comidaAjena), Set.of(51L)))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("no pertenece al menú");
    }

    @Test
    void rechazaComidaInexistenteComo404() {
        Comida principal = platoPrincipal(60L);
        MenuDiario menu = menuValido(LocalDate.of(2026, 9, 1), DayOfWeek.TUESDAY, (short) 1, principal);
        // se pidieron dos ids pero el repositorio (simulado) solo devolvió uno: falta 61L
        assertThatThrownBy(() -> ReservaReglas.validarSeleccion(
                usuarioSinRestricciones(), menu, java.util.List.of(principal), Set.of(60L, 61L)))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

}