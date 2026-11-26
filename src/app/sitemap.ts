import type { MetadataRoute } from "next";
import { getAllActiveSlugs } from "@/lib/consultas";
import { absoluteUrl } from "@/config/site";
import { PAGINAS, type DatosPagina } from "@/config/seo";

/** Cuanto pesa cada pagina dentro del sitio (de 0 a 1). */
const PRIORIDAD: Record<string, number> = {
  "/": 1,
  "/marketing-digital": 0.9,
  "/trafico-ads": 0.9,
  "/chatbots-crm": 0.9,
  "/asesorias": 0.8,
  "/contactanos": 0.7,
  "/redes": 0.4,
};

/**
 * /sitemap.xml
 *
 * Antes devolvia 404: las 27 URLs publicas no tenian ninguna ruta de
 * descubrimiento declarada.
 *
 * Se genera con la MISMA fuente que alimenta generateStaticParams() en
 * /clientes/[slug] (getAllActiveSlugs(), ver src/lib/sanity.ts), asi el
 * sitemap no puede declarar una pagina que no existe ni omitir una que si.
 * Las cuentas inactivas quedan fuera a proposito.
 *
 * Deliberadamente fuera: /api/*, rutas internas y cualquier cosa no
 * navegable.
 *
 * OJO: en staging el sitemap se genera igual (es util para verificar que
 * funciona), pero robots.ts NO lo declara y el sitio va con noindex. No
 * enviar este sitemap a Search Console hasta que exista el dominio
 * definitivo en NEXT_PUBLIC_SITE_URL.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();
  const slugs = await getAllActiveSlugs();

  // Las paginas de servicios no estaban (2026-11-23): Google solo conocia el
  // inicio y los clientes. Van todas las de src/config/seo.ts que se pueden
  // indexar; las «en construccion» (indexar: false) quedan fuera.
  const paginas = Object.values(PAGINAS as Record<string, DatosPagina>)
    .filter((p) => p.indexar !== false)
    .map((p) => ({
      url: absoluteUrl(p.ruta),
      lastModified: ahora,
      changeFrequency: "monthly" as const,
      priority: PRIORIDAD[p.ruta] ?? 0.5,
    }));

  return [
    ...paginas,
    ...slugs.map((slug) => ({
      url: absoluteUrl(`/clientes/${slug}`),
      lastModified: ahora,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
