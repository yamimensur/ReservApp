# ADR 0002 — Hosting: backend en Render y base de datos en Supabase

**Estado:** aceptada · **Fecha:** 2026-10-03

## Contexto

El backend y la base de datos estaban en Railway. El 03/10 terminó el período de prueba gratuito y ambos servicios se apagaron: la API respondía 404 y el frontend no podía conectarse. El Parcial I exige una URL pública funcionando. El plan gratuito de Railway (0,5 GB de RAM y USD 1 de crédito mensual) no alcanza para Spring Boot más PostgreSQL. Las opciones eran pagar el plan Hobby (USD 5 por mes, con tarjeta) o migrar a servicios gratuitos.

## Decisión

- **Backend en Render** (plan free, región Virginia), con una imagen Docker de dos etapas definida en `backend/Dockerfile`. Se despliega automáticamente desde `main`.
- **Base de datos en Supabase** (plan free, East US), en la misma región que el backend: cada pedido hace varias consultas a la base, y la distancia entre ambos impacta más que la distancia al usuario.
- **Conexión por Session pooler.** La conexión directa de Supabase usa IPv6, que Render no soporta. El Transaction pooler se descartó porque es incompatible con las *prepared statements* que usa Hibernate.
- **Data API de Supabase deshabilitada.** Supabase expone por defecto las tablas del esquema `public` a través de una API web, y las nuestras no tienen RLS. Como el acceso a datos pasa únicamente por el backend, se apagó esa API.
- **Perfil `demo` activo en producción**, para cargar el seed con usuarios y datos de demostración. No hay datos reales.
- Los secretos (`DB_PASSWORD`, `JWT_SECRET`) se configuran solo como variables de entorno en Render.

## Alternativas descartadas

- **Railway Hobby:** la más rápida, pero implicaba un costo mensual en dólares con tarjeta.
- **Neon** para la base: equivalente para este uso; cualquiera de las dos servía.

## Consecuencias

- Render free apaga el servicio tras unos 15 minutos sin tráfico, y con 0,1 de CPU el arranque de Spring tarda alrededor de dos minutos. Antes de cada demo hay que abrir `/api/v1/health` para "despertarlo".
- Supabase free puede pausar proyectos tras un período sin actividad.
- El panel de Render está en la cuenta de Cecilia y el de Vercel en la de Yamila: los cambios de variables de entorno pasan por ellas.
- Costo de infraestructura: cero.