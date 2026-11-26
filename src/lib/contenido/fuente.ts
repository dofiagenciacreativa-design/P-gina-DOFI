/**
 * De dónde lee la web su contenido al construirse:
 *  - "sanity"   (por defecto): la API de Sanity, como hasta ahora;
 *  - "archivos": los archivos del repositorio (carpeta contenido/).
 *
 * Se elige con la variable CONTENT_SOURCE (en .env.production). En `main`
 * sigue en Sanity hasta la etapa 6 del panel; scripts/cf-deploy.mjs impide
 * construir `main` con «archivos» antes de tiempo.
 */
export type Fuente = "sanity" | "archivos";

export function fuenteActual(): Fuente {
  return process.env.CONTENT_SOURCE === "archivos" ? "archivos" : "sanity";
}
