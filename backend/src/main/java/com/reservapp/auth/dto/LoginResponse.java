package com.reservapp.auth.dto;

import java.time.Instant;

public record LoginResponse(String token, String tipo, Instant expiraEn) {}