import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { diasDisponibles, diaSemanaCorto, fechaLegible, numeroDia, proximoLaborable } from "@/lib/fecha";
import { obtenerMenu } from "@/services/menuService";
import { crearReserva } from "@/services/reservaService";
import { ErrorApi } from "@/services/apiClient";
import type { ComidaMenu, MenuResponse } from "@/types/menu";
import type { ReservaResponse } from "@/types/reserva";
import { cn } from "@/lib/utils";

const NOMBRE_TIPO: Record<ComidaMenu["tipo"], string> = {
  ENTRADA: "Entrada",
  PLATO_PRINCIPAL: "Plato principal",
  POSTRE: "Postre",
  BEBIDA: "Bebida",
};

const ORDEN_TIPO: ComidaMenu["tipo"][] = ["ENTRADA", "PLATO_PRINCIPAL", "POSTRE", "BEBIDA"];

function agruparPorTipo(comidas: ComidaMenu[]): Map<ComidaMenu["tipo"], ComidaMenu[]> {
  const grupos = new Map<ComidaMenu["tipo"], ComidaMenu[]>();
  for (const tipo of ORDEN_TIPO) grupos.set(tipo, []);
  for (const c of comidas) grupos.get(c.tipo)?.push(c);
  return grupos;
}

/** Selección inicial: el primer plato principal compatible. */
function seleccionInicial(comidas: ComidaMenu[]): Set<number> {
  const principal = comidas.find((c) => c.tipo === "PLATO_PRINCIPAL" && c.compatible);
  return principal ? new Set([principal.id]) : new Set();
}

// --- Componentes internos ---

