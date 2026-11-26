import { claveDelPanel } from "@/lib/panel/config";
import { COOKIE, claveCorrecta, valorDeSesion } from "@/lib/panel/sesion";
import { json, mismoOrigen } from "../_comun";

export const dynamic = "force-dynamic";

/** POST { clave } → abre la sesión del panel (cookie dofi_panel, 14 días). */
export async function POST(req: Request) {
  if (!mismoOrigen(req)) return json({ error: "Petición rechazada (origen distinto)." }, 403);
  const clave = claveDelPanel();
  if (!clave) return json({ error: "Falta configurar la contraseña del panel en Cloudflare (PANEL_CLAVE)." }, 503);

  let intento = "";
  try {
    intento = String(((await req.json()) as { clave?: unknown }).clave ?? "");
  } catch {
    return json({ error: "Petición inválida." }, 400);
  }

  if (!(await claveCorrecta(intento, clave))) {
    // Un segundo de espera por intento fallido: probar contraseñas a ciegas se vuelve muy lento.
    await new Promise((r) => setTimeout(r, 1000));
    return json({ error: "Contraseña incorrecta." }, 401);
  }

  const { valor, vence } = await valorDeSesion(clave);
  const segundos = Math.floor((vence - Date.now()) / 1000);
  return json({ ok: true }, 200, {
    "Set-Cookie": `${COOKIE}=${valor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${segundos}`,
  });
}
