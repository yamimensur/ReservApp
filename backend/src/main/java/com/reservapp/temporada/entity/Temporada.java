package com.reservapp.temporada.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity @Table(name = "temporada")
public class Temporada {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 100) private String nombre;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Estacion estacion;
    @Column(name = "fecha_desde", nullable = false) private LocalDate fechaDesde;
    @Column(name = "fecha_hasta", nullable = false) private LocalDate fechaHasta;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private EstadoTemporada estado;
    protected Temporada() {}

    /** Constructor de prueba: permite armar la entidad a mano en tests sin pasar por Hibernate. */
    public Temporada(Long id, String nombre, Estacion estacion, LocalDate fechaDesde, LocalDate fechaHasta, EstadoTemporada estado) {
        this.id = id;
        this.nombre = nombre;
        this.estacion = estacion;
        this.fechaDesde = fechaDesde;
        this.fechaHasta = fechaHasta;
        this.estado = estado;
    }

    public LocalDate getFechaDesde() { return fechaDesde; }
    public LocalDate getFechaHasta() { return fechaHasta; }
    public EstadoTemporada getEstado() { return estado; }
}