package com.reservapp.asistencia.controller;

import com.reservapp.asistencia.service.AsistenciaService;
import com.reservapp.reserva.dto.ReservaDelDiaResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/asistencias")
public class AsistenciaController {
    private final AsistenciaService asistencias;

    public AsistenciaController(AsistenciaService asistencias) { this.asistencias = asistencias; }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public Page<ReservaDelDiaResponse> listar(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "50") int size) {
        int limite = Math.min(Math.max(size, 1), 50);
        var orden = Sort.by(Sort.Order.asc("usuario.correo"), Sort.Order.asc("codigo"));
        return asistencias.listarDelDia(fecha, PageRequest.of(Math.max(page, 0), limite, orden));
    }
}
