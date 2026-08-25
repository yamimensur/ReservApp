INSERT INTO rol (id, nombre) VALUES
    (1, 'EMPLEADO'), (2, 'TERCERIZADO'), (3, 'ADMINISTRADOR'), (4, 'RRHH')
ON CONFLICT DO NOTHING;

INSERT INTO restriccion_alimenticia (id, nombre, descripcion) VALUES
    (1, 'Vegetariana', 'No contiene carnes'),
    (2, 'Vegana', 'No contiene productos de origen animal'),
    (3, 'Sin gluten', 'No contiene gluten')
ON CONFLICT DO NOTHING;

-- Todos los usuarios demo usan la contraseña "password" (hash BCrypt); cambiarla fuera del entorno demo.
INSERT INTO usuario (id, correo, password_hash, tipo_usuario, estado, rol_id) VALUES
    (1, 'empleado@reservapp.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'EMPLEADO', 'ACTIVO', 1),
    (2, 'tercerizado@reservapp.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'TERCERIZADO', 'ACTIVO', 2),
    (3, 'admin@reservapp.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'EMPLEADO', 'ACTIVO', 3),
    (4, 'rrhh@reservapp.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'EMPLEADO', 'ACTIVO', 4)
ON CONFLICT DO NOTHING;

INSERT INTO usuario_restriccion (usuario_id, restriccion_id) VALUES (1, 1), (2, 3) ON CONFLICT DO NOTHING;

INSERT INTO comida (id, nombre, tipo, estado) VALUES
    (1, 'Ensalada de estación', 'ENTRADA', 'ACTIVA'),
    (2, 'Milanesa con puré', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (3, 'Curry de garbanzos', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (4, 'Fruta fresca', 'POSTRE', 'ACTIVA'),
    (5, 'Agua mineral', 'BEBIDA', 'ACTIVA')
ON CONFLICT DO NOTHING;

INSERT INTO comida_restriccion_compatible (comida_id, restriccion_id) VALUES
    (1, 1), (1, 2), (1, 3), (3, 1), (3, 2), (3, 3),
    (4, 1), (4, 2), (4, 3), (5, 1), (5, 2), (5, 3)
ON CONFLICT DO NOTHING;

INSERT INTO temporada (id, nombre, estacion, fecha_desde, fecha_hasta, estado)
VALUES (1, 'Temporada demo', 'INVIERNO', CURRENT_DATE - 60, CURRENT_DATE + 90, 'PUBLICADA')
ON CONFLICT DO NOTHING;

INSERT INTO semana_temporada (id, temporada_id, numero) VALUES (1,1,1), (2,1,2), (3,1,3), (4,1,4) ON CONFLICT DO NOTHING;

INSERT INTO menu_diario (id, semana_id, dia_semana)
SELECT ((s.numero - 1) * 5 + d.orden), s.id, d.nombre
FROM semana_temporada s
CROSS JOIN (VALUES (1,'MONDAY'),(2,'TUESDAY'),(3,'WEDNESDAY'),(4,'THURSDAY'),(5,'FRIDAY')) AS d(orden,nombre)
WHERE s.temporada_id = 1
ON CONFLICT DO NOTHING;

INSERT INTO menu_comida (menu_id, comida_id)
SELECT m.id, c.id FROM menu_diario m CROSS JOIN comida c
WHERE m.semana_id IN (1,2,3,4) AND c.id IN (1,2,3,4,5)
ON CONFLICT DO NOTHING;

-- Reserva para el siguiente día laborable; permite demostrar consulta, retiro y liquidación.
WITH proximo_dia AS (
    SELECT CASE EXTRACT(ISODOW FROM CURRENT_DATE)::int
        WHEN 5 THEN CURRENT_DATE + 3 WHEN 6 THEN CURRENT_DATE + 2 ELSE CURRENT_DATE + 1 END AS fecha
), menu_aplicable AS (
    SELECT m.id, p.fecha FROM proximo_dia p JOIN menu_diario m
      ON m.semana_id = 1 AND EXTRACT(ISODOW FROM p.fecha) = CASE m.dia_semana
          WHEN 'MONDAY' THEN 1 WHEN 'TUESDAY' THEN 2 WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4 WHEN 'FRIDAY' THEN 5 END
)
INSERT INTO reserva (id, codigo, usuario_id, menu_id, fecha, estado, creada_en)
SELECT 1, 'DEMO-RESERVA-001', 1, id, fecha, 'ACTIVA', CURRENT_TIMESTAMP FROM menu_aplicable
ON CONFLICT DO NOTHING;

INSERT INTO reserva_comida (reserva_id, comida_id) VALUES (1,1), (1,3), (1,4), (1,5) ON CONFLICT DO NOTHING;

WITH ultimo_laborable AS (
    SELECT d::date AS fecha
    FROM generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '1 month',
                         date_trunc('month', CURRENT_DATE) - INTERVAL '1 day', INTERVAL '1 day') d
    WHERE EXTRACT(ISODOW FROM d) BETWEEN 1 AND 5
    ORDER BY d DESC LIMIT 1
), menu_aplicable AS (
    SELECT m.id, u.fecha FROM ultimo_laborable u JOIN menu_diario m
      ON m.semana_id = 1 AND EXTRACT(ISODOW FROM u.fecha) = CASE m.dia_semana
          WHEN 'MONDAY' THEN 1 WHEN 'TUESDAY' THEN 2 WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4 WHEN 'FRIDAY' THEN 5 END
)
INSERT INTO reserva (id, codigo, usuario_id, menu_id, fecha, estado, creada_en)
SELECT 2, 'DEMO-RESERVA-002', 2, id, fecha, 'ACTIVA', fecha::timestamp - INTERVAL '1 day' FROM menu_aplicable
ON CONFLICT DO NOTHING;

INSERT INTO reserva_comida (reserva_id, comida_id) VALUES (2,1), (2,3), (2,4), (2,5) ON CONFLICT DO NOTHING;

INSERT INTO liquidacion_mensual (id, usuario_id, anio, mes, importe_total, generada_en)
VALUES (1, 2,
        EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::smallint,
        EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')::smallint,
        2500.00, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO asistencia (id, reserva_id, administrador_id, liquidacion_id, confirmada_en)
SELECT 1, 2, 3, 1, r.fecha::timestamp + INTERVAL '12 hours' FROM reserva r WHERE r.id = 2
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('rol','id'), COALESCE(MAX(id),1)) FROM rol;
SELECT setval(pg_get_serial_sequence('restriccion_alimenticia','id'), COALESCE(MAX(id),1)) FROM restriccion_alimenticia;
SELECT setval(pg_get_serial_sequence('usuario','id'), COALESCE(MAX(id),1)) FROM usuario;
SELECT setval(pg_get_serial_sequence('comida','id'), COALESCE(MAX(id),1)) FROM comida;
SELECT setval(pg_get_serial_sequence('temporada','id'), COALESCE(MAX(id),1)) FROM temporada;
SELECT setval(pg_get_serial_sequence('semana_temporada','id'), COALESCE(MAX(id),1)) FROM semana_temporada;
SELECT setval(pg_get_serial_sequence('menu_diario','id'), COALESCE(MAX(id),1)) FROM menu_diario;
SELECT setval(pg_get_serial_sequence('reserva','id'), COALESCE(MAX(id),1)) FROM reserva;
SELECT setval(pg_get_serial_sequence('liquidacion_mensual','id'), COALESCE(MAX(id),1)) FROM liquidacion_mensual;
SELECT setval(pg_get_serial_sequence('asistencia','id'), COALESCE(MAX(id),1)) FROM asistencia;
