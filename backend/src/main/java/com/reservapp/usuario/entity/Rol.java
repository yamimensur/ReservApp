package com.reservapp.usuario.entity;

import jakarta.persistence.*;

@Entity @Table(name = "rol")
public class Rol {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Enumerated(EnumType.STRING) @Column(nullable = false, unique = true, length = 20) private RolNombre nombre;
    protected Rol() {}
}
