import { tokenDeGithub } from "@/lib/panel/config";
import { ErrorDeGithub, reenviarBlob } from "@/lib/panel/github";
import { exigirSesion, json } from "../_comun";

export const dynamic = "force-dynamic";

const MAXIMO = 25 * 1024 * 1024; // una foto de 15 MB pesa ~20 MB en base64

/**
 * POST con el cuerpo {"content": "<base64>", "encoding": "base64"} ya armado
 * por el navegador → lo reenvía a GitHub SIN leerlo (no gasta CPU) y devuelve
 * { sha }. El archivo queda en GitHub, pero no en ninguna carpeta hasta que
 * «Publicar cambios» lo use en un commit.
 */
export async function POST(req: Request) {
  const rechazo = await exigirSesion(req);
  if (rechazo) return rechazo;
  const token = tokenDeGithub();
  if (!token) return json({ error: "Falta la llave de GitHub en Cloudflare (GITHUB_TOKEN_PANEL)." }, 503);

  const largo = req.headers.get("content-length");
  if (!largo || Number(largo) > MAXIMO) return json({ error: "El archivo es demasiado grande (máximo 15 MB)." }, 413);
  if (!(req.headers.get("content-type") ?? "").includes("application/json") || !req.body) {
    return json({ error: "Petición inválida." }, 400);
  }

  try {
    return json({ sha: await reenviarBlob(token, req.body, largo) });
  } catch (e) {
    const estado = e instanceof ErrorDeGithub ? e.estado : 500;
    console.error("[panel] No se pudo guardar un archivo en GitHub:", e);
    return json({ error: "GitHub no aceptó el archivo. Intenta de nuevo en un momento." }, estado >= 500 ? 502 : estado);
  }
}
