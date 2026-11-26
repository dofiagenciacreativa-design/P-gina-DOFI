import { ramaDestino, tokenDeGithub } from "@/lib/panel/config";
import { incluye } from "@/lib/panel/github";
import { haySesion, json } from "../_comun";

export const dynamic = "force-dynamic";

const SHA = /^[a-f0-9]{40}$/;

/** La dirección de la web que se construye con la rama destino. */
export function sitioDeRama(rama: string): string | null {
  if (rama === "main") return null; // es este mismo sitio: el navegador lee su propio /contenido-version.json
  return `https://${rama.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-pagina-dofi.dofiagenciacreativa.workers.dev`;
}

/**
 * GET ?publicado=<sha>[&construido=<sha>] → { incluido, construido }: ¿la web
 * ya está construida con lo que se publicó? Si no viene `construido` y la rama
 * destino es de pruebas, se lee el /contenido-version.json de su vista previa.
 */
export async function GET(req: Request) {
  if (!(await haySesion(req))) return json({ error: "Tu sesión venció. Vuelve a entrar." }, 401);
  const token = tokenDeGithub();
  const rama = ramaDestino();
  if (!token || !rama) return json({ error: "Falta configurar el panel en Cloudflare." }, 503);

  const u = new URL(req.url);
  const publicado = u.searchParams.get("publicado") ?? "";
  let construido = u.searchParams.get("construido");
  if (!SHA.test(publicado) || (construido !== null && !SHA.test(construido))) return json({ error: "Petición inválida." }, 400);

  try {
    if (construido === null) {
      const sitio = sitioDeRama(rama);
      if (!sitio) return json({ error: "Falta el commit construido." }, 400);
      const v = (await fetch(`${sitio}/contenido-version.json?t=${Date.now()}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))) as {
        commit?: string | null;
      } | null;
      construido = v?.commit && SHA.test(v.commit) ? v.commit : null;
      if (!construido) return json({ incluido: false, construido: null });
    }
    return json({ incluido: await incluye(token, publicado, construido), construido });
  } catch (e) {
    console.error("[panel] No se pudo comprobar la publicación:", e);
    return json({ incluido: false, construido });
  }
}
