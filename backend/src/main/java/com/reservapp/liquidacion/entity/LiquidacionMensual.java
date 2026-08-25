package com.reservapp.liquidacion.entity;

import com.reservapp.usuario.entity.Usuario;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "liquidacion_mensual", uniqueConstraints = @UniqueConstraint(name = "uk_liquidacion_usuario_periodo", columnNames = {"usuario_id", "anio", "mes"}))
public class LiquidacionMensual {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "usuario_id", nullable = false) private Usuario usuario;
    @Column(nullable = false) private Short anio;
    @Column(nullable = false) private Short mes;
    @Column(name = "importe_total", nullable = false, precision = 12, scale = 2) private BigDecimal importeTotal;
    @Column(name = "generada_en", nullable = false) private Instant generadaEn;
    protected LiquidacionMensual() {}
}
