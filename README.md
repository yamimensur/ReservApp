# ReservApp

Aplicación web para la gestión integral de un comedor corporativo. Permite a empleados y personal tercerizado reservar su almuerzo, mientras que los administradores planifican menús, registran asistencias y obtienen información para la operación diaria.

## Objetivo

Digitalizar la gestión de reservas del comedor para mejorar la planificación alimentaria, reducir desperdicios y ofrecer a cada persona opciones compatibles con sus restricciones alimenticias.

## Alcance funcional

### Usuarios

| Rol | Capacidades principales |
| --- | --- |
| Empleado | Consultar el menú, registrar y administrar sus reservas, e indicar restricciones alimenticias. |
| Personal tercerizado | Utilizar las funciones de reserva habilitadas para su tipo de usuario. |
| Administrador del comedor | Gestionar comidas y temporadas, consultar reservas y registrar asistencias. |
| RR. HH. | Consultar y generar liquidaciones mensuales cuando cuente con permisos. |

### Funcionalidades incluidas

- Autenticación con credenciales corporativas y autorización por roles.
- Registro de restricciones alimenticias y sugerencias de platos compatibles.
- Consulta de menú y reserva de almuerzo con entrada, plato principal, postre y bebida; el plato principal es obligatorio.
- Modificación o cancelación de reservas antes de la hora límite.
- Validación de una sola reserva por persona y día, exclusivamente en días laborables, hasta siete días de anticipación y antes de las 09:00.
- Gestión de comidas y de su compatibilidad con restricciones alimenticias.
- Planificación y publicación de temporadas de menú con ciclos circulares de cuatro semanas.
- Panel administrativo con reservas diarias, detalle de elecciones y control de asistencia mediante código de reserva o búsqueda manual.
- Liquidación mensual basada en asistencias confirmadas, con importes según el tipo de empleado y exportación prevista a CSV y PDF.
- Reportes de asistencia, consumo y preferencias alimentarias para apoyar la toma de decisiones.

### Fuera de alcance inicial

- Inventario de ingredientes y materias primas.
- Compras y gestión de proveedores.
- Procesamiento de pagos, descuentos de nómina o integración con sistemas externos de RR. HH.
- Aplicación móvil nativa; la aplicación web será responsive.
- Notificaciones automáticas por correo o mensajería.
- Cálculos nutricionales avanzados y calificación de comidas.

## Tecnologías

| Parte | Tecnología |
| --- | --- |
| Frontend | React + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Java 21 + Spring Boot 3 |
| API | REST con Spring Web |
| Validaciones | Jakarta Validation (`@Valid`, `@NotNull`, etc.) |
| ORM | Spring Data JPA + Hibernate |
| Base de datos | PostgreSQL |
| Migraciones | Flyway |
| Autenticación | Spring Security + JWT |
| Testing backend | JUnit 5 + Mockito |
| Testing API | MockMvc / Testcontainers |
| Testing frontend | Vitest |
| Integraciones externas | Cloudinary, Resend, Mercado Pago, Maps u otras según la necesidad del producto |
| Deploy frontend | Vercel |
| Deploy backend | Render o Railway |
| Base de datos en producción | Supabase PostgreSQL, Neon o Railway |
| Repositorio | GitHub |

## Estructura del proyecto

```text
ReservApp/
├── frontend/        # Cliente web en React
├── backend/         # API REST en Spring Boot
├── docs/            # Documentación funcional y técnica
└── README.md
```

## Reglas de negocio clave

| Regla | Definición |
| --- | --- |
| Ventana de reserva | Hasta 7 días hacia adelante, solo días laborables y antes de las 09:00. |
| Unicidad | Una única reserva por usuario y por día. |
| Composición | El plato principal es obligatorio; entrada, postre y bebida son opcionales. |
| Restricciones | Las comidas seleccionadas deben ser compatibles con las restricciones registradas. |
| Temporadas | Solo puede existir una temporada activa; las semanas rotan automáticamente en un ciclo de 4 semanas. |
| Asistencia | Solo se confirma una asistencia si hay una reserva activa; se evita el registro duplicado. |
| Liquidación | Se calcula sobre asistencias confirmadas y aplica el importe definido para cada tipo de empleado. |

