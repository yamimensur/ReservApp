package com.reservapp.reserva.service;

import com.reservapp.comida.entity.*;
import com.reservapp.comida.repository.ComidaRepository;
import com.reservapp.exception.*;
import com.reservapp.menu.entity.MenuDiario;
import com.reservapp.menu.repository.MenuDiarioRepository;
import com.reservapp.reserva.dto.*;
import com.reservapp.reserva.entity.*;
import com.reservapp.reserva.repository.ReservaRepository;
import com.reservapp.usuario.entity.*;
import com.reservapp.usuario.repository.UsuarioRepository;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import com.reservapp.exception.RecursoNoEncontradoException;

@Service
public class ReservaService {
    private final ReservaRepository reservas;
    private final UsuarioRepository usuarios;
    private final MenuDiarioRepository menus;
    private final ComidaRepository comidas;
    private final Clock clock;

    public ReservaService(ReservaRepository reservas, UsuarioRepository usuarios, MenuDiarioRepository menus,
                          ComidaRepository comidas, Clock clock) {
        this.reservas = reservas; this.usuarios = usuarios; this.menus = menus; this.comidas = comidas; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Page<ReservaResponse> listar(String correo, Pageable pageable) {
        Usuario usuario = usuario(correo);
        return reservas.findByUsuarioId(usuario.getId(), pageable).map(this::response);
    }

    @Transactional(readOnly = true)
    public ReservaResponse obtener(Long id, String correo) { return response(reservaPropia(id, correo)); }

    @Transactional
    public ReservaResponse crear(CrearReservaRequest request, String correo) {
        Usuario usuario = usuario(correo);
        MenuDiario menu = menus.findDetalleById(request.menuId()).orElseThrow(() -> new RecursoNoEncontradoException("No existe el menú"));
        List<Comida> seleccion = comidas.findByIdIn(request.comidaIds());

        ZonedDateTime ahora = ZonedDateTime.now(clock);
        ReservaReglas.validarCreacion(request.fecha(), ahora, usuario, menu, seleccion, request.comidaIds());

        if (reservas.existsByUsuarioIdAndFecha(usuario.getId(), request.fecha()))
            throw new ReglaNegocioException(HttpStatus.CONFLICT, "Ya existe una reserva para la fecha indicada");
        Reserva reserva = new Reserva(UUID.randomUUID().toString(), usuario, menu, request.fecha(), Set.copyOf(seleccion), clock.instant());
        return response(reservas.save(reserva));
    }

    @Transactional
    public ReservaResponse modificar(Long id, ModificarReservaRequest request, String correo) {
        Reserva reserva = reservaPropia(id, correo);
        ReservaReglas.validarHorarioLimite(reserva.getFecha(), ZonedDateTime.now(clock));
        List<Comida> seleccion = comidas.findByIdIn(request.comidaIds());
        ReservaReglas.validarSeleccion(reserva.getUsuario(), reserva.getMenu(), seleccion, request.comidaIds());
        reserva.cambiarComidas(Set.copyOf(seleccion));
        return response(reserva);
    }

    @Transactional
    public void cancelar(Long id, String correo) {
        Reserva reserva = reservaPropia(id, correo);
        ReservaReglas.validarHorarioLimite(reserva.getFecha(), ZonedDateTime.now(clock));
        reserva.cancelar();
    }

    private Usuario usuario(String correo) { return usuarios.findByCorreo(correo).orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario autenticado")); }
    private Reserva reservaPropia(Long id, String correo) {
        return reservas.findDetalleByIdAndUsuarioCorreo(id, correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la reserva"));
    }
    private ReservaResponse response(Reserva r) {
        var detalle = r.getComidas().stream().sorted(Comparator.comparing(Comida::getId))
                .map(c -> new ReservaResponse.ComidaResponse(c.getId(), c.getNombre(), c.getTipo().name())).toList();
        return new ReservaResponse(r.getId(), r.getCodigo(), r.getUsuario().getId(), r.getMenu().getId(), r.getFecha(), r.getEstado(), r.getCreadaEn(), detalle);
    }
}
