import type { Metadata } from "next";
import { company } from "./company";
import { site } from "./site";

/**
 * SEO de cada pagina: titulo, descripcion, direccion oficial (canonical) e
 * imagen para compartir. Fuente unica: las paginas llaman a
 * `metadatosDePagina(PAGINAS.x)` y no escriben sus metadatos a mano.
 *
 * POR QUE (2026-11-23):
 *  - El layout declaraba `canonical: "/"` y ninguna pagina lo cambiaba, asi
 *    que TODAS las paginas le decian a Google «soy una copia del inicio».
 *    Con eso Google no indexa las paginas de servicios. Ahora cada pagina
 *    declara su propia direccion.
 *  - Ningun titulo ni descripcion decia «agencia de marketing» y la ciudad
 *    no salia en el titulo de ninguna pagina: justo lo que busca la gente
 *    («agencia de marketing en Cuenca»).
 *
 * Reglas para escribirlos: titulo de 60 caracteres o menos (Google corta el
 * resto), descripcion de 160 o menos, la frase importante al principio y
 * nada que la pagina no diga.
 */

export const IMAGEN_COMPARTIR = {
  url: "/og/dofi-agencia-marketing-cuenca.jpg",
  width: 1200,
  height: 630,
  alt: "DOFI, agencia de marketing digital en Cuenca, Ecuador",
} as const;

export type DatosPagina = {
  /** Ruta de la pagina, con barra inicial: "/", "/trafico-ads". */
  ruta: string;
  titulo: string;
  descripcion: string;
  /** false = la pagina no debe aparecer en Google (p. ej. «en construccion»). */
  indexar?: boolean;
  /** Imagen para compartir propia; si no, la general de DOFI. */
  imagen?: string;
};

export const PAGINAS = {
  inicio: {
    ruta: "/",
    titulo: "Agencia de Marketing Digital en Cuenca | DOFI",
    descripcion:
      "DOFI es una agencia de marketing digital en Cuenca, Ecuador: redes sociales que venden, pauta en Meta y TikTok, chatbots con IA y CRM. Ventas Inteligentes.",
  },
  marketingDigital: {
    ruta: "/marketing-digital",
    titulo: "Marketing Digital y Redes Sociales en Cuenca | DOFI",
    descripcion:
      "Tu equipo de marketing completo en Cuenca: estrategia, contenido, producción audiovisual y manejo de redes sociales para hacer crecer tu negocio.",
  },
  traficoAds: {
    ruta: "/trafico-ads",
    titulo: "Publicidad en Meta Ads, TikTok y Google Ads en Cuenca",
    descripcion:
      "Campañas de pauta en Meta Ads, TikTok Ads y Google Ads que llevan clientes a tu WhatsApp, medidas y optimizadas con datos. DOFI, Cuenca - Ecuador.",
  },
  chatbotsCrm: {
    ruta: "/chatbots-crm",
    titulo: "Chatbots con IA y CRM para WhatsApp | FENIAX by DOFI",
    descripcion:
      "FENIAX conecta tu WhatsApp, Instagram, Facebook y TikTok a un CRM con inteligencia artificial que responde al instante y da seguimiento a cada cliente.",
  },
  asesorias: {
    ruta: "/asesorias",
    titulo: "Asesorías de Negocio 1 a 1 en Cuenca | DOFI",
    descripcion:
      "Asesorías 1 a 1 con Dani: revisamos tu negocio, detectamos lo que frena tus ventas y sales con una ruta clara para crecer. Rescatando Emprendedores.",
  },
  contactanos: {
    ruta: "/contactanos",
    titulo: "Contacto | DOFI Agencia de Marketing en Cuenca",
    descripcion:
      "Cuéntanos qué necesita tu negocio y te escribimos por WhatsApp. Agencia de marketing digital en Cuenca, Ecuador: Padre Aguirre y Rafael María Arízaga.",
  },
  redes: {
    ruta: "/redes",
    titulo: "Nuestro trabajo en redes | DOFI Agencia de Marketing",
    descripcion: "Las redes de DOFI y de Daniel Vallejo: mira el contenido y las campañas que hacemos todos los días en Cuenca.",
  },
  clientes: {
    ruta: "/clientes",
    titulo: "Clientes | DOFI Agencia de Marketing en Cuenca",
    descripcion: "Las marcas de Cuenca que confían en DOFI.",
    indexar: false,
  },
  elSocio: {
    ruta: "/el-socio",
    titulo: "El Socio | DOFI Agencia de Marketing en Cuenca",
    descripcion: "Daniel Vallejo, El Socio de DOFI.",
    indexar: false,
  },
} as const satisfies Record<string, DatosPagina>;

/** Metadatos de Next para una pagina. */
export function metadatosDePagina(p: DatosPagina): Metadata {
  const imagen = p.imagen ? { url: p.imagen } : IMAGEN_COMPARTIR;
  return {
    // `absolute`: el titulo ya viene completo, sin plantilla del layout.
    title: { absolute: p.titulo },
    description: p.descripcion,
    // Direccion oficial solo con el dominio definitivo: en las vistas previas
    // (*.workers.dev) seria peor que ninguna. Ver src/config/site.ts.
    alternates: site.isIndexable ? { canonical: p.ruta } : undefined,
    // Solo se escribe cuando hay que esconder la pagina; si no, manda el
    // layout (que en las vistas previas ya pone noindex a todo).
    robots: p.indexar === false ? { index: false, follow: true } : undefined,
    openGraph: {
      title: p.titulo,
      description: p.descripcion,
      url: p.ruta,
      siteName: company.name,
      locale: "es_EC",
      type: "website",
      images: [imagen],
    },
    twitter: {
      card: "summary_large_image",
      title: p.titulo,
      description: p.descripcion,
      images: [imagen.url],
    },
  };
}
