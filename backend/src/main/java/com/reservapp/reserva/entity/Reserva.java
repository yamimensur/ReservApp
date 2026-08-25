package com.reservapp.reserva.entity;

import com.reservapp.comida.entity.Comida;
import com.reservapp.menu.entity.MenuDiario;
import com.reservapp.usuario.entity.Usuario;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "reserva", uniqueConstraints = {
        @UniqueConstraint(name = "uk_reserva_codigo", columnNames = "codigo"),
        @UniqueConstraint(name = "uk_reserva_usuario_fecha", columnNames = {"usuario_id", "fecha"})})
public class Reserva {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 36) private String codigo;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "usuario_id", nullable = false) private Usuario usuario;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "menu_id", nullable = false) private MenuDiario menu;
    @Column(nullable = false) private LocalDate fecha;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private EstadoReserva estado;
    @Column(name = "creada_en", nullable = false) private Instant creadaEn;
    @ManyToMany
    @JoinTable(name = "reserva_comida", joinColumns = @JoinColumn(name = "reserva_id"), inverseJoinColumns = @JoinColumn(name = "comida_id"))
    private Set<Comida> comidas = new HashSet<>();
    protected Reserva() {}
}
