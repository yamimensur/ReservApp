/** Formatea una fecha ISO (AAAA-MM-DD) como "Lunes 3 de noviembre". */
export function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const nombre = fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

/** Devuelve la fecha de hoy en formato AAAA-MM-DD (zona local). */
export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Suma `dias` días a una fecha ISO y devuelve el resultado en ISO. */
function sumarDias(iso: string, dias: number): string {
  const fecha = new Date(iso + "T12:00:00");
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

/** Devuelve true si la fecha (ISO) cae lunes a viernes. */
function esLaborable(iso: string): boolean {
  const dia = new Date(iso + "T12:00:00").getDay();
  return dia >= 1 && dia <= 5;
}

/**
 * Lista de días laborables para los que se puede consultar el menú:
 * desde hoy hasta 7 días adelante, solo lunes a viernes.
 */
export function diasDisponibles(): string[] {
  const hoy = hoyISO();
  const dias: string[] = [];
  for (let i = 0; i <= 7; i++) {
    const fecha = sumarDias(hoy, i);
    if (esLaborable(fecha)) dias.push(fecha);
  }
  return dias;
}

/** Próximo día laborable (hoy si es laborable, si no el lunes siguiente). */
export function proximoLaborable(): string {
  const lista = diasDisponibles();
  return lista[0] ?? hoyISO();
}

/** Nombre corto del día: "Lun", "Mar", etc. */
export function diaSemanaCorto(iso: string): string {
  const nombre = new Date(iso + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short" });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

/** Número del día del mes. */
export function numeroDia(iso: string): string {
  return new Date(iso + "T12:00:00").getDate().toString();
}
