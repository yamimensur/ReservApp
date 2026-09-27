package com.reservapp.menu.entity;

import com.reservapp.comida.entity.Comida;
import com.reservapp.temporada.entity.SemanaTemporada;
import jakarta.persistence.*;
import java.time.DayOfWeek;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "menu_diario", uniqueConstraints = @UniqueConstraint(name = "uk_menu_semana_dia", columnNames = {"semana_id", "dia_semana"}))
public class MenuDiario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "semana_id", nullable = false) private SemanaTemporada semana;
    @Enumerated(EnumType.STRING) @Column(name = "dia_semana", nullable = false, length = 10) private DayOfWeek diaSemana;
    @ManyToMany
    @JoinTable(name = "menu_comida", joinColumns = @JoinColumn(name = "menu_id"), inverseJoinColumns = @JoinColumn(name = "comida_id"))
    private Set<Comida> comidas = new HashSet<>();
    protected MenuDiario() {}

    /** Constructor de prueba: permite armar la entidad a mano en tests sin pasar por Hibernate. */
    public MenuDiario(Long id, SemanaTemporada semana, DayOfWeek diaSemana, Set<Comida> comidas) {
        this.id = id;
        this.semana = semana;
        this.diaSemana = diaSemana;
        this.comidas = new HashSet<>(comidas);
    }

    public Long getId() { return id; }
    public DayOfWeek getDiaSemana() { return diaSemana; }
    public Set<Comida> getComidas() { return Set.copyOf(comidas); }
    public SemanaTemporada getSemana() { return semana; }
}