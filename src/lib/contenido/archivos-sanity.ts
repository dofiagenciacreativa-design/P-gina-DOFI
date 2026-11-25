import type { ResolverArchivo } from "./tipos";

/**
 * Resuelve las referencias de archivos de Sanity sin consultar a Sanity: la
 * referencia ya trae todo lo necesario.
 *
 *   image-<sha1>-<ancho>x<alto>-<ext>  →  https://cdn.sanity.io/images/<proyecto>/<conjunto>/<sha1>-<ancho>x<alto>.<ext>
 *   file-<sha1>-<ext>                  →  https://cdn.sanity.io/files/<proyecto>/<conjunto>/<sha1>.<ext>
 *
 * Es la misma dirección que devuelve `asset->url` en GROQ. Lo usa el panel en
 * la etapa 1 (todavía no hay almacén propio).
 */
export function resolverDeSanity(o: { projectId: string; dataset: string }): ResolverArchivo {
  const base = `https://cdn.sanity.io`;
  return (valor) => {
    const ref = (valor as { asset?: { _ref?: unknown } } | null | undefined)?.asset?._ref;
    if (typeof ref !== "string") return null;

    const imagen = /^image-([a-f0-9]+)-(\d+)x(\d+)-([a-z0-9]+)$/i.exec(ref);
    if (imagen) {
      const [, sha, ancho, alto, ext] = imagen;
      return {
        url: `${base}/images/${o.projectId}/${o.dataset}/${sha}-${ancho}x${alto}.${ext}`,
        ancho: Number(ancho),
        alto: Number(alto),
      };
    }

    const archivo = /^file-([a-f0-9]+)-([a-z0-9]+)$/i.exec(ref);
    if (archivo) {
      const [, sha, ext] = archivo;
      return { url: `${base}/files/${o.projectId}/${o.dataset}/${sha}.${ext}`, ancho: null, alto: null };
    }

    return null;
  };
}
