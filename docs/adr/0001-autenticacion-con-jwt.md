# ADR 0001 — Autenticación con contraseña propia y JWT

**Estado:** aceptada · **Fecha:** 2026-10-04

## Contexto

La spec (H1) pide ingresar con correo corporativo y contraseña, con cuatro roles (Empleado, Tercerizado, Administrador, RR. HH.). La tabla `usuario` ya guarda la contraseña como hash BCrypt. El backend es una API REST consumida por un frontend en otro dominio (Vercel), configurada sin sesiones (`STATELESS`).

## Decisión

- Login propio: `POST /api/v1/auth/login` verifica la contraseña con BCrypt y devuelve un JWT firmado con HS256.
- El token lleva `sub` (correo), `rol`, `iat` y `exp`. Nunca la contraseña: el contenido de un JWT es legible por cualquiera, solo la firma impide modificarlo.
- Duración: 60 minutos (`JWT_EXPIRACION_MINUTOS`). El secreto viene de `JWT_SECRET` y no tiene valor por defecto: sin él la aplicación no arranca (fail fast).
- La validación del token usa el módulo oficial `spring-boot-starter-oauth2-resource-server`, no un filtro escrito por el equipo.
- El rol se lee de la base al hacer login, nunca del cuerpo del pedido. `@PreAuthorize` lo verifica en el servidor.
- Errores: `401` sin sesión o token inválido; `403` rol insuficiente; `404` para un recurso ajeno, igual que para uno inexistente, filtrando por dueño en la consulta.
- El login responde siempre "Correo o contraseña incorrectos" y compara contra un hash señuelo si el correo no existe, para no revelar qué correos están registrados (ni por el mensaje ni por la demora).

## Alternativas descartadas

- **Login con Google (OAuth):** es el ejemplo de la clase, pero el dominio requiere usuarios tercerizados que no tienen cuenta corporativa de Google, y el modelo ya preveía contraseña propia.
- **Sesiones en el servidor:** obligan a guardar estado y a manejar cookies entre dominios distintos (Vercel y Render).
- **Filtro JWT propio:** más código de seguridad para mantener y revisar; la librería oficial ya valida firma y expiración.

## Consecuencias

- Un token no se puede revocar antes de que venza: si se compromete, vale hasta 60 minutos. Se acepta por el alcance del MVP.
- Rotar `JWT_SECRET` invalida todos los tokens emitidos.
- `JWT_SECRET` debe configurarse en cada entorno (Render, local, tests).