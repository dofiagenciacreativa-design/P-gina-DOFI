/**
 * Nombres y límites de los videos del panel. Sin dependencias: lo usan el
 * Worker (src/lib/panel/media.ts) y el navegador (src/panel/archivos/subir-video.ts).
 */

export const NOMBRE_DE_VIDEO = /^[a-f0-9]{40}\.(mp4|webm|mov)$/;
/** Videos que se suben desde el panel: hasta 200 MB, en partes de 20 MB (el Worker acepta hasta 100 MB por pedido). */
export const VIDEO_MAXIMO = 200 * 1024 * 1024;
export const PARTE_DE_VIDEO = 20 * 1024 * 1024;
export const claveDeVideo = (nombre: string) => `videos/${nombre}`;
export const TIPO_DE_VIDEO: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };
