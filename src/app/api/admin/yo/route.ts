import { ajustesFaltantes, ramaDestino, sitioDeRama, tokenDeGithub } from "@/lib/panel/config";
import { revisarLlave } from "@/lib/panel/github";
import { haySesion, json } from "../_comun";

export const dynamic = "force-dynamic";

/**
 * GET → ¿hay sesión?, adónde publica (rama y sitio donde se ve; null = este
 * mismo) y qué falta configurar (sin revelar secretos). Con sesión, además
 * comprueba que la llave de GitHub funcione.
 */
export async function GET(req: Request) {
  const sesion = await haySesion(req);
  const token = tokenDeGithub();
  const rama = ramaDestino();
  const llave = sesion && token ? await revisarLlave(token) : null;
  return json({ sesion, rama, sitio: rama ? sitioDeRama(rama) : null, faltan: ajustesFaltantes(), llave });
}
