package com.reservapp.reserva.service;

import com.reservapp.comida.repository.ComidaRepository;
import com.reservapp.comida.entity.*;
import com.reservapp.exception.ReglaNegocioException;
import com.reservapp.menu.entity.MenuDiario;
import com.reservapp.reserva.entity.*;
import com.reservapp.temporada.entity.*;
import com.reservapp.usuario.entity.*;
import org.springframework.http.HttpStatus;
import com.reservapp.exception.RecursoNoEncontradoException;
import com.reservapp.menu.repository.MenuDiarioRepository;
import com.reservapp.reserva.dto.CrearReservaRequest;
import com.reservapp.reserva.repository.ReservaRepository;
import com.reservapp.usuario.entity.Usuario;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Tests de ReservaService: lo que le corresponde a ESTA capa es que ensamble
 * bien las consultas y traduzca lo que falta a 404 — no repetir las reglas de
 * negocio, que ya se prueban sin mocks en ReservaReglasTest.
 *
 * El caso "rechaza una reserva a más de siete días" vivía acá con @Mock de
 * las cuatro dependencias; se movió a ReservaReglasTest.aceptaUnaFecha... /
 * rechazaUnaFechaAOchoDias, donde se prueba en milisegundos y sin mocks.
 */
@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class ReservaServiceTest {
    @Mock ReservaRepository reservas;
    @Mock UsuarioRepository usuarios;
    @Mock MenuDiarioRepository menus;
    @Mock ComidaRepository comidas;
    @Mock Usuario usuario;

    private static final LocalDate FECHA = LocalDate.of(2026, 9, 1);
    private static final String CORREO = "empleado@reservapp.demo";

    private ReservaService prepararCreacion(boolean existeActiva) {
        Usuario empleado = new Usuario(1L, CORREO, TipoUsuario.EMPLEADO, EstadoUsuario.ACTIVO, null, Set.of());
        Comida principal = new Comida(3L, "Curry", TipoComida.PLATO_PRINCIPAL, EstadoComida.ACTIVA, Set.of());
        Temporada temporada = new Temporada(1L, "Primavera", Estacion.PRIMAVERA, FECHA,
                FECHA.plusWeeks(4), EstadoTemporada.PUBLICADA);
        MenuDiario menu = new MenuDiario(1L, new SemanaTemporada(1L, temporada, (short) 1),
                DayOfWeek.TUESDAY, Set.of(principal));
        when(usuarios.findByCorreo(CORREO)).thenReturn(Optional.of(empleado));
        when(menus.findDetalleById(1L)).thenReturn(Optional.of(menu));
        when(comidas.findByIdIn(Set.of(3L))).thenReturn(List.of(principal));
        when(reservas.existsByUsuarioIdAndFechaAndEstado(1L, FECHA, EstadoReserva.ACTIVA)).thenReturn(existeActiva);
        Clock clock = Clock.fixed(Instant.parse("2026-09-01T11:00:00Z"), ZoneId.of("America/Argentina/Buenos_Aires"));
        return new ReservaService(reservas, usuarios, menus, comidas, clock);
    }

    @Test
    void permiteCrearTrasUnaReservaCanceladaYConsultaSoloActivas() {
        ReservaService service = prepararCreacion(false);
        when(reservas.save(any(Reserva.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var respuesta = service.crear(new CrearReservaRequest(1L, FECHA, Set.of(3L)), CORREO);

        assertThat(respuesta.estado()).isEqualTo(EstadoReserva.ACTIVA);
        assertThat(respuesta.fecha()).isEqualTo(FECHA);
        verify(reservas).existsByUsuarioIdAndFechaAndEstado(1L, FECHA, EstadoReserva.ACTIVA);
        verify(reservas).save(any(Reserva.class));
    }

    @Test
    void rechazaOtraReservaActivaParaLaMismaFechaCon409() {
        ReservaService service = prepararCreacion(true);

        assertThatThrownBy(() -> service.crear(new CrearReservaRequest(1L, FECHA, Set.of(3L)), CORREO))
                .isInstanceOfSatisfying(ReglaNegocioException.class,
                        error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessage("Ya existe una reserva para la fecha indicada");
        verify(reservas).existsByUsuarioIdAndFechaAndEstado(1L, FECHA, EstadoReserva.ACTIVA);
        verify(reservas, never()).save(any());
    }

    @Test
    void rechazaLaCreacionSiElMenuNoExiste() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-01T12:00:00Z"), ZoneId.of("America/Argentina/Buenos_Aires"));
        ReservaService service = new ReservaService(reservas, usuarios, menus, comidas, clock);
        LocalDate fecha = LocalDate.of(2026, 9, 8);
        when(usuarios.findByCorreo("empleado@reservapp.demo")).thenReturn(Optional.of(usuario));
        when(menus.findDetalleById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.crear(new CrearReservaRequest(1L, fecha, Set.of(3L)), "empleado@reservapp.demo"))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("No existe el menú");
    }
    @Test
    void unaReservaAjenaSeInformaComoInexistente() {
        ReservaService service = new ReservaService(reservas, usuarios, menus, comidas, Clock.systemDefaultZone());
        when(reservas.findDetalleByIdAndUsuarioCorreo(1L, "otra@reservapp.demo")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.obtener(1L, "otra@reservapp.demo"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }
}
