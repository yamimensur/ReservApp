# Especificación del sistema — ReservApp

> Este documento es el relevamiento de requerimientos de ReservApp y debe mantenerse actualizado durante el proyecto. Una funcionalidad que no esté definida aquí no forma parte del alcance acordado.

## 1. El problema

**Para quién:** empleados directos, personal tercerizado, administración del comedor y las áreas de Recursos Humanos y Finanzas de la organización.

**Qué hace hoy sin el sistema:** la demanda diaria de almuerzos se estima manualmente, sin reservas anticipadas ni un registro confiable de asistencia. La planificación de menús y el seguimiento de restricciones alimenticias se gestionan de forma dispersa, lo que dificulta la operación y puede generar desperdicios.

**Qué mejora:** ReservApp centraliza la reserva de almuerzos, la planificación de menús y el control de asistencia para que el comedor prepare según demanda real y cada usuario encuentre opciones compatibles con sus restricciones.

## 2. Roles

| Rol | Quién es | Qué puede hacer que el otro no |
|---|---|---|
| Empleado | Persona contratada directamente por la organización. | Consultar el menú, gestionar sus reservas e indicar sus restricciones alimenticias. |
| Personal tercerizado | Persona externa habilitada para utilizar el comedor. | Realizar reservas bajo las condiciones e importes asociados a su tipo de usuario. |
| Administrador del comedor | Responsable de la operación diaria del comedor. | Gestionar comidas y temporadas, consultar reservas del día y registrar asistencias. |
| RR. HH. | Personal autorizado para consultar información de liquidación. | Consultar o generar liquidaciones mensuales cuando tenga el permiso correspondiente. |

## 3. Entidades

| Entidad | Qué representa | Se relaciona con |
|---|---|---|
| Usuario | Persona autenticada en el sistema, con tipo y restricciones alimenticias. | Rol, Restricción alimenticia, Reserva, Asistencia, Liquidación. |
| Rol | Conjunto de permisos asignado a una persona usuaria. | Usuario. |
| Restricción alimenticia | Condición alimentaria declarada por una persona y compatibilidades de las comidas. | Usuario, Comida. |
| Comida | Opción del menú: entrada, plato principal, postre o bebida. | Tipo de comida, Restricción alimenticia, Menú diario, Reserva. |
| Temporada | Planificación de menús para una estación y un intervalo de fechas. | Semana de temporada, Menú diario. |
| Semana de temporada | Una de las cuatro semanas que componen el ciclo circular de una temporada. | Temporada, Menú diario. |
| Menú diario | Plantilla de comidas correspondiente a un día de la semana dentro del ciclo de una temporada. | Semana de temporada, Comida, Reserva. |
| Reserva | Selección de comidas de una persona para una fecha. | Usuario, Menú diario, Comida, Asistencia. |
| Asistencia | Confirmación de que una persona con reserva retiró su almuerzo. | Reserva, Usuario administrador. |
| Liquidación mensual | Consolidado de asistencias confirmadas e importes por persona y período. | Usuario, Asistencia. |

### Decisiones de modelado

- Cada usuario tiene exactamente un rol y un rol puede estar asignado a cero o más usuarios. Un usuario no puede acumular varios roles simultáneamente.
- Un menú diario es una plantilla asociada a exactamente una semana de temporada y a un día de la semana. La fecha concreta para la que se ofrece se determina aplicando el ciclo circular de la temporada; no se persiste un menú nuevo por cada fecha del calendario.
- Una liquidación mensual corresponde a exactamente un usuario, un año y un mes. Un usuario puede tener cero o más liquidaciones, pero no más de una para el mismo año y mes.

### Cardinalidades y reglas de borrado

