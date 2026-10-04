package com.reservapp.reserva.service;

import com.reservapp.comida.repository.ComidaRepository;
import com.reservapp.exception.ReglaNegocioException;
import com.reservapp.menu.entity.MenuDiario;
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
import com.reservapp.exception.RecursoNoEncontradoException;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class ReservaServiceTest {
    @Mock ReservaRepository reservas;
    @Mock UsuarioRepository usuarios;
    @Mock MenuDiarioRepository menus;
    @Mock ComidaRepository comidas;
    @Mock Usuario usuario;
    @Mock MenuDiario menu;

    @Test
    void rechazaUnaReservaAMasDeSieteDias() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-01T12:00:00Z"), ZoneId.of("America/Argentina/Buenos_Aires"));
        ReservaService service = new ReservaService(reservas, usuarios, menus, comidas, clock);
        LocalDate fecha = LocalDate.of(2026, 9, 10);
        when(usuarios.findByCorreo("empleado@reservapp.demo")).thenReturn(Optional.of(usuario));
        when(menus.findDetalleById(1L)).thenReturn(Optional.of(menu));
        when(comidas.findByIdIn(Set.of(3L))).thenReturn(List.of());

        assertThatThrownBy(() -> service.crear(new CrearReservaRequest(1L, fecha, Set.of(3L)), "empleado@reservapp.demo"))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("siete días");
    }
    @Test
    void unaReservaAjenaSeInformaComoInexistente() {
        ReservaService service = new ReservaService(reservas, usuarios, menus, comidas, Clock.systemDefaultZone());
        when(reservas.findDetalleByIdAndUsuarioCorreo(1L, "otra@reservapp.demo")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.obtener(1L, "otra@reservapp.demo"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }
}
