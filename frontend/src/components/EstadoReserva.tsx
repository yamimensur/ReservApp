import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Estado = "ACTIVA" | "CANCELADA";

const ESTILO: Record<Estado, { texto: string; clases: string }> = {
  ACTIVA: { texto: "✓ Activa", clases: "bg-brote text-verde-oscuro" },
  CANCELADA: { texto: "– Cancelada", clases: "bg-muted text-muted-foreground" },
};

/** Traduce el estado del backend a texto y color. El color nunca va solo: siempre hay texto. */
export function EstadoReserva({ estado }: { estado: Estado }) {
  const { texto, clases } = ESTILO[estado];
  return <Badge className={cn(clases)}>{texto}</Badge>;
}
