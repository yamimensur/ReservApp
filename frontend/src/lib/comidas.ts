import type { ComidaMenu } from "@/types/menu";

export const NOMBRE_TIPO: Record<ComidaMenu["tipo"], string> = {
  ENTRADA: "Entrada",
  PLATO_PRINCIPAL: "Plato principal",
  POSTRE: "Postre",
  BEBIDA: "Bebida",
};

export const ORDEN_TIPO: ComidaMenu["tipo"][] = ["ENTRADA", "PLATO_PRINCIPAL", "POSTRE", "BEBIDA"];