| Relación | Cardinalidad | Borrado del registro padre |
|---|---|---|
| Rol → Usuario | Un rol tiene 0..N usuarios; cada usuario tiene 1 rol. | `RESTRICT`: un rol asignado no se elimina. |
| Usuario ↔ Restricción alimenticia | N-N; ambos lados admiten 0..N. | Al borrar un usuario se eliminan sus asociaciones; una restricción usada no se elimina. |
| Comida ↔ Restricción alimenticia | N-N; una comida admite 0..N compatibilidades. | Al borrar una comida se eliminan sus asociaciones; una restricción usada no se elimina. |
| Temporada → Semana de temporada | Una temporada tiene exactamente 4 semanas; cada semana pertenece a 1 temporada. | `CASCADE`: las semanas son parte de la temporada. |
| Semana de temporada → Menú diario | Una semana tiene 1..N menús; cada menú pertenece a 1 semana. | `CASCADE`: los menús son parte de la semana. |
| Menú diario ↔ Comida | N-N; un menú ofrece 1..N comidas y una comida puede aparecer en 0..N menús. | Al borrar un menú se eliminan sus asociaciones; una comida ofrecida no se elimina. |
| Usuario → Reserva | Un usuario tiene 0..N reservas; cada reserva pertenece a 1 usuario. | `RESTRICT`: se conserva el historial de reservas. |
| Menú diario → Reserva | Un menú tiene 0..N reservas; cada reserva referencia 1 menú. | `RESTRICT`: un menú reservado no se elimina. |
| Reserva ↔ Comida | N-N; una reserva selecciona 1..N comidas. | Al borrar una reserva se eliminan sus asociaciones; una comida seleccionada no se elimina. |
| Reserva → Asistencia | Una reserva tiene 0..1 asistencia; cada asistencia corresponde a 1 reserva. | `RESTRICT`: una reserva con asistencia no se elimina. |
| Usuario administrador → Asistencia | Un administrador registra 0..N asistencias; cada asistencia identifica 1 administrador. | `RESTRICT`: se conserva quién confirmó la asistencia. |
| Usuario → Liquidación mensual | Un usuario tiene 0..N liquidaciones; cada liquidación corresponde a 1 usuario. | `RESTRICT`: las liquidaciones deben conservarse. |
| Liquidación mensual → Asistencia | Una liquidación incluye 0..N asistencias; una asistencia pertenece a 0..1 liquidación. | `RESTRICT`: una liquidación utilizada no se elimina. |

Usuarios, comidas, reservas, temporadas publicadas, asistencias y liquidaciones se desactivan o cambian de estado cuando corresponda; no se borran físicamente si poseen historial. Los borrados en cascada se limitan a componentes sin identidad independiente y tablas de asociación.

## 4. Historias de usuario

### H1 — Autenticación y perfil alimenticio

**Como** empleado o personal tercerizado, **quiero** iniciar sesión con mi correo corporativo y contraseña, y registrar mis restricciones alimenticias, **para** acceder a las funciones habilitadas y recibir opciones de menú compatibles.

Criterios de aceptación:

- [ ] Dado un correo corporativo registrado y una contraseña válida, cuando la persona inicia sesión, entonces accede a las funciones correspondientes a su rol.
- [ ] Dado un perfil autenticado, cuando registra o actualiza sus restricciones alimenticias, entonces quedan guardadas para las sugerencias y validaciones posteriores.
- [ ] Caso de error: cuando las credenciales son inválidas o el correo no está habilitado, el sistema informa el error sin revelar información sensible.

### H2 — Consultar y reservar almuerzo

**Como** empleado o personal tercerizado, **quiero** consultar el menú de una fecha y reservar mi almuerzo, **para** asegurar mi comida y permitir que el comedor estime la demanda.

Criterios de aceptación:

- [ ] Dado un menú publicado para una fecha válida, cuando la persona lo consulta, entonces ve las opciones de entrada, plato principal, postre y bebida, indicando cuáles son compatibles con sus restricciones.
- [ ] Dado un menú disponible, cuando selecciona un plato principal y confirma la reserva, entonces el sistema registra una única reserva para esa persona y fecha.
- [ ] Dado un perfil con restricciones, cuando el menú tiene alternativas compatibles, entonces el sistema sugiere al menos un plato principal compatible.
- [ ] Caso de error: cuando no se selecciona un plato principal, se intenta reservar fuera del plazo o se elige una comida incompatible, el sistema no crea la reserva y explica el motivo.

### H3 — Modificar o cancelar una reserva

