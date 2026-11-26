import { ajustesFaltantes, ramaDestino } from "@/lib/panel/config";
import { haySesion, json } from "../_comun";

export const dynamic = "force-dynamic";

/** GET → ¿hay sesión?, adónde publica y qué falta configurar (sin revelar secretos). */
export async function GET(req: Request) {
  return json({ sesion: await haySesion(req), rama: ramaDestino(), faltan: ajustesFaltantes() });
}
