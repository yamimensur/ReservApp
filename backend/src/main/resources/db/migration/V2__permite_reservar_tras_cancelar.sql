-- Una reserva cancelada no debe impedir volver a reservar la misma fecha.
ALTER TABLE reserva DROP CONSTRAINT uk_reserva_usuario_fecha;
CREATE UNIQUE INDEX uk_reserva_usuario_fecha_activa
    ON reserva (usuario_id, fecha) WHERE estado = 'ACTIVA';
