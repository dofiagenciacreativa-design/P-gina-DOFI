import { REPOSITORIO } from "./config";

/**
 * Lo mínimo de la API de GitHub que usa el panel para publicar
 * (docs/panel-propio/plan-etapa-3.md). Solo del lado del servidor: el token
 * nunca llega al navegador.
 */

const BASE = `https://api.github.com/repos/${REPOSITORIO.dueno}/${REPOSITORIO.nombre}`;

export class ErrorDeGithub extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje);
  }
}

/**
 * Qué hacer cuando GitHub rechaza la llave, según su respuesta:
 *  401 = la llave no es válida; 404 = la llave no ve el repositorio;
 *  403 = la ve, pero no puede escribir. null = no es un problema de la llave.
 */
export function problemaDeLlave(e: unknown): string | null {
  if (!(e instanceof ErrorDeGithub)) return null;
  if (e.estado === 401)
    return "GitHub dice que la llave del panel no es válida: puede estar incompleta, haber vencido o haberse borrado. Crea una nueva y pégala completa en GITHUB_TOKEN_PANEL.";
  if (e.estado === 404)
    return "La llave del panel no tiene acceso al repositorio P-gina-DOFI. Al crearla, en «Repository access» elige «Only select repositories» y marca P-gina-DOFI.";
  if (e.estado === 403)
    return "La llave del panel puede leer, pero no escribir. En GitHub, edita la llave y en «Permissions → Contents» elige «Read and write».";
  return null;
}

/** Comprueba que la llave ve el repositorio (solo lectura; no cambia nada). null = bien. */
export async function revisarLlave(token: string): Promise<string | null> {
  try {
    await pedir(token, "GET", "");
    return null;
  } catch (e) {
    return problemaDeLlave(e) ?? "No se pudo comprobar la llave de GitHub en este momento.";
  }
}

function cabeceras(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "panel-dofi",
  };
}

async function pedir<T>(token: string, metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: { ...cabeceras(token), ...(cuerpo ? { "Content-Type": "application/json" } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    cache: "no-store",
  });
  if (!r.ok) throw new ErrorDeGithub(r.status, `GitHub respondió ${r.status} en ${metodo} ${ruta}`);
  return (await r.json()) as T;
}

/** El último commit de una rama. */
export async function commitDeRama(token: string, rama: string): Promise<string> {
  const ref = await pedir<{ object: { sha: string } }>(token, "GET", `/git/ref/heads/${encodeURIComponent(rama)}`);
  return ref.object.sha;
}

/** Los archivos que cambiaron entre dos commits. */
export async function archivosCambiados(token: string, desde: string, hasta: string): Promise<string[]> {
  const c = await pedir<{ files?: { filename: string }[] }>(token, "GET", `/compare/${desde}...${hasta}`);
  return (c.files ?? []).map((f) => f.filename);
}

/** ¿El commit `construido` ya incluye al commit `publicado`? */
export async function incluye(token: string, publicado: string, construido: string): Promise<boolean> {
  if (publicado === construido) return true;
  const c = await pedir<{ status: string }>(token, "GET", `/compare/${publicado}...${construido}`);
  return c.status === "identical" || c.status === "ahead";
}

/** El texto de un archivo de la rama (para mezclar contenido/archivos.json). */
export async function leerTexto(token: string, ruta: string, commit: string): Promise<string | null> {
  try {
    const a = await pedir<{ content: string; encoding: string }>(token, "GET", `/contents/${ruta}?ref=${commit}`);
    const binario = atob(a.content.replace(/\n/g, ""));
    return new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0)));
  } catch (e) {
    if (e instanceof ErrorDeGithub && e.estado === 404) return null;
    throw e;
  }
}

/**
 * Reenvía tal cual a GitHub un cuerpo ya armado por el navegador
 * ({"content": "<base64>", "encoding": "base64"}) y devuelve el sha del blob.
 * El Worker no lo lee: así un archivo grande no gasta CPU.
 */
export async function reenviarBlob(token: string, cuerpo: ReadableStream<Uint8Array>, largo: string | null): Promise<string> {
  const r = await fetch(`${BASE}/git/blobs`, {
    method: "POST",
    headers: { ...cabeceras(token), "Content-Type": "application/json", ...(largo ? { "Content-Length": largo } : {}) },
    body: cuerpo,
    // Node (next start) exige «duplex» para enviar un cuerpo en flujo; el Worker lo ignora.
    ...({ duplex: "half" } as object),
    cache: "no-store",
  });
  if (!r.ok) throw new ErrorDeGithub(r.status, `GitHub respondió ${r.status} al guardar un archivo`);
  return ((await r.json()) as { sha: string }).sha;
}

export type ArchivoAPublicar = { ruta: string; texto: string } | { ruta: string; blob: string };

/** Crea un commit con los archivos dados sobre `padre` y mueve la rama. */
export async function crearCommit(
  token: string,
  o: { rama: string; padre: string; archivos: ArchivoAPublicar[]; mensaje: string }
): Promise<string> {
  const padre = await pedir<{ tree: { sha: string } }>(token, "GET", `/git/commits/${o.padre}`);
  const arbol = await pedir<{ sha: string }>(token, "POST", `/git/trees`, {
    base_tree: padre.tree.sha,
    tree: o.archivos.map((a) =>
      "texto" in a
        ? { path: a.ruta, mode: "100644", type: "blob", content: a.texto }
        : { path: a.ruta, mode: "100644", type: "blob", sha: a.blob }
    ),
  });
  const commit = await pedir<{ sha: string }>(token, "POST", `/git/commits`, {
    message: o.mensaje,
    tree: arbol.sha,
    parents: [o.padre],
  });
  try {
    await pedir(token, "PATCH", `/git/refs/heads/${encodeURIComponent(o.rama)}`, { sha: commit.sha, force: false });
  } catch (e) {
    // 422: la rama avanzó mientras se armaba el commit (otra publicación o un cambio de Claude Desktop).
    if (e instanceof ErrorDeGithub && e.estado === 422) throw new ErrorDeGithub(409, "La rama cambió mientras se publicaba");
    throw e;
  }
  return commit.sha;
}

/** Los últimos commits de una rama que tocaron un archivo («Versiones anteriores»). */
export async function commitsDeArchivo(
  token: string,
  rama: string,
  ruta: string,
  cuantos = 20
): Promise<{ commit: string; fecha: string; mensaje: string }[]> {
  const lista = await pedir<{ sha: string; commit: { message: string; author?: { date?: string }; committer?: { date?: string } } }[]>(
    token,
    "GET",
    `/commits?sha=${encodeURIComponent(rama)}&path=${encodeURIComponent(ruta)}&per_page=${cuantos}`
  );
  return lista.map((c) => ({
    commit: c.sha,
    fecha: c.commit.committer?.date ?? c.commit.author?.date ?? "",
    mensaje: c.commit.message.split("\n")[0],
  }));
}
