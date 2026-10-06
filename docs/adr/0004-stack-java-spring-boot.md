# ADR 0004 — Stack: Java + Spring Boot en el backend en lugar de Next.js

**Estado:** aceptada · **Fecha:** 2026-10-05

## Contexto

ReservApp reutiliza el dominio de "ReservApp", del Trabajo de Diploma: reservas del comedor corporativo, menús por temporada, control de asistencia y liquidación mensual, adaptándolo a lo que exige Metodologías de Desarrollo Web. El equipo eligió hacerlo para concentrar el esfuerzo en lo que esta materia evalúa: arquitectura, decisiones técnicas, seguridad, calidad y producción.

El Trabajo de Diploma usaba React, Node.js, MySQL, Firebase Authentication, Swagger y Jest, con un alcance mucho mayor (cuatro iteraciones, auditoría, liquidaciones y reportes). La cátedra sugiere Next.js + TypeScript + Prisma + Zod + Auth.js, y admite otro stack si cumple el núcleo obligatorio y la decisión queda en un ADR.

Antes de implementar, el equipo revisó la elección: es un proyecto de dieciséis clases, en producción desde la primera, y el dominio se recortó a un MVP centrado en el flujo de reserva.

## Decisión

- **Backend:** Java 21 + Spring Boot 3 (Spring Web, Spring Security, Spring Data JPA, Jakarta Validation y Flyway).
- **Frontend:** React + TypeScript + Vite, que se conserva del plan original.
- **Base de datos:** PostgreSQL (ver ADR 0005).

Motivos:

- **Experiencia previa** del equipo con Java y Spring Boot.
- **Sin servidor que configurar:** Spring Boot trae el servidor web embebido, y la aplicación se ejecuta como un único proceso.
- **Inversión de control:** Spring crea y conecta los componentes (controladores, servicios, repositorios, el reloj). Eso simplifica la administración del sistema y permite reemplazar dependencias en los tests.
- **Un ecosistema integrado:** autenticación y autorización (Spring Security), acceso a datos (Spring Data JPA), validación y migraciones forman parte de la misma plataforma, con configuración por convención.

El equipo comparó brevemente las opciones y eligió la que le permitía escribir la lógica de negocio desde el primer día.

## Alternativas descartadas

- **El stack del Trabajo de Diploma (React + Node.js + MySQL + Firebase Authentication):** para un proyecto corto implicaba conectar cuatro tecnologías distintas antes de escribir lógica. Firebase Authentication guarda los usuarios fuera de la base de datos, lo que duplica la información de usuario y obliga a mantenerla sincronizada. Para el alcance del MVP era sobreingeniería. Se conservó React en el frontend.
- **Next.js (stack de la cátedra):** el acceso a datos requiere un ORM aparte (Prisma o Drizzle) y la autenticación, una librería externa (Auth.js) o un servicio de terceros. Aunque el template de la cátedra los trae configurados, el equipo prefirió un ecosistema que ya conocía y donde esas piezas vienen integradas, en lugar de aprender varias librerías nuevas en paralelo con el proyecto.

## Consecuencias

- Las demos, el template y las consignas de la materia están en Next.js: el equipo las traduce a su stack.
- La validación no se comparte entre cliente y servidor (frontend en TypeScript, backend en Java): el servidor valida con Jakarta Validation, y el cliente valida por su cuenta.
- Hay dos despliegues (Vercel y Render) y CORS configurado entre dominios.
- Spring tarda en arrancar: en el plan gratuito de Render, alrededor de dos minutos (ver ADR 0002).
