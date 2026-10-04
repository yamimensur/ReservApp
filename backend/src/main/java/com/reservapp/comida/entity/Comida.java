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

    /** Constructor de prueba: permite armar la entidad a mano en tests sin pasar por Hibernate. */
    public Comida(Long id, String nombre, TipoComida tipo, EstadoComida estado,
                  Set<com.reservapp.usuario.entity.RestriccionAlimenticia> restriccionesCompatibles) {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
        this.estado = estado;
        this.restriccionesCompatibles = new HashSet<>(restriccionesCompatibles);
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public TipoComida getTipo() { return tipo; }
    public EstadoComida getEstado() { return estado; }
    public Set<RestriccionAlimenticia> getRestriccionesCompatibles() { return Set.copyOf(restriccionesCompatibles); }
}