import { evaluate, parse } from "groq-js";
import type { Doc } from "./tipos";

/**
 * Ejecuta una consulta GROQ sobre documentos en memoria, con el evaluador
 * oficial de GROQ (groq-js). Son las MISMAS consultas que se mandan hoy a
 * Sanity: así la web obtiene exactamente los mismos datos leyendo los
 * archivos del repositorio (docs/panel-propio/plan-etapa-2.md).
 */

type Arbol = ReturnType<typeof parse>;
const interpretadas = new Map<string, Arbol>();

export async function consultarSobre<T>(
  conjunto: Doc[],
  query: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const clave = `${query}\u0000${JSON.stringify(params)}`;
  let arbol = interpretadas.get(clave);
  if (!arbol) {
    arbol = parse(query, { params });
    interpretadas.set(clave, arbol);
  }
  const valor = await evaluate(arbol, { dataset: conjunto, params });
  return (await valor.get()) as T;
}

/** La consulta sobre el contenido del repositorio (contenido/). */
export async function consultarLocal<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  const { CONJUNTO } = await import("./conjunto");
  return consultarSobre<T>(CONJUNTO, query, params);
}
