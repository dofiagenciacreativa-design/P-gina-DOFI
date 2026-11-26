import type { Doc } from "@/lib/contenido/tipos";
import { ARCHIVO_DE_ACTIVOS, serializarJson } from "@/lib/contenido/serializar";
import { ramaDestino, tokenDeGithub } from "@/lib/panel/config";
import { ErrorDeGithub, commitDeRama, crearCommit, leerTexto, problemaDeLlave } from "@/lib/panel/github";
import { NOMBRE_DE_VIDEO, TIPO_DE_VIDEO, almacenDeVideos, claveDeVideo } from "@/lib/panel/media";
import { exigirSesion, json } from "../../_comun";

export const dynamic = "force-dynamic";

/**
 * POST → pasa a R2 los videos que todavía se ven desde Sanity (hoy, los 3 de
 * Asesorías) y publica el cambio de sus direcciones en contenido/archivos.json.
 * Un clic, una sola vez por almacén (vista previa y producción).
 *
 * El Worker no lee los videos: el cuerpo de la descarga de Sanity pasa en
 * flujo directo a R2 (casi sin CPU). Si un video ya está en R2, no se copia otra vez.
 */
export async function POST(req: Request) {
  const rechazo = await exigirSesion(req);
  if (rechazo) return rechazo;
  const token = tokenDeGithub();
  const rama = ramaDestino();
  const almacen = almacenDeVideos();
  if (!token || !rama) return json({ error: "Falta configurar el panel en Cloudflare (GITHUB_TOKEN_PANEL / PANEL_RAMA_DESTINO)." }, 503);
  if (!almacen) return json({ error: "El almacén de videos (R2) no está conectado a este sitio." }, 503);

  try {
    const actual = await commitDeRama(token, rama);
    const texto = await leerTexto(token, ARCHIVO_DE_ACTIVOS, actual);
    if (!texto) return json({ error: "No encontré contenido/archivos.json en la rama." }, 500);
    const activos = JSON.parse(texto) as (Doc & { url?: string; sha1hash?: string; extension?: string; mimeType?: string })[];

    const pendientes = activos.filter((a) => a._type === "sanity.fileAsset" && typeof a.url === "string" && a.url.startsWith("https://cdn.sanity.io/"));
    if (pendientes.length === 0) return json({ copiados: [], mensaje: "Todos los videos ya están en Cloudflare." });

    const copiados: string[] = [];
    for (const a of pendientes) {
      const nombre = `${a.sha1hash}.${a.extension}`;
      if (!NOMBRE_DE_VIDEO.test(nombre)) return json({ error: `El video ${a._id} tiene un formato que no se puede pasar.` }, 400);
      if (!(await almacen.head(claveDeVideo(nombre)))) {
        const r = await fetch(a.url!, { cache: "no-store" });
        if (!r.ok || !r.body) return json({ error: `Sanity no entregó el video ${a.originalFilename ?? a._id} (${r.status}).` }, 502);
        await almacen.put(claveDeVideo(nombre), r.body, { httpMetadata: { contentType: a.mimeType ?? TIPO_DE_VIDEO[a.extension ?? "mp4"] } });
      }
      a.url = `/videos/${nombre}`;
      copiados.push(nombre);
    }

    const commit = await crearCommit(token, {
      rama,
      padre: actual,
      archivos: [{ ruta: ARCHIVO_DE_ACTIVOS, texto: serializarJson(activos) }],
      mensaje: `Contenido: ${copiados.length} videos pasan de Sanity a Cloudflare R2 (desde el panel)`,
    });
    return json({ copiados, commit, rama });
  } catch (e) {
    console.error("[panel] No se pudieron pasar los videos a R2:", e);
    if (e instanceof ErrorDeGithub && e.estado === 409) return json({ error: "Alguien publicó justo al mismo tiempo. Vuelve a intentar en unos segundos." }, 409);
    const llave = problemaDeLlave(e);
    if (llave) return json({ error: llave }, 502);
    return json({ error: "No se pudieron pasar los videos. Vuelve a intentar; lo que ya se copió no se repite." }, 502);
  }
}
