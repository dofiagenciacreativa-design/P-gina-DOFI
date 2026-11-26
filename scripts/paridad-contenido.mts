/**
 * Prueba de paridad (etapa 2 del panel, docs/panel-propio/plan-etapa-2.md):
 * corre cada consulta GROQ de la web contra Sanity y contra los archivos del
 * repositorio (contenido/) y compara los resultados.
 *
 *   npm run contenido:paridad
 *
 * Las direcciones de imagen se igualan antes de comparar:
 *   https://cdn.sanity.io/images/<p>/<d>/<sha1>-<A>x<B>.<ext>?…  ≡  /media/<sha1>-<A>x<B>.webp?…
 * Sale con código 1 si hay alguna diferencia.
 */
import { QUERY_CUENTAS_ACTIVAS, QUERY_CUENTA_POR_SLUG, QUERY_PAGINA_INICIO, QUERY_SLUGS_ACTIVOS } from "../src/lib/sanity.ts";
import { QUERY_MARKETING } from "../src/lib/marketing-digital.ts";
import { QUERY_TRAFICO } from "../src/lib/trafico.ts";
import { QUERY_FENIAX } from "../src/lib/feniax.ts";
import { QUERY_ASESORIAS } from "../src/lib/asesorias.ts";
import { consultarSobre } from "../src/lib/contenido/consulta-local.ts";
import { CONJUNTO } from "../src/lib/contenido/conjunto.ts";

const API = `https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${process.env.SANITY_DATASET}`;

async function deSanity(query: string, params: Record<string, unknown> = {}) {
  const u = new URL(API);
  u.searchParams.set("query", query);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(`$${k}`, JSON.stringify(v));
  const r = await fetch(u);
  if (!r.ok) throw new Error(`Sanity respondió ${r.status}`);
  return ((await r.json()) as { result: unknown }).result;
}

const igualarUrl = (t: string) =>
  t
    .replace(/https:\/\/cdn\.sanity\.io\/images\/[^/]+\/[^/]+\/([a-f0-9]{40}-\d+x\d+)\.[a-z0-9]+/g, "imagen:$1")
    .replace(/\/media\/([a-f0-9]{40}-\d+x\d+)\.webp/g, "imagen:$1");

function igualar(v: unknown): unknown {
  if (typeof v === "string") return igualarUrl(v);
  if (Array.isArray(v)) return v.map(igualar);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, igualar(x)]));
  return v;
}

function diferencias(a: unknown, b: unknown, ruta = ""): string[] {
  if (Array.isArray(a) && Array.isArray(b)) {
    const salida: string[] = [];
    if (a.length !== b.length) salida.push(`${ruta}: largo ${a.length} ≠ ${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) salida.push(...diferencias(a[i], b[i], `${ruta}[${i}]`));
    return salida;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const claves = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...claves].flatMap((k) => diferencias((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${ruta}.${k}`));
  }
  return JSON.stringify(a) === JSON.stringify(b) ? [] : [`${ruta}: Sanity=${JSON.stringify(a)?.slice(0, 120)} · archivos=${JSON.stringify(b)?.slice(0, 120)}`];
}

async function comparar(nombre: string, query: string, params: Record<string, unknown> = {}) {
  const [sanity, archivos] = await Promise.all([deSanity(query, params), consultarSobre(CONJUNTO, query, params)]);
  const d = diferencias(igualar(sanity), igualar(archivos));
  console.log(`${d.length === 0 ? "✓" : "✗"} ${nombre}${d.length ? ` — ${d.length} diferencias` : ""}`);
  d.slice(0, 15).forEach((x) => console.log(`    ${x}`));
  return d.length;
}

let total = 0;
total += await comparar("Inicio", QUERY_PAGINA_INICIO);
total += await comparar("Marketing Digital", QUERY_MARKETING);
total += await comparar("Tráfico / Ads", QUERY_TRAFICO);
total += await comparar("ChatBots / CRM", QUERY_FENIAX);
total += await comparar("Asesorías", QUERY_ASESORIAS);
total += await comparar("Cuentas activas", QUERY_CUENTAS_ACTIVAS);
total += await comparar("Slugs activos", QUERY_SLUGS_ACTIVOS);
const slugs = (await deSanity(QUERY_SLUGS_ACTIVOS)) as string[];
for (const slug of slugs) total += await comparar(`Cuenta ${slug}`, QUERY_CUENTA_POR_SLUG, { slug });

console.log(total === 0 ? "\nParidad: 0 diferencias." : `\nParidad: ${total} diferencias.`);
process.exit(total === 0 ? 0 : 1);
