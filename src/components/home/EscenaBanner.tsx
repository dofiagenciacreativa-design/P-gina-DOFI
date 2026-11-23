"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ClaveEscena } from "@/remotion/home/tema";
import videosGrabados from "@/remotion/home/videos.json";
import { VideoEscena } from "./VideoEscena";

/**
 * La parte animada de un banner del Home (ver src/remotion/home/ y
 * BannerHibrido.tsx).
 *
 * VIDEO O EN VIVO (2026-11-23, «la pagina va a saltos»)
 * -----------------------------------------------------------------
 * La escena se muestra de una de dos formas:
 *
 *   1. VIDEO (lo normal): un WebM con transparencia grabado de la misma
 *      escena con `npm run grabar:escenas` (VideoEscena.tsx). El navegador
 *      solo reproduce. Dibujada en vivo, la escena redibuja 30 veces por
 *      segundo decenas de brillos, sombras y desenfoques: en una laptop con
 *      grafica integrada el banner iba a 8-14 cuadros por segundo.
 *   2. EN VIVO, con Remotion (ReproductorEscena.tsx), como antes. Solo cuando
 *      el video no sirve:
 *        - el texto del banner se cambio en Sanity y ya no es el del video
 *          (videos.json guarda el texto con el que se grabo cada escena):
 *          nunca se muestra un texto viejo. Volver a grabar y publicar
 *          devuelve la fluidez;
 *        - Safari y todos los navegadores del iPhone y del iPad: reproducen
 *          WebM pero ignoran su transparencia (pintarian la escena sobre
 *          negro);
 *        - el video falla al cargar.
 *
 * CARGA DIFERIDA: la escena se monta cuando el banner esta a ~900 px de entrar
 * en pantalla, no antes; el banner que esta oculto en este tamaño (el de
 * escritorio en un telefono y al reves) nunca se monta. Mientras llega, el
 * hueco muestra el fondo del banner; la escena aparece con un fundido.
 *
 * PRECARGA (2026-10-28, «los banners no cargan rapido»): cuando toca dibujar
 * en vivo, el codigo de Remotion se baja apenas la pagina queda libre
 * (requestIdleCallback), sin esperar a que el visitante llegue a los banners.
 * Con video, Remotion no se descarga.
 *
 * Solo corre mientras esta en pantalla. Con movimiento reducido no corre:
 * queda un cuadro quieto con todo en su sitio.
 *
 * El borde que mira a la foto se desvanece (mascara): asi la escena y la foto
 * se funden en vez de encontrarse en una linea recta. Es decorativo
 * (aria-hidden): el texto del banner va en BannerHibrido para lectores de
 * pantalla y buscadores.
 */

const cargarReproductor = () => import("./ReproductorEscena");
const ReproductorEscena = dynamic(cargarReproductor, { ssr: false });

/** Una sola precarga por pagina, aunque haya 8 escenas (4 banners x 2 tamaños). */
let precargado = false;
function precargarReproductor() {
  if (precargado) return;
  precargado = true;
  const pedir = () => void cargarReproductor();
  if ("requestIdleCallback" in window) window.requestIdleCallback(pedir, { timeout: 2500 });
  else setTimeout(pedir, 1200);
}

type VideoGrabado = { lineas: string[]; video: string; videoMovil: string; poster: string };
const VIDEOS = videosGrabados as Partial<Record<ClaveEscena, VideoGrabado>>;

/** Safari (y todo navegador de iPhone/iPad, que usa su motor) reproduce WebM
 *  pero sin la transparencia. Chrome, Edge, Firefox y Android si la respetan. */
function reproduceWebmTransparente(): boolean {
  const ua = navigator.userAgent;
  const esMotorDeSafari = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua);
  if (esMotorDeSafari) return false;
  return document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
}

export function EscenaBanner({
  escena,
  lineas,
  ancho,
  alto,
  borde,
  movil = false,
  className = "",
}: {
  escena: ClaveEscena;
  lineas: string[];
  /** Proporcion de la escena (la de su lienzo Remotion). */
  ancho: number;
  alto: number;
  /** Que borde de la escena se desvanece: el que mira a la foto. */
  borde: "izquierda" | "derecha" | "abajo" | null;
  /** El banner del telefono: usa la version mas chica del video. */
  movil?: boolean;
  className?: string;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);
  const [enVista, setEnVista] = useState(false);
  const [reducido, setReducido] = useState(false);
  // Como se muestra la escena. Se decide en el navegador (depende de el).
  const [modo, setModo] = useState<"video" | "vivo" | null>(null);
  const grabado = VIDEOS[escena];
  const texto = lineas.join(" | ");

  useEffect(() => {
    const mismoTexto = grabado !== undefined && grabado.lineas.join(" | ") === texto;
    const conVideo = mismoTexto && reproduceWebmTransparente();
    setModo(conVideo ? "video" : "vivo");
    if (!conVideo) precargarReproductor();
  }, [grabado, texto]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducido(mq.matches);
    const alCambiar = () => setReducido(mq.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const lejos = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCerca(true);
          lejos.disconnect();
        }
      },
      { rootMargin: "900px 0px" }
    );
    const visible = new IntersectionObserver(([e]) => setEnVista(e.isIntersecting), { threshold: 0.1 });
    lejos.observe(el);
    visible.observe(el);
    return () => {
      lejos.disconnect();
      visible.disconnect();
    };
  }, []);

  // `borde` es el borde de la escena que se desvanece (el que mira a la foto):
  // la mascara va opaca hasta el 86% y se apaga hacia ese borde.
  const direccion = borde === "derecha" ? "to right" : borde === "izquierda" ? "to left" : "to bottom";
  const mascara = borde ? `linear-gradient(${direccion}, #000 0%, #000 86%, transparent 100%)` : undefined;

  return (
    <div
      ref={raiz}
      aria-hidden="true"
      className={`relative ${className}`}
      style={{
        aspectRatio: `${ancho} / ${alto}`,
        WebkitMaskImage: mascara,
        maskImage: mascara,
      }}
    >
      {cerca && modo === "video" && grabado && (
        <VideoEscena
          video={movil ? grabado.videoMovil : grabado.video}
          poster={grabado.poster}
          activo={enVista}
          reducido={reducido}
          alFallar={() => {
            precargarReproductor();
            setModo("vivo");
          }}
        />
      )}
      {cerca && modo === "vivo" && (
        <div className="absolute inset-0 animate-[aparecer_0.7s_ease-out_both] motion-reduce:animate-none">
          <ReproductorEscena escena={escena} lineas={lineas} activo={enVista} reducido={reducido} />
        </div>
      )}
    </div>
  );
}
