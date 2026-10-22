import { LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSesion } from "@/hooks/useSesion";
import { NOMBRE_ROL } from "@/lib/roles";
import { cn } from "@/lib/utils";

const enlace = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-2 py-1 text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring",
    isActive ? "bg-accent text-accent-foreground" : "text-foreground",
  );

/** Estructura de las pantallas con sesión: barra arriba (dónde estoy, quién soy, cómo salgo). */
export function AppLayout() {
  const { sesion, salir } = useSesion();
  const navigate = useNavigate();
  if (sesion.estado !== "autenticado") return null;
  const { usuario } = sesion;
  const reserva = usuario.rol === "EMPLEADO" || usuario.rol === "TERCERIZADO";

  const alSalir = () => {
    salir();
    navigate("/ingresar", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <NavLink to="/" className="font-heading text-lg font-bold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring">
            ReservApp
          </NavLink>
          <nav aria-label="Principal" className="flex flex-wrap gap-2">
            {reserva && (
              <>
                <NavLink to="/menu" className={enlace}>Menú del día</NavLink>
                <NavLink to="/mis-reservas" className={enlace}>Mis reservas</NavLink>
              </>
            )}
            {usuario.rol === "ADMINISTRADOR" && (
              <NavLink to="/reservas-del-dia" className={enlace}>Reservas del día</NavLink>
            )}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-sm">{usuario.correo}</span>
              <Badge variant="secondary">{NOMBRE_ROL[usuario.rol]}</Badge>
            </div>
            <Button variant="outline" onClick={alSalir}>
              <LogOut aria-hidden="true" />
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main id="contenido" className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
