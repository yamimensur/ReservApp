package com.reservapp.temporada.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "semana_temporada", uniqueConstraints = @UniqueConstraint(name = "uk_semana_temporada_numero", columnNames = {"temporada_id", "numero"}))
public class SemanaTemporada {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "temporada_id", nullable = false) private Temporada temporada;
    @Column(nullable = false) private Short numero;
    protected SemanaTemporada() {}

    /** Constructor de prueba: permite armar la entidad a mano en tests sin pasar por Hibernate. */
    public SemanaTemporada(Long id, Temporada temporada, Short numero) {
        this.id = id;
        this.temporada = temporada;
        this.numero = numero;
    }

    public Temporada getTemporada() { return temporada; }
    public Short getNumero() { return numero; }
}