import { createContext } from "react";
import type { Credenciales, Usuario } from "@/types/auth";

/** Evento que avisa que el backend rechazó el token (venció o es inválido). */
export const EVENTO_SESION_VENCIDA = "reservapp:sesion-vencida";

export type EstadoSesion =
  | { estado: "cargando" }
  | { estado: "anonimo" }
  | { estado: "autenticado"; usuario: Usuario };

export interface ValorSesion {
  sesion: EstadoSesion;
  ingresar: (credenciales: Credenciales) => Promise<Usuario>;
  salir: () => void;
}

export const SesionContext = createContext<ValorSesion | null>(null);