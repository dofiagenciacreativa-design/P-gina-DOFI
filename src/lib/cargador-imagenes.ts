import { direccionParaAncho } from "./contenido/medios";

/**
 * Cargador de imágenes de next/image (next.config.ts → images.loaderFile).
 *
 * POR QUÉ (2026-10-28, «los banners del Home no cargan rápido"): en Cloudflare
 * el optimizador de Next (/_next/image) no está activo -- OpenNext lo hace con
 * el servicio Cloudflare Images, que este proyecto no tiene enlazado -- y
 * devolvía el ARCHIVO ORIGINAL (la foto del hero, un PNG de 1676x939, bajaba
 * con 6,2 MB, y dos veces).
 *
 * Las fotos del contenido (/media/…) ya se guardan como WebP en varios anchos
 * (src/lib/contenido/medios.ts): este cargador elige, para cada ancho del
 * srcset, la variante más angosta que alcance. El navegador baja solo esa.
 *
 * Las demás imágenes del propio sitio (/public) se sirven tal cual: ya se
 * guardan en el tamaño en que se usan (ver los logos livianos en public/).
 */
export default function cargadorImagenes({ src, width }: { src: string; width: number; quality?: number }) {
  // Contenido guardado en el repositorio (etapa 2 del panel): la variante
  // WebP ya generada más angosta que alcance, o la imagen completa. Se
  // ignoran ?w, ?h, ?auto y ?q que traen las consultas: el tamaño lo decide
  // `width`. Ver src/lib/contenido/medios.ts.
  if (src.startsWith("/media/")) return direccionParaAncho(src.split("?")[0], width) ?? src;

  // Foto nueva del panel, todavía sin publicar (vista previa): se usa tal cual.
  if (src.startsWith("data:") || src.startsWith("blob:")) return src.split("?")[0];

  return src;
}
