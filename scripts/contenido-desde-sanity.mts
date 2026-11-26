/**
 * Copia el contenido publicado de Sanity a archivos del repositorio
 * (etapa 2 del panel propio, docs/panel-propio/plan-etapa-2.md).
 *
 *   npm run contenido:copiar
 *
 * - contenido/<_id>.json para los documentos únicos y contenido/<colección>.json
 *   para las listas, con la MISMA forma de Sanity (solo se quitan _rev y _system).
 * - contenido/archivos.json: los documentos de los activos en uso, con url local
 *   para las imágenes y la de Sanity para los videos (pasan a R2 en la etapa 3).
 * - public/media/<sha1>-<ancho>x<alto>.webp + variantes, y el original en
 *   media-originales/ (no se publica).
 *
 * Solo LEE de Sanity (API pública, sin clave). Repetible: no rehace las
 * imágenes que ya existen. No toca nada más del proyecto.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { anchosParaGenerar } from "../src/lib/contenido/medios.ts";

const PROYECTO = process.env.SANITY_PROJECT_ID;
const CONJUNTO = process.env.SANITY_DATASET;
if (!PROYECTO || !CONJUNTO) throw new Error("Faltan SANITY_PROJECT_ID / SANITY_DATASET (.env.production)");

const API = `https://${PROYECTO}.api.sanity.io/v2024-01-01/data/query/${CONJUNTO}`;
const RAIZ = process.cwd();
const DIR_CONTENIDO = path.join(RAIZ, "contenido");
const DIR_MEDIA = path.join(RAIZ, "public", "media");
const DIR_ORIGINALES = path.join(RAIZ, "media-originales");

/** Documentos únicos: un archivo cada uno. */
const UNICOS = ["paginaInicio", "hero", "banners", "marketingDigitalPage", "traficoAdsPage", "chatbotsCrmPage", "asesoriasPage"];
/** Colecciones: un archivo con la lista. */
const COLECCIONES: Record<string, string> = { cuenta: "cuentas", contenido: "contenidos", servicio: "servicios", resena: "resenas" };

type Doc = Record<string, unknown> & { _id: string; _type: string };

async function consultar<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  const u = new URL(API);
  u.searchParams.set("query", query);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(`$${k}`, JSON.stringify(v));
  const r = await fetch(u);
  if (!r.ok) throw new Error(`Sanity respondió ${r.status}`);
  return ((await r.json()) as { result: T }).result;
}

/** JSON con las claves ordenadas: el mismo contenido da siempre el mismo archivo (diferencias limpias en git). */
function ordenar(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(ordenar);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.keys(v as object)
        .sort()
        .map((k) => [k, ordenar((v as Record<string, unknown>)[k])])
    );
  }
  return v;
}
const escribirJson = (archivo: string, datos: unknown) =>
  writeFileSync(path.join(DIR_CONTENIDO, archivo), JSON.stringify(ordenar(datos), null, 2) + "\n");

function referencias(v: unknown, salida = new Set<string>()): Set<string> {
  if (Array.isArray(v)) v.forEach((e) => referencias(e, salida));
  else if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const ref = (o.asset as { _ref?: unknown } | undefined)?._ref;
    if (typeof ref === "string" && /^(image|file)-/.test(ref)) salida.add(ref);
    Object.values(o).forEach((e) => referencias(e, salida));
  }
  return salida;
}

function limpiar(d: Doc): Doc {
  const { _rev, _system, ...resto } = d as Doc & { _rev?: unknown; _system?: unknown };
  void _rev;
  void _system;
  return resto as Doc;
}

type Activo = {
  _id: string;
  _type: "sanity.imageAsset" | "sanity.fileAsset";
  url: string;
  extension: string;
  mimeType: string;
  size: number;
  sha1hash: string;
  originalFilename: string | null;
  metadata?: { dimensions?: { width: number; height: number; aspectRatio: number } };
};

async function copiarImagen(a: Activo): Promise<Activo> {
  const { width: ancho, height: alto } = a.metadata!.dimensions!;
  const nombre = `${a.sha1hash}-${ancho}x${alto}`;
  const completa = path.join(DIR_MEDIA, `${nombre}.webp`);
  const yaEsta = existsSync(completa) && readdirSync(DIR_ORIGINALES).some((f) => f.startsWith(`${nombre}.`));

  if (!yaEsta) {
    // La CDN de Sanity no entrega el archivo byte a byte como se subió: lo
    // vuelve a codificar (y a los WebP los entrega como PNG sin pérdida si el
    // pedido no acepta WebP). Por eso se pide sin «Accept» (la mejor calidad
    // disponible) y se comprueban las medidas en vez de la huella sha1.
    const r = await fetch(a.url);
    if (!r.ok) throw new Error(`No se pudo bajar ${a.url}: ${r.status}`);
    const bytes = Buffer.from(await r.arrayBuffer());
    const tipo = r.headers.get("content-type") ?? "";
    const ext = tipo.includes("png") ? "png" : tipo.includes("jpeg") ? "jpg" : tipo.includes("webp") ? "webp" : a.extension;
    writeFileSync(path.join(DIR_ORIGINALES, `${nombre}.${ext}`), bytes);

    // Medidas ya enderezadas (orientación EXIF 5 a 8 = foto girada 90°), como las informa Sanity.
    const info = await sharp(bytes).metadata();
    const girada = (info.orientation ?? 1) >= 5;
    const [w, h] = girada ? [info.height, info.width] : [info.width, info.height];
    if (w !== ancho || h !== alto) throw new Error(`${a._id} mide ${w}x${h} y Sanity dice ${ancho}x${alto}`);

    const carpeta = path.join(DIR_MEDIA, nombre);
    rmSync(carpeta, { recursive: true, force: true });
    mkdirSync(carpeta, { recursive: true });
    await sharp(bytes).rotate().webp({ quality: 85 }).toFile(completa);
    for (const n of anchosParaGenerar(ancho)) {
      await sharp(bytes).rotate().resize({ width: n }).webp({ quality: 80 }).toFile(path.join(carpeta, `w${n}.webp`));
    }
  }

  return { ...a, url: `/media/${nombre}.webp`, extension: "webp", mimeType: "image/webp" };
}

async function principal() {
  console.log(`Leyendo Sanity (${PROYECTO}/${CONJUNTO})…`);
  const docs = (
    await consultar<Doc[]>(
      `*[!(_type match "system.*") && !(_type match "sanity.*") && !(_id in path("drafts.**"))] | order(_id asc)`
    )
  ).map(limpiar);

  const tipos = new Set(docs.map((d) => d._type));
  const conocidos = new Set([...UNICOS, ...Object.keys(COLECCIONES)]);
  const raros = [...tipos].filter((t) => !conocidos.has(t));
  if (raros.length) throw new Error(`Hay tipos de documento que esta copia no conoce: ${raros.join(", ")}`);

  const ids = [...referencias(docs)].sort();
  const activos = await consultar<Activo[]>(
    `*[_id in $ids]{ _id, _type, url, extension, mimeType, size, sha1hash, originalFilename, metadata{ dimensions{ width, height, aspectRatio } } } | order(_id asc)`,
    { ids }
  );
  const faltan = ids.filter((id) => !activos.some((a) => a._id === id));
  if (faltan.length) throw new Error(`Referencias a archivos que no existen en Sanity: ${faltan.join(", ")}`);

  mkdirSync(DIR_CONTENIDO, { recursive: true });
  mkdirSync(DIR_MEDIA, { recursive: true });
  mkdirSync(DIR_ORIGINALES, { recursive: true });

  const copiados: Activo[] = [];
  let i = 0;
  for (const a of activos) {
    i++;
    if (a._type === "sanity.imageAsset") {
      process.stdout.write(`\r  imágenes ${i}/${activos.length}   `);
      copiados.push(await copiarImagen(a));
    } else {
      copiados.push(a); // videos: siguen en Sanity hasta la etapa 3 (R2)
    }
  }
  process.stdout.write("\n");

  // Imágenes que ya no se usan: se borran para no publicar basura.
  const enUso = new Set(copiados.filter((a) => a._type === "sanity.imageAsset").map((a) => a.url.replace(/^\/media\/|\.webp$/g, "")));
  for (const entrada of readdirSync(DIR_MEDIA)) {
    const nombre = entrada.replace(/\.webp$/, "");
    if (!enUso.has(nombre)) rmSync(path.join(DIR_MEDIA, entrada), { recursive: true, force: true });
  }

  for (const id of UNICOS) {
    const d = docs.find((x) => x._id === id);
    if (!d) throw new Error(`Falta el documento único ${id}`);
    escribirJson(`${id}.json`, d);
  }
  for (const [tipo, archivo] of Object.entries(COLECCIONES)) {
    escribirJson(`${archivo}.json`, docs.filter((d) => d._type === tipo));
  }
  escribirJson("archivos.json", copiados);

  const resumen = [...tipos].sort().map((t) => `${t}: ${docs.filter((d) => d._type === t).length}`);
  const imagenes = copiados.filter((a) => a._type === "sanity.imageAsset").length;
  console.log(`Listo. ${docs.length} documentos (${resumen.join(", ")}), ${imagenes} imágenes, ${copiados.length - imagenes} videos (siguen en Sanity).`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
