# ADR 0003 — Comprobante de reserva por correo con Resend

**Estado:** aceptada · **Fecha:** 2026-10-05

## Contexto

Al crear una reserva la persona necesita un comprobante: qué eligió, para qué día, hasta cuándo puede modificar o cancelar, y el código para retirar el pedido. El código solo, en la respuesta del `201`, no le queda a mano cuando cierra la pantalla. El Parcial I pide una integración externa en el núcleo de la API.

## Decisión

- Después de que `POST /api/v1/reservas` guarda la reserva y la transacción hace commit, el backend envía un comprobante por correo a la persona autenticada.
- El proveedor es Resend: `POST https://api.resend.com/emails` con `Authorization: Bearer` y la variable `RESEND_API_KEY`.
- El correo es complementario. Si falta la clave, hay timeout (5 segundos) o Resend responde 4xx o 5xx, la reserva queda guardada, el log registra el código y la respuesta trae `notificacion: NO_ENVIADA`. La aplicación arranca aunque la clave no esté.
- Sin un dominio verificado, Resend solo entrega a la casilla de la cuenta que generó la clave. Alcanza para la demo. El remitente por defecto es `ReservApp <onboarding@resend.dev>`.
- No se envía correo al modificar, al cancelar ni como recordatorio. El QR del código queda como mejora futura.

## Alternativas descartadas

- **Mostrar solo el código en la respuesta HTTP:** la persona no se lleva qué eligió ni el horario límite de las 09:00.
- **Enviar el correo dentro de la transacción:** si el guardado fallara después, llegaría un comprobante de una reserva que no existe.
- **RENAPER:** identifica personas ante el Estado. No envía correo ni tiene relación con el comprobante del comedor.
- **Reintentos automáticos:** quedan fuera de este alcance. Un fallo se informa en la misma respuesta y en el log.

## Consecuencias

- Cecilia tiene que cargar `RESEND_API_KEY` en Render antes de que el comprobante salga en producción. Sin esa variable la reserva sigue funcionando.
- Hasta verificar un dominio, la demo real del correo solo llega a la casilla dueña de la cuenta de Resend.
- Un fallo de Resend no deja la reserva a medias: o se guardó y el correo no salió, o la reserva se rechazó y no hubo correo.
