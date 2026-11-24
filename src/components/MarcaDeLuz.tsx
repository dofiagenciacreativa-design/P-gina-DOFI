/**
 * Una marca «hecha de luz» (2026-11-23): el logo grande y tenue, con un
 * reflejo que lo recorre cada pocos segundos y un resplandor que respira.
 * Lo eligió el propietario para el cierre de las páginas de servicio, en
 * lugar de la imagen con un delfín generado con IA: el delfín sigue, pero
 * es el del logo de DOFI (y en Chatbots y CRM, el fénix de FENIAX).
 *
 * Sin imagen nueva: el reflejo es un degradado que se mueve DENTRO de la
 * silueta del logo (CSS mask con el mismo archivo). Solo se anima
 * background-position y opacity. Con «menos movimiento» queda quieto, con
 * el reflejo a la mitad. Estilos: .marca-luz en globals.css.
 */
export function MarcaDeLuz({
  src,
  ancho,
  alto,
  tono = "dofi",
  className = "",
}: {
  /** El logo con transparencia (PNG o SVG). */
  src: string;
  /** Proporción del archivo, para reservar el lugar sin saltos. */
  ancho: number;
  alto: number;
  tono?: "dofi" | "feniax";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`marca-luz marca-luz--${tono} pointer-events-none relative ${className}`}
      style={{ aspectRatio: `${ancho} / ${alto}`, "--marca-luz-src": `url(${src})` } as React.CSSProperties}
    >
      <span className="marca-luz__halo" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="marca-luz__base" loading="lazy" decoding="async" />
      <span className="marca-luz__luz" />
    </div>
  );
}
