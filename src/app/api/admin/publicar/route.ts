import type { Doc } from "@/lib/contenido/tipos";
import { ARCHIVO_DE_ACTIVOS, ARCHIVO_DE_DOCUMENTO, rutaDeMedioPermitida, serializarJson } from "@/lib/contenido/serializar";
import { ramaDestino, tokenDeGithub } from "@/lib/panel/config";
import { ErrorDeGithub, archivosCambiados, commitDeRama, crearCommit, leerTexto, problemaDeLlave, type ArchivoAPublicar } from "@/lib/panel/github";
import { almacenDeVideos, claveDeVideo } from "@/lib/panel/media";
import { ARCHIVO_DE_COLECCION, ID_DE_COLECCION, mezclarColeccion, repetido } from "@/lib/contenido/colecciones";
import { exigirSesion, json } from "../_comun";

export const dynamic = "force-dynamic";

type Pedido = {
  /** El commit con el que se construyó la página que se estaba editando (null en local). */
  base: string | null;
  /** Los documentos cambiados, completos. */
  documentos: Doc[];
  /** Fotos ya subidas como blobs: dónde van en el repositorio. */
  medios?: { ruta: string; blob: string }[];
  /** Documentos de activos nuevos (fotos sanity.imageAsset y videos sanity.fileAsset) para contenido/archivos.json. */
  activosNuevos?: Doc[];
  /** Lo que se publica, en palabras («Inicio · Portada»…), para el mensaje del commit. */
  resumen?: string[];
};

const SHA = /^[a-f0-9]{40}$/;
const FOTO = /^image-[a-f0-9]{40}-\d+x\d+-[a-z0-9]+$/;
const VIDEO = /^file-([a-f0-9]{40})-(mp4|webm)$/;

/** El documento de un video nuevo, armado aquí: del navegador solo se toma el nombre original y el tamaño. */
function videoNuevo(a: Doc): Doc | null {
  const m = VIDEO.exec(a._id);
  if (!m || a._type !== "sanity.fileAsset") return null;
  const [, sha1, extension] = m;
  const nombre = typeof a.originalFilename === "string" ? a.originalFilename.slice(0, 200) : `video.${extension}`;
  const tamano = typeof a.size === "number" && a.size > 0 ? a.size : undefined;
  return {
    _id: a._id,
    _type: "sanity.fileAsset",
    extension,
    mimeType: extension === "webm" ? "video/webm" : "video/mp4",
    originalFilename: nombre,
    sha1hash: sha1,
    ...(tamano ? { size: tamano } : {}),
    url: `/videos/${sha1}.${extension}`,
  };
}

/**
 * POST → publica: un commit en la rama destino con los documentos cambiados
 * (y las fotos nuevas). Cloudflare construye la web sola al recibirlo.
 * Ver docs/panel-propio/plan-etapa-3.md, «Publicar».
 */
