# Contrato de la API REST

La API usa JSON, el prefijo `/api/v1` y autenticación JWT salvo donde se indique que el acceso es público. Las identidades y roles se obtienen del token; nunca del cuerpo de la solicitud. Los listados se paginan con `page` y `size` (máximo 50).

## Operaciones

| Método y ruta | Qué hace | Rol | Respuestas y errores |
|---|---|---|---|
| `GET /api/v1/health` | Comprueba la disponibilidad de la API | Público | `200` |
| `POST /api/v1/auth/login` | Autentica con correo corporativo | Público | `200`; `401` credenciales inválidas o usuario inactivo |
| `GET /api/v1/usuarios/me` | Consulta el perfil y restricciones propios | Empleado, Tercerizado, Administrador, RR. HH. | `200`; `401` |
| `PATCH /api/v1/usuarios/me/restricciones` | Actualiza restricciones propias | Empleado, Tercerizado | `200`; `400` body inválido; `404` restricción inexistente |
| `GET /api/v1/menus?fecha=AAAA-MM-DD` | Consulta el menú aplicable y sus compatibilidades | Empleado, Tercerizado | `200`; `400` fecha inválida; `404` menú no publicado |
| `GET /api/v1/reservas?page=0&size=20` | Lista las reservas de la persona autenticada | Empleado, Tercerizado | `200`; `401`; `403` rol sin acceso |
| `POST /api/v1/reservas` | Registra una reserva propia | Empleado, Tercerizado | `201`; `400` body inválido; `404` menú/comida inexistente; `409` reserva duplicada; `422` fecha, temporada, menú o selección incompatibles |
| `GET /api/v1/reservas/{id}` | Consulta una reserva propia | Empleado, Tercerizado | `200`; `404` ajena o inexistente |
| `PATCH /api/v1/reservas/{id}` | Modifica las comidas de una reserva propia | Empleado, Tercerizado | `200`; `400` body inválido; `404` ajena o reserva/comida inexistente; `409` horario vencido; `422` selección inválida |
| `DELETE /api/v1/reservas/{id}` | Cancela lógicamente una reserva propia | Empleado, Tercerizado | `204`; `404` ajena o inexistente; `409` horario vencido |
| `POST /api/v1/reservas/{id}/confirmacion-asistencia` | Confirma el retiro de una reserva activa (operación principal no-ABM) | Administrador | `201`; `403` rol insuficiente; `404` reserva inexistente; `409` cancelada o ya confirmada |
| `GET /api/v1/comidas?page=0&size=20` | Lista comidas | Administrador | `200`; `403` |
| `POST /api/v1/comidas` | Crea una comida | Administrador | `201`; `400`; `409` nombre duplicado |
| `GET /api/v1/comidas/{id}` | Consulta una comida | Administrador | `200`; `404` |
| `PATCH /api/v1/comidas/{id}` | Modifica comida y compatibilidades | Administrador | `200`; `400`; `404`; `409` nombre duplicado |
| `DELETE /api/v1/comidas/{id}` | Desactiva una comida | Administrador | `204`; `404`; `409` si la operación afecta historial |
| `GET /api/v1/temporadas?page=0&size=20` | Lista temporadas | Administrador | `200`; `403` |
| `POST /api/v1/temporadas` | Crea una temporada y sus cuatro semanas | Administrador | `201`; `400`; `409` fechas superpuestas |
| `GET /api/v1/temporadas/{id}` | Consulta una temporada | Administrador | `200`; `404` |
| `PATCH /api/v1/temporadas/{id}` | Modifica una temporada en borrador | Administrador | `200`; `400`; `404`; `409` estado o fechas incompatibles |
| `DELETE /api/v1/temporadas/{id}` | Elimina una temporada sin historial | Administrador | `204`; `404`; `409` publicada o utilizada |
| `POST /api/v1/temporadas/{id}/publicacion` | Publica una temporada completa | Administrador | `201`; `404`; `409` incompleta, solapada o ya publicada |
| `GET /api/v1/asistencias?fecha=AAAA-MM-DD&page=0&size=50` | Lista asistencias y reservas diarias | Administrador | `200`; `400`; `403` |
| `POST /api/v1/liquidaciones` | Genera liquidaciones de un mes cerrado | Administrador, RR. HH. autorizado | `201`; `400`; `403`; `409` período abierto o ya liquidado |
| `GET /api/v1/liquidaciones?page=0&size=20` | Lista liquidaciones permitidas | Administrador, RR. HH. autorizado | `200`; `403` |
| `GET /api/v1/liquidaciones/{id}/exportacion?formato=csv|pdf` | Exporta una liquidación | Administrador, RR. HH. autorizado | `200`; `400`; `403`; `404` |
| `GET /api/v1/reportes/resumen?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` | Resume asistencia, consumo y preferencias | Administrador, RR. HH. autorizado | `200`; `400`; `403` |

## Estado de implementación de esta iteración

Están implementados el health check, el login con JWT (`POST /api/v1/auth/login`), el CRUD REST de `Reserva` (donde `DELETE` cancela para preservar historial) y la confirmación de asistencia. El resto constituye el contrato derivado de las historias H1–H6 y se implementará en sus iteraciones correspondientes.

Pendientes explícitos exigidos por la cursada:

- `TODO (clase 5)`: ampliar casos de reglas de negocio conforme se incorporen las restantes operaciones del contrato.
