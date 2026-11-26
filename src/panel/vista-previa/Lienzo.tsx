"use client";

import { useEffect, useRef, useState } from "react";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ContentBanner } from "@/components/ContentBanner";
import { Footer } from "@/components/Footer";
import { SeccionesMarketing } from "@/components/marketing/SeccionesMarketing";
import { SeccionesTrafico } from "@/components/trafico/PaginaTrafico";
import { CLASE_MAIN_FENIAX, SeccionesFeniax } from "@/components/feniax/PaginaFeniax";
import { SeccionesAsesorias } from "@/components/asesorias/PaginaAsesorias";
import { FichaCliente } from "@/components/clientes/FichaCliente";
import type { MensajeAlLienzo, VistaPrevia } from "./mensajes";

/**
 * El lienzo de la vista previa (/admin/lienzo). Vive dentro de un iframe del
 * panel y dibuja la página con los MISMOS componentes de la web, con los datos
 * que le manda el panel por postMessage. No pide nada al servidor.
 *
 * Mismo armado que cada página: Nav, las secciones dentro de <main> y Footer.
 * Las piezas van sin envoltorio a propósito: la regla
 * `main > .pantalla:first-child` de globals.css le da a la portada su alto, y
 * un <div> alrededor la rompería.
 */

/** Las secciones de una página de servicio, con la clase de su <main>. */
function Servicio({ vista, lista }: { vista: Exclude<VistaPrevia, { pagina: "inicio" | "cliente" }>; lista?: string[] }) {
  const claves = lista ? new Set(lista) : null;
  switch (vista.pagina) {
    case "marketing":
      return <SeccionesMarketing secciones={claves ? vista.secciones.filter((s) => claves.has(s.key)) : vista.secciones} />;
    case "trafico":
      return <SeccionesTrafico secciones={claves ? vista.secciones.filter((s) => claves.has(s.key)) : vista.secciones} />;
    case "feniax":
      return <SeccionesFeniax secciones={claves ? vista.secciones.filter((s) => claves.has(s.key)) : vista.secciones} todas={vista.secciones} />;
    case "asesorias":
      return <SeccionesAsesorias secciones={claves ? vista.secciones.filter((s) => claves.has(s.key)) : vista.secciones} todas={vista.secciones} />;
  }
}

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
  const orden =
    vista?.pagina === "inicio"
      ? ["hero", ...vista.datos.seccionesContenido.map((b) => `banner:${b.id}`)]
      : vista && vista.pagina !== "cliente"
        ? vista.secciones.map((s) => s.key)
        : [];
  useEffect(() => {
    if (!pieza) return;
    if (modo !== "completa") {
      window.scrollTo({ top: 0 });
      return;
    }
    const indice = orden.indexOf(pieza);
    const destino = principal.current?.children[Math.max(0, indice)] as HTMLElement | undefined;
    destino?.scrollIntoView({ block: "start" });
    // Solo al cambiar de pieza o de modo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieza, modo]);

  if (!vista) {
    return <div className="grid min-h-screen place-items-center bg-canvas font-sans text-ink-subtle">Preparando la vista previa…</div>;
  }

  if (vista.pagina === "cliente") {
    if (!vista.cliente) {
      return (
        <div className="grid min-h-screen place-items-center bg-canvas px-6 text-center font-sans text-ink-subtle">
          {vista.aviso ?? "Este cliente no tiene página en la web (está inactivo o le falta la dirección)."}
        </div>
      );
    }
    return <FichaCliente client={vista.cliente} />;
  }

  if (vista.pagina !== "inicio") {
    const claseMain = vista.pagina === "feniax" ? CLASE_MAIN_FENIAX : undefined;
    if (vista.modo === "seccion") {
      const indice = orden.indexOf(vista.vista);
      if (indice < 0) {
        return (
          <div className="grid min-h-screen place-items-center bg-canvas px-6 text-center font-sans text-ink-subtle">
            Esta sección está oculta («Mostrar en la página» apagado) o le falta el título: no se ve en la web.
          </div>
        );
      }
      return (
        <>
          {indice === 0 ? <Nav /> : null}
          <main ref={principal} className={claseMain}>
            <Servicio vista={vista} lista={[vista.vista]} />
          </main>
        </>
      );
    }
    return (
      <>
        <Nav />
        <main ref={principal} className={claseMain}>
          <Servicio vista={vista} />
        </main>
        <Footer />
      </>
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