## Requisitos

- Node.js 20 o superior y un gestor de paquetes (`npm`, `pnpm` o `yarn`).
- Java 21.
- PostgreSQL 16 o superior.
- Docker (opcional, recomendado para levantar servicios locales y ejecutar pruebas de integración).

## Puesta en marcha local

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd ReservApp
```

### 2. Configurar la base de datos

Crea una base de datos PostgreSQL local, por ejemplo `reservapp`, y define las variables de entorno del backend:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=reservapp
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET=una_clave_larga_y_segura
```

Las migraciones de esquema se ejecutarán con Flyway al iniciar la aplicación.

Para cargar los datos de demostración del flujo principal, activa además el perfil `demo`:

```env
SPRING_PROFILES_ACTIVE=demo
```

Este perfil agrega `db/seed` a las ubicaciones de Flyway. No debe habilitarse en una base de producción con datos reales.

### 3. Iniciar el backend

```bash
cd backend
./mvnw spring-boot:run
```

En Windows también se puede usar:

```powershell
.\mvnw.cmd spring-boot:run
```

La API quedará disponible, por defecto, en `http://localhost:8080`.

### 4. Iniciar el frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite mostrará la URL local de acceso, habitualmente `http://localhost:5173`.

## Variables de entorno

Cada aplicación debe disponer de su propio archivo de variables locales, sin versionar secretos.

### Backend

| Variable | Descripción |
| --- | --- |
| `DB_HOST` | Host de PostgreSQL. |
| `DB_PORT` | Puerto de PostgreSQL. |
| `DB_NAME` | Nombre de la base de datos. |
| `DB_USERNAME` | Usuario de la base de datos. |
| `DB_PASSWORD` | Contraseña de la base de datos. |
| `JWT_SECRET` | Clave secreta usada para firmar tokens JWT. |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos para el frontend. |

### Frontend

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API REST. |

Ejemplo:

```env
VITE_API_URL=http://localhost:8080
```

## Calidad y pruebas

### Backend

```bash
cd backend
./mvnw test
```

El backend usará JUnit 5 y Mockito para pruebas unitarias. Las pruebas de la capa HTTP se implementarán con MockMvc y, cuando corresponda, Testcontainers para verificar la integración con PostgreSQL.

### Frontend

```bash
cd frontend
npm run test
```

Las pruebas del cliente se realizarán con Vitest.

## API y seguridad

- La comunicación entre frontend y backend se realiza mediante una API REST.
- Los datos de entrada se validan con Jakarta Validation antes de ser procesados.
- La autenticación y autorización se implementan con Spring Security y JWT.
- Las contraseñas nunca deben almacenarse en texto plano; se utilizará un algoritmo de hash seguro configurado por Spring Security.
- El acceso a funciones administrativas y de liquidación estará limitado por roles y permisos.
- La documentación de endpoints, contratos y códigos de respuesta se mantendrá en `docs/`.

## Iteraciones previstas

1. Autenticación y carga de menús semanales.
2. Consulta de menú, reserva, modificación y cancelación dentro del horario permitido.
3. Panel administrativo, gestión de comidas y control de asistencia.
4. Diferenciación por tipo de usuario, liquidaciones y reportes.

## Despliegue

La propuesta de despliegue es independiente por componente:

- Frontend: Vercel.
- Backend: Render o Railway.
- Base de datos: Supabase PostgreSQL, Neon o Railway.

Antes de desplegar, configura las variables de producción en cada plataforma, incluyendo `JWT_SECRET`, las credenciales de PostgreSQL y `CORS_ALLOWED_ORIGINS` con el dominio público del frontend.

## Convenciones de contribución

- No subir archivos `.env`, claves, tokens ni credenciales.
- Crear migraciones versionadas de Flyway para todo cambio de esquema.
- Acompañar los cambios de backend y frontend con pruebas cuando aplique.
- Mantener los cambios pequeños, con mensajes de commit claros y descriptivos.

## Documentación

La documentación funcional y técnica del proyecto se encuentra en [docs/spec.md](docs/spec.md).
