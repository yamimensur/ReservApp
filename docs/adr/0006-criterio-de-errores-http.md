# ADR 0006 — Criterio de códigos de error HTTP

**Estado:** aceptada · **Fecha:** 2026-10-06

## Contexto

Los errores de la API se originan en varias capas: Spring Security (autenticación y roles), la validación de los pedidos, las reglas de negocio y el manejador global de excepciones. Sin un criterio común, un mismo tipo de problema podía responder con códigos distintos según dónde se detectara.

La clase 5 pide justificar el uso de `422`. Además, al sumar un manejador genérico de `Exception`, errores del cliente (un JSON mal escrito, una ruta inexistente, un id no numérico) pasaron a responder `500`, como si fueran fallas del servidor.

## Decisión

Cada código responde a una pregunta distinta:

| Código | Cuándo | Ejemplos |
| --- | --- | --- |
| `400` | El pedido está mal formado: se detecta mirando solo el pedido | JSON ilegible; un campo inválido (con detalle en `fields`); `/reservas/abc` |
| `401` | No se sabe quién hace el pedido | Sin token, token inválido o vencido |
| `403` | Se sabe quién es, pero su rol no alcanza | Un administrador consultando "mis reservas" |
| `404` | El recurso no existe, o existe pero es de otra persona | Reserva inexistente o ajena (ver ADR 0001); ruta inexistente |
| `409` | Choca con el estado actual: el mismo pedido podría ser válido en otro momento | Ya hay una reserva activa para esa fecha; venció el horario de las 09:00; asistencia ya confirmada |
| `422` | Está bien formado, pero rompe una regla de negocio | El menú no corresponde al día; selección inválida; temporada no publicada; fecha fuera de rango |
| `500` | Solo lo no previsto: un bug | Se registra el detalle en el log y se responde un mensaje genérico, sin datos internos |

Implementación:

- Todas las respuestas de error usan el mismo formato (`ApiError`), incluidas las de Spring Security.
- `GlobalExceptionHandler` tiene un manejador específico por cada tipo de error previsto. Spring elige el más específico, así que el genérico de `Exception` solo recibe lo no previsto.
- El catálogo de `docs/api.md` documenta los errores de cada operación.

## Alternativas descartadas

- **Un único `400` para todo error del cliente:** más simple, pero no distingue "corregí el pedido" de "el negocio no lo permite", y el cliente no puede mostrar mensajes distintos.
- **`400` en lugar de `422` para las reglas de negocio:** es válido y muchas APIs lo hacen; se eligió `422` para separar los errores de forma de los de negocio.
- **Dejar el manejo de errores por defecto de Spring:** cada capa respondería con un formato distinto.

## Consecuencias

- El frontend puede decidir qué mostrar según el código, sin interpretar el texto del mensaje.
- Cada nuevo tipo de error tiene que sumarse con su manejador específico: si no, cae en el genérico y responde `500`. `ManejoDeErroresTest` cubre los casos de pedidos mal formados y rutas inexistentes.
- El catálogo de `api.md` debe mantenerse sincronizado con el código.