package com.reservapp.notificacion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Component
public class NotificadorResend implements NotificadorCorreo {
    private static final Logger log = LoggerFactory.getLogger(NotificadorResend.class);

    private final String apiKey;
    private final String remitente;
    private final RestClient cliente;

    @Autowired
    public NotificadorResend(
            @Value("${app.notificacion.api-key:}") String apiKey,
            @Value("${app.notificacion.remitente:ReservApp <onboarding@resend.dev>}") String remitente,
            @Value("${app.notificacion.timeout:5s}") Duration timeout) {
        this(apiKey, remitente, cliente(timeout));
    }

    NotificadorResend(String apiKey, String remitente, RestClient cliente) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.remitente = remitente;
        this.cliente = cliente;
    }

    @Override
    public EstadoNotificacion enviar(ComprobanteReserva comprobante) {
        if (apiKey.isBlank()) {
            log.warn("Comprobante no enviado para la reserva {}: falta RESEND_API_KEY", comprobante.codigo());
            return EstadoNotificacion.NO_ENVIADA;
        }
        try {
            cliente.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new Correo(remitente, new String[] {comprobante.destinatario()},
                            "Comprobante de reserva " + comprobante.codigo(), comprobante.texto()))
                    .retrieve()
                    .toBodilessEntity();
            return EstadoNotificacion.ENVIADA;
        } catch (Exception error) {
            log.warn("Comprobante no enviado para la reserva {}: {}", comprobante.codigo(), error.toString());
            return EstadoNotificacion.NO_ENVIADA;
        }
    }

    private static RestClient cliente(Duration timeout) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(timeout);
        fabrica.setReadTimeout(timeout);
        return RestClient.builder().baseUrl("https://api.resend.com").requestFactory(fabrica).build();
    }

    private record Correo(String from, String[] to, String subject, String text) {}
}
