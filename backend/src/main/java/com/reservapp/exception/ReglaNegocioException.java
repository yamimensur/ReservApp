package com.reservapp.exception;
import org.springframework.http.HttpStatus;
public class ReglaNegocioException extends RuntimeException {
    private final HttpStatus status;
    public ReglaNegocioException(HttpStatus status, String mensaje) { super(mensaje); this.status = status; }
    public HttpStatus getStatus() { return status; }
}
