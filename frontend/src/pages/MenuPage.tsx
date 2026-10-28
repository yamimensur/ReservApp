import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { diasDisponibles, diaSemanaCorto, fechaLegible, numeroDia, proximoLaborable } from "@/lib/fecha";
import { obtenerMenu } from "@/services/menuService";
import { ErrorApi } from "@/services/apiClient";
import type { ComidaMenu, MenuResponse } from "@/types/menu";
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

function GrupoComidas({ tipo, comidas }: { tipo: ComidaMenu["tipo"]; comidas: ComidaMenu[] }) {
  if (comidas.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{NOMBRE_TIPO[tipo]}</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {comidas.map((c) => (
          <li key={c.id}>
            <Card size="sm" className={cn(!c.compatible && "opacity-60")}>
              <CardContent className="flex items-center justify-between gap-2">
                <span className={cn("text-sm", !c.compatible && "line-through")}>{c.nombre}</span>
                {!c.compatible && <Badge variant="destructive">Incompatible</Badge>}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- Página principal ---

export function MenuPage() {
  const [fecha, setFecha] = useState(proximoLaborable);
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback((fechaSeleccionada: string) => {
    setCargando(true);
    setError(null);
    setMenu(null);
    const controller = new AbortController();
    obtenerMenu(fechaSeleccionada, controller.signal)
      .then(setMenu)
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

  const cambiarFecha = (f: string) => setFecha(f);

  const grupos = menu ? agruparPorTipo(menu.comidas) : null;

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

      {grupos && (
        <div className="space-y-5">
          {ORDEN_TIPO.map((tipo) => (
            <GrupoComidas key={tipo} tipo={tipo} comidas={grupos.get(tipo) ?? []} />
          ))}
        </div>
      )}
    </section>
  );
}
