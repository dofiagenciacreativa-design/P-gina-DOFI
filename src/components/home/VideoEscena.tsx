"use client";

import { useEffect, useRef, useState } from "react";

/**
 * La escena de un banner como VIDEO con transparencia (WebM), grabado de la
 * misma escena Remotion con `npm run grabar:escenas`.
 *
 * Mismo comportamiento que el reproductor en vivo (ReproductorEscena): corre
 * solo, en bucle y sin sonido; se pausa al salir de la pantalla (`activo`).
 * Aparece con un fundido cuando su primer cuadro esta listo. Con movimiento
 * reducido no se descarga el video: queda el primer cuadro (una imagen), con
 * todo en su sitio.
 *
 * Si el video no se puede reproducir, avisa con `alFallar` y EscenaBanner
 * vuelve a la escena dibujada en vivo.
 */
export function VideoEscena({
  video,
  poster,
  activo,
  reducido,
  alFallar,
}: {
  video: string;
  poster: string;
  activo: boolean;
  reducido: boolean;
  alFallar: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Si el primer cuadro llego antes de que React escuchara el evento.
    if (v.readyState >= 2) setListo(true);
    if (!activo) {
      v.pause();
      return;
    }
    // El navegador puede rechazar el play() (ahorro de bateria, por ejemplo):
    // queda el primer cuadro del video, que es la escena completa.
    v.play().catch(() => {});
  }, [activo, reducido]);

  if (reducido) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt="" className="absolute inset-0 h-full w-full object-fill" />;
  }

  return (
    <video
      ref={ref}
      src={video}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      onLoadedData={() => setListo(true)}
      onError={alFallar}
      className={`pointer-events-none absolute inset-0 h-full w-full object-fill transition-opacity duration-700 ease-out ${listo ? "opacity-100" : "opacity-0"}`}
    />
  );
}
