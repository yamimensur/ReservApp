# ADR 0007 — El frontend guarda el token en sessionStorage

**Estado:** aceptada · **Fecha:** 2026-10-14

## Contexto

El backend devuelve el JWT en el cuerpo de `POST /api/v1/auth/login` (ADR 0001) y espera recibirlo en el header `Authorization: Bearer` de cada pedido. El frontend (Vercel) y la API (Render) están en dominios distintos. El frontend tiene que guardar el token en algún lugar para usarlo en los pedidos siguientes y para no perder la sesión al recargar la página. Las computadoras del comedor pueden ser compartidas.

## Decisión

- El token se guarda en `sessionStorage`, bajo la clave `reservapp.token` (`frontend/src/services/tokenStorage.ts`).
- Un único cliente HTTP (`frontend/src/services/apiClient.ts`) lo agrega a cada pedido. Si la API responde `401`, borra el token y avisa a la app con un evento, y `SesionProvider` cierra la sesión en todas las pantallas.
- Al iniciar sesión se borra cualquier token anterior antes de pedir uno nuevo: Spring Security rechaza con `401` un token inválido aunque la ruta sea pública.
- Al recargar, la app vuelve a pedir `GET /api/v1/usuarios/me` con el token guardado para saber quién es el usuario y cuál es su rol. Nunca se lee el rol desde el token en el navegador.
- Las rutas protegidas del frontend (`RutaProtegida`) son experiencia de usuario, no seguridad: el backend valida token y rol en cada operación.

## Alternativas descartadas

- **Variable en memoria:** se pierde con cada recarga y obliga a iniciar sesión otra vez.
- **localStorage:** sobrevive al cierre del navegador; en una computadora compartida, la próxima persona entraría con la sesión anterior.
- **Cookie `httpOnly`:** es la opción más resistente a XSS, pero exige cambiar el backend (emitir la cookie, CORS con credenciales entre Vercel y Render) y agregar protección CSRF. Para el alcance del MVP, el costo supera al beneficio.

## Consecuencias

- Un script malicioso que lograra ejecutarse en la página (XSS) podría leer el token, igual que con localStorage. Se mitiga porque React escapa el texto que muestra, no se usa `dangerouslySetInnerHTML` y el token vence a los 60 minutos.
- Cerrar la pestaña cierra la sesión.
- Si en el futuro se migra a cookie `httpOnly`, el cambio queda concentrado en `tokenStorage.ts` y `apiClient.ts`.
