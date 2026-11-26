import type { PaginaInicio } from "@/lib/inicio";
import type { SeccionMarketing } from "@/lib/marketing-digital";
import type { SeccionTrafico } from "@/lib/trafico";
import type { SeccionFeniax } from "@/lib/feniax";
import type { SeccionAsesorias } from "@/lib/asesorias";

/**
 * Lo que el panel le manda al lienzo (/admin/lienzo) por postMessage, y lo
 * que el lienzo le contesta. Solo se aceptan mensajes del mismo origen.
 */

export type ModoVista = "seccion" | "completa";
export type Dispositivo = "computadora" | "celular";

type Comun = {
  modo: ModoVista;
  /** Qué pieza mostrar o hacia cuál desplazarse: Inicio, "hero" | "banner:<id>"; servicios, el _key de la sección. */
  vista: string;
};

export type VistaPrevia = Comun &
  (
    | { pagina: "inicio"; datos: PaginaInicio }
    | { pagina: "marketing"; secciones: SeccionMarketing[] }
    | { pagina: "trafico"; secciones: SeccionTrafico[] }
    | { pagina: "feniax"; secciones: SeccionFeniax[] }
    | { pagina: "asesorias"; secciones: SeccionAsesorias[] }
  );

export type MensajeAlLienzo = { tipo: "dibujar" } & VistaPrevia;
export type MensajeDelLienzo = { tipo: "listo" };

export const TAMANOS: Record<Dispositivo, { ancho: number; alto: number }> = {
  computadora: { ancho: 1440, alto: 900 },
  celular: { ancho: 390, alto: 844 },
};
