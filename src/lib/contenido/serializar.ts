/**
 * Cómo se escriben los archivos de contenido/ (lo usan la copia desde Sanity
 * y el panel al publicar): JSON con las claves ordenadas, dos espacios y un
 * salto de línea final. El mismo contenido da siempre el mismo archivo, así
 * que en git solo aparece lo que de verdad cambió.
 */

export function ordenarClaves(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(ordenarClaves);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.keys(v as object)
        .sort()
        .map((k) => [k, ordenarClaves((v as Record<string, unknown>)[k])])
    );
  }
  return v;
}

export const serializarJson = (v: unknown): string => JSON.stringify(ordenarClaves(v), null, 2) + "\n";

/** Los documentos únicos y su archivo. Las colecciones (cuentas, reseñas…) llegan con la etapa 5. */
export const ARCHIVO_DE_DOCUMENTO: Record<string, string> = {
  paginaInicio: "contenido/paginaInicio.json",
  hero: "contenido/hero.json",
  banners: "contenido/banners.json",
  marketingDigitalPage: "contenido/marketingDigitalPage.json",
  traficoAdsPage: "contenido/traficoAdsPage.json",
  chatbotsCrmPage: "contenido/chatbotsCrmPage.json",
  asesoriasPage: "contenido/asesoriasPage.json",
};

export const ARCHIVO_DE_ACTIVOS = "contenido/archivos.json";

/** Rutas en las que el panel puede escribir archivos (blobs). */
const RUTAS_DE_MEDIOS = [
  /^public\/media\/[a-f0-9]{40}-\d+x\d+\.webp$/,
  /^public\/media\/[a-f0-9]{40}-\d+x\d+\/w\d+\.webp$/,
  /^media-originales\/[a-f0-9]{40}-\d+x\d+\.(png|jpg|jpeg|webp|gif)$/,
];
export const rutaDeMedioPermitida = (ruta: string) => RUTAS_DE_MEDIOS.some((r) => r.test(ruta));
