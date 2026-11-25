import type { PaginaInicio } from "@/lib/inicio";

/**
 * Lo que el panel le manda al lienzo (/admin/lienzo) por postMessage, y lo
 * que el lienzo le contesta. Solo se aceptan mensajes del mismo origen.
 */

export type ModoVista = "seccion" | "completa";
export type Dispositivo = "computadora" | "celular";

export type VistaPrevia = {
  pagina: "inicio";
  datos: PaginaInicio;
  modo: ModoVista;
  /** Qué pieza mostrar o hacia cuál desplazarse: "hero" | "banner:<id>". */
  vista: string;
};

export type MensajeAlLienzo = { tipo: "dibujar" } & VistaPrevia;
export type MensajeDelLienzo = { tipo: "listo" };

export const TAMANOS: Record<Dispositivo, { ancho: number; alto: number }> = {
  computadora: { ancho: 1440, alto: 900 },
  celular: { ancho: 390, alto: 844 },
};
