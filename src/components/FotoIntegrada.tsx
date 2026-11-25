import { getImageProps } from "next/image";

/**
 * FOTO INTEGRADA (pedido del 2026-11-25): una foto recortada (PNG/WebP con
 * fondo transparente: Daniel con el equipo, la gente de Asesorías) que se
 * apoya sobre el fondo de una portada SIN verse «pegada encima».
 *
 * Por qué se veía pegada (medido en las fotos publicadas):
 *  - El recorte termina en una línea recta (abajo, y a la derecha en la de
 *    Marketing) que queda flotando en medio del fondo: se lee como un sticker.
 *  - Es una foto de día, clara, sobre un fondo de noche morado: no comparte la
 *    luz de la escena (ni el morado ni el naranja de la marca le llegan).
 *  - Nada la apoya: ni piso, ni sombra, ni luz detrás.
 *
 * Tratamientos (los mismos para cualquier foto nueva):
 *  - «fundido»:   el borde recto se disuelve en el fondo (abajo y, más suave,
 *                 a los lados) y un charco de luz de marca la apoya.
 *  - «luz»:       fundido + la foto toma la luz de la escena: un poco más
 *                 oscura abajo, morado de un lado y naranja del otro (solo
 *                 sobre la gente, no sobre el fondo) y un contraluz suave en
 *                 el contorno.
 *  - «escenario»: luz + un aro de luz de marca detrás, como un escenario.
 *  - «ninguno»:   la foto tal cual (como estaba).
 *
 * La caja de este componente mide EXACTAMENTE lo que mide la foto: así el
 * fundido cae en el borde real de la foto y no en un hueco vacío. Por eso
 * necesita saber la proporción (ancho/alto) y la caja donde se apoya debe
 * tener tamaño propio (container-type: size, ver `encaje`).
 */

export type TratamientoFoto = "ninguno" | "fundido" | "luz" | "escenario";

export type IntegracionFoto = {
  tratamiento: TratamientoFoto;
  /** 0-100: cuánto se nota (largo del fundido y fuerza de la luz). */
  intensidad: number;
};

/** Lo que se usa si la sección no dice nada. */
export const INTEGRACION_POR_DEFECTO: IntegracionFoto = { tratamiento: "luz", intensidad: 60 };

export const TRATAMIENTOS: readonly TratamientoFoto[] = ["ninguno", "fundido", "luz", "escenario"];

/** Acepta lo que venga del contenido y devuelve algo válido. */
export function normalizarIntegracion(valor: unknown): IntegracionFoto {
  const v = (valor ?? {}) as Partial<Record<keyof IntegracionFoto, unknown>>;
  const tratamiento = TRATAMIENTOS.includes(v.tratamiento as TratamientoFoto)
    ? (v.tratamiento as TratamientoFoto)
    : INTEGRACION_POR_DEFECTO.tratamiento;
  const n = typeof v.intensidad === "number" && Number.isFinite(v.intensidad) ? v.intensidad : INTEGRACION_POR_DEFECTO.intensidad;
  return { tratamiento, intensidad: Math.min(100, Math.max(0, Math.round(n))) };
}

type Props = {
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  integracion: IntegracionFoto;
  /**
   * Cómo se ubica dentro de su caja:
   *  - "contenida": la caja padre es un contenedor de tamaño fijo
   *    (`container-type: size`); la foto la llena sin salirse (como
   *    object-contain). Dónde se apoya lo dice `className` (p. ej.
   *    `bottom-0 right-0`).
   *  - "flujo": la foto ocupa el ancho disponible con su propia proporción
   *    (la caja crece con ella).
   */
  encaje: "contenida" | "flujo";
  /** Posición de la caja (solo con encaje "contenida"). */
  className?: string;
  /** Lados que NO se funden porque tocan el borde de la pantalla. */
  bordesLibres?: { derecha?: boolean; izquierda?: boolean; abajo?: boolean };
  prioridad?: boolean;
  /** Estilo extra para la caja (por ejemplo, un ancho máximo). */
  estilo?: React.CSSProperties;
  /** Para el srcset (como en next/image). */
  sizes?: string;
  /** Único en la página (para los degradados del aro). */
  idUnico: string;
};

