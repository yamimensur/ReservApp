import { Navigate, Outlet, useLocation } from "react-router";
import { PantallaCargando } from "@/components/PantallaCargando";
import { useSesion } from "@/hooks/useSesion";
import { NotFoundPage } from "@/pages/NotFoundPage";
import type { Rol } from "@/types/auth";

interface Props {
  /** Roles que pueden ver estas rutas. Sin roles: alcanza con estar logueado. */
  roles?: Rol[];
}

/**
 * Decide qué mostrar según la sesión. Es experiencia de usuario, no seguridad:
 * el backend vuelve a validar el token y el rol en cada pedido.
 */
export function RutaProtegida({ roles }: Props) {
  const { sesion } = useSesion();
  const location = useLocation();

  if (sesion.estado === "cargando") return <PantallaCargando />;
  if (sesion.estado === "anonimo") {
    return <Navigate to="/ingresar" replace state={{ desde: location.pathname }} />;
  }
  // Un rol sin acceso ve la misma página que una ruta inexistente: no revelamos qué existe.
  if (roles && !roles.includes(sesion.usuario.rol)) return <NotFoundPage />;
  return <Outlet />;
}
