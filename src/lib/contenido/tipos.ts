/**
 * Tipos comunes de la capa de contenido del panel propio
 * (docs/panel-propio/diseno.md §6.1 y cambios-2026-11-24.md §5).
 */

/** Un documento con la misma forma JSON que tiene en Sanity. */
export type Doc = Record<string, unknown> & { _id: string; _type: string };

/** Lo que la web necesita saber de una imagen o archivo guardado. */
export type InfoArchivo = { url: string; ancho: number | null; alto: number | null };

/**
 * Recibe el valor guardado de un campo de imagen o archivo
 * (hoy `{ asset: { _ref } }` de Sanity; desde la etapa 3, `{ archivo }` del
 * almacén propio) y devuelve su dirección y medidas, o null si no hay archivo.
 * Así las proyecciones no saben de dónde salen las imágenes.
 */
export type ResolverArchivo = (valor: unknown) => InfoArchivo | null;