export function FotoIntegrada({
  src,
  alt,
  ancho,
  alto,
  integracion,
  encaje,
  bordesLibres = {},
  prioridad = false,
  estilo,
  sizes = "100vw",
  idUnico,
  className = "",
}: Props) {
  const { tratamiento } = integracion;
  const k = integracion.intensidad / 100; // 0..1
  const ratio = ancho / alto;
  // srcset por el cargador del sitio (el CDN de Sanity redimensiona).
  const { props: img } = getImageProps({ src, alt, width: ancho, height: alto, sizes, priority: prioridad, unoptimized: src.startsWith("/") });

  // Caja del tamaño exacto de la foto.
  const caja: React.CSSProperties =
    encaje === "flujo"
      ? { position: "relative", width: "100%", aspectRatio: `${ancho} / ${alto}` }
      : {
          position: "absolute",
          aspectRatio: `${ancho} / ${alto}`,
          width: `min(100cqw, calc(100cqh * ${ratio.toFixed(4)}))`,
        };

  const conFundido = tratamiento !== "ninguno";
  // Largo del fundido: de 14% a 34% del alto (abajo) y de 4% a 12% a los lados.
  const abajo = conFundido && !bordesLibres.abajo ? 14 + 20 * k : 0;
  const lado = conFundido ? 4 + 8 * k : 0;
  const capas = [
    abajo > 0 ? `linear-gradient(to top, transparent 0%, #000 ${abajo.toFixed(1)}%)` : null,
    lado > 0 && !bordesLibres.izquierda ? `linear-gradient(to right, transparent 0%, #000 ${lado.toFixed(1)}%)` : null,
    lado > 0 && !bordesLibres.derecha ? `linear-gradient(to left, transparent 0%, #000 ${lado.toFixed(1)}%)` : null,
  ].filter(Boolean) as string[];
  const mascara: React.CSSProperties =
    capas.length > 0
      ? {
          WebkitMaskImage: capas.join(", "),
          maskImage: capas.join(", "),
          WebkitMaskComposite: capas.map(() => "source-in").join(", "),
          maskComposite: "intersect",
        }
      : {};

  // La gente toma la luz de la escena. Todo con filtros sobre la propia foto
  // (respetan su recorte): el CDN de Sanity no deja usar la foto como máscara
  // CSS (responde 403 a las peticiones con Origin), así que nada de url() en
  // mask-image. El filtro SVG (abajo) hace dos cosas:
  //  - un color más de noche: apenas más oscura y con las sombras hacia el
  //    morado de la escena;
  //  - contraluz: el contorno se enciende en morado del lado izquierdo y en
  //    naranja del derecho (luces de relieve sobre el borde del recorte).
  const conLuz = tratamiento === "luz" || tratamiento === "escenario";
  const oscuro = 1 - 0.1 * k;
  const matriz = [
    [1.0 * oscuro, 0, 0.03, 0, 0],
    [0, 0.95 * oscuro, 0, 0, 0],
    [0.04, 0, 1.06 * oscuro, 0, 0.012],
    [0, 0, 0, 1, 0],
  ]
    .map((f) => f.map((v) => v.toFixed(3)).join(" "))
    .join(" ");
  const filtroLuz = `url(#${idUnico}-luz) drop-shadow(0 0 ${(10 + 14 * k).toFixed(0)}px rgba(138,91,255,${(0.22 + 0.22 * k).toFixed(2)}))`;

  return (
    <div style={{ ...caja, ...estilo }} className={`isolate ${className}`}>
      {/* Charco de luz de marca donde la foto «pisa»: la apoya en la escena. */}
      {conFundido && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -z-10"
          style={{
            left: "-6%",
            right: "-6%",
            bottom: "-4%",
            height: "46%",
            background: `radial-gradient(50% 55% at 50% 78%, rgba(109,75,201,${(0.35 + 0.3 * k).toFixed(2)}) 0%, rgba(244,123,32,${(0.1 + 0.12 * k).toFixed(2)}) 45%, transparent 75%)`,
            filter: "blur(18px)",
          }}
        />
      )}

      {/* Contraluz detrás de la gente (luz y escenario). */}
      {conLuz && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -z-10"
          style={{
            inset: "8% 6% 10% 6%",
            background: `radial-gradient(closest-side, rgba(155,123,255,${(0.32 + 0.3 * k).toFixed(2)}) 0%, rgba(109,75,201,${(0.18 + 0.2 * k).toFixed(2)}) 45%, transparent 78%)`,
            filter: "blur(30px)",
          }}
        />
      )}

      {/* Aro de luz (escenario). */}
      {tratamiento === "escenario" && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -z-10"
          style={{ left: "50%", top: "-2%", width: "78%", aspectRatio: "1", transform: "translateX(-50%)", overflow: "visible" }}
          viewBox="0 0 100 100"
          fill="none"
        >
          <defs>
            <linearGradient id={`${idUnico}-aro`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#B49BFF" />
              <stop offset="0.55" stopColor="#8A5BFF" />
              <stop offset="1" stopColor="#FF9440" />
            </linearGradient>
            <radialGradient id={`${idUnico}-aro-dentro`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0.55" stopColor="#6D4BC9" stopOpacity="0" />
              <stop offset="1" stopColor="#6D4BC9" stopOpacity={0.35 * k + 0.1} />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill={`url(#${idUnico}-aro-dentro)`} />
          <circle cx="50" cy="50" r="46" stroke={`url(#${idUnico}-aro)`} strokeWidth="1.6" style={{ filter: "drop-shadow(0 0 2.5px #8A5BFF) drop-shadow(0 0 6px rgba(255,148,64,0.55))" }} />
          <circle cx="50" cy="50" r="49" stroke={`url(#${idUnico}-aro)`} strokeOpacity="0.35" strokeWidth="0.5" />
        </svg>
      )}

      {conLuz && (
        <svg aria-hidden="true" width="0" height="0" className="absolute">
          <filter id={`${idUnico}-luz`} x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values={matriz} result="color" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="relieve" />
            <feSpecularLighting in="relieve" surfaceScale="5" specularConstant="1.4" specularExponent="40" lightingColor="#9D6BFF" result="izq">
              <feDistantLight azimuth="200" elevation="22" />
            </feSpecularLighting>
            <feComposite in="izq" in2="SourceAlpha" operator="in" result="izqDentro" />
            <feSpecularLighting in="relieve" surfaceScale="5" specularConstant="1.4" specularExponent="40" lightingColor="#FF8A3D" result="der">
              <feDistantLight azimuth="-20" elevation="22" />
            </feSpecularLighting>
            <feComposite in="der" in2="SourceAlpha" operator="in" result="derDentro" />
            <feComposite in="izqDentro" in2="color" operator="arithmetic" k2={(0.55 + 0.45 * k).toFixed(2)} k3="1" result="conIzq" />
            <feComposite in="derDentro" in2="conIzq" operator="arithmetic" k2={(0.4 + 0.4 * k).toFixed(2)} k3="1" />
          </filter>
        </svg>
      )}

      <div className="absolute inset-0" style={mascara}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...img}
          alt={alt}
          decoding="async"
          className="block h-full w-full"
          style={conLuz ? { filter: filtroLuz } : undefined}
        />
      </div>
    </div>
  );
}
