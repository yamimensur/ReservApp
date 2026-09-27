package com.reservapp.reserva.service;

import com.reservapp.comida.repository.ComidaRepository;
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
import static org.mockito.Mockito.when;

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
}