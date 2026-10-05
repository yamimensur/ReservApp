# ReservApp

Aplicación web para la gestión integral de un comedor corporativo. Permite a empleados y personal tercerizado reservar su almuerzo, mientras que los administradores planifican menús, registran asistencias y obtienen información para la operación diaria.

## Equipo

- Yamile Mensur — responsable del repositorio (creó el repo y tiene la cuenta de Vercel)
- Aldana Muñoz
- Virginia Martinez
- Cecilia Nuñez — cuenta de Render (backend en producción)

## Producción

- **Frontend:** https://reserv-app-hazel.vercel.app
- **API:** https://reservapp-api-v7dk.onrender.com (estado: `/api/v1/health`)
- **Base de datos:** Supabase (PostgreSQL)

El plan gratuito de Render apaga el servicio tras unos minutos sin tráfico: el primer pedido puede tardar uno o dos minutos. Ver [ADR 0002](docs/adr/0002-hosting-render-supabase.md).

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
- Correos al modificar o cancelar, recordatorios y mensajería. El comprobante al crear la reserva se envía con Resend.
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
| Deploy backend | Render (Docker) |
| Base de datos en producción | Supabase PostgreSQL |
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
JWT_SECRET=pegar_aca_una_clave_de_al_menos_32_caracteres
```

`JWT_SECRET` es obligatoria y debe tener **al menos 32 caracteres**: sin ella el backend no arranca. Se puede generar una con `openssl rand -base64 48` (incluido en Git Bash).

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
| `JWT_SECRET` | Clave secreta usada para firmar tokens JWT. Sin ella el backend no arranca. |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos para el frontend. |
| `RESEND_API_KEY` | Clave de Resend para el comprobante de reserva. Si falta, el backend arranca igual y la reserva responde `notificacion: NO_ENVIADA`. En Render la carga Cecilia. |
| `RESEND_FROM` | Remitente del comprobante. Por defecto `ReservApp <onboarding@resend.dev>`. |

### Frontend

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API REST. |

Ejemplo:

```env
VITE_API_URL=http://localhost:8080
```

En despliegue, el frontend de Vercel debe definir `VITE_API_URL` con el dominio público HTTPS del backend de Render, sin una barra final. El backend debe definir `CORS_ALLOWED_ORIGINS` con el dominio público de Vercel. Si hay más de un origen autorizado, se separan con comas.

El endpoint público `GET /api/v1/health` permite comprobar la conexión sin autenticación. El resto de las rutas bajo `/api` permanece protegido.

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
- Backend: Render, con la imagen definida en `backend/Dockerfile`. Se despliega automáticamente desde `main`.
- Base de datos: Supabase PostgreSQL, conectada por *Session pooler*.

Antes de desplegar, configura las variables de producción en cada plataforma, incluyendo `JWT_SECRET`, las credenciales de PostgreSQL y `CORS_ALLOWED_ORIGINS` con el dominio público del frontend.

## Convenciones de contribución

- No subir archivos `.env`, claves, tokens ni credenciales.
- Crear migraciones versionadas de Flyway para todo cambio de esquema.
- Acompañar los cambios de backend y frontend con pruebas cuando aplique.
- Mantener los cambios pequeños, con mensajes de commit claros y descriptivos.

## Documentación

La documentación funcional y técnica del proyecto se encuentra en [docs/spec.md](docs/spec.md).
