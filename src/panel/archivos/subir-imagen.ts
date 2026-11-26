"use client";

import type { Doc } from "@/lib/contenido/tipos";
import { anchosParaGenerar } from "@/lib/contenido/medios";

/**
 * «Cambiar foto» (docs/panel-propio/plan-etapa-3.md): todo el trabajo pesado
 * lo hace el navegador. Genera el WebP a tamaño completo y sus variantes,
 * sube cada archivo a GitHub como blob (por /api/admin/blob, que lo reenvía
 * sin leerlo) y devuelve el documento de la foto nueva. Nada queda en la web
 * hasta pulsar «Publicar cambios».
 */

export type FotoNueva = {
  /** Documento sanity.imageAsset para contenido/archivos.json, con su url definitiva (/media/…). */
  activo: Doc & { url: string; metadata: { dimensions: { width: number; height: number; aspectRatio: number } } };
  /** Los blobs ya subidos y dónde van en el repositorio. */
  medios: { ruta: string; blob: string }[];
  /** Una versión chica en data: URL para ver la foto en la vista previa antes de publicar. */
  vistaPrevia: string;
};

const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAXIMO = 15 * 1024 * 1024;

const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");

function aBase64(datos: Blob): Promise<string> {
  return new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(String(lector.result).replace(/^data:[^,]*,/, ""));
    lector.onerror = () => mal(lector.error);
    lector.readAsDataURL(datos);
  });
}

function aDataUrl(datos: Blob): Promise<string> {
  return new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(String(lector.result));
    lector.onerror = () => mal(lector.error);
    lector.readAsDataURL(datos);
  });
}

async function aWebp(imagen: ImageBitmap, ancho: number, calidad: number): Promise<Blob> {
  const alto = Math.round((imagen.height * ancho) / imagen.width);
  const lienzo = new OffscreenCanvas(ancho, alto);
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("Este navegador no puede preparar la foto.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imagen, 0, 0, ancho, alto);
  const blob = await lienzo.convertToBlob({ type: "image/webp", quality: calidad });
  if (blob.type !== "image/webp") throw new Error("Este navegador no sabe crear fotos WebP. Usa Chrome, Brave o Edge para cambiar fotos.");
  return blob;
}

async function subirBlob(datos: Blob): Promise<string> {
  const r = await fetch("/api/admin/blob", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: await aBase64(datos), encoding: "base64" }),
  });
  const j = (await r.json().catch(() => ({}))) as { sha?: string; error?: string };
  if (!r.ok || !j.sha) throw new Error(j.error ?? "No se pudo subir la foto.");
  return j.sha;
}

export async function subirImagen(archivo: File, alAvanzar?: (texto: string) => void): Promise<FotoNueva> {
  const ext = TIPOS[archivo.type];
  if (!ext) throw new Error("Esa foto no se puede usar: tiene que ser JPG, PNG, WebP o GIF.");
  if (archivo.size > MAXIMO) throw new Error("La foto pesa más de 15 MB. Achícala un poco y vuelve a intentar.");

  alAvanzar?.("Preparando la foto…");
  const bytes = await archivo.arrayBuffer();
  const sha1 = hex(await crypto.subtle.digest("SHA-1", bytes));
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const { width: ancho, height: alto } = imagen;
  const nombre = `${sha1}-${ancho}x${alto}`;

  const piezas: { ruta: string; datos: Blob }[] = [
    { ruta: `media-originales/${nombre}.${ext}`, datos: archivo },
    { ruta: `public/media/${nombre}.webp`, datos: await aWebp(imagen, ancho, 0.85) },
  ];
  for (const n of anchosParaGenerar(ancho)) piezas.push({ ruta: `public/media/${nombre}/w${n}.webp`, datos: await aWebp(imagen, n, 0.8) });
  const chica = await aWebp(imagen, Math.min(ancho, 828), 0.8);
  imagen.close();

  const medios: FotoNueva["medios"] = [];
  for (const [i, p] of piezas.entries()) {
    alAvanzar?.(`Subiendo la foto (${i + 1} de ${piezas.length})…`);
    medios.push({ ruta: p.ruta, blob: await subirBlob(p.datos) });
  }

  return {
    activo: {
      _id: `image-${nombre}-${ext}`,
      _type: "sanity.imageAsset",
      url: `/media/${nombre}.webp`,
      extension: "webp",
      mimeType: "image/webp",
      originalFilename: archivo.name,
      sha1hash: sha1,
      size: archivo.size,
      metadata: { dimensions: { width: ancho, height: alto, aspectRatio: ancho / alto } },
    },
    medios,
    vistaPrevia: await aDataUrl(chica),
  };
}
