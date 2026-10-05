package com.reservapp.notificacion;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class NotificadorResendTest {

    @Test
    void sinClaveNoLlamaAlProveedor() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.resend.com");
        MockRestServiceServer servidor = MockRestServiceServer.bindTo(builder).build();
        NotificadorCorreo notificador = new NotificadorResend("", "ReservApp <onboarding@resend.dev>", builder.build());

        EstadoNotificacion estado = notificador.enviar(new ComprobanteReserva("empleado@reservapp.demo", "RES-1", "texto"));

        assertThat(estado).isEqualTo(EstadoNotificacion.NO_ENVIADA);
        servidor.verify();
    }

    @Test
    void proveedorConErrorDevuelveNoEnviada() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.resend.com");
        MockRestServiceServer servidor = MockRestServiceServer.bindTo(builder).build();
        servidor.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer clave-rota"))
                .andRespond(withServerError());
        NotificadorCorreo notificador = new NotificadorResend("clave-rota", "ReservApp <onboarding@resend.dev>", builder.build());

        EstadoNotificacion estado = notificador.enviar(new ComprobanteReserva("empleado@reservapp.demo", "RES-9", "texto"));

        assertThat(estado).isEqualTo(EstadoNotificacion.NO_ENVIADA);
        servidor.verify();
    }

    @Test
    void proveedorOkDevuelveEnviada() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.resend.com");
        MockRestServiceServer servidor = MockRestServiceServer.bindTo(builder).build();
        servidor.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer clave-ok"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        NotificadorCorreo notificador = new NotificadorResend("clave-ok", "ReservApp <onboarding@resend.dev>", builder.build());

        EstadoNotificacion estado = notificador.enviar(new ComprobanteReserva("empleado@reservapp.demo", "RES-2", "texto"));

        assertThat(estado).isEqualTo(EstadoNotificacion.ENVIADA);
        servidor.verify();
    }
}
