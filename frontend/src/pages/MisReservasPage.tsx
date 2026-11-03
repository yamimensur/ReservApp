import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { TarjetaReserva } from "@/components/TarjetaReserva";
import { SinDatos } from "@/components/SinDatos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorApi } from "@/services/apiClient";
import { listarReservas } from "@/services/reservaService";
import type { Pagina } from "@/types/api";
import type { ReservaResponse } from "@/types/reserva";

export function MisReservasPage() {
  const [pagina, setPagina] = useState(0);
  const [datos, setDatos] = useState<Pagina<ReservaResponse> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [mensaje, setMensaje] = useState<{ texto: string } | null>(null);
  const [ahora, setAhora] = useState(Date.now);
  const aviso = useRef<HTMLDivElement>(null);

  // Actualiza las acciones si se alcanza el corte mientras la pantalla permanece abierta.
  useEffect(() => {
    const timer = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { if (mensaje) aviso.current?.focus(); }, [mensaje]);
  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setDatos(null);
    setError(null);
    setMensaje(null);
    listarReservas(pagina, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setDatos(data); })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof ErrorApi ? err.message : "No pudimos cargar tus reservas. Probá de nuevo.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [pagina, intento]);

  function actualizar(reserva: ReservaResponse, texto: string) {
    setDatos((anterior) => anterior && ({ ...anterior, content: anterior.content.map((r) => r.id === reserva.id ? reserva : r) }));
    setMensaje({ texto });
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Mis reservas</h1>
          <p className="text-muted-foreground">Consultá tus almuerzos reservados y tu historial, desde la fecha más reciente.</p>
        </div>
        <Link to="/menu" className={buttonVariants({ variant: "outline" })}>Ver menú y reservar</Link>
      </header>

      {cargando && (
        <div aria-busy="true" className="space-y-4">
          <p role="status" className="text-muted-foreground">Cargando tus reservas…</p>
          {[1, 2, 3].map((n) => <Skeleton key={n} className="h-48 w-full rounded-xl" />)}
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar tus reservas</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" className="mt-2" onClick={() => setIntento((n) => n + 1)}>Reintentar</Button>
        </Alert>
      )}
      {mensaje && <Alert ref={aviso} tabIndex={-1} variant="exito" role="status" className="outline-none focus-visible:ring-3 focus-visible:ring-ring"><AlertDescription>{mensaje.texto}</AlertDescription></Alert>}
      {datos && datos.content.length === 0 && (
        <SinDatos titulo="Todavía no tenés reservas." detalle="Elegí un almuerzo en el menú para comenzar." />
      )}
      {datos && datos.content.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">{datos.totalElements} {datos.totalElements === 1 ? "reserva" : "reservas"} en tu historial</p>
          <ul className="space-y-4" aria-label="Tus reservas">
            {datos.content.map((reserva) => (
              <li key={reserva.id}><TarjetaReserva reserva={reserva} ahora={ahora} onActualizada={actualizar} /></li>
            ))}
          </ul>
          {datos.totalPages > 1 && (
            <nav aria-label="Páginas de reservas" className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" disabled={datos.first} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
              <span role="status" className="text-sm">Página {datos.number + 1} de {datos.totalPages}</span>
              <Button variant="outline" disabled={datos.last} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
