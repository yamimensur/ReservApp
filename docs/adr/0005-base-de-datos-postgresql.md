# ADR 0005 — Base de datos PostgreSQL y modelo relacional

**Estado:** aceptada · **Fecha:** 2026-10-05

## Contexto

El dominio tiene muchas relaciones entre entidades: cuatro relaciones N-N (usuario–restricción, comida–restricción, menú–comida y reserva–comida), historial que debe conservarse (reservas, asistencias, liquidaciones) y reglas de unicidad (una reserva activa por persona y día, una sola temporada publicada). El plan inicial, heredado del Trabajo de Diploma, usaba MySQL junto con Firebase Authentication.

## Decisión

- **PostgreSQL**, alojado en Supabase en producción (ver ADR 0002).
- **La integridad la garantiza la base, no solo el código:** claves foráneas con reglas de borrado, `UNIQUE`, `CHECK` (reservas solo de lunes a viernes, estados válidos, rangos de fechas) y transacciones. Una regla protegida por la base se cumple aunque lleguen dos pedidos al mismo tiempo.
- **Una única fuente de datos:** usuarios, roles y reservas viven en la misma base, sin un servicio externo de usuarios que haya que sincronizar.
- **Migraciones versionadas con Flyway.** Una migración aplicada nunca se modifica; cada cambio de esquema es una versión nueva. Hibernate solo valida el esquema (`ddl-auto=validate`). Los datos de demostración son una migración repetible que solo se activa con el perfil `demo`.

Decisiones del modelo (detalle en `spec.md` y `modelo-entidades.md`):

- Cada usuario tiene exactamente un rol.
- El menú es una plantilla por día de la semana, dentro de un ciclo de cuatro semanas por temporada: no se guarda un menú por cada fecha.
- Reglas de borrado: `RESTRICT` para conservar el historial (reservas, asistencias, liquidaciones) y `CASCADE` para lo que es parte de otra entidad (las semanas de una temporada, los menús de una semana).
- La cancelación es lógica: la reserva pasa a `CANCELADA` y se conserva para el historial.
- Una persona puede tener una sola reserva **activa** por día. La V1 aplicaba la restricción también a las canceladas, lo que impedía volver a reservar después de cancelar; se corrige con un índice único parcial sobre las reservas activas.

## Alternativas descartadas

- **MongoDB:** las relaciones N-N y las reglas de borrado tendrían que mantenerse a mano en el código; la integridad dependería de que ningún camino del código la olvide.
- **MySQL (plan inicial):** se integra igual de bien con Spring, pero no admite índices únicos parciales, que el modelo usa para "una sola temporada publicada" y "una sola reserva activa por día". Además, Supabase y la cátedra trabajan con PostgreSQL.
- **Firebase Authentication con una base aparte:** duplica los datos de usuario en dos lugares y agrega errores de sincronización.

## Consecuencias

- Todo cambio de esquema requiere una migración nueva y probada en local antes de llegar a producción.
- Las consultas deben cuidar el problema N+1: los repositorios cargan las relaciones necesarias con `@EntityGraph`.
- El modelo relacional exige definir las relaciones y sus reglas de borrado antes de implementar, como quedó en `spec.md`.
