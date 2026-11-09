import { useEffect, useRef, useState } from "react";
import { EditarReservaForm } from "@/components/EditarReservaForm";
import { EstadoReserva } from "@/components/EstadoReserva";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fechaLegible } from "@/lib/fecha";
import { NOMBRE_TIPO, ORDEN_TIPO } from "@/lib/comidas";
import { puedeGestionarReserva } from "@/lib/reservas";
import { ErrorApi } from "@/services/apiClient";
import { cancelarReserva } from "@/services/reservaService";
import type { ReservaResponse } from "@/types/reserva";

interface Props {
  reserva: ReservaResponse;
  ahora: number;
  onActualizada: (reserva: ReservaResponse, mensaje: string) => void;
}

export function TarjetaReserva({ reserva, ahora, onActualizada }: Props) {
  const [accion, setAccion] = useState<"editar" | "cancelar" | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editar = useRef<HTMLButtonElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const conservar = useRef<HTMLButtonElement>(null);
  const volverA = useRef<"editar" | "cancelar" | null>(null);
  const habilitada = puedeGestionarReserva(reserva, ahora);
  const tituloId = `reserva-${reserva.id}`;

  useEffect(() => {
    if (accion === "cancelar") conservar.current?.focus();
    if (!accion && volverA.current) {
      (volverA.current === "editar" ? editar : cancelar).current?.focus();
      volverA.current = null;
    }
  }, [accion]);

  function cerrar() {
    volverA.current = accion;
    setAccion(null);
    setError(null);
  }

  async function confirmarCancelacion() {
    if (enviando) return;
    if (!puedeGestionarReserva(reserva)) {
      setError("Venció el horario de modificación o cancelación.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await cancelarReserva(reserva.id);
      setAccion(null);
      onActualizada({ ...reserva, estado: "CANCELADA" }, "Reserva cancelada. Se conserva en tu historial.");
    } catch (err: unknown) {
      setError(err instanceof ErrorApi ? err.message : "No pudimos cancelar la reserva. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <article aria-labelledby={tituloId}>
      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 sm:flex-row">
          <div className="min-w-0 space-y-1">
            <h2 id={tituloId} className="font-semibold">{fechaLegible(reserva.fecha)} de {reserva.fecha.slice(0, 4)}</h2>
            <p className="break-all text-sm text-muted-foreground">Código: <span className="font-mono text-foreground">{reserva.codigo}</span></p>
          </div>
          <EstadoReserva estado={reserva.estado} />
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            {ORDEN_TIPO.map((tipo) => {
              const comidas = reserva.comidas.filter((c) => c.tipo === tipo);
              return (
                <div key={tipo}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{NOMBRE_TIPO[tipo]}</dt>
                  <dd>{comidas.length ? comidas.map((c) => c.nombre).join(", ") : "Sin selección"}</dd>
                </div>
              );
            })}
          </dl>
          {reserva.estado === "ACTIVA" && (
            <p className="text-sm text-muted-foreground">
              {habilitada ? "Podés modificar o cancelar antes de las 09:00 del día de la reserva (hora de Argentina)."
                : "Venció el horario para modificar o cancelar esta reserva (09:00, hora de Argentina)."}
            </p>
          )}
          {!accion && habilitada && (
            <div className="flex flex-wrap gap-2">
              <Button ref={editar} variant="outline" onClick={() => setAccion("editar")}>Modificar</Button>
              <Button ref={cancelar} variant="destructive" onClick={() => setAccion("cancelar")}>Cancelar reserva</Button>
            </div>
          )}
          {accion === "editar" && (
            <EditarReservaForm reserva={reserva} habilitada={habilitada} onCerrar={cerrar}
              onActualizada={(actualizada) => { setAccion(null); onActualizada(actualizada, "Cambios guardados en tu reserva."); }} />
          )}
          {accion === "cancelar" && (
            <section aria-label="Confirmar cancelación" className="space-y-3 rounded-lg border border-destructive/30 bg-error-fondo p-4" aria-busy={enviando}>
              <h3 className="font-semibold">¿Querés cancelar esta reserva?</h3>
              <p className="text-sm">Tu almuerzo dejará de estar reservado. Podés volver a reservar antes de las 09:00 del día correspondiente.</p>
              {error && <Alert variant="destructive"><AlertTitle>No pudimos cancelar la reserva</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="flex flex-wrap gap-2">
                <Button ref={conservar} variant="outline" onClick={cerrar} disabled={enviando}>Conservar reserva</Button>
                <Button variant="destructive" onClick={confirmarCancelacion} disabled={enviando || !habilitada}>
                  {enviando ? "Cancelando…" : "Sí, cancelar reserva"}
                </Button>
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </article>
  );
}
