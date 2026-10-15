import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto que ocupa el lugar del contenido mientras se resuelve la sesión. */
export function PantallaCargando() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
