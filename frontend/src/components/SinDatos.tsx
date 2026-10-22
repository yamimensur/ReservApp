import type { ReactNode } from "react";

interface Props {
  titulo: string;
  detalle?: string;
  /** Acción sugerida, por ejemplo un botón "Reservar mi almuerzo". */
  accion?: ReactNode;
}

/** Estado vacío: no hay registros. Es distinto de "sin resultados" (un filtro que no coincide). */
export function SinDatos({ titulo, detalle, accion }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <p className="font-heading text-lg font-semibold">{titulo}</p>
      {detalle && <p className="max-w-prose text-sm text-muted-foreground">{detalle}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
