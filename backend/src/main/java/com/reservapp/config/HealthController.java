package com.reservapp.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {
    @GetMapping
    ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(new HealthResponse("UP", "ReservApp API"));
    }

    public record HealthResponse(String status, String application) {}
}
