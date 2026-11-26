import type { Doc } from "@/lib/contenido/tipos";

/**
 * Esquema del panel: qué campos tiene cada sección y dónde viven dentro de
 * cada documento. El formulario se arma solo a partir de esto
 * (docs/panel-propio/diseno.md §7.2). Etapa 1: las clases del Inicio; etapa 4
 * (plan-etapa-4.md): listas, video, campos que dependen de la página y los
 * bloques de las páginas de servicio.
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

/** Un elemento de una lista: sus campos, cómo se llama en la lista y cómo nace. */
export type TipoElemento = {
  /** El _type del elemento (los de Sanity, tal cual). */
  tipo: string;
  titulo: string;
  campos: Campo[];
  /** El nombre de cada elemento en la lista (p. ej. el título del paso). */
  resumen: (elemento: Record<string, unknown>) => string;
  /** Valores con los que nace un elemento nuevo (además de _type y _key). */
  nuevo?: () => Record<string, unknown>;
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
  /** «Cambiar foto» (etapa 3). */
  | (Base & { clase: "imagen" })
  /** «Cambiar video»: sube el archivo a R2 (etapa 4). */
  | (Base & { clase: "video" })
  /** Una lista de elementos con sus campos: agregar, subir/bajar, duplicar y quitar. */
  | (Base & { clase: "lista"; elemento: TipoElemento; max?: number; vacia?: string })
  /** La dirección corta de una página ({ _type: "slug", current }), con «Crear desde <desde>». Etapa 5. */
  | (Base & { clase: "slug"; desde: string })
  /** Un documento de otra colección ({ _type: "reference", _ref }), elegido de una lista. */
  | (Base & { clase: "referencia"; a: TipoColeccion })
  /** Varios documentos de otra colección ([{ _key, _type: "reference", _ref }]), marcados en una lista. */
  | (Base & { clase: "referencias"; a: TipoColeccion })
  /** Una fecha «AAAA-MM-DD» (texto, como la guardaba Sanity). */
  | (Base & { clase: "fecha" });

/** Las colecciones (listas de documentos) del panel: etapa 5. */
export type TipoColeccion = "cuenta" | "resena" | "servicio" | "contenido";

/**
 * Una colección: cómo se llama, cómo se ve cada documento en la lista, sus
 * campos (en grupos, como los bloques) y con qué valores nace uno nuevo.
 * Los campos escriben en la raíz del documento (mismos nombres que en Sanity).
 */
export type DefinicionColeccion = {
  tipo: TipoColeccion;
  /** «Clientes», «Reseñas»… (la pestaña). */
  titulo: string;
  /** «cliente», «reseña»… («+ Nuevo cliente», «¿Borrar este cliente?»). */
  singular: string;
  /** Género del singular, para «Nuevo»/«Nueva». */
  femenino?: boolean;
  icono: NombreIcono;
  /** El texto de «¿Cómo funciona?» y de la cabecera de la pestaña. */
  ayuda: string;
  grupos: { titulo: string; campos: Campo[]; nota?: string }[];
  /** El nombre de cada documento en la lista. */
  resumen: (doc: Doc) => string;
  /** Una línea chica debajo del nombre (categoría, estrellas…). */
  detalle?: (doc: Doc) => string;
  /** ¿Está apagado en la web? (para tacharlo en la lista). */
  oculto?: (doc: Doc) => boolean;
  /** Orden de la lista (por defecto, por el resumen). */
  orden?: (a: Doc, b: Doc) => number;
  /** Valores con los que nace un documento nuevo (además de _id y _type). */
  nuevo: () => Record<string, unknown>;
  /** Campos que no se pueden repetir entre documentos de la colección («slug.current», «nombre»…). */
  unicos?: { campo: string; mensaje: string }[];
  /** Prefijo del _id de los documentos nuevos («cuenta-» + slug, o «resena-» + clave). */
  prefijoId: string;
};

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

/**
 * Un tipo de bloque de `sections[]` en las páginas de servicio (inventario-esquema.md §3.4):
 * sus grupos de campos, cómo se presenta en la lista y con qué valores nace.
 */
export type DefinicionBloque = {
  tipo: string;
  titulo: string;
  icono: NombreIcono;
  /** El texto de «¿Cómo funciona?». */
  ayuda: string;
  grupos: { titulo: string; campos: Campo[]; nota?: string }[];
  nuevo?: () => Record<string, unknown>;
  aviso?: string;
};

export type NombreIcono =
  | "portada"
  | "tarjetas"
  | "banner"
  | "texto"
  | "metodo"
  | "clientes"
  | "resenas"
  | "cierre"
  | "logros"
  | "videos";

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
  /** Páginas de servicio: la sección está apagada («Mostrar en la página» = no). */
  oculta?: boolean;
};
