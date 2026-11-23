"use client";

import { useEffect, useState } from "react";
import { Thumbnail } from "@remotion/player";
import { ESCENAS } from "@/remotion/home/escenas";
import { DURACION, FPS, type ClaveEscena } from "@/remotion/home/tema";

/**
 * Una escena de banner, quieta en el cuadro que se le pida. La usa
 * scripts/grabar-escenas.mjs: pide cada cuadro con `window.__ponerCuadro(n)`
 * y le saca una captura con fondo transparente.
 */
declare global {
  interface Window {
    __ponerCuadro?: (n: number) => void;
  }
}

export function LienzoEscena({ escena, lineas }: { escena: ClaveEscena; lineas: string[] }) {
  const [cuadro, setCuadro] = useState(0);
  const def = ESCENAS[escena];

  useEffect(() => {
    window.__ponerCuadro = (n) => setCuadro(n);
    return () => {
      delete window.__ponerCuadro;
    };
  }, []);

  return (
    <div
      id="lienzo"
      data-cuadro={cuadro}
      data-lineas={JSON.stringify(lineas)}
      style={{ position: "relative", width: def.ancho, height: def.alto, overflow: "hidden" }}
    >
      <Thumbnail
        component={def.componente}
        inputProps={{ lineas }}
        durationInFrames={DURACION}
        compositionWidth={def.ancho}
        compositionHeight={def.alto}
        fps={FPS}
        frameToDisplay={cuadro}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}
