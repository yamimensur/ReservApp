# AGENTS.md — reglas de ReservApp

Este archivo guía a los asistentes de IA y a quienes contribuyan al repositorio. Debe mantenerse actualizado cuando cambien las convenciones del proyecto.

> Las reglas deben ser verificables. Si una decisión no está definida aquí o en la especificación, no se debe asumir.

## Qué es este proyecto

ReservApp es una aplicación web para la gestión de un comedor corporativo. Los empleados y el personal tercerizado consultan menús y reservan almuerzos; el administrador planifica temporadas, gestiona comidas y confirma asistencias. RR. HH. puede acceder a liquidaciones mensuales cuando tiene permiso.

El flujo principal es: una persona autenticada consulta el menú, reserva un almuerzo compatible con sus restricciones alimenticias y, al retirar el pedido, un administrador confirma la asistencia.

## La especificación

Los requisitos funcionales, criterios de aceptación, flujo principal y reglas de negocio están en [`docs/spec.md`](./docs/spec.md).

- **Antes de implementar lógica de dominio, leer `docs/spec.md`.** Las reglas de la sección 6 son obligatorias.
- Si un requerimiento, una regla o un permiso no está definido, no inventarlo: solicitar aclaración.
- Las reglas de negocio se mantienen únicamente en `docs/spec.md`; este archivo no debe duplicarlas.
- Al cambiar una funcionalidad, actualizar su historia de usuario y criterios de aceptación en `docs/spec.md` cuando corresponda.

## Stack

- Frontend: React + TypeScript + Vite.
- Interfaz: Tailwind CSS + shadcn/ui.
- Backend: Java 21 + Spring Boot 3 + Spring Web.
- Persistencia: Spring Data JPA + Hibernate + PostgreSQL.
- Migraciones: Flyway.
- Seguridad: Spring Security + JWT.
- Validaciones: Jakarta Validation.
- Testing backend: JUnit 5, Mockito, MockMvc y Testcontainers.
- Testing frontend: Vitest.

## Comandos

### Frontend

```bash
cd frontend
npm install
npm run dev       # desarrollo
npm run build     # build de producción
npm run test      # pruebas con Vitest
```

### Backend

```bash
cd backend
./mvnw spring-boot:run  # desarrollo
./mvnw test             # pruebas unitarias e integración
./mvnw verify           # verificación completa
```

En Windows usar `./mvnw.cmd` en lugar de `./mvnw`.

Después de todo cambio de esquema, agregar una migración nueva de Flyway. Nunca modificar ni borrar una migración ya aplicada.

## Estructura y dónde va cada cosa

### Frontend

| Si vas a escribir… | Va en… |
|---|---|
| Una pantalla o vista | `frontend/src/pages/` |
| Un componente reutilizable de dominio | `frontend/src/components/` |
| Un componente base de shadcn/ui | `frontend/src/components/ui/` |
| Una llamada HTTP o cliente de API | `frontend/src/services/` |
| Un hook reutilizable | `frontend/src/hooks/` |
| Un tipo o interfaz compartida | `frontend/src/types/` |
| Una utilidad sin JSX | `frontend/src/lib/` |
| Una prueba | Junto al archivo probado con el sufijo `.test.ts` o `.test.tsx` |

### Backend

El paquete base es `com.reservapp`. Cada módulo de dominio se organiza dentro de `backend/src/main/java/com/reservapp/<modulo>/`.

| Si vas a escribir… | Va en… |
|---|---|
| Un endpoint REST | `<modulo>/controller/` |
| Un DTO de entrada o salida | `<modulo>/dto/` |
| Lógica de aplicación o dominio | `<modulo>/service/` |
| Una entidad JPA | `<modulo>/entity/` |
| Un repositorio Spring Data | `<modulo>/repository/` |
| Un mapper entre entidad y DTO | `<modulo>/mapper/` |
| Seguridad, JWT o configuración transversal | `config/` o `security/` |
| Manejo global de errores | `exception/` |
| Migración de base de datos | `backend/src/main/resources/db/migration/` |
| Prueba unitaria | `backend/src/test/java/` replicando el paquete de producción |
| Prueba de integración | `backend/src/test/java/` con sufijo `IT` |

Las rutas de la API usan el prefijo `/api/v1`. No exponer entidades JPA directamente en respuestas HTTP.

## Reglas

### Datos y migraciones

- Todo acceso a datos pasa por un `Repository` de Spring Data JPA; controladores y DTOs no acceden a repositorios directamente.
- La lógica de negocio vive en servicios; los controladores solo reciben requests, validan DTOs y delegan.
- Las consultas que devuelven listas deben tener paginación o un límite explícito, salvo catálogos pequeños justificados.
- Toda modificación de esquema se realiza con una migración Flyway nueva nombrada `V<versión>__<descripcion>.sql`.
- No usar `ddl-auto=update` fuera del entorno local de desarrollo. En pruebas e integración, el esquema debe surgir de Flyway.
- Definir restricciones de base de datos para invariantes relevantes: claves foráneas, `NOT NULL`, índices y restricciones únicas cuando apliquen.

