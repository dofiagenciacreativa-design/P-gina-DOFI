"use client";

import { useEffect, useRef, useState } from "react";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ContentBanner } from "@/components/ContentBanner";
import { Footer } from "@/components/Footer";
import type { MensajeAlLienzo, VistaPrevia } from "./mensajes";

/**
 * El lienzo de la vista previa (/admin/lienzo). Vive dentro de un iframe del
 * panel y dibuja la página con los MISMOS componentes de la web, con los datos
 * que le manda el panel por postMessage. No pide nada al servidor.
 *
 * Mismo armado que src/app/page.tsx: Nav, Hero y los banners dentro de
 * <main>, y Footer. Las piezas van sin envoltorio a propósito: la regla
 * `main > .pantalla:first-child` de globals.css le da al Hero su alto de
 * portada, y un <div> alrededor la rompería.
 */
export function Lienzo() {
  const [vista, setVista] = useState<VistaPrevia | null>(null);
  const principal = useRef<HTMLElement>(null);

  useEffect(() => {
    const alRecibir = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const m = e.data as MensajeAlLienzo | null;
      if (m?.tipo === "dibujar") setVista(m);
    };
    // Dentro del lienzo nada navega: es una maqueta.
    const sinNavegar = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("a, form button[type=submit]")) e.preventDefault();
    };
    window.addEventListener("message", alRecibir);
    document.addEventListener("click", sinNavegar, true);
    if (window.parent !== window) window.parent.postMessage({ tipo: "listo" }, window.location.origin);
    return () => {
      window.removeEventListener("message", alRecibir);
      document.removeEventListener("click", sinNavegar, true);
    };
  }, []);

  // Al cambiar de sección o de modo (no en cada letra), llevar la vista a esa pieza.
  const pieza = vista?.vista;
  const modo = vista?.modo;
  const banners = vista?.datos.seccionesContenido;
  useEffect(() => {
    if (!pieza || !banners) return;
    if (modo !== "completa") {
      window.scrollTo({ top: 0 });
      return;
    }
    const indice = pieza === "hero" ? 0 : 1 + banners.findIndex((b) => `banner:${b.id}` === pieza);
    const destino = principal.current?.children[Math.max(0, indice)] as HTMLElement | undefined;
    destino?.scrollIntoView({ block: "start" });
    // Solo al cambiar de pieza o de modo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieza, modo]);

  if (!vista) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas font-sans text-ink-subtle">Preparando la vista previa…</div>
    );
  }

  const { hero, capacidades, seccionesContenido } = vista.datos;
  const portada = <Hero content={hero} capacidades={capacidades} />;

  if (vista.modo === "seccion") {
    if (vista.vista === "hero") {
      return (
        <>
          <Nav />
          <main ref={principal}>{portada}</main>
        </>
      );
    }
    const banner = seccionesContenido.find((b) => `banner:${b.id}` === vista.vista) ?? seccionesContenido[0];
    return <main ref={principal}>{banner ? <ContentBanner {...banner} /> : null}</main>;
  }

  return (
    <>
      <Nav />
      <main ref={principal}>
        {portada}
        {seccionesContenido.map((b) => (
          <ContentBanner key={b.id} {...b} />
        ))}
      </main>
      <Footer />
    </>
  );
}