function SelectorFecha({ fechas, seleccionada, onChange }: {
  fechas: string[];
  seleccionada: string;
  onChange: (f: string) => void;
}) {
  return (
    <nav aria-label="Seleccionar fecha" className="flex flex-wrap gap-1.5">
      {fechas.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          aria-pressed={f === seleccionada}
          className={cn(
            "flex flex-col items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring",
            f === seleccionada
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          <span className="text-[0.65rem] uppercase">{diaSemanaCorto(f)}</span>
          <span className="text-base font-bold leading-tight">{numeroDia(f)}</span>
        </button>
      ))}
    </nav>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Cargando menú…</span>
      <Skeleton className="h-6 w-40" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

function GrupoComidas({ tipo, comidas, seleccionadas, onToggle, deshabilitado }: {
  tipo: ComidaMenu["tipo"];
  comidas: ComidaMenu[];
  seleccionadas: Set<number>;
  onToggle: (comida: ComidaMenu) => void;
  deshabilitado: boolean;
}) {
  if (comidas.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{NOMBRE_TIPO[tipo]}</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {comidas.map((c) => {
          const activa = seleccionadas.has(c.id);
          const bloqueada = !c.compatible;
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={bloqueada || deshabilitado}
                onClick={() => onToggle(c)}
                aria-pressed={activa}
                className="w-full text-left"
              >
                <Card size="sm" className={cn(
                  "transition-colors",
                  bloqueada && "opacity-60",
                  activa && "ring-2 ring-primary",
                )}>
                  <CardContent className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        activa ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                      )}>
                        {activa && <CheckIcon />}
                      </span>
                      <span className={cn("text-sm", bloqueada && "line-through")}>{c.nombre}</span>
                    </span>
                    {bloqueada && <Badge variant="destructive">Incompatible</Badge>}
                  </CardContent>
                </Card>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
    </svg>
  );
}

function ReservaExitosa({ reserva }: { reserva: ReservaResponse }) {
  const variante = reserva.notificacion === "ENVIADA" ? "exito" : "aviso";
  return (
    <Alert variant={variante}>
      <AlertTitle>
        {reserva.notificacion === "ENVIADA"
          ? "¡Reserva confirmada!"
          : "Reserva registrada"}
      </AlertTitle>
      <AlertDescription className="space-y-1">
        <p>
          Tu código de reserva es <strong>{reserva.codigo}</strong>.
        </p>
        {reserva.notificacion === "ENVIADA" ? (
          <p>Te enviamos un comprobante por correo.</p>
        ) : (
          <p>No pudimos enviar el comprobante por correo, pero tu reserva quedó registrada.</p>
        )}
      </AlertDescription>
    </Alert>
  );
}

// --- Página principal ---

export function MenuPage() {
  const [fecha, setFecha] = useState(proximoLaborable);
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);
  const [reserva, setReserva] = useState<ReservaResponse | null>(null);

  const cargar = useCallback((fechaSeleccionada: string) => {
    setCargando(true);
    setError(null);
    setMenu(null);
    setSeleccionadas(new Set());
    setErrorReserva(null);
    setReserva(null);
    const controller = new AbortController();
    obtenerMenu(fechaSeleccionada, controller.signal)
      .then((data) => {
        setMenu(data);
        setSeleccionadas(seleccionInicial(data.comidas));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof ErrorApi && err.status === 404) {
          setError("No hay un menú publicado para esta fecha.");
        } else if (err instanceof ErrorApi) {
          setError(err.message);
        } else {
          setError("Ocurrió un error inesperado. Probá de nuevo.");
        }
      })
      .finally(() => setCargando(false));
    return () => controller.abort();
  }, []);

  useEffect(() => cargar(fecha), [fecha, cargar]);

  const cambiarFecha = (f: string) => {
    setFecha(f);
  };

  const toggleComida = (comida: ComidaMenu) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(comida.id)) {
        next.delete(comida.id);
      } else {
        // Para platos principales: reemplazar en vez de agregar (solo 1 permitido)
        if (comida.tipo === "PLATO_PRINCIPAL") {
          const principales = menu?.comidas.filter((c) => c.tipo === "PLATO_PRINCIPAL") ?? [];
          for (const p of principales) next.delete(p.id);
        }
        next.add(comida.id);
      }
      return next;
    });
  };

  const grupos = menu ? agruparPorTipo(menu.comidas) : null;

  const principalSeleccionado = useMemo(() => {
    if (!menu) return false;
    return menu.comidas.some((c) => c.tipo === "PLATO_PRINCIPAL" && seleccionadas.has(c.id));
  }, [menu, seleccionadas]);

  const puedeReservar = principalSeleccionado && seleccionadas.size > 0 && !enviando;

  const enviarReserva = async () => {
    if (!menu || !puedeReservar) return;
    setEnviando(true);
    setErrorReserva(null);
    try {
      const res = await crearReserva({
        menuId: menu.id,
        fecha,
        comidaIds: [...seleccionadas],
      });
      setReserva(res);
    } catch (err: unknown) {
      if (err instanceof ErrorApi) {
        setErrorReserva(err.message);
      } else {
        setErrorReserva("Ocurrió un error inesperado. Probá de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Menú del día</h1>
        <p className="text-muted-foreground">Consultá el menú y reservá tu almuerzo.</p>
      </header>

      <SelectorFecha fechas={diasDisponibles()} seleccionada={fecha} onChange={cambiarFecha} />

      <h2 className="text-lg font-semibold">{fechaLegible(fecha)}</h2>

      {cargando && <MenuSkeleton />}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar el menú</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {reserva && <ReservaExitosa reserva={reserva} />}

      {grupos && !reserva && (
        <>
          <p className="text-sm text-muted-foreground">
            Seleccioná las comidas que querés reservar. Es obligatorio elegir un plato principal.
          </p>
          <div className="space-y-5">
            {ORDEN_TIPO.map((tipo) => (
              <GrupoComidas
                key={tipo}
                tipo={tipo}
                comidas={grupos.get(tipo) ?? []}
                seleccionadas={seleccionadas}
                onToggle={toggleComida}
                deshabilitado={enviando}
              />
            ))}
          </div>

          {errorReserva && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos crear la reserva</AlertTitle>
              <AlertDescription>{errorReserva}</AlertDescription>
            </Alert>
          )}

          <Button onClick={enviarReserva} disabled={!puedeReservar}>
            {enviando ? "Reservando…" : "Reservar almuerzo"}
          </Button>
        </>
      )}
    </section>
  );
}
