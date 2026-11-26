import { ramaDestino } from "@/lib/panel/config";
import { NOMBRE_DE_VIDEO, PARTE_DE_VIDEO, TIPO_DE_VIDEO, VIDEO_MAXIMO, almacenDeVideos, claveDeVideo } from "@/lib/panel/media";
import { exigirSesion, json } from "../../_comun";

export const dynamic = "force-dynamic";

/**
 * «Cambiar video» (docs/panel-propio/plan-etapa-4.md): el navegador sube el
 * video a R2 en partes de 20 MB y el Worker pasa cada parte en flujo, sin
 * leerla (casi sin CPU). El nombre es el SHA-1 del archivo: si ya está en R2,
 * no se sube otra vez.
 *
 *   POST {accion:"iniciar", nombre, tamano}             → {existe} | {uploadId}
 *   PUT  ?nombre=…&uploadId=…&parte=n  (cuerpo: la parte) → {partNumber, etag}
 *   POST {accion:"terminar", nombre, uploadId, partes}  → {listo}
 *   POST {accion:"cancelar", nombre, uploadId}          → {cancelado}
 *
 * Sin rama destino (la web real hasta la etapa 6, «solo para mirar») no se sube nada.
 */

type Pedido =
  | { accion: "iniciar"; nombre: string; tamano: number }
  | { accion: "terminar"; nombre: string; uploadId: string; partes: { partNumber: number; etag: string }[] }
  | { accion: "cancelar"; nombre: string; uploadId: string };

function preparar() {
  if (!ramaDestino()) return { error: json({ error: "En la web real el panel todavía es «solo para mirar»: los videos se cambian en la vista previa." }, 403) };
  const almacen = almacenDeVideos();
  if (!almacen) return { error: json({ error: "El almacén de videos (R2) no está conectado a este sitio." }, 503) };
  return { almacen };
}

export async function POST(req: Request) {
  const rechazo = await exigirSesion(req);
  if (rechazo) return rechazo;
  const { almacen, error } = preparar();
  if (error) return error;

  let p: Pedido;
  try {
    p = (await req.json()) as Pedido;
  } catch {
    return json({ error: "Petición inválida." }, 400);
  }
  if (!p || typeof p.nombre !== "string" || !NOMBRE_DE_VIDEO.test(p.nombre)) return json({ error: "Ese archivo no es un video MP4 o WebM." }, 400);
  const clave = claveDeVideo(p.nombre);

  try {
    if (p.accion === "iniciar") {
      if (!(p.tamano > 0) || p.tamano > VIDEO_MAXIMO) return json({ error: "El video pesa más de 200 MB. Comprímelo y vuelve a intentar." }, 413);
      if (await almacen.head(clave)) return json({ existe: true });
      const extension = p.nombre.split(".").pop() ?? "mp4";
      const subida = await almacen.createMultipartUpload(clave, { httpMetadata: { contentType: TIPO_DE_VIDEO[extension] ?? "video/mp4" } });
      return json({ uploadId: subida.uploadId });
    }
    if (p.accion === "terminar") {
      const partes = (p.partes ?? []).filter((x) => Number.isInteger(x?.partNumber) && typeof x?.etag === "string");
      if (!p.uploadId || partes.length === 0) return json({ error: "Petición inválida." }, 400);
      await almacen.resumeMultipartUpload(clave, p.uploadId).complete(partes);
      return json({ listo: true });
    }
    if (p.accion === "cancelar") {
      if (p.uploadId) await almacen.resumeMultipartUpload(clave, p.uploadId).abort();
      return json({ cancelado: true });
    }
    return json({ error: "Petición inválida." }, 400);
  } catch (e) {
    console.error("[panel] Subida de video:", e);
    return json({ error: "Cloudflare no aceptó el video. Vuelve a intentar en un momento." }, 502);
  }
}

export async function PUT(req: Request) {
  const rechazo = await exigirSesion(req);
  if (rechazo) return rechazo;
  const { almacen, error } = preparar();
  if (error) return error;

  const u = new URL(req.url);
  const nombre = u.searchParams.get("nombre") ?? "";
  const uploadId = u.searchParams.get("uploadId") ?? "";
  const parte = Number(u.searchParams.get("parte"));
  const largo = Number(req.headers.get("content-length"));
  if (!NOMBRE_DE_VIDEO.test(nombre) || !uploadId || !Number.isInteger(parte) || parte < 1 || parte > 10_000) return json({ error: "Petición inválida." }, 400);
  if (!(largo > 0) || largo > PARTE_DE_VIDEO || !req.body) return json({ error: "Parte de tamaño inválido." }, 413);

  try {
    const r = await almacen.resumeMultipartUpload(claveDeVideo(nombre), uploadId).uploadPart(parte, req.body);
    return json({ partNumber: r.partNumber, etag: r.etag });
  } catch (e) {
    console.error("[panel] Parte de video:", e);
    return json({ error: "Se cortó la subida de una parte del video." }, 502);
  }
}
