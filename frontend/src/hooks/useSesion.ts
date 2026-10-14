import { useContext } from "react";
import { SesionContext, type ValorSesion } from "@/lib/sesion";

/** Da acceso a la sesión desde cualquier componente que esté dentro de <SesionProvider>. */
export function useSesion(): ValorSesion {
  const valor = useContext(SesionContext);
  if (!valor) throw new Error("useSesion se tiene que usar dentro de <SesionProvider>");
  return valor;
}