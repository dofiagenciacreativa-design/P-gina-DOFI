import type { ResolverArchivo } from "./tipos";

/**
 * Los documentos de activos (imágenes y videos) con la forma de Sanity:
 * `sanity.imageAsset` / `sanity.fileAsset`. Vienen de Sanity o de
 * contenido/archivos.json, según la fuente (src/lib/contenido/fuente.ts).
 */
export type Activo = {
  _id: string;
  url: string;
  metadata?: { dimensions?: { width?: number; height?: number } | null } | null;
};

/** Todas las referencias a activos (`asset._ref`) que hay dentro de un valor. */
export function referenciasDeActivos(v: unknown, salida = new Set<string>()): Set<string> {
  if (Array.isArray(v)) v.forEach((e) => referenciasDeActivos(e, salida));
  else if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const ref = (o.asset as { _ref?: unknown } | undefined)?._ref;
    if (typeof ref === "string" && /^(image|file)-/.test(ref)) salida.add(ref);
    Object.values(o).forEach((e) => referenciasDeActivos(e, salida));
  }
  return salida;
}

/** Resuelve `{ asset: { _ref } }` con la lista de activos que ya se tiene (sin consultar nada). */
export function resolverDeActivos(activos: Activo[]): ResolverArchivo {
  const porId = new Map(activos.map((a) => [a._id, a]));
  return (valor) => {
    const ref = (valor as { asset?: { _ref?: unknown } } | null | undefined)?.asset?._ref;
    const a = typeof ref === "string" ? porId.get(ref) : undefined;
    if (!a) return null;
    return { url: a.url, ancho: a.metadata?.dimensions?.width ?? null, alto: a.metadata?.dimensions?.height ?? null };
  };
}