### Validación y API

- Toda entrada HTTP se recibe mediante DTOs y se valida con Jakarta Validation (`@Valid`, `@NotNull`, `@NotBlank`, etc.).
- Las validaciones entre campos y las reglas temporales o de dominio se implementan en la capa de servicio o mediante un validador específico; no se duplican entre controlador y servicio.
- Los valores de dominio cerrados (roles, estados, tipos de comida) se representan con `enum`, no con `String` libre.
- No usar `Object`, datos sin tipo o conversiones sin validar para procesar entradas externas.
- Usar códigos HTTP y una respuesta de error consistente. Los errores se manejan centralmente con `@RestControllerAdvice`.
- Fechas, horas y zona horaria se manejan explícitamente. Las reglas de corte horario deben poder probarse sin depender del reloj del sistema; inyectar `Clock` cuando sea necesario.

### Seguridad

- Toda ruta protegida valida autenticación y autorización en el backend con Spring Security; ocultar un botón en el frontend no sustituye un control de acceso.
- Nunca confiar en el `userId`, rol o permiso enviados por el cliente. Se obtienen del JWT autenticado.
- Las contraseñas se almacenan únicamente con `PasswordEncoder`; nunca en texto plano, logs, DTOs de respuesta ni excepciones.
- Los secretos y credenciales van en variables de entorno o configuración externa. Nunca se versionan archivos `.env`, tokens, claves JWT o contraseñas.
- Configurar CORS con orígenes explícitos mediante `CORS_ALLOWED_ORIGINS`; no usar `*` en producción.
- Los endpoints de administración y liquidación deben requerir los roles o permisos definidos en la especificación.

### Java y Spring Boot

- Usar Java 21 y preferir clases pequeñas con responsabilidades claras.
- Los nombres de clases son PascalCase; métodos, variables y paquetes usan camelCase y minúsculas respectivamente.
- Las entidades JPA no contienen lógica de transporte HTTP ni anotaciones de controladores.
- Las transacciones se declaran en los servicios, no en los controladores.
- No capturar `Exception` genéricamente para ocultar errores. Lanzar excepciones de dominio significativas y mapearlas en el manejador global.

### React y TypeScript

- Un componente por archivo, en PascalCase. Hooks y utilidades usan camelCase.
- TypeScript estricto: está prohibido `any`. Si el dato es desconocido, usar `unknown` y validarlo antes de utilizarlo.
- Los componentes no realizan llamadas HTTP directas: usan funciones de `src/services/`.
- Resolver siempre los estados de carga, vacío y error; no dejar la pantalla en blanco ante un fallo de red.
- No duplicar tipos del backend manualmente sin necesidad; centralizar los contratos de API en `src/types/`.

### Estilos y accesibilidad

- Usar Tailwind CSS para los estilos. No crear hojas CSS globales o estilos inline salvo valores calculados en tiempo de ejecución.
- Reutilizar componentes de `src/components/ui/` antes de crear controles visuales propios.
- Todo formulario debe tener etiquetas asociadas, mensajes de error textuales y navegación funcional con teclado.
- Mantener contraste suficiente y foco visible, según los requisitos de accesibilidad de `docs/spec.md`.

### Pruebas

- Toda regla de negocio nueva o modificada debe tener al menos una prueba unitaria en el backend.
- Los endpoints críticos se prueban con MockMvc; la persistencia y las migraciones se verifican con Testcontainers cuando interactúan con PostgreSQL.
- Las pruebas no dependen de servicios externos ni de datos compartidos entre ejecuciones.
- Las historias de usuario terminadas deben verificar sus criterios de aceptación relevantes mediante pruebas manuales documentadas o automatizadas.

### Git

- Ramas: `feat/<descripcion-corta>`, `fix/<descripcion-corta>` o `docs/<descripcion-corta>`.
- Commits en imperativo y español, por ejemplo: `agrega validación de horario de reserva`.
- Nunca versionar `.env`, archivos de credenciales, claves privadas, tokens ni resultados de build.

## Cómo quiero que trabajes

- Si la consigna es ambigua o falta una regla de negocio, solicitar aclaración antes de implementar.
- Hacer cambios pequeños y enfocados; no refactorizar archivos ajenos a la tarea.
- Antes de crear un componente, helper o servicio nuevo, buscar si existe uno reutilizable en la estructura correspondiente.
- Al modificar seguridad, migraciones o modelo de datos, explicar el motivo y los efectos de la modificación.
- Ejecutar las pruebas y verificaciones aplicables antes de dar por terminado un cambio.
