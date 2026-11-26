/**
 * Imágenes del contenido guardado en el repositorio (etapa 2 del panel,
 * docs/panel-propio/plan-etapa-2.md).
 *
 *   /media/<sha1>-<ancho>x<alto>.webp           la imagen completa, en WebP
 *   /media/<sha1>-<ancho>x<alto>/w<N>.webp      variantes más angostas
 *
 * El ancho del original va en el nombre: así cualquiera (el cargador de
 * next/image, el panel) sabe qué variantes existen sin consultar nada.
 */

export const ANCHOS_VARIANTE = [160, 320, 480, 640, 828, 1080, 1200, 1600, 1920, 2400] as const;

/** Los anchos de variante que se generan para una imagen: solo los más angostos que el original. */
export function anchosParaGenerar(anchoOriginal: number): number[] {
  return ANCHOS_VARIANTE.filter((a) => a < anchoOriginal);
}

/** La variante más angosta que sea >= pedido; null = usar la imagen completa. */
export function elegirVariante(variantes: readonly number[], pedido: number | null): number | null {
  if (!pedido || pedido <= 0) return null;
  const candidatas = variantes.filter((v) => v >= pedido).sort((a, b) => a - b);
  return candidatas[0] ?? null;
}

const MEDIA = /^\/media\/([a-f0-9]{40})-(\d+)x(\d+)\.webp$/;

/** Si la dirección es una imagen de /media, sus datos; si no, null. */
export function leerDireccionMedia(ruta: string): { sha1: string; ancho: number; alto: number; base: string } | null {
  const m = MEDIA.exec(ruta);
  if (!m) return null;
  const [, sha1, ancho, alto] = m;
  return { sha1, ancho: Number(ancho), alto: Number(alto), base: `/media/${sha1}-${ancho}x${alto}` };
}

/** La dirección del archivo a servir para un ancho pedido (variante o imagen completa). */
export function direccionParaAncho(ruta: string, pedido: number): string | null {
  const d = leerDireccionMedia(ruta);
  if (!d) return null;
  const variante = elegirVariante(anchosParaGenerar(d.ancho), pedido);
  return variante ? `${d.base}/w${variante}.webp` : `${d.base}.webp`;
}
