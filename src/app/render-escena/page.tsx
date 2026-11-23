import { notFound } from "next/navigation";
import { getPaginaInicio } from "@/lib/sanity";
import { CLAVES_ESCENA, GEOMETRIA, type ClaveEscena } from "@/remotion/home/tema";
import { LienzoEscena } from "./LienzoEscena";

/**
 * SOLO PARA GRABAR LOS VIDEOS DE LOS BANNERS (no es una pagina del sitio).
 *
 * Muestra una escena de banner sola, sobre fondo transparente y a su tamaño
 * real, con el MISMO texto que trae el Home desde Sanity. La abre
 * scripts/grabar-escenas.mjs (`npm run grabar:escenas`) para capturar los 240
 * cuadros de cada escena y armar el video que reproduce el Home.
 *
 * En el sitio publicado no existe: responde 404. Solo abre en desarrollo
 * (`npm run dev`) o, para grabar mas rapido contra la version compilada, con
 * la variable GRABAR_ESCENAS=1 (ver scripts/grabar-escenas.mjs).
 */
export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

export default async function RenderEscena({
  searchParams,
}: {
  searchParams: Promise<{ escena?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.GRABAR_ESCENAS !== "1") notFound();

  const { escena } = await searchParams;
  if (!escena || !CLAVES_ESCENA.includes(escena as ClaveEscena)) notFound();
  const clave = escena as ClaveEscena;

  const { seccionesContenido } = await getPaginaInicio();
  const banner = seccionesContenido.find((s) => s.escena === clave);
  const lineas = banner && banner.lineas.length > 0 ? banner.lineas : GEOMETRIA[clave].lineasPorDefecto;

  return (
    <main id="render-escena">
      {/* Fuera todo lo demas (grano, boton de WhatsApp, avisos de Next) y el
          fondo de la pagina: la captura tiene que salir transparente. */}
      <style>{`
        html, body { background: transparent !important; margin: 0 !important; }
        body > *:not(#render-escena) { display: none !important; }
      `}</style>
      <LienzoEscena escena={clave} lineas={lineas} />
    </main>
  );
}
