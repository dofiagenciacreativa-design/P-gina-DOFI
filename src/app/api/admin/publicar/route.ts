import type { Doc } from "@/lib/contenido/tipos";
import { ARCHIVO_DE_ACTIVOS, ARCHIVO_DE_DOCUMENTO, rutaDeMedioPermitida, serializarJson } from "@/lib/contenido/serializar";
import { ramaDestino, tokenDeGithub } from "@/lib/panel/config";
import { ErrorDeGithub, archivosCambiados, commitDeRama, crearCommit, leerTexto, problemaDeLlave, type ArchivoAPublicar } from "@/lib/panel/github";
import { exigirSesion, json } from "../_comun";

export const dynamic = "force-dynamic";

type Pedido = {
  /** El commit con el que se construyó la página que se estaba editando (null en local). */
  base: string | null;
  /** Los documentos cambiados, completos. */
  documentos: Doc[];
  /** Fotos ya subidas como blobs: dónde van en el repositorio. */
  medios?: { ruta: string; blob: string }[];
  /** Documentos de activos nuevos (sanity.imageAsset) para contenido/archivos.json. */
  activosNuevos?: Doc[];
  /** Lo que se publica, en palabras («Inicio · Portada»…), para el mensaje del commit. */
  resumen?: string[];
};

const SHA = /^[a-f0-9]{40}$/;

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

  // Qué archivos se escriben, validando cada ruta.
  const archivos: ArchivoAPublicar[] = [];
  for (const d of p.documentos ?? []) {
    const ruta = ARCHIVO_DE_DOCUMENTO[d?._id];
    if (!ruta || d._type !== d._id) return json({ error: `El documento «${d?._id}» no se puede publicar desde el panel.` }, 400);
    archivos.push({ ruta, texto: serializarJson(d) });
  }
  for (const m of p.medios ?? []) {
    if (!rutaDeMedioPermitida(m.ruta) || !/^[a-f0-9]{40}$/.test(m.blob)) return json({ error: "Una foto tiene una ruta inválida." }, 400);
    archivos.push({ ruta: m.ruta, blob: m.blob });
  }
  if (archivos.length === 0 && !(p.activosNuevos ?? []).length) return json({ error: "No hay cambios para publicar." }, 400);

  try {
    const actual = await commitDeRama(token, rama);

    // ¿Alguien (otra pestaña, Claude Desktop) cambió estos mismos archivos mientras se editaba?
    const rutas = new Set(archivos.map((a) => a.ruta));
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

    // Fotos nuevas: se agregan a contenido/archivos.json (leído de la rama en ese momento).
    const nuevos = (p.activosNuevos ?? []).filter((a) => a?._type === "sanity.imageAsset" && /^image-[a-f0-9]{40}-\d+x\d+-[a-z0-9]+$/.test(a._id));
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
