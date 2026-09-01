package com.reservapp.reserva.controller;

import com.reservapp.asistencia.dto.AsistenciaResponse;
import com.reservapp.asistencia.service.AsistenciaService;
import com.reservapp.reserva.dto.*;
import com.reservapp.reserva.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.net.URI;

@RestController
@RequestMapping("/api/v1/reservas")
public class ReservaController {
    private final ReservaService reservas; private final AsistenciaService asistencias;
    public ReservaController(ReservaService reservas, AsistenciaService asistencias) { this.reservas = reservas; this.asistencias = asistencias; }

    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLEADO','TERCERIZADO')")
    public Page<ReservaResponse> listar(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size, Authentication auth) {
        int limite = Math.min(Math.max(size, 1), 50);
        return reservas.listar(auth.getName(), PageRequest.of(Math.max(page, 0), limite, Sort.by(Sort.Direction.DESC, "fecha")));
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLEADO','TERCERIZADO')")
    public ReservaResponse obtener(@PathVariable Long id, Authentication auth) { return reservas.obtener(id, auth.getName()); }
    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLEADO','TERCERIZADO')")
    public ResponseEntity<ReservaResponse> crear(@Valid @RequestBody CrearReservaRequest request, Authentication auth) {
        ReservaResponse creada = reservas.crear(request, auth.getName());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(creada.id()).toUri();
        return ResponseEntity.created(location).body(creada);
    }
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLEADO','TERCERIZADO')")
    public ReservaResponse modificar(@PathVariable Long id, @Valid @RequestBody ModificarReservaRequest request, Authentication auth) {
        return reservas.modificar(id, request, auth.getName());
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLEADO','TERCERIZADO')")
    public ResponseEntity<Void> cancelar(@PathVariable Long id, Authentication auth) {
        reservas.cancelar(id, auth.getName()); return ResponseEntity.noContent().build();
    }
    @PostMapping("/{id}/confirmacion-asistencia")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<AsistenciaResponse> confirmarAsistencia(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(asistencias.confirmar(id, auth.getName()));
    }
}
