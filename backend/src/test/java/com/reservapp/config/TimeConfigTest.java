package com.reservapp.config;

import com.reservapp.reserva.service.ReservaReglas;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class TimeConfigTest {

    @Test
    void elRelojUsaLaHoraDeArgentinaYNoLaDelServidor() {
        assertThat(new TimeConfig().clock().getZone())
                .isEqualTo(ZoneId.of("America/Argentina/Buenos_Aires"));
    }

    @Test
    void aLas0830DeArgentinaTodaviaSePuedeModificar() {
        // 11:30 UTC son las 08:30 en Argentina. Con el reloj en UTC, esto se rechazaba.
        ZonedDateTime ahora = Instant.parse("2026-10-06T11:30:00Z").atZone(TimeConfig.ZONA);

        assertThatCode(() -> ReservaReglas.validarHorarioLimite(LocalDate.of(2026, 10, 6), ahora))
                .doesNotThrowAnyException();
    }
}