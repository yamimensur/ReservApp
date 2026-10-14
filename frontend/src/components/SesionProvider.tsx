import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { EVENTO_SESION_VENCIDA, SesionContext, type EstadoSesion } from "@/lib/sesion";
import { cerrarSesion, iniciarSesion, obtenerUsuarioActual } from "@/services/authService";
import { borrarToken, leerToken } from "@/services/tokenStorage";
import type { Credenciales } from "@/types/auth";

/** Guarda quién está logueado y lo comparte con toda la app. */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<EstadoSesion>(() =>
    leerToken() ? { estado: "cargando" } : { estado: "anonimo" },
  );

  // Al abrir o recargar la app: si quedó un token guardado, preguntamos al backend quién es.
  useEffect(() => {
    if (!leerToken()) return;
    const controller = new AbortController();
    obtenerUsuarioActual(controller.signal)
      .then((usuario) => setSesion({ estado: "autenticado", usuario }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        borrarToken();
        setSesion({ estado: "anonimo" });
      });
    return () => controller.abort();
  }, []);

  // Si en cualquier pedido el backend responde 401, la sesión se cierra en toda la app.
  useEffect(() => {
    const alVencer = () => setSesion({ estado: "anonimo" });
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
  }, []);

  const ingresar = useCallback(async (credenciales: Credenciales) => {
    const usuario = await iniciarSesion(credenciales);
    setSesion({ estado: "autenticado", usuario });
    return usuario;
  }, []);

  const salir = useCallback(() => {
    cerrarSesion();
    setSesion({ estado: "anonimo" });
  }, []);

  const valor = useMemo(() => ({ sesion, ingresar, salir }), [sesion, ingresar, salir]);

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}