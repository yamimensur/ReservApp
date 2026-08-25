package com.reservapp.usuario.entity;

import jakarta.persistence.*;

@Entity @Table(name = "restriccion_alimenticia")
public class RestriccionAlimenticia {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 80) private String nombre;
    @Column(length = 300) private String descripcion;
    protected RestriccionAlimenticia() {}
}
