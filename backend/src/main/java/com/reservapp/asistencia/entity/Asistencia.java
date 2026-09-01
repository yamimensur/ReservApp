package com.reservapp.asistencia.entity;

import com.reservapp.liquidacion.entity.LiquidacionMensual;
import com.reservapp.reserva.entity.Reserva;
import com.reservapp.usuario.entity.Usuario;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "asistencia")
public class Asistencia {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @OneToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "reserva_id", nullable = false, unique = true) private Reserva reserva;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "administrador_id", nullable = false) private Usuario administrador;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "liquidacion_id") private LiquidacionMensual liquidacion;
    @Column(name = "confirmada_en", nullable = false) private Instant confirmadaEn;
    protected Asistencia() {}
    public Asistencia(Reserva reserva, Usuario administrador, Instant confirmadaEn) {
        this.reserva = reserva; this.administrador = administrador; this.confirmadaEn = confirmadaEn;
    }
    public Long getId() { return id; }
    public Reserva getReserva() { return reserva; }
    public Usuario getAdministrador() { return administrador; }
    public Instant getConfirmadaEn() { return confirmadaEn; }
}
