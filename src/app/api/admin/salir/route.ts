import { COOKIE } from "@/lib/panel/sesion";
import { json, mismoOrigen } from "../_comun";

export const dynamic = "force-dynamic";

/** POST → cierra la sesión en este navegador. */
export async function POST(req: Request) {
  if (!mismoOrigen(req)) return json({ error: "Petición rechazada (origen distinto)." }, 403);
  return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
}
