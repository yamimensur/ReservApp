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
    (1, 'empleado@reservapp.demo', '$2a$10$5FwjoMNAWW/WQAe.O76FKOtMnnUd8cqkh3Ess9zU/40KLVFCGmi3O', 'EMPLEADO', 'ACTIVO', 1),
    (2, 'tercerizado@reservapp.demo', '$2a$10$5FwjoMNAWW/WQAe.O76FKOtMnnUd8cqkh3Ess9zU/40KLVFCGmi3O', 'TERCERIZADO', 'ACTIVO', 2),
    (3, 'admin@reservapp.demo', '$2a$10$5FwjoMNAWW/WQAe.O76FKOtMnnUd8cqkh3Ess9zU/40KLVFCGmi3O', 'EMPLEADO', 'ACTIVO', 3),
    (4, 'rrhh@reservapp.demo', '$2a$10$5FwjoMNAWW/WQAe.O76FKOtMnnUd8cqkh3Ess9zU/40KLVFCGmi3O', 'EMPLEADO', 'ACTIVO', 4)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO usuario_restriccion (usuario_id, restriccion_id) VALUES (1, 1), (2, 3) ON CONFLICT DO NOTHING;

-- Carta del comedor. Los ids 1 a 5 se mantienen porque los usan los tests y la reserva demo.
INSERT INTO comida (id, nombre, tipo, estado) VALUES
    (1, 'Ensalada de estación', 'ENTRADA', 'ACTIVA'),
    (2, 'Milanesa con puré', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (3, 'Curry de garbanzos', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (4, 'Fruta fresca', 'POSTRE', 'ACTIVA'),
    (5, 'Agua mineral', 'BEBIDA', 'ACTIVA'),
    (6, 'Sopa de calabaza', 'ENTRADA', 'ACTIVA'),
    (7, 'Empanada de carne', 'ENTRADA', 'ACTIVA'),
    (8, 'Tarta de acelga', 'ENTRADA', 'ACTIVA'),
    (9, 'Pollo al horno con papas', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (10, 'Ravioles de ricota con fileto', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (11, 'Merluza a la plancha con arroz', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (12, 'Guiso de lentejas', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (13, 'Pastel de papas', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (14, 'Wok de vegetales con arroz', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (15, 'Bife de cuadril con ensalada', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (16, 'Lasaña de verduras', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (17, 'Ñoquis con salsa fileto', 'PLATO_PRINCIPAL', 'ACTIVA'),
    (18, 'Flan casero', 'POSTRE', 'ACTIVA'),
    (19, 'Ensalada de frutas', 'POSTRE', 'ACTIVA'),
    (20, 'Arroz con leche', 'POSTRE', 'ACTIVA'),
    (21, 'Agua saborizada', 'BEBIDA', 'ACTIVA'),
    (22, 'Jugo de naranja', 'BEBIDA', 'ACTIVA')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo;

-- Restricciones: 1 Vegetariana, 2 Vegana, 3 Sin gluten. Si una comida no figura, no es apta.
INSERT INTO comida_restriccion_compatible (comida_id, restriccion_id) VALUES
    (1, 1), (1, 2), (1, 3), (3, 1), (3, 2), (3, 3),
    (4, 1), (4, 2), (4, 3), (5, 1), (5, 2), (5, 3),
    (6, 1), (6, 2), (6, 3), (8, 1),
    (9, 3), (10, 1), (11, 3), (12, 1), (12, 2), (12, 3), (13, 3),
    (14, 1), (14, 2), (14, 3), (15, 3), (16, 1), (17, 1),
    (18, 1), (18, 3), (19, 1), (19, 2), (19, 3), (20, 1), (20, 3),
    (21, 1), (21, 2), (21, 3), (22, 1), (22, 2), (22, 3)
ON CONFLICT DO NOTHING;

INSERT INTO temporada (id, nombre, estacion, fecha_desde, fecha_hasta, estado)
VALUES (1, 'Primavera 2026', 'PRIMAVERA', CURRENT_DATE - 60, CURRENT_DATE + 90, 'PUBLICADA')
-- Si la temporada ya existe solo cambia el nombre: las fechas quedan como estaban.
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, estacion = EXCLUDED.estacion;

INSERT INTO semana_temporada (id, temporada_id, numero) VALUES (1,1,1), (2,1,2), (3,1,3), (4,1,4) ON CONFLICT DO NOTHING;

INSERT INTO menu_diario (id, semana_id, dia_semana)
SELECT ((s.numero - 1) * 5 + d.orden), s.id, d.nombre
FROM semana_temporada s
CROSS JOIN (VALUES (1,'MONDAY'),(2,'TUESDAY'),(3,'WEDNESDAY'),(4,'THURSDAY'),(5,'FRIDAY')) AS d(orden,nombre)
WHERE s.temporada_id = 1
ON CONFLICT DO NOTHING;

-- Menú de las 4 semanas: cada día hay 3 platos principales (uno con carne, uno vegetariano
-- y uno apto para todas las restricciones), 2 entradas, 2 postres y 3 bebidas.
-- Se escribe por nombre para que sea fácil de leer y de cambiar.
DROP TABLE IF EXISTS demo_menu;
CREATE TEMP TABLE demo_menu (semana SMALLINT, dia VARCHAR(10), entrada TEXT, carne TEXT, vegetariano TEXT, apto_todos TEXT, postre TEXT);
INSERT INTO demo_menu VALUES
    (1, 'MONDAY', 'Sopa de calabaza', 'Milanesa con puré', 'Ñoquis con salsa fileto', 'Wok de vegetales con arroz', 'Flan casero'),
    (1, 'TUESDAY', 'Empanada de carne', 'Pollo al horno con papas', 'Ravioles de ricota con fileto', 'Curry de garbanzos', 'Ensalada de frutas'),
    (1, 'WEDNESDAY', 'Tarta de acelga', 'Merluza a la plancha con arroz', 'Lasaña de verduras', 'Guiso de lentejas', 'Arroz con leche'),
    (1, 'THURSDAY', 'Sopa de calabaza', 'Pastel de papas', 'Ñoquis con salsa fileto', 'Wok de vegetales con arroz', 'Flan casero'),
    (1, 'FRIDAY', 'Empanada de carne', 'Bife de cuadril con ensalada', 'Ravioles de ricota con fileto', 'Curry de garbanzos', 'Ensalada de frutas'),
    (2, 'MONDAY', 'Tarta de acelga', 'Pollo al horno con papas', 'Ravioles de ricota con fileto', 'Curry de garbanzos', 'Ensalada de frutas'),
    (2, 'TUESDAY', 'Sopa de calabaza', 'Merluza a la plancha con arroz', 'Lasaña de verduras', 'Guiso de lentejas', 'Arroz con leche'),
    (2, 'WEDNESDAY', 'Empanada de carne', 'Pastel de papas', 'Ñoquis con salsa fileto', 'Wok de vegetales con arroz', 'Flan casero'),
    (2, 'THURSDAY', 'Tarta de acelga', 'Bife de cuadril con ensalada', 'Ravioles de ricota con fileto', 'Curry de garbanzos', 'Ensalada de frutas'),
    (2, 'FRIDAY', 'Sopa de calabaza', 'Milanesa con puré', 'Lasaña de verduras', 'Guiso de lentejas', 'Arroz con leche'),
    (3, 'MONDAY', 'Empanada de carne', 'Merluza a la plancha con arroz', 'Lasaña de verduras', 'Guiso de lentejas', 'Arroz con leche'),
    (3, 'TUESDAY', 'Tarta de acelga', 'Pastel de papas', 'Ñoquis con salsa fileto', 'Wok de vegetales con arroz', 'Flan casero'),
    (3, 'WEDNESDAY', 'Sopa de calabaza', 'Bife de cuadril con ensalada', 'Ravioles de ricota con fileto', 'Curry de garbanzos', 'Ensalada de frutas'),
    (3, 'THURSDAY', 'Empanada de carne', 'Milanesa con puré', 'Lasaña de verduras', 'Guiso de lentejas', 'Arroz con leche'),
    (3, 'FRIDAY', 'Tarta de acelga', 'Pollo al horno con papas', 'Ñoquis con salsa fileto', 'Wok de vegetales con arroz', 'Flan casero'),
    (4, 'MONDAY', 'Sopa de calabaza', 'Pastel de papas', 'Ñoquis con salsa fileto', 'Wok de vegetales con arroz', 'Flan casero'),
    (4, 'TUESDAY', 'Empanada de carne', 'Bife de cuadril con ensalada', 'Ravioles de ricota con fileto', 'Curry de garbanzos', 'Ensalada de frutas'),
    (4, 'WEDNESDAY', 'Tarta de acelga', 'Milanesa con puré', 'Lasaña de verduras', 'Guiso de lentejas', 'Arroz con leche'),
    (4, 'THURSDAY', 'Sopa de calabaza', 'Pollo al horno con papas', 'Ñoquis con salsa fileto', 'Wok de vegetales con arroz', 'Flan casero'),
    (4, 'FRIDAY', 'Empanada de carne', 'Merluza a la plancha con arroz', 'Ravioles de ricota con fileto', 'Curry de garbanzos', 'Ensalada de frutas');

-- Se rearma el menú de la temporada. Las reservas guardan sus comidas aparte (reserva_comida),
-- así que esto no cambia lo que ya reservó cada persona.
DELETE FROM menu_comida WHERE menu_id IN (
    SELECT m.id FROM menu_diario m JOIN semana_temporada s ON s.id = m.semana_id WHERE s.temporada_id = 1);

INSERT INTO menu_comida (menu_id, comida_id)
SELECT m.id, c.id
FROM demo_menu dm
JOIN semana_temporada s ON s.temporada_id = 1 AND s.numero = dm.semana
JOIN menu_diario m ON m.semana_id = s.id AND m.dia_semana = dm.dia
JOIN comida c ON c.id BETWEEN 1 AND 22 AND c.nombre IN (
    dm.entrada, dm.carne, dm.vegetariano, dm.apto_todos, dm.postre,
    'Ensalada de estación', 'Fruta fresca', 'Agua mineral', 'Agua saborizada', 'Jugo de naranja')
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

-- ---------------------------------------------------------------------------
-- Personas y movimiento del comedor, para que la demo muestre un uso real:
-- reservas de las últimas dos semanas (con asistencia) y de las próximas cuatro.
-- Todas usan la contraseña "password", igual que los usuarios demo.
-- No se agregan reservas futuras a empleado@ ni a tercerizado@: los tests las crean.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS demo_persona;
CREATE TEMP TABLE demo_persona (orden INT, correo TEXT, tipo_usuario TEXT, rol_id BIGINT, restriccion_id BIGINT, solo_pasado BOOLEAN);
INSERT INTO demo_persona VALUES
    (1, 'lucia.gomez@reservapp.demo', 'EMPLEADO', 1, NULL, false),
    (2, 'martin.fernandez@reservapp.demo', 'EMPLEADO', 1, NULL, false),
    (3, 'sofia.rodriguez@reservapp.demo', 'EMPLEADO', 1, 1, false),
    (4, 'diego.lopez@reservapp.demo', 'EMPLEADO', 1, NULL, false),
    (5, 'valentina.diaz@reservapp.demo', 'EMPLEADO', 1, 3, false),
    (6, 'joaquin.martinez@reservapp.demo', 'EMPLEADO', 1, NULL, false),
    (7, 'camila.perez@reservapp.demo', 'EMPLEADO', 1, 2, false),
    (8, 'nicolas.sanchez@reservapp.demo', 'EMPLEADO', 1, NULL, false),
    (9, 'florencia.romero@reservapp.demo', 'TERCERIZADO', 2, NULL, false),
    (10, 'matias.alvarez@reservapp.demo', 'TERCERIZADO', 2, 3, false),
    -- El empleado demo (vegetariano) tiene historial pasado para que "Mis reservas" no esté vacío.
    (11, 'empleado@reservapp.demo', 'EMPLEADO', 1, 1, true);

INSERT INTO usuario (correo, password_hash, tipo_usuario, estado, rol_id)
SELECT correo, '$2a$10$5FwjoMNAWW/WQAe.O76FKOtMnnUd8cqkh3Ess9zU/40KLVFCGmi3O', tipo_usuario, 'ACTIVO', rol_id
FROM demo_persona
ON CONFLICT (correo) DO NOTHING;

INSERT INTO usuario_restriccion (usuario_id, restriccion_id)
SELECT u.id, p.restriccion_id FROM demo_persona p JOIN usuario u ON u.correo = p.correo
WHERE p.restriccion_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Días laborables de la ventana y el menú que corresponde a cada uno
-- (misma cuenta que Temporada.numeroDeSemana: semanas desde el inicio, rotando de 1 a 4).
DROP TABLE IF EXISTS demo_dia;
CREATE TEMP TABLE demo_dia AS
SELECT d::date AS fecha, m.id AS menu_id
FROM temporada t
CROSS JOIN generate_series(GREATEST(t.fecha_desde, CURRENT_DATE - 14),
                           LEAST(t.fecha_hasta, CURRENT_DATE + 28), INTERVAL '1 day') d
JOIN semana_temporada s ON s.temporada_id = t.id AND s.numero = ((d::date - t.fecha_desde) / 7) % 4 + 1
JOIN menu_diario m ON m.semana_id = s.id AND m.dia_semana = to_char(d, 'FMDAY')
WHERE t.id = 1 AND EXTRACT(ISODOW FROM d) BETWEEN 1 AND 5;

-- No todos almuerzan todos los días, y alguna que otra reserva se cancela.
-- El código es un UUID fijo por persona y fecha, así el script se puede volver a correr sin duplicar.
INSERT INTO reserva (codigo, usuario_id, menu_id, fecha, estado, creada_en)
SELECT md5(p.correo || dd.fecha)::uuid::text, u.id, dd.menu_id, dd.fecha,
       CASE WHEN (p.orden * 3 + (dd.fecha - DATE '2026-01-05')) % 13 = 0 THEN 'CANCELADA' ELSE 'ACTIVA' END,
       LEAST(((dd.fecha - 1) + TIME '16:00' + p.orden * INTERVAL '11 minutes') AT TIME ZONE 'America/Argentina/Buenos_Aires',
             CURRENT_TIMESTAMP - p.orden * INTERVAL '5 minutes')
FROM demo_dia dd
CROSS JOIN demo_persona p
JOIN usuario u ON u.correo = p.correo
WHERE (p.orden + (dd.fecha - DATE '2026-01-05')) % 4 <> 0
  AND (NOT p.solo_pasado OR (dd.fecha < CURRENT_DATE AND (dd.fecha - DATE '2026-01-05') % 3 = 0))
ON CONFLICT DO NOTHING;

-- Qué eligió cada persona: quien tiene una restricción va por el plato apto para todos;
-- el resto alterna entre carne y vegetariano. Siempre un solo plato principal.
INSERT INTO reserva_comida (reserva_id, comida_id)
SELECT r.id, c.id
FROM reserva r
JOIN usuario u ON u.id = r.usuario_id
JOIN demo_persona p ON p.correo = u.correo AND r.codigo = md5(p.correo || r.fecha)::uuid::text
JOIN menu_diario m ON m.id = r.menu_id
JOIN semana_temporada s ON s.id = m.semana_id
JOIN demo_menu dm ON dm.semana = s.numero AND dm.dia = m.dia_semana
CROSS JOIN LATERAL (VALUES
    (CASE WHEN (p.orden + r.id) % 4 = 0 THEN NULL
          WHEN p.restriccion_id IS NOT NULL OR (p.orden + r.id) % 2 = 0 THEN 'Ensalada de estación'
          ELSE dm.entrada END),
    (CASE WHEN p.restriccion_id IS NOT NULL THEN dm.apto_todos
          WHEN (p.orden + r.id) % 3 = 0 THEN dm.vegetariano
          ELSE dm.carne END),
    (CASE WHEN p.restriccion_id IS NOT NULL OR (p.orden + r.id) % 2 = 1 THEN 'Fruta fresca' ELSE dm.postre END),
    ((ARRAY['Agua mineral', 'Agua saborizada', 'Jugo de naranja'])[p.orden % 3 + 1])
) AS eleccion(nombre)
JOIN comida c ON c.id BETWEEN 1 AND 22 AND c.nombre = eleccion.nombre
ON CONFLICT DO NOTHING;

-- Asistencia confirmada por el administrador en los días que ya pasaron (algunos no vinieron).
INSERT INTO asistencia (reserva_id, administrador_id, confirmada_en)
SELECT r.id, a.id,
       (r.fecha + TIME '12:10' + ((p.orden * 7 + r.id) % 80) * INTERVAL '1 minute') AT TIME ZONE 'America/Argentina/Buenos_Aires'
FROM reserva r
JOIN usuario u ON u.id = r.usuario_id
JOIN demo_persona p ON p.correo = u.correo AND r.codigo = md5(p.correo || r.fecha)::uuid::text
JOIN usuario a ON a.correo = 'admin@reservapp.demo'
WHERE r.estado = 'ACTIVA' AND r.fecha < CURRENT_DATE AND (p.orden + r.id) % 9 <> 0
ON CONFLICT (reserva_id) DO NOTHING;

DROP TABLE demo_dia;
DROP TABLE demo_persona;
DROP TABLE demo_menu;
