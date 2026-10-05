package com.reservapp.exception;

public class CredencialesInvalidasException extends RuntimeException {
    public CredencialesInvalidasException() { super("Correo o contraseña incorrectos"); }
}