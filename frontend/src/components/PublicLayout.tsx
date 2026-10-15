import { Outlet } from "react-router";

/** Estructura de las pantallas sin sesión: encabezado simple y contenido centrado. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <span className="font-heading text-lg font-bold text-primary">ReservApp</span>
        </div>
      </header>
      <main id="contenido" className="flex flex-1 items-start justify-center px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
