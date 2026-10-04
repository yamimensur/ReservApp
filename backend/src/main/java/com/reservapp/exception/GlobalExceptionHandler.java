package com.reservapp.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNoEncontradoException.class)
    ResponseEntity<ApiError> notFound(RecursoNoEncontradoException ex) {
        return response(HttpStatus.NOT_FOUND, ex.getMessage(), Map.of());
    }
    @ExceptionHandler(CredencialesInvalidasException.class)
    ResponseEntity<ApiError> credenciales(CredencialesInvalidasException ex) {
        return response(HttpStatus.UNAUTHORIZED, ex.getMessage(), Map.of());
    }
    @ExceptionHandler(ReglaNegocioException.class)
    ResponseEntity<ApiError> negocio(ReglaNegocioException ex) {
        return response(ex.getStatus(), ex.getMessage(), Map.of());
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e -> fields.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return response(HttpStatus.BAD_REQUEST, "La solicitud contiene datos inválidos", fields);
    }
    // Acá solo llega lo que NO se previó: un bug, no un resultado posible del
    // negocio. Se loguea el detalle completo (para el equipo) y se responde
    // un mensaje genérico sin internals (para quien hizo el request).
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> inesperado(Exception ex) {
        log.error("Error interno no controlado", ex);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno", Map.of());
    }
    private ResponseEntity<ApiError> response(HttpStatus status, String message, Map<String, String> fields) {
        return ResponseEntity.status(status).body(new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, fields));
    }
}