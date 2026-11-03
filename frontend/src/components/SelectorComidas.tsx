import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NOMBRE_TIPO, ORDEN_TIPO } from "@/lib/comidas";
import { cn } from "@/lib/utils";
import type { ComidaMenu } from "@/types/menu";

interface Props {
  comidas: ComidaMenu[];
  seleccionadas: Set<number>;
  onChange: (seleccion: Set<number>) => void;
  deshabilitado: boolean;
}

/** Selector compartido por la creación y la modificación de reservas. */
export function SelectorComidas({ comidas, seleccionadas, onChange, deshabilitado }: Props) {
  function toggle(comida: ComidaMenu) {
    const siguientes = new Set(seleccionadas);
    if (siguientes.has(comida.id)) {
      siguientes.delete(comida.id);
    } else {
      if (comida.tipo === "PLATO_PRINCIPAL") {
        for (const principal of comidas.filter((c) => c.tipo === "PLATO_PRINCIPAL")) {
          siguientes.delete(principal.id);
        }
      }
      siguientes.add(comida.id);
    }
    onChange(siguientes);
  }

  return (
    <div className="space-y-5">
      {ORDEN_TIPO.map((tipo) => {
        const opciones = comidas.filter((c) => c.tipo === tipo);
        if (opciones.length === 0) return null;
        return (
          <fieldset key={tipo} className="space-y-2" disabled={deshabilitado}>
            <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{NOMBRE_TIPO[tipo]}</legend>
            <ul className="grid gap-2 sm:grid-cols-2">
              {opciones.map((comida) => {
                const activa = seleccionadas.has(comida.id);
                return (
                  <li key={comida.id}>
                    <button type="button" disabled={!comida.compatible || deshabilitado}
                      onClick={() => toggle(comida)} aria-pressed={activa}
                      className="w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring">
                      <Card size="sm" className={cn("transition-colors", !comida.compatible && "opacity-60", activa && "ring-2 ring-primary")}>
                        <CardContent className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true" className={cn("flex size-4 shrink-0 items-center justify-center rounded border",
                              activa ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                              {activa && <Check className="size-3" />}
                            </span>
                            <span className={cn("text-sm", !comida.compatible && "line-through")}>{comida.nombre}</span>
                          </span>
                          {!comida.compatible && <Badge variant="destructive">Incompatible</Badge>}
                        </CardContent>
                      </Card>
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </div>
  );
}