**Como** persona con una reserva activa, **quiero** modificarla o cancelarla antes de la hora de corte, **para** corregir mi elección sin afectar la planificación del comedor.

Criterios de aceptación:

- [ ] Dada una reserva propia dentro del horario permitido, cuando la persona modifica sus elecciones, entonces la reserva queda actualizada y se vuelven a validar las restricciones.
- [ ] Dada una reserva propia dentro del horario permitido, cuando la persona la cancela, entonces deja de contabilizarse en la demanda del día.
- [ ] Caso de error: cuando la hora límite ya venció, el sistema no permite modificar ni cancelar la reserva.

### H4 — Gestionar comidas y temporadas

**Como** administrador del comedor, **quiero** administrar comidas y planificar temporadas circulares de cuatro semanas, **para** publicar menús válidos sin cargarlos nuevamente cada día.

Criterios de aceptación:

- [ ] Dado un administrador autenticado, cuando crea, modifica o elimina una comida, entonces puede indicar su tipo y las restricciones alimenticias con las que es compatible.
- [ ] Dado un administrador autenticado, cuando crea una temporada, entonces puede definir nombre, estación, fechas y el sistema genera cuatro semanas para planificar.
- [ ] Dada una temporada completa y sin conflictos de fechas, cuando se publica, entonces sus menús quedan disponibles para las reservas.
- [ ] Caso de error: cuando se intenta publicar una temporada incompleta o activar una segunda temporada simultánea, el sistema rechaza la operación e informa la inconsistencia.

### H5 — Controlar asistencia

**Como** administrador del comedor, **quiero** confirmar la asistencia de las personas que retiran su pedido, **para** contrastar reservas con consumo real y generar información confiable.

Criterios de aceptación:

- [ ] Dadas las reservas del día, cuando el administrador ingresa un código de reserva válido o busca a una persona manualmente, entonces puede confirmar su asistencia.
- [ ] Dada una asistencia confirmada, cuando se consulta el listado diario, entonces se muestra la hora y el estado de asistencia de la reserva.
- [ ] Caso de error: cuando no existe una reserva activa o la asistencia ya fue registrada, el sistema no duplica el registro y muestra una advertencia.

### H6 — Generar liquidación y reportes

**Como** administrador o usuario de RR. HH. autorizado, **quiero** obtener una liquidación mensual y reportes del comedor, **para** gestionar cargos y tomar decisiones operativas.

Criterios de aceptación:

- [ ] Dado un período mensual cerrado, cuando se genera una liquidación, entonces incluye únicamente las asistencias confirmadas y aplica el importe correspondiente al tipo de usuario.
- [ ] Dada una liquidación generada, cuando se exporta, entonces el sistema ofrece los formatos CSV y PDF.
- [ ] Dado un usuario autorizado, cuando consulta reportes, entonces puede ver información de asistencia, consumo y preferencias alimentarias, con al menos un gráfico de resumen.
- [ ] Caso de error: cuando un usuario sin rol Administrador o RR. HH. intenta consultar una liquidación, el sistema deniega el acceso.

## 5. Flujo principal

El flujo principal es la reserva de almuerzo.

1. La persona inicia sesión con su correo corporativo y contraseña.
2. El sistema identifica su rol y recupera sus restricciones alimenticias.
3. La persona consulta el menú del día o de una fecha habilitada.
4. El sistema muestra las comidas disponibles y sugiere platos principales compatibles con el perfil alimenticio.
5. La persona selecciona un plato principal y, opcionalmente, entrada, postre y bebida.
6. El sistema valida fecha, día laborable, horario, unicidad de la reserva y compatibilidad alimenticia.
7. El sistema registra la reserva y genera un código único para la posterior confirmación de asistencia.
8. Al retirar el pedido, el administrador valida el código o busca manualmente a la persona y registra la asistencia.

## 6. Reglas de negocio

