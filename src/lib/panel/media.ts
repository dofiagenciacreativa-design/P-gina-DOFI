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

/** Una subida por partes de R2 (videos grandes: cada parte pasa por el Worker sin leerse). */
export type SubidaPorPartes = {
  uploadId: string;
  uploadPart(numero: number, valor: ReadableStream | ArrayBuffer): Promise<{ partNumber: number; etag: string }>;
  complete(partes: { partNumber: number; etag: string }[]): Promise<ObjetoR2>;
  abort(): Promise<void>;
};

export type AlmacenR2 = {
  get(clave: string, opciones?: { range?: Headers }): Promise<ObjetoR2 | null>;
  head(clave: string): Promise<ObjetoR2 | null>;
  put(clave: string, valor: ReadableStream | ArrayBuffer | null, opciones?: { httpMetadata?: { contentType?: string } }): Promise<ObjetoR2>;
  createMultipartUpload(clave: string, opciones?: { httpMetadata?: { contentType?: string } }): Promise<SubidaPorPartes>;
  resumeMultipartUpload(clave: string, uploadId: string): SubidaPorPartes;
};

export function almacenDeVideos(): AlmacenR2 | null {
  try {
    const env = getCloudflareContext().env as unknown as { MEDIA?: AlmacenR2 };
    return env.MEDIA ?? null;
  } catch {
    return null;
  }
}

export { NOMBRE_DE_VIDEO, PARTE_DE_VIDEO, TIPO_DE_VIDEO, VIDEO_MAXIMO, claveDeVideo } from "./videos";
