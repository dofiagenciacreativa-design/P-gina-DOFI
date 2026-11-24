import { company, perfilesRedes } from "@/config/company";
import { IMAGEN_COMPARTIR, PAGINAS } from "@/config/seo";
import { absoluteUrl, site } from "@/config/site";

/**
 * Datos estructurados (schema.org, JSON-LD): la ficha del negocio escrita
 * para maquinas. Google la usa para el panel del negocio y las busquedas
 * locales («agencia de marketing en Cuenca»), y los buscadores con IA
 * (ChatGPT, Perplexity, Gemini) para entender quien es DOFI, donde esta y
 * que hace.
 *
 * Todo sale de src/config/company.ts y src/config/seo.ts: si cambia un dato
 * de la empresa, cambia aca solo. No se declara nada que la web no diga
 * (ni precios, ni calificaciones, ni premios).
 */

const ID_NEGOCIO = `${site.url}/#negocio`;
const ID_SITIO = `${site.url}/#sitio`;

/** Ubicacion de la ficha «Dofi Agencia Creativa» de Google Maps
 *  (la de company.location.mapsUrl). */
const COORDENADAS = { latitude: -2.8902594, longitude: -79.0045122 } as const;

type Servicio = { nombre: string; tipo: string; descripcion: string; ruta: string };

/** Los servicios, cada uno con su pagina. */
export const SERVICIOS = {
  marketingDigital: {
    nombre: "Marketing digital y manejo de redes sociales",
    tipo: "Marketing digital",
    descripcion: PAGINAS.marketingDigital.descripcion,
    ruta: PAGINAS.marketingDigital.ruta,
  },
  traficoAds: {
    nombre: "Publicidad pagada en Meta Ads, TikTok Ads y Google Ads",
    tipo: "Publicidad digital",
    descripcion: PAGINAS.traficoAds.descripcion,
    ruta: PAGINAS.traficoAds.ruta,
  },
  chatbotsCrm: {
    nombre: "FENIAX: chatbots con inteligencia artificial y CRM",
    tipo: "Automatización de ventas con IA",
    descripcion: PAGINAS.chatbotsCrm.descripcion,
    ruta: PAGINAS.chatbotsCrm.ruta,
  },
  asesorias: {
    nombre: "Asesorías de negocio 1 a 1 · Rescatando Emprendedores",
    tipo: "Consultoría de negocios",
    descripcion: PAGINAS.asesorias.descripcion,
    ruta: PAGINAS.asesorias.ruta,
  },
} as const satisfies Record<string, Servicio>;

const zonaDeServicio = [
  { "@type": "City", name: "Cuenca" },
  { "@type": "Country", name: "Ecuador" },
];

/** La ficha del negocio. Va en todas las paginas (layout). */
export function datosDelNegocio() {
  const redes = [company.social.facebook, company.social.instagram, company.social.tiktok, company.social.linkedin].filter(
    (r): r is string => Boolean(r)
  );
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": ID_NEGOCIO,
    name: company.name,
    alternateName: ["DOFI", "Dofi Agencia Creativa"],
    description:
      "Agencia de marketing digital en Cuenca, Ecuador. Manejo de redes sociales, producción de contenido, publicidad en Meta Ads, TikTok Ads y Google Ads, chatbots con inteligencia artificial y CRM (FENIAX), y asesorías de negocio 1 a 1.",
    slogan: company.tagline,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo-dofi.png"),
    image: absoluteUrl(IMAGEN_COMPARTIR.url),
    telephone: `+${company.phone.e164}`,
    email: company.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.location.address,
      addressLocality: company.location.city,
      addressRegion: company.location.region,
      addressCountry: company.location.countryCode,
    },
    geo: { "@type": "GeoCoordinates", ...COORDENADAS },
    hasMap: company.location.mapsUrl,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "17:30",
      },
    ],
    areaServed: zonaDeServicio,
    knowsAbout: [
      "Marketing digital",
      "Manejo de redes sociales",
      "Producción audiovisual",
      "Meta Ads",
      "TikTok Ads",
      "Google Ads",
      "Chatbots con inteligencia artificial",
      "CRM",
      "Automatización de ventas por WhatsApp",
    ],
    sameAs: redes,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "ventas",
      telephone: `+${company.phone.e164}`,
      email: company.email,
      areaServed: "EC",
      availableLanguage: "es",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de DOFI",
      itemListElement: Object.values(SERVICIOS).map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.nombre, url: absoluteUrl(s.ruta) },
      })),
    },
    member: perfilesRedes.some((p) => p.nombre.startsWith("Daniel Vallejo"))
      ? [
          {
            "@type": "Person",
            name: "Daniel Vallejo",
            jobTitle: "El Socio",
            sameAs: perfilesRedes.filter((p) => p.nombre.startsWith("Daniel Vallejo")).map((p) => p.href),
          },
        ]
      : undefined,
  };
}

/** El sitio web en si. Va en todas las paginas (layout). */
export function datosDelSitio() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": ID_SITIO,
    name: company.name,
    url: absoluteUrl("/"),
    inLanguage: "es-EC",
    publisher: { "@id": ID_NEGOCIO },
  };
}

/** Un servicio, para su pagina. */
export function datosDeServicio(s: Servicio) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.nombre,
    serviceType: s.tipo,
    description: s.descripcion,
    url: absoluteUrl(s.ruta),
    provider: { "@id": ID_NEGOCIO },
    areaServed: zonaDeServicio,
  };
}

/** Las migas de pan («Inicio › Pauta digital»): Google las muestra en el resultado. */
export function migasDePan(pasos: { nombre: string; ruta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ nombre: "Inicio", ruta: "/" }, ...pasos].map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.nombre,
      item: absoluteUrl(p.ruta),
    })),
  };
}
