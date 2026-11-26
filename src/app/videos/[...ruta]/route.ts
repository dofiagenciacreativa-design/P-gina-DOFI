import { NOMBRE_DE_VIDEO, TIPO_DE_VIDEO, almacenDeVideos, claveDeVideo } from "@/lib/panel/media";

export const dynamic = "force-dynamic";

/**
 * /videos/<sha1>.<ext> — los videos del contenido, desde R2
 * (docs/panel-propio/cambios-2026-11-25.md §2). Acepta pedidos por rango
 * (Range) para que el video se pueda adelantar sin bajarlo entero. El nombre
 * es el sha1 del archivo: nunca cambia bajo la misma dirección, así que se
 * guarda en caché para siempre.
 */
async function servir(req: Request, params: Promise<{ ruta: string[] }>, conCuerpo: boolean) {
  const nombre = (await params).ruta.join("/");
  if (!NOMBRE_DE_VIDEO.test(nombre)) return new Response("No encontrado", { status: 404 });
  const almacen = almacenDeVideos();
  if (!almacen) return new Response("Almacén de videos no disponible", { status: 503 });

  const rango = conCuerpo && req.headers.has("range") ? req.headers : undefined;
  const obj = conCuerpo ? await almacen.get(claveDeVideo(nombre), rango ? { range: rango } : undefined) : await almacen.head(claveDeVideo(nombre));
  if (!obj) return new Response("No encontrado", { status: 404 });

  const ext = nombre.split(".").pop() ?? "mp4";
  const cabeceras = new Headers({
    "Content-Type": obj.httpMetadata?.contentType ?? TIPO_DE_VIDEO[ext] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    ETag: obj.httpEtag,
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  if (rango && obj.range && typeof obj.range.offset === "number" && typeof obj.range.length === "number") {
    const desde = obj.range.offset;
    const hasta = desde + obj.range.length - 1;
    cabeceras.set("Content-Range", `bytes ${desde}-${hasta}/${obj.size}`);
    cabeceras.set("Content-Length", String(obj.range.length));
    return new Response(obj.body ?? null, { status: 206, headers: cabeceras });
  }
  cabeceras.set("Content-Length", String(obj.size));
  return new Response(conCuerpo ? (obj.body ?? null) : null, { status: 200, headers: cabeceras });
}

export function GET(req: Request, { params }: { params: Promise<{ ruta: string[] }> }) {
  return servir(req, params, true);
}

export function HEAD(req: Request, { params }: { params: Promise<{ ruta: string[] }> }) {
  return servir(req, params, false);
}
