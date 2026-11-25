"use client";

import { useEffect, useRef, useState } from "react";
import { TAMANOS, type Dispositivo, type MensajeAlLienzo, type VistaPrevia } from "./mensajes";

/**
 * El marco de la vista previa: un iframe con el lienzo, del tamaño real de
 * una computadora (1440×900) o de un celular (390×844), achicado para caber
 * en la columna. El iframe hace falta para que el diseño adaptable de la web
 * responda al ancho elegido, como en un equipo de verdad.
 */
export function Marco({
  vista,
  dispositivo,
  ajustarAlto = false,
}: {
  vista: VistaPrevia;
  dispositivo: Dispositivo;
  /** true en «Ampliar»: además del ancho, que quepa en el alto disponible. */
  ajustarAlto?: boolean;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const marco = useRef<HTMLIFrameElement>(null);
  const [disponible, setDisponible] = useState({ ancho: 0, alto: 0 });
  const [listo, setListo] = useState(false);
  const { ancho, alto } = TAMANOS[dispositivo];

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setDisponible({ ancho: el.clientWidth, alto: el.clientHeight });
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const alRecibir = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== marco.current?.contentWindow) return;
      if ((e.data as { tipo?: string } | null)?.tipo === "listo") setListo(true);
    };
    window.addEventListener("message", alRecibir);
    return () => window.removeEventListener("message", alRecibir);
  }, []);

  useEffect(() => {
    if (!listo) return;
    const mensaje: MensajeAlLienzo = { tipo: "dibujar", ...vista };
    marco.current?.contentWindow?.postMessage(mensaje, window.location.origin);
  }, [vista, listo]);

  const margen = dispositivo === "celular" ? 24 : 0;
  let escala = disponible.ancho > 0 ? Math.min(1, (disponible.ancho - margen) / ancho) : 0.4;
  if (ajustarAlto && disponible.alto > 0) escala = Math.min(escala, (disponible.alto - margen) / alto);

  return (
    <div ref={caja} className={`flex w-full justify-center ${ajustarAlto ? "h-full items-center" : ""}`}>
      <div
        className={`relative overflow-hidden bg-white ${
          dispositivo === "celular" ? "my-3 rounded-[26px] shadow-[0_0_0_7px_#1A0F3D,0_18px_40px_-18px_rgba(18,10,38,0.6)]" : "rounded-lg shadow-[0_0_0_1px_rgba(75,42,147,0.14)]"
        }`}
        style={{ width: ancho * escala, height: alto * escala }}
      >
        <iframe
          ref={marco}
          src="/admin/lienzo"
          title={`Vista previa en ${dispositivo}`}
          className="absolute left-0 top-0 origin-top-left border-0"
          style={{ width: ancho, height: alto, transform: `scale(${escala})` }}
        />
      </div>
    </div>
  );
}