- Una persona solo puede tener una reserva por día.
- Solo se puede reservar para días laborables y hasta siete días hacia adelante.
- Las reservas, modificaciones y cancelaciones se permiten únicamente antes de las 09:00 del día correspondiente.
- El plato principal es obligatorio; entrada, postre y bebida son opcionales.
- Las comidas seleccionadas deben ser compatibles con las restricciones alimenticias registradas por la persona.
- La aplicación debe sugerir automáticamente un plato principal compatible cuando exista una alternativa.
- Solo las temporadas publicadas pueden ofrecer menús para reserva.
- Solo puede haber una temporada activa a la vez; no se admiten períodos superpuestos.
- Cada temporada tiene cuatro semanas y la semana aplicable rota automáticamente en secuencia 1 → 2 → 3 → 4 → 1 según la fecha.
- Una asistencia solo puede registrarse para una reserva activa y no puede confirmarse dos veces.
- Las liquidaciones mensuales se calculan exclusivamente con asistencias confirmadas; el importe depende del tipo de usuario.
- Las funciones de liquidación requieren rol Administrador o RR. HH. con el permiso correspondiente.

## 7. Requisitos no funcionales

### Usabilidad

- **Eficiencia:** una persona autenticada puede completar una reserva en cinco interacciones o menos, sin contar la selección de comidas opcionales.
- **Errores:** si falta un campo obligatorio o una regla impide la reserva, el sistema identifica el problema en texto, conserva las selecciones válidas y no crea datos incompletos.
- **Aprendizaje:** una persona que no conoce la aplicación puede localizar el menú del día y registrar una reserva sin asistencia del equipo de desarrollo.
- **Recuerdo:** la opción de reservar se encuentra en la pantalla principal de los roles de reserva y permanece en la misma ubicación de navegación.
- **Satisfacción:** antes de la entrega se realiza una prueba de uso con al menos una persona ajena al equipo y se registran los hallazgos relevantes.

### Rendimiento y compatibilidad

- Las operaciones básicas de inicio de sesión, consulta de menú, reserva y registro de asistencia deben responder en menos de dos segundos bajo condiciones normales.
- El sistema debe soportar al menos 100 usuarios concurrentes entre las 08:00 y las 09:00.
- La aplicación web debe funcionar en las dos últimas versiones de Chrome, Firefox y Safari.
- La interfaz debe ser responsive para escritorio y dispositivos móviles.

### Seguridad y datos

- Las contraseñas se almacenan únicamente mediante hash seguro; nunca en texto plano.
- La autorización se aplica por rol y permiso en cada operación protegida.
- Los datos de liquidación deben conservarse por al menos cinco años.
- La base de datos debe contar con un respaldo automático diario y un procedimiento documentado de restauración.

### Accesibilidad

- [ ] Toda la interfaz se puede operar con teclado y el foco visible identifica el elemento activo.
- [ ] Cada campo de formulario tiene un `label` asociado; no se usa solo `placeholder` como etiqueta.
- [ ] Las imágenes informativas incluyen texto alternativo y las decorativas utilizan texto alternativo vacío.
- [ ] El contraste entre texto y fondo alcanza como mínimo 4,5:1, o 3:1 para texto grande.
- [ ] Los errores nunca se comunican solo con color: se acompañan de un mensaje textual.

## 8. Integración externa

**Cuál:** no se requiere una integración externa obligatoria para el alcance inicial.

**Para qué:** el sistema utilizará credenciales propias asociadas a correos corporativos; no se contempla, por ahora, integración con nómina, pagos, correo ni mensajería.

**Qué pasa si se cae:** no aplica en la primera versión. Si se agregan integraciones futuras, deberán documentar su objetivo, datos intercambiados, tratamiento de errores y procedimiento de contingencia antes de implementarse.

## 9. Fuera de alcance

- Gestión de inventario de ingredientes y materias primas.
- Compras y gestión de proveedores.
- Procesamiento de pagos, facturación o descuentos automáticos de nómina.
- Integración automática con sistemas externos de Recursos Humanos o contabilidad.
- Aplicación móvil nativa.
- Notificaciones automáticas por correo electrónico o mensajería.
- Gestión nutricional avanzada, cálculo de calorías o recomendaciones dietéticas personalizadas.
- Calificaciones de comidas o encuestas de satisfacción de empleados.
