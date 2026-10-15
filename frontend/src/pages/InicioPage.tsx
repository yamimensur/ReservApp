import { Navigate } from "react-router";
import { useSesion } from "@/hooks/useSesion";
import { paginaDeInicio } from "@/lib/roles";

/** "/" no tiene contenido propio: lleva a la pantalla principal de cada rol. */
export function InicioPage() {
  const { sesion } = useSesion();
  if (sesion.estado !== "autenticado") return null;
  return <Navigate to={paginaDeInicio(sesion.usuario.rol)} replace />;
}
