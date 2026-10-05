package com.reservapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class TimeConfig {
    // Las reglas de horario (por ejemplo, el límite de las 09:00) son de Argentina.
    // No se usa la zona de la máquina porque el servidor de Render corre en UTC.
    public static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    @Bean
    Clock clock() {
        return Clock.system(ZONA);
    }
}