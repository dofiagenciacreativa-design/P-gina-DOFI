import { tokenDeGithub } from "@/lib/panel/config";
import { incluye } from "@/lib/panel/github";
import { haySesion, json } from "../_comun";

export const dynamic = "force-dynamic";

const SHA = /^[a-f0-9]{40}$/;

/**
 * GET ?publicado=<sha>&construido=<sha> → { incluido }: ¿el commit con el que
 * se construyó la web ya incluye lo que se publicó? Lo decide GitHub.
 *
 * El `construido` lo lee el navegador del /contenido-version.json del sitio
 * destino (este mismo en producción; el de pruebas en una vista previa). El
 * servidor no lo pide: un Worker no puede pedirle nada a otro *.workers.dev de
 * la misma cuenta (error 1042), y por eso el aviso «Ya está en la web» no
 * llegaba nunca en las vistas previas.
 */
export async function GET(req: Request) {
  if (!(await haySesion(req))) return json({ error: "Tu sesión venció. Vuelve a entrar." }, 401);
  const token = tokenDeGithub();
  if (!token) return json({ error: "Falta configurar el panel en Cloudflare." }, 503);

  const u = new URL(req.url);
  const publicado = u.searchParams.get("publicado") ?? "";
  const construido = u.searchParams.get("construido") ?? "";
  if (!SHA.test(publicado) || !SHA.test(construido)) return json({ error: "Petición inválida." }, 400);

  try {
    return json({ incluido: await incluye(token, publicado, construido) });
  } catch (e) {
    console.error("[panel] No se pudo comprobar la publicación:", e);
    return json({ incluido: false });
  }
}
