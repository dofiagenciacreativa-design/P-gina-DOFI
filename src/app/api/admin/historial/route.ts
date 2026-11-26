import { ARCHIVO_DE_DOCUMENTO } from "@/lib/contenido/serializar";
import { ARCHIVO_DE_COLECCION } from "@/lib/contenido/colecciones";
import { ramaDestino, tokenDeGithub } from "@/lib/panel/config";
import { commitsDeArchivo, leerTexto, problemaDeLlave } from "@/lib/panel/github";
import { haySesion, json } from "../_comun";

export const dynamic = "force-dynamic";

const ARCHIVOS = new Set([...Object.values(ARCHIVO_DE_DOCUMENTO), ...Object.values(ARCHIVO_DE_COLECCION)]);
const SHA = /^[a-f0-9]{40}$/;

/**
 * «Versiones anteriores» (docs/panel-propio/plan-etapa-5.md): el historial es
 * el de git.
 *   GET ?archivo=contenido/x.json              → { versiones: [{ commit, fecha, mensaje }] }
 *   GET ?archivo=contenido/x.json&commit=<sha> → { contenido } (el JSON de esa versión)
 * Lee la rama donde publica el panel; en la web real («solo para mirar»), main.
 */
export async function GET(req: Request) {
  if (!(await haySesion(req))) return json({ error: "Tu sesión venció. Vuelve a entrar." }, 401);
  const token = tokenDeGithub();
  if (!token) return json({ error: "Falta la llave de GitHub en Cloudflare (GITHUB_TOKEN_PANEL)." }, 503);

  const u = new URL(req.url);
  const archivo = u.searchParams.get("archivo") ?? "";
  const commit = u.searchParams.get("commit");
  if (!ARCHIVOS.has(archivo) || (commit !== null && !SHA.test(commit))) return json({ error: "Petición inválida." }, 400);

  try {
    if (commit) {
      const texto = await leerTexto(token, archivo, commit);
      if (texto === null) return json({ error: "En esa versión el archivo no existía." }, 404);
      return json({ contenido: JSON.parse(texto) });
    }
    return json({ versiones: await commitsDeArchivo(token, ramaDestino() ?? "main", archivo) });
  } catch (e) {
    console.error("[panel] Historial:", e);
    const llave = problemaDeLlave(e);
    return json({ error: llave ?? "No se pudo leer el historial en GitHub. Intenta de nuevo en un momento." }, 502);
  }
}
