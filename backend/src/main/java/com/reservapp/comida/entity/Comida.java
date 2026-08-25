package com.reservapp.comida.entity;

import com.reservapp.usuario.entity.RestriccionAlimenticia;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity @Table(name = "comida")
public class Comida {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 120) private String nombre;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private TipoComida tipo;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private EstadoComida estado;
    @ManyToMany
    @JoinTable(name = "comida_restriccion_compatible", joinColumns = @JoinColumn(name = "comida_id"),
            inverseJoinColumns = @JoinColumn(name = "restriccion_id"))
    private Set<RestriccionAlimenticia> restriccionesCompatibles = new HashSet<>();
    protected Comida() {}
}