export async function POST(req: Request) {
  const rechazo = await exigirSesion(req);
  if (rechazo) return rechazo;
  const token = tokenDeGithub();
  const rama = ramaDestino();
  if (!token) return json({ error: "Falta la llave de GitHub en Cloudflare (GITHUB_TOKEN_PANEL)." }, 503);
  if (!rama) return json({ error: "Falta configurar dónde publicar (PANEL_RAMA_DESTINO)." }, 503);

  let p: Pedido;
  try {
    p = (await req.json()) as Pedido;
  } catch {
    return json({ error: "Petición inválida." }, 400);
  }

  // Qué archivos se escriben, validando cada ruta. Los documentos únicos van a su
  // archivo; los de una colección (clientes, reseñas…) se agrupan por archivo y se
  // mezclan más abajo con lo que tiene la rama (etapa 5).
  const archivos: ArchivoAPublicar[] = [];
  const colecciones = new Map<string, { tipo: string; cambios: Doc[] }>();
  for (const d of p.documentos ?? []) {
    const unico = ARCHIVO_DE_DOCUMENTO[d?._id];
    if (unico && d._type === d._id) {
      archivos.push({ ruta: unico, texto: serializarJson(d) });
      continue;
    }
    const ruta = ARCHIVO_DE_COLECCION[d?._type];
    if (!ruta || typeof d._id !== "string" || !ID_DE_COLECCION.test(d._id)) {
      return json({ error: `El documento «${d?._id}» no se puede publicar desde el panel.` }, 400);
    }
    const grupo = colecciones.get(ruta) ?? { tipo: d._type, cambios: [] };
    grupo.cambios.push(d);
    colecciones.set(ruta, grupo);
  }
  for (const m of p.medios ?? []) {
    if (!rutaDeMedioPermitida(m.ruta) || !/^[a-f0-9]{40}$/.test(m.blob)) return json({ error: "Una foto tiene una ruta inválida." }, 400);
    archivos.push({ ruta: m.ruta, blob: m.blob });
  }
  if (archivos.length === 0 && colecciones.size === 0 && !(p.activosNuevos ?? []).length) return json({ error: "No hay cambios para publicar." }, 400);

  try {
    const actual = await commitDeRama(token, rama);

    // ¿Alguien (otra pestaña, Claude Desktop) cambió estos mismos archivos mientras se editaba?
    const rutas = new Set([...archivos.map((a) => a.ruta), ...colecciones.keys()]);
    if (p.base && SHA.test(p.base) && p.base !== actual) {
      const cambiados = await archivosCambiados(token, p.base, actual);
      const choque = cambiados.filter((r) => rutas.has(r));
      if (choque.length) {
        return json(
          { error: "Esta sección cambió en la web mientras la editabas. Recarga la página para ver lo último y vuelve a hacer tu cambio.", archivos: choque },
          409
        );
      }
    }

    // Colecciones: cada archivo se lee de la rama y se cambian solo esos documentos.
    const ahora = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    for (const [ruta, { tipo, cambios }] of colecciones) {
      const texto = await leerTexto(token, ruta, actual);
      const lista = mezclarColeccion(texto ? (JSON.parse(texto) as Doc[]) : [], cambios, ahora);
      const error = repetido(lista, tipo);
      if (error) return json({ error }, 400);
      archivos.push({ ruta, texto: serializarJson(lista) });
    }

    // Fotos y videos nuevos: se agregan a contenido/archivos.json (leído de la rama en ese momento).
    const fotos = (p.activosNuevos ?? []).filter((a) => a?._type === "sanity.imageAsset" && FOTO.test(a._id));
    const videos = (p.activosNuevos ?? []).map((a) => (a ? videoNuevo(a) : null)).filter((a): a is Doc => a !== null);
    if (videos.length) {
      // Un video que no terminó de subir no se publica (la web lo pediría a R2 y no lo encontraría).
      const almacen = almacenDeVideos();
      if (!almacen) return json({ error: "El almacén de videos (R2) no está conectado a este sitio." }, 503);
      for (const v of videos) {
        if (!(await almacen.head(claveDeVideo(`${v.sha1hash}.${v.extension}`)))) {
          return json({ error: `El video «${v.originalFilename}» no terminó de subir. Vuelve a elegirlo con «Cambiar video».` }, 400);
        }
      }
    }
    const nuevos = [...fotos, ...videos];
    if (nuevos.length) {
      const texto = await leerTexto(token, ARCHIVO_DE_ACTIVOS, actual);
      const lista = (texto ? (JSON.parse(texto) as Doc[]) : []).filter((a) => !nuevos.some((n) => n._id === a._id));
      const todos = [...lista, ...nuevos].sort((a, b) => (a._id < b._id ? -1 : 1));
      archivos.push({ ruta: ARCHIVO_DE_ACTIVOS, texto: serializarJson(todos) });
    }

    const que = (p.resumen ?? []).filter((x) => typeof x === "string").slice(0, 8).join(", ") || "contenido";
    const commit = await crearCommit(token, {
      rama,
      padre: actual,
      archivos,
      mensaje: `Contenido: ${que} (publicado desde el panel)`,
    });
    return json({ commit, rama });
  } catch (e) {
    console.error("[panel] No se pudo publicar:", e);
    if (e instanceof ErrorDeGithub && e.estado === 409) {
      return json({ error: "Alguien publicó justo al mismo tiempo. Espera unos segundos y vuelve a pulsar «Publicar cambios»." }, 409);
    }
    const llave = problemaDeLlave(e);
    if (llave) return json({ error: llave }, 502);
    return json({ error: "No se pudo publicar. Intenta de nuevo en un momento; tus cambios siguen guardados en este navegador." }, 502);
  }
}
