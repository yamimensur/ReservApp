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
}
