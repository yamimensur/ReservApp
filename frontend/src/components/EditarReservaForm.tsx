import { useEffect, useRef, useState, type FormEvent } from "react";
import { SelectorComidas } from "@/components/SelectorComidas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ErrorApi } from "@/services/apiClient";
import { obtenerMenu } from "@/services/menuService";
import { modificarReserva } from "@/services/reservaService";
import { puedeGestionarReserva } from "@/lib/reservas";
import type { MenuResponse } from "@/types/menu";
import type { ReservaResponse } from "@/types/reserva";

interface Props {
  reserva: ReservaResponse;
  habilitada: boolean;
  onCerrar: () => void;
  onActualizada: (reserva: ReservaResponse) => void;
}

export function EditarReservaForm({ reserva, habilitada, onCerrar, onActualizada }: Props) {
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);
  const [seleccionCambio, setSeleccionCambio] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => { titulo.current?.focus(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setErrorCarga(null);
    obtenerMenu(reserva.fecha, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data.id !== reserva.menuId) {
          throw new ErrorApi(409, "El menú de esta reserva cambió. No podemos ofrecer sus opciones para modificarla.");
        }
        setMenu(data);
        const validas = new Set(data.comidas.filter((c) => c.compatible).map((c) => c.id));
        const seleccion = reserva.comidas.filter((c) => validas.has(c.id)).map((c) => c.id);
        setSeleccionadas(new Set(seleccion));
        setSeleccionCambio(seleccion.length !== reserva.comidas.length);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setErrorCarga(err instanceof ErrorApi ? err.message : "No pudimos cargar las opciones del menú.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [reserva.fecha, reserva.menuId, reserva.comidas, intento]);

  const tienePrincipal = menu?.comidas.some((c) => c.tipo === "PLATO_PRINCIPAL" && c.compatible && seleccionadas.has(c.id));

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando || !tienePrincipal || !habilitada) return;
    if (!puedeGestionarReserva(reserva)) {
      setError("Venció el horario de modificación o cancelación.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const actualizada = await modificarReserva(reserva.id, { comidaIds: [...seleccionadas] });
      onActualizada(actualizada);
    } catch (err: unknown) {
      setError(err instanceof ErrorApi ? err.message : "No pudimos guardar los cambios. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4 border-t pt-4" aria-label="Modificar reserva" aria-busy={cargando || enviando}>
      <h3 ref={titulo} tabIndex={-1} className="font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring">Modificar comidas</h3>
      <p className="text-sm text-muted-foreground">Elegí un plato principal. Entrada, postre y bebida son opcionales.</p>
      {cargando && <p role="status">Cargando opciones del menú…</p>}
      {errorCarga && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar las opciones</AlertTitle>
          <AlertDescription>{errorCarga}</AlertDescription>
          <Button type="button" variant="outline" className="mt-2" onClick={() => setIntento((n) => n + 1)}>Reintentar</Button>
        </Alert>
      )}
      {!cargando && !errorCarga && menu && (
        <>
          {seleccionCambio && (
            <Alert variant="aviso"><AlertDescription>Algunas comidas ya no están disponibles o son incompatibles con tu perfil. Revisá la selección antes de guardar.</AlertDescription></Alert>
          )}
          <SelectorComidas comidas={menu.comidas} seleccionadas={seleccionadas} onChange={setSeleccionadas}
            deshabilitado={enviando || !habilitada} />
          {!tienePrincipal && <p className="text-sm text-destructive">Seleccioná un plato principal compatible para guardar.</p>}
        </>
      )}
      {error && <Alert variant="destructive"><AlertTitle>No pudimos modificar la reserva</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={cargando || !!errorCarga || !tienePrincipal || enviando || !habilitada}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="outline" onClick={onCerrar} disabled={enviando}>Volver sin guardar</Button>
      </div>
    </form>
  );
}
