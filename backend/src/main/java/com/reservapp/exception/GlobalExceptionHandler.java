package com.reservapp.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

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
        // El cuerpo no es un JSON válido (mal escrito o con un tipo que no corresponde).
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> cuerpoIlegible(HttpMessageNotReadableException ex) {
        return response(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud no es un JSON válido", Map.of());
    }
    // Un parámetro de la URL no tiene el formato esperado (por ejemplo, /reservas/abc).
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiError> tipoInvalido(MethodArgumentTypeMismatchException ex) {
        return response(HttpStatus.BAD_REQUEST, "El parámetro '" + ex.getName() + "' tiene un formato inválido", Map.of());
    }
    // La ruta pedida no existe en la API.
    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiError> rutaInexistente(NoResourceFoundException ex) {
        return response(HttpStatus.NOT_FOUND, "La ruta no existe", Map.of());
    }
    // @PreAuthorize lanza AccessDeniedException dentro del controller. Sin este
    // manejador la atraparía el genérico de Exception y respondería 500 en lugar de 403.
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiError> sinPermiso(AccessDeniedException ex) {
        return response(HttpStatus.FORBIDDEN, "No tenés permiso para esta acción", Map.of());
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