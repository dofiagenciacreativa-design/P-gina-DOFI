"use client";

import type { Doc } from "@/lib/contenido/tipos";
import { PARTE_DE_VIDEO, VIDEO_MAXIMO } from "@/lib/panel/videos";

/**
 * «Cambiar video» (docs/panel-propio/plan-etapa-4.md): el navegador calcula
 * el SHA-1 del archivo y lo sube a R2 en partes de 20 MB por
 * /api/admin/videos/subir. Queda en /videos/<sha1>.<ext>, así que se ve
 * enseguida en la vista previa; el documento lo usa al publicar.
 */

export type VideoNuevo = {
  /** Documento sanity.fileAsset para contenido/archivos.json, con su url definitiva (/videos/…). */
  activo: Doc & { url: string; sha1hash: string; extension: string; mimeType: string; originalFilename: string; size: number };
};

const TIPOS: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };

const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");

async function pedir<T>(cuerpo: unknown): Promise<T> {
  const r = await fetch("/api/admin/videos/subir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error ?? "No se pudo subir el video.");
  return j;
}

async function subirParte(nombre: string, uploadId: string, numero: number, trozo: Blob): Promise<{ partNumber: number; etag: string }> {
  let ultimo: unknown;
  for (let intento = 0; intento < 3; intento++) {
    try {
      const r = await fetch(`/api/admin/videos/subir?nombre=${nombre}&uploadId=${encodeURIComponent(uploadId)}&parte=${numero}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: trozo,
      });
      const j = (await r.json().catch(() => ({}))) as { partNumber?: number; etag?: string; error?: string };
      if (r.ok && j.etag) return { partNumber: j.partNumber ?? numero, etag: j.etag };
      ultimo = new Error(j.error ?? "Se cortó la subida.");
      if (r.status === 401 || r.status === 403) break;
    } catch (e) {
      ultimo = e;
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error("Se cortó la subida.");
}

export async function subirVideo(archivo: File, alAvanzar: (texto: string) => void = () => {}): Promise<VideoNuevo> {
  const extension = TIPOS[archivo.type] ?? (/\.webm$/i.test(archivo.name) ? "webm" : /\.mp4$/i.test(archivo.name) ? "mp4" : null);
  if (!extension) throw new Error("Tiene que ser un video MP4 o WebM.");
  if (archivo.size > VIDEO_MAXIMO) throw new Error("El video pesa más de 200 MB. Comprímelo y vuelve a intentar.");

  alAvanzar("Preparando el video…");
  const sha1 = hex(await crypto.subtle.digest("SHA-1", await archivo.arrayBuffer()));
  const nombre = `${sha1}.${extension}`;

  const inicio = await pedir<{ existe?: boolean; uploadId?: string }>({ accion: "iniciar", nombre, tamano: archivo.size });
  if (!inicio.existe) {
    const uploadId = inicio.uploadId;
    if (!uploadId) throw new Error("Cloudflare no abrió la subida.");
    const total = Math.ceil(archivo.size / PARTE_DE_VIDEO);
    const partes: { partNumber: number; etag: string }[] = [];
    try {
      for (let i = 0; i < total; i++) {
        alAvanzar(`Subiendo… ${Math.round((i / total) * 100)} %`);
        partes.push(await subirParte(nombre, uploadId, i + 1, archivo.slice(i * PARTE_DE_VIDEO, (i + 1) * PARTE_DE_VIDEO)));
      }
      alAvanzar("Terminando…");
      await pedir({ accion: "terminar", nombre, uploadId, partes });
    } catch (e) {
      await pedir({ accion: "cancelar", nombre, uploadId }).catch(() => null);
      throw e;
    }
  }

  return {
    activo: {
      _id: `file-${sha1}-${extension}`,
      _type: "sanity.fileAsset",
      url: `/videos/${nombre}`,
      sha1hash: sha1,
      extension,
      mimeType: extension === "webm" ? "video/webm" : "video/mp4",
      originalFilename: archivo.name,
      size: archivo.size,
    },
  };
}
