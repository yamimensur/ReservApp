import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SinDatos } from "@/components/SinDatos";
import { EstadoReserva } from "@/components/EstadoReserva";
import { fechaLegible, horaArgentina, hoyISO } from "@/lib/fecha";
import { ErrorApi } from "@/services/apiClient";
import { confirmarAsistencia, listarAsistencias } from "@/services/asistenciaService";
import type { Pagina } from "@/types/api";
import type { ReservaDelDia } from "@/types/reserva";

function TarjetaDelDia({ reserva, onConfirmada }: {
  reserva: ReservaDelDia;
  onConfirmada: (id: number, confirmadaEn: string) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tituloId = `reserva-dia-${reserva.id}`;
  const confirmada = reserva.asistenciaConfirmadaEn;

  async function confirmar() {
    if (enviando || confirmada) return;
    setEnviando(true);
    setError(null);
    try {
      const asistencia = await confirmarAsistencia(reserva.id);
      onConfirmada(reserva.id, asistencia.confirmadaEn);
    } catch (err: unknown) {
      setError(err instanceof ErrorApi ? err.message : "No pudimos confirmar la asistencia. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <article aria-labelledby={tituloId}>
      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 sm:flex-row">
          <div className="min-w-0 space-y-1">
            <h3 id={tituloId} className="font-semibold">{reserva.correo}</h3>
            <p className="break-all text-sm text-muted-foreground">
              Código: <span className="font-mono text-foreground">{reserva.codigo}</span>
            </p>
          </div>
          <EstadoReserva estado={reserva.estado} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{reserva.comidas.map((comida) => comida.nombre).join(", ") || "Sin comidas"}</p>
          {confirmada ? (
            <p role="status">Asistencia confirmada a las {horaArgentina(confirmada)}.</p>
          ) : (
            <Button
              onClick={confirmar}
              disabled={enviando}
              aria-label={`Confirmar asistencia de ${reserva.codigo}`}
            >
              {enviando ? "Confirmando…" : "Confirmar asistencia"}
            </Button>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos confirmar la asistencia</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </article>
  );
}

export function ReservasDelDiaPage() {
  const [fecha, setFecha] = useState(hoyISO);
  const [pagina, setPagina] = useState(0);
  const [datos, setDatos] = useState<Pagina<ReservaDelDia> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setDatos(null);
    setError(null);
    listarAsistencias(fecha, pagina, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setDatos(data); })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ErrorApi ? err.message : "No pudimos cargar las reservas del día. Probá de nuevo.");
      })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [fecha, pagina, intento]);

  function marcarConfirmada(id: number, confirmadaEn: string) {
    setDatos((anterior) => anterior && ({
      ...anterior,
      content: anterior.content.map((reserva) =>
        reserva.id === id ? { ...reserva, asistenciaConfirmadaEn: confirmadaEn } : reserva),
    }));
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Reservas del día</h1>
        <p className="text-muted-foreground">
          Reservas activas para confirmar la asistencia al retirar el pedido.
        </p>
      </header>

      <div className="max-w-xs space-y-2">
        <Label htmlFor="fecha-del-dia">Fecha</Label>
        <Input
          id="fecha-del-dia"
          type="date"
          value={fecha}
          onChange={(event) => {
            if (!event.target.value) return;
            setFecha(event.target.value);
            setPagina(0);
          }}
        />
      </div>

      <h2 className="text-lg font-semibold">{fechaLegible(fecha)}</h2>

      {cargando && (
        <div aria-busy="true" className="space-y-4">
          <p role="status" className="text-muted-foreground">Cargando las reservas del día…</p>
          {[1, 2, 3].map((n) => <Skeleton key={n} className="h-32 w-full rounded-xl" />)}
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar las reservas</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" className="mt-2" onClick={() => setIntento((n) => n + 1)}>Reintentar</Button>
        </Alert>
      )}
      {datos && datos.content.length === 0 && (
        <SinDatos
          titulo="No hay reservas activas para esta fecha."
          detalle="Cuando alguien reserve un almuerzo, va a aparecer en este listado."
        />
      )}
      {datos && datos.content.length > 0 && (
        <>
          <ul className="space-y-4" aria-label="Reservas del día">
            {datos.content.map((reserva) => (
              <li key={reserva.id}>
                <TarjetaDelDia reserva={reserva} onConfirmada={marcarConfirmada} />
              </li>
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
