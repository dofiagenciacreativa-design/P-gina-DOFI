import type { Doc } from "./tipos";
import paginaInicio from "../../../contenido/paginaInicio.json";
import hero from "../../../contenido/hero.json";
import banners from "../../../contenido/banners.json";
import marketingDigitalPage from "../../../contenido/marketingDigitalPage.json";
import traficoAdsPage from "../../../contenido/traficoAdsPage.json";
import chatbotsCrmPage from "../../../contenido/chatbotsCrmPage.json";
import asesoriasPage from "../../../contenido/asesoriasPage.json";
import cuentas from "../../../contenido/cuentas.json";
import contenidos from "../../../contenido/contenidos.json";
import servicios from "../../../contenido/servicios.json";
import resenas from "../../../contenido/resenas.json";
import archivos from "../../../contenido/archivos.json";

/**
 * Todo el contenido de la web guardado en el repositorio (carpeta
 * contenido/), como una sola lista de documentos con la misma forma que en
 * Sanity, más los documentos de los activos (imágenes y videos).
 *
 * Importaciones estáticas a propósito: el contenido queda dentro del paquete
 * al construir y no hace falta red, clave ni sistema de archivos para leerlo.
 * Lo escribe `npm run contenido:copiar` (y, desde la etapa 3, el panel).
 */
const lista = (x: unknown) => x as unknown as Doc[];
const uno = (x: unknown) => [x as unknown as Doc];

export const CONJUNTO: Doc[] = [
  ...uno(paginaInicio),
  ...uno(hero),
  ...uno(banners),
  ...uno(marketingDigitalPage),
  ...uno(traficoAdsPage),
  ...uno(chatbotsCrmPage),
  ...uno(asesoriasPage),
  ...lista(cuentas),
  ...lista(contenidos),
  ...lista(servicios),
  ...lista(resenas),
  ...lista(archivos),
];
