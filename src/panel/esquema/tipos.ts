import type { Doc } from "@/lib/contenido/tipos";

/**
 * Esquema del panel: qué campos tiene cada sección y dónde viven dentro de
 * cada documento. El formulario se arma solo a partir de esto
 * (docs/panel-propio/diseno.md §7.2). En la etapa 1 existen las clases que usa
 * la página de Inicio; las demás (referencia, lista reordenable, archivo…)
 * llegan con las páginas que las necesitan.
 */

/** Un paso dentro de un documento: nombre de campo, posición o elemento de lista por su _key. */
export type Segmento = string | number | { _key: string };
export type Ruta = Segmento[];

export type Opcion = { valor: string; titulo: string };

type Base = {
  /** Nombre del campo dentro del bloque. Admite puntos para objetos anidados: "ctaPosicionDesktop.horizontal". */
  nombre: string;
  titulo: string;
  ayuda?: string;
  obligatorio?: boolean;
};

export type Campo =
  /** `max` es el largo recomendado: el contador avisa, pero no impide guardar. */
  | (Base & { clase: "texto"; max?: number })
  | (Base & { clase: "textoLargo"; max?: number; filas?: number })
  /** Ruta interna («/…») o dirección completa (https://, mailto:, tel:). */
  | (Base & { clase: "enlace" })
  | (Base & { clase: "opcion"; opciones: Opcion[]; forma?: "lista" | "botones" })
  /** `porDefecto`: cómo lo trata la web cuando el campo no existe (p. ej. «activa» vale sí). */
  | (Base & { clase: "booleano"; porDefecto?: boolean })
  | (Base & { clase: "numero"; min?: number; max?: number; paso?: number })
  /** Una lista de textos editada como un párrafo: un renglón por elemento. */
  | (Base & { clase: "lineas"; maxLineas?: number; maxPorLinea?: number })
  /** Etapa 1: la imagen se ve, pero se cambia desde la etapa 3. */
  | (Base & { clase: "imagen" });

/** Un grupo de campos que viven juntos en un documento (TEXTO, BOTÓN, una tarjeta…). */
export type Bloque = {
  titulo: string;
  /** _id del documento donde se guardan estos campos. */
  documento: string;
  /** Dónde viven los campos dentro de ese documento. [] = en la raíz. */
  ruta: Ruta;
  campos: Campo[];
  nota?: string;
};

export type NombreIcono =
  | "portada"
  | "tarjetas"
  | "banner"
  | "texto"
  | "metodo"
  | "clientes"
  | "resenas"
  | "cierre";

export type SeccionPanel = {
  /** Identificador estable dentro de la página (no cambia al editar). */
  clave: string;
  titulo: string;
  icono: NombreIcono;
  /** «Aparece en: …» */
  apareceEn: string;
  /** El texto de «¿Cómo funciona?». */
  ayuda: string;
  /** Qué pieza dibuja la vista previa para esta sección ("hero", "banner:<id>"). */
  vista: string;
  /** Cuántos elementos tiene, cuando corresponde (tarjetas, pasos…). */
  cuenta?: number;
  bloques: Bloque[];
  /** Un aviso fijo arriba de los campos (por ejemplo, el del video de los banners). */
  aviso?: string;
  /** Cuando la sección todavía no tiene datos propios y la web muestra los de fábrica. */
  vacia?: { texto: string; boton: string; aplicar: (docs: Record<string, Doc>) => Record<string, Doc> };
};
