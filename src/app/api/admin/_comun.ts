import { claveDelPanel } from "@/lib/panel/config";
import { cookieDeSesion, sesionValida } from "@/lib/panel/sesion";

/**
 * Común a las rutas /api/admin/*: respuestas sin caché y fuera de los
 * buscadores, sesión y control de origen en las escrituras.
 */

export const json = (cuerpo: unknown, estado = 200, extra: Record<string, string> = {}) =>
  Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...extra },
  });

export async function haySesion(req: Request): Promise<boolean> {
  return sesionValida(cookieDeSesion(req.headers.get("cookie")), claveDelPanel());
}

/** Las escrituras solo se aceptan desde el propio sitio (defensa contra formularios de otros sitios). */
export function mismoOrigen(req: Request): boolean {
  const origen = req.headers.get("origin");
  if (!origen) return false;
  try {
    return new URL(origen).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

/** Para las escrituras: sesión válida y mismo origen; si no, la respuesta de error. */
export async function exigirSesion(req: Request): Promise<Response | null> {
  if (!mismoOrigen(req)) return json({ error: "Petición rechazada (origen distinto)." }, 403);
  if (!(await haySesion(req))) return json({ error: "Tu sesión venció. Vuelve a entrar." }, 401);
  return null;
}
