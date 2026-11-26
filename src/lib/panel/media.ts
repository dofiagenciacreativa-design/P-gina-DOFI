import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * El almacén R2 de los videos (enlace MEDIA del Worker: «dofi-media» en
 * producción, «dofi-media-pruebas» en las vistas previas). Solo lo que usa
 * el panel; los tipos completos están en @cloudflare/workers-types.
 */

export type ObjetoR2 = {
  size: number;
  etag: string;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
  range?: { offset?: number; length?: number };
  body?: ReadableStream;
};

export type AlmacenR2 = {
  get(clave: string, opciones?: { range?: Headers }): Promise<ObjetoR2 | null>;
  head(clave: string): Promise<ObjetoR2 | null>;
  put(clave: string, valor: ReadableStream | ArrayBuffer | null, opciones?: { httpMetadata?: { contentType?: string } }): Promise<ObjetoR2>;
};

export function almacenDeVideos(): AlmacenR2 | null {
  try {
    const env = getCloudflareContext().env as unknown as { MEDIA?: AlmacenR2 };
    return env.MEDIA ?? null;
  } catch {
    return null;
  }
}

export const NOMBRE_DE_VIDEO = /^[a-f0-9]{40}\.(mp4|webm|mov)$/;
export const claveDeVideo = (nombre: string) => `videos/${nombre}`;
export const TIPO_DE_VIDEO: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };
