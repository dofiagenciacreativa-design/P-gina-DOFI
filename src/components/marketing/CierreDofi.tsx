import Image from "next/image";
import { BotonCta, type TamanoBoton } from "@/components/BotonCta";
import { Anim } from "./Anim";
import type { SeccionCierre } from "@/lib/marketing-digital";

/**
 * El cierre de las paginas de servicio (ctaBanner): Marketing Digital, Pauta
 * digital, Chatbots y CRM y Asesorías.
 *
 * REDISEÑO DEL 2026-11-23 (pedido del propietario: «esa imagen con el
 * delfín se ve muy, muy fea porque también fue hecha con IA»). Antes era UNA
 * imagen de Sanity de 2077x757 a todo el ancho: Daniel dando la mano a la
 * izquierda, un delfín generado con IA a la derecha y fondo transparente en
 * medio. En el teléfono, el recorte mostraba justo el medio vacío: una franja
 * oscura sin nada encima del título.
 *
 * Ahora:
 *  - Daniel es un recorte de esa misma foto (public/cierre/daniel-mano.webp),
 *    sin el delfín.
 *  - El delfín lo reemplaza un dibujo en código: ondas de agua que salen de
 *    su mano tendida, como cuando algo toca el mar («Un Mar de Ideas»). Es la
 *    única pieza que se mueve, lenta, y con «menos movimiento» se queda
 *    quieta.
 *  - Texto a la izquierda y Daniel a la derecha: su mano apunta hacia el
 *    título y el botón. En el teléfono, el texto arriba y Daniel apoyado en el
 *    borde de abajo, con la mano tendida hacia el botón.
 *
 * La imagen del cierre que sigue cargada en Sanity ya no se usa aquí (ni
 * su versión para teléfono). Los textos y el botón sí vienen de Sanity,
 * como antes.
 */
export function CierreDofi({
  seccion,
  id,
  nivel,
  tamanoBoton,
}: {
  seccion: SeccionCierre;
  id: string;
  nivel: "h1" | "h2";
  tamanoBoton?: TamanoBoton;
}) {
  const { subtitulo, titulo, descripcion, destacado, cta, animar } = seccion;
  const Titulo = nivel;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="relative isolate overflow-hidden bg-abyss text-foam"
    >
      {/* Fondo: dos luces de marca, sin imagen. El morado detrás de Daniel,
          un naranja muy tenue abajo a la izquierda, del lado del botón. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(55%_75%_at_78%_70%,rgba(109,75,201,0.42),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45%_55%_at_8%_100%,rgba(244,123,32,0.12),transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-page grid-cols-1 px-5 sm:px-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-8 md:px-10 lg:px-12">
        {/* Texto */}
        <div className="flex flex-col items-start pt-[var(--seccion-y)] md:justify-center md:pb-[var(--seccion-y)]">
          {subtitulo && (
            <Anim animar={animar} y={12} duration={0.6}>
              <p className="mb-5 inline-flex w-fit items-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 font-sans text-sm text-foam/85">
                {subtitulo}
              </p>
            </Anim>
          )}

          <Anim animar={animar} y={16} delay={0.08} duration={0.6}>
            <Titulo
              id={`${id}-titulo`}
              className="max-w-[17ch] text-balance font-display text-[clamp(2.125rem,1.2rem+2.6vw,3.75rem)] font-extrabold leading-[1.04] tracking-[-0.025em]"
            >
              {titulo}
            </Titulo>
          </Anim>

          {descripcion && (
            <Anim animar={animar} y={14} delay={0.16} duration={0.6}>
              <p className="mt-5 max-w-[46ch] font-sans text-lg leading-relaxed text-foam/80 md:text-xl">
                {descripcion}
              </p>
            </Anim>
          )}

          {destacado && (
            <Anim animar={animar} y={14} delay={0.24} duration={0.6}>
              <p className="mt-5 flex items-center gap-3 font-display text-lg font-semibold tracking-tight text-accent-lift">
                <span aria-hidden="true" className="h-px w-10 bg-accent-lift/70" />
                {destacado}
              </p>
            </Anim>
          )}

          {cta && (
            <Anim animar={animar} y={14} delay={0.32} duration={0.6}>
              <div className="mt-8">
                <BotonCta texto={cta.texto} enlace={cta.enlace} tamano={tamanoBoton ?? "grande"} />
              </div>
            </Anim>
          )}
        </div>

        {/* Daniel con las ondas. El cuadro tiene la proporción del recorte
            (430x710) y se apoya en el borde de abajo de la sección. */}
        <div className="relative mx-auto mt-8 w-[min(68%,280px)] self-end md:mt-0 md:w-full md:max-w-[340px] lg:max-w-[380px]">
          <div className="relative aspect-[430/710]">
            <Ondas />
            <Image
              src="/cierre/daniel-mano.webp"
              alt="Daniel, de DOFI, tendiendo la mano"
              fill
              unoptimized
              sizes="(min-width: 1024px) 380px, (min-width: 768px) 340px, 280px"
              className="object-contain object-bottom"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Las ondas: cuatro círculos de línea fina que nacen en la mano de Daniel
 * (30 % del ancho, 62 % del alto del recorte) y se abren hasta apagarse,
 * uno detrás de otro. Van DETRÁS de la foto. Con «menos movimiento» quedan
 * quietas, como anillos tenues.
 */
function Ondas() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-[30%] top-[62%] -z-0">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="cierre-onda absolute left-0 top-0 block rounded-full border"
          style={{ "--onda-retraso": `${i * -1.75}s`, "--onda-quieta": `${0.55 + i * 0.32}` } as React.CSSProperties}
        />
      ))}
      {/* Un resplandor naranja detrás de la mano: la recorta contra el fondo. */}
      <span className="absolute left-0 top-0 block h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/30 blur-2xl" />
    </div>
  );
}
