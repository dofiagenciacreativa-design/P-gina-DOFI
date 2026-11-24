import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { company } from "@/config/company";
import { site } from "@/config/site";
import { PAGINAS, metadatosDePagina } from "@/config/seo";
import { BotonWhatsApp } from "@/components/BotonWhatsApp";
import { DatosEstructurados } from "@/components/seo/DatosEstructurados";
import { datosDelNegocio, datosDelSitio } from "@/lib/datos-estructurados";
import "./globals.css";

/**
 * Fuentes auto-alojadas, sin llamadas de red durante el build.
 *
 * Antes se usaba next/font/google, que descarga los archivos de fuente en
 * cada build. En el pipeline de Cloudflare Workers eso colgo el build por
 * ~29 minutos hasta que lo mato el timeout: el sandbox de build no llega
 * con normalidad a fonts.gstatic.com. Con archivos locales el build no
 * depende de ninguna red externa.
 *
 * Sora: un solo archivo variable (pesos 300-800) descargado una vez de
 * Google Fonts y guardado en ./fonts/sora-variable.woff2.
 * Geist: paquete oficial de Vercel (geist/font/sans), ya trae los archivos
 * empaquetados. Su variable de CSS es --font-geist-sans (fija por el
 * paquete), por eso globals.css referencia ese nombre y no --font-geist.
 */
const sora = localFont({
  src: "./fonts/sora-variable.woff2",
  variable: "--font-sora",
  display: "swap",
  weight: "300 800",
});

/**
 * Archivo (con su eje de ancho): SOLO para el titulo condensado del banner de
 * Pauta del Home, recreado con Remotion. `preload: false`: no se descarga en
 * las paginas que no lo usan; el navegador lo pide cuando el banner lo pinta.
 */
const archivo = localFont({
  src: "./fonts/archivo-variable.woff2",
  variable: "--font-archivo",
  display: "swap",
  weight: "800 900",
  preload: false,
});

/**
 * URL publica y permiso de indexacion: ambos salen de src/config/site.ts.
 *
 * Antes aqui estaba escrito a mano `const siteUrl = "https://dofi.agency"`,
 * un dominio que no sirve este sitio. Con eso, og:url mandaba a cada enlace
 * compartido a un destino equivocado.
 *
 * Mientras NEXT_PUBLIC_SITE_URL no traiga un dominio propio, el sitio se
 * comporta como staging: noindex,nofollow y SIN canonical (un canonical a
 * *.workers.dev seria peor que no tenerlo). En cuanto se defina el dominio
 * definitivo, el mismo codigo pasa a emitir canonical e indexable.
 */
/**
 * CADA VISITA SE ARMA SOLA (arreglo del 2026-11-23).
 *
 * El sintoma: en dofiagenciacreativa.com 1 de cada 4-5 visitas recibia
 * «Internal Server Error». El registro de Cloudflare decia: «This promise was
 * created by a request that has since ended, so it can never settle».
 *
 * La causa: con las paginas «pre-armadas» (ISR), Next.js junta las visitas
 * que llegan a la vez a la misma pagina y las hace esperar UNA sola promesa
 * (el «batcher» de su ResponseCache). Si la visita que creo esa promesa
 * termina antes (un robot que corta la conexion, por ejemplo), Cloudflare no
 * deja que esa promesa se resuelva en otra visita, y las que esperaban
 * fallan. Solo pasaba en el dominio real, que es donde hay trafico de verdad.
 *
 * El arreglo: todas las paginas son dinamicas, asi Next.js no les da clave de
 * cache y no comparte nada entre visitas. No cambia la velocidad: este sitio
 * no tiene cache incremental configurado en OpenNext (open-next.config.ts), y
 * cada visita ya se armaba desde cero (respondia siempre «x-nextjs-cache:
 * MISS»). Si algun dia se configura un cache incremental (R2/KV), revisar
 * esta linea junto con esa configuracion.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // Titulo, descripcion e imagen para compartir de respaldo (los del inicio).
  // Cada pagina declara los suyos con metadatosDePagina() (src/config/seo.ts).
  //
  // SIN canonical aca (2026-11-23): antes el layout declaraba
  // `canonical: "/"` y todas las paginas lo heredaban, o sea que todas le
  // decian a Google «soy una copia del inicio». Ahora cada pagina declara
  // la suya.
  ...metadatosDePagina(PAGINAS.inicio),
  alternates: undefined,
  keywords: [
    "agencia de marketing digital Cuenca",
    "agencia de marketing Cuenca",
    "manejo de redes sociales Cuenca",
    "publicidad en Meta Ads",
    "TikTok Ads",
    "Google Ads",
    "chatbots con IA",
    "CRM para WhatsApp",
    company.shortName,
    company.partner.name,
  ],
  robots: site.isIndexable
    ? undefined
    : {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-EC" className={`${sora.variable} ${GeistSans.variable} ${archivo.variable}`}>
      <body>
        {/* La ficha del negocio y del sitio para buscadores (no se ve). */}
        <DatosEstructurados datos={[datosDelNegocio(), datosDelSitio()]} />
        {/*
          THESIS: El lienzo blanco reemplaza el canvas oscuro en Navbar,
          Hero y Capacidades; DOFI se expresa en morado+naranja sobre claro,
          nunca en bloques oscuros continuos.
          OWN-WORLD: Blanco calido (--color-canvas) + tinta morada
          (--color-ink) + acentos morado/naranja DOFI (--color-brand/
          --color-accent); tarjetas blancas que pasan a degradado DOFI en
          hover, sin glass oscuro.
          STORY: El visitante entiende en el primer scroll que DOFI es
          agencia + CRM + IA ("Ventas Inteligentes"), ve una foto real
          editable desde el CMS integrada en todo el Hero, y actua via
          "Quiero Mejorar mis Ventas" (o explora el trabajo real primero).
          FIRST VIEWPORT (actualizado en "Correccion Hero final"): Header
          claro arriba; Hero de composicion unica -- imagen a pantalla
          completa con overlays geometricos morados animados, copy a la
          izquierda por delante; banda de 4 tarjetas superpuesta al borde
          inferior del hero.
          FORM: Brief-pinned — "DOFI, REPLANTEO DEFINITIVO NAVBAR + HERO +
          SANITY" del propietario fijo cada decision visual con precision;
          sin ronda de exploracion de direccion, se construyo directo sobre
          el brief.
          FINISH: unreviewed and undocumented is unfinished; this build
          ends with the finish review, the verdict, DESIGN.md, and every
          shipping raster carrying its provenance.
        */}
        {/* Las animaciones de entrada se renderizan con opacity 0 en el HTML
            del servidor y solo se revelan al hidratar. Sin JS eso dejaria
            secciones enteras invisibles, asi que aqui se fuerzan visibles. */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <div className="grain-layer" aria-hidden="true" />
        {children}
        <BotonWhatsApp />
      </body>
    </html>
  );
}
