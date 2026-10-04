package com.reservapp.usuario.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity @Table(name = "usuario")
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 254) private String correo;
    @Column(name = "password_hash", nullable = false, length = 100) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(name = "tipo_usuario", nullable = false, length = 20) private TipoUsuario tipoUsuario;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private EstadoUsuario estado;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "rol_id", nullable = false) private Rol rol;
    @ManyToMany
    @JoinTable(name = "usuario_restriccion", joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "restriccion_id"))
    private Set<RestriccionAlimenticia> restricciones = new HashSet<>();
    protected Usuario() {}

    /** Constructor de prueba: permite armar la entidad a mano en tests sin pasar por Hibernate. */
    public Usuario(Long id, String correo, TipoUsuario tipoUsuario, EstadoUsuario estado, Rol rol,
                   Set<RestriccionAlimenticia> restricciones) {
        this.id = id;
        this.correo = correo;
        this.tipoUsuario = tipoUsuario;
        this.estado = estado;
        this.rol = rol;
        this.restricciones = new HashSet<>(restricciones);
    }

    public Long getId() { return id; }
    public String getCorreo() { return correo; }
    public EstadoUsuario getEstado() { return estado; }
    public String getPasswordHash() { return passwordHash; }
    public Rol getRol() { return rol; }
    public Set<RestriccionAlimenticia> getRestricciones() { return Set.copyOf(restricciones); }
}