/**
 * Ajuste de un solo uso en Sanity (pedido del 2026-11-23):
 *
 *  HOME, banners de Redes, Pauta y ChatBots/CRM: la «Foto de primer plano»
 *  pasa a ser la que tiene la foto real de Daniel (public/home/
 *  banner-<escena>-foto.webp). En las anteriores la persona central había
 *  quedado con la cara cambiada por una edición con IA.
 *
 *  Solo cambia la referencia a la imagen de esos tres banners: no toca el
 *  botón, el texto, el orden ni el banner de Asesorías. Las fotos anteriores
 *  siguen en Sanity (se puede volver atrás con la copia de seguridad).
 *
 *  Si el documento tiene un BORRADOR sin publicar, también le pone las fotos
 *  nuevas (si no, al publicarlo desde el Studio volverían las viejas) y
 *  avisa en qué más se diferencia de lo publicado.
 *
 * Seguro de repetir: si un banner ya tiene la foto nueva, no lo toca. Antes
 * de escribir guarda una copia en audit/backup-banners-antes-de-fotos-daniel-
 * 2026-11-23.json. Sin --aplicar solo muestra lo que haría. Para --aplicar
 * hace falta SANITY_WRITE_TOKEN en .env.local.
 *
 * Uso: npx tsx --env-file=.env.local scripts/ajustar-2026-11-23-fotos-banners.mts [--aplicar]
 */
import { createClient } from "@sanity/client";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
const aplicar = process.argv.includes("--aplicar");

if (!projectId || !dataset || (aplicar && !token)) {
  console.error("Faltan SANITY_PROJECT_ID, SANITY_DATASET o (para --aplicar) SANITY_WRITE_TOKEN en .env.local");
  process.exit(1);
}

// Con token se leen tambien los borradores; sin token, solo lo publicado.
const client = createClient({ projectId, dataset, token: token || undefined, apiVersion: "2024-01-01", useCdn: false });
const raiz = process.cwd();
const ESCENAS = ["redes", "pauta", "crm"] as const;

type Imagen = { _type?: string; asset?: { _ref?: string }; hotspot?: unknown; crop?: unknown } | undefined;
type Banner = { _key: string; escena?: string; fotoPrimerPlano?: Imagen };
type Doc = { _id: string; _rev: string; seccionesContenido?: Banner[] } & Record<string, unknown>;

/** El id que Sanity le da a una imagen sale de su contenido (sha1) y su tamaño:
 *  sirve para saber, sin subir nada, si la foto nueva ya esta puesta. */
function huella(archivo: string) {
  return crypto.createHash("sha1").update(fs.readFileSync(archivo)).digest("hex");
}

const publicado = (await client.getDocument("banners")) as Doc | undefined;
if (!publicado?.seccionesContenido) {
  console.error("No existe el documento «banners» o no tiene banners.");
  process.exit(1);
}
const borrador = token ? ((await client.getDocument("drafts.banners")) as Doc | undefined) : undefined;

console.log(`banners (publicado, rev ${publicado._rev.slice(0, 6)})${borrador ? " + borrador sin publicar" : ""}${aplicar ? "" : "   [simulacion: nada se escribe]"}`);

let respaldado = false;
function respaldar() {
  if (respaldado) return;
  respaldado = true;
  const destino = path.join(raiz, "audit", "backup-banners-antes-de-fotos-daniel-2026-11-23.json");
  if (!fs.existsSync(destino)) fs.writeFileSync(destino, JSON.stringify(publicado, null, 2));
  console.log(`  Copia del documento anterior: ${path.relative(raiz, destino)}`);
  if (borrador) {
    const d2 = path.join(raiz, "audit", "backup-banners-borrador-antes-de-fotos-daniel-2026-11-23.json");
    fs.writeFileSync(d2, JSON.stringify(borrador, null, 2));
    console.log(`  Copia del borrador anterior: ${path.relative(raiz, d2)}`);
  }
}

let cambios = 0;
for (const escena of ESCENAS) {
  const archivo = path.join(raiz, "public", "home", `banner-${escena}-foto.webp`);
  const sha = huella(archivo);
  const banner = publicado.seccionesContenido.find((b) => b.escena === escena);
  if (!banner) {
    console.log(`  ${escena}: no hay banner con esa escena, se omite.`);
    continue;
  }
  const actual = banner.fotoPrimerPlano?.asset?._ref ?? "";
  if (actual.includes(sha)) {
    console.log(`  ${escena}: ya tiene la foto nueva, no se toca.`);
    continue;
  }
  cambios += 1;
  console.log(`  ${escena}: foto de primer plano -> banner-${escena}-foto.webp (${Math.round(fs.statSync(archivo).size / 1024)} KB). Antes: ${actual || "(ninguna)"}`);
  if (!aplicar) continue;

  respaldar();
  const asset = await client.assets.upload("image", fs.readFileSync(archivo), {
    filename: `banner-${escena}-daniel.webp`,
    contentType: "image/webp",
  });
  console.log(`    Imagen subida: ${asset._id} (${asset.metadata?.dimensions?.width} x ${asset.metadata?.dimensions?.height})`);
  const foto = { _type: "image", asset: { _type: "reference", _ref: asset._id } };
  const r = await client.patch("banners").set({ [`seccionesContenido[_key=="${banner._key}"].fotoPrimerPlano`]: foto }).commit();
  console.log(`    Publicado. rev: ${r._rev}`);
  if (borrador?.seccionesContenido?.some((b) => b._key === banner._key)) {
    await client.patch("drafts.banners").set({ [`seccionesContenido[_key=="${banner._key}"].fotoPrimerPlano`]: foto }).commit();
    console.log("    Tambien en el borrador.");
  }
}

if (borrador) {
  // Para decidir despues que hacer con el borrador: en que se diferencia de lo publicado.
  const limpio = (o: unknown) => JSON.stringify(o, (k, v) => (["_rev", "_updatedAt", "_createdAt", "_id"].includes(k) ? undefined : v));
  const dif: string[] = [];
  for (const b of publicado.seccionesContenido) {
    const otro = borrador.seccionesContenido?.find((x) => x._key === b._key) as Record<string, unknown> | undefined;
    if (!otro) {
      dif.push(`${b.escena}: no esta en el borrador`);
      continue;
    }
    for (const campo of new Set([...Object.keys(b), ...Object.keys(otro)])) {
      if (campo === "fotoPrimerPlano" && (ESCENAS as readonly string[]).includes(b.escena ?? "")) continue;
      if (limpio((b as Record<string, unknown>)[campo]) !== limpio(otro[campo])) dif.push(`${b.escena}.${campo}`);
    }
  }
  console.log(
    dif.length
      ? `\nAVISO: el borrador sin publicar (del Studio) difiere de lo publicado en: ${dif.join(", ")}.\n  Si se publica ese borrador desde el Studio, esos campos vuelven a como estaban en el borrador.`
      : "\nEl borrador sin publicar no tiene otras diferencias con lo publicado."
  );
}

console.log(cambios === 0 ? "\nNada que cambiar." : aplicar ? `\nListo: ${cambios} foto(s) cambiada(s).` : `\nSe cambiarian ${cambios} foto(s). Para aplicarlo: agregar --aplicar.`);
