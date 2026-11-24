import { BotonCta, type TamanoBoton } from "@/components/BotonCta";
import { MarcaDeLuz } from "@/components/MarcaDeLuz";
import { LOGOS_FENIAX } from "@/config/feniax";
import { Anim } from "./Anim";
import type { SeccionCierre } from "@/lib/marketing-digital";

/**
 * El cierre de las páginas de servicio (ctaBanner): Marketing Digital, Pauta
 * digital, Asesorías y, con su propia marca, Chatbots y CRM (FENIAX).
 *
 * REDISEÑO DEL 2026-11-23, pedido y elegido por el propietario:
 *  - Antes era UNA imagen de Sanity de 2077x757 a todo el ancho: Daniel
 *    dando la mano y un delfín generado con IA, con fondo transparente en
 *    medio. En el teléfono el recorte mostraba justo ese medio: una franja
 *    oscura vacía encima del título («están como con espacio o
 *    descuadrado»).
 *  - El propietario no quiso la foto de Daniel en el cierre y eligió «el
 *    delfín hecho de luz» (propuesta C): el delfín del logo de DOFI, grande
 *    y tenue, con un reflejo que lo recorre (MarcaDeLuz). En Chatbots y CRM
 *    es el isotipo de FENIAX, con sus colores.
 *  - Texto a la izquierda y la marca a la derecha.
 *    Sin espacio vacío encima del título.
 *    En el teléfono todo va CENTRADO y la marca va detrás del texto, en
 *    grande (pedidos del propietario, 2026-11-24).
 *
 * La imagen del cierre que sigue cargada en Sanity (y su versión para
 * teléfono) ya no se usa. Textos y botón siguen viniendo de Sanity.
 */
const VARIANTES = {
  dofi: {
    marca: { src: "/cierre/marca-dofi.png", ancho: 512, alto: 282 },
    fondo:
      "bg-[radial-gradient(55%_75%_at_80%_45%,rgba(109,75,201,0.40),transparent_70%),radial-gradient(45%_55%_at_8%_100%,rgba(244,123,32,0.12),transparent_70%)]",
    colorBoton: "naranja" as const,
  },
  feniax: {
    marca: { src: LOGOS_FENIAX.isotipo, ancho: 673, alto: 470 },
    fondo:
      "bg-[radial-gradient(50%_70%_at_78%_45%,rgba(237,109,25,0.26),rgba(121,40,131,0.30)_45%,transparent_75%),linear-gradient(180deg,#2A1638_0%,#160A20_100%)]",
    colorBoton: "feniax" as const,
  },
};

export function CierreDofi({
  seccion,
  id,
  nivel,
  tamanoBoton,
  variante = "dofi",
}: {
  seccion: SeccionCierre;
  id: string;
  nivel: "h1" | "h2";
  tamanoBoton?: TamanoBoton;
  variante?: keyof typeof VARIANTES;
}) {
  const { subtitulo, titulo, descripcion, destacado, cta, animar } = seccion;
  const Titulo = nivel;
  const v = VARIANTES[variante];
  // FENIAX: las dos últimas palabras con el degradado del isotipo, como el
  // resto de la página (.texto-ia).
  const palabras = titulo.split(" ");
  const corte = variante === "feniax" && palabras.length > 2 ? palabras.length - 2 : palabras.length;
  const inicio = palabras.slice(0, corte).join(" ");
  const final = palabras.slice(corte).join(" ");

  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="relative isolate overflow-hidden bg-abyss text-foam"
    >
      <div aria-hidden="true" className={`absolute inset-0 -z-10 ${v.fondo}`} />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="mx-auto grid w-full max-w-page grid-cols-1 items-center gap-8 px-5 py-[var(--seccion-y)] sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-10 md:px-10 lg:px-12">
        {/* La marca. En el teléfono va DETRÁS del texto, grande y más tenue
            (pedido del propietario, 2026-11-24): ocupa el fondo de la sección
            sin sumar alto. En computadora, a la derecha del texto. */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center opacity-[0.45] md:static md:order-2 md:block md:translate-y-0 md:opacity-100">
          <MarcaDeLuz
            src={v.marca.src}
            ancho={v.marca.ancho}
            alto={v.marca.alto}
            tono={variante}
            className={
              variante === "feniax"
                ? "w-[92%] max-w-none shrink-0 md:ml-auto md:w-[78%] md:max-w-[420px] md:shrink"
                : "w-[140%] max-w-none shrink-0 md:ml-auto md:w-[112%] md:max-w-[620px] md:shrink md:translate-x-[6%]"
            }
          />
        </div>

        <div className="relative z-10 flex min-w-0 flex-col items-center text-center md:order-1 md:items-start md:text-left">
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
              className="mx-auto max-w-[17ch] text-balance font-display md:mx-0 text-[clamp(2rem,1.2rem+2.6vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.025em]"
            >
              {inicio}
              {final && (
                <>
                  {" "}
                  <span className="texto-ia">{final}</span>
                </>
              )}
            </Titulo>
          </Anim>

          {descripcion && (
            <Anim animar={animar} y={14} delay={0.16} duration={0.6}>
              <p className="mx-auto mt-5 max-w-[46ch] font-sans text-lg leading-relaxed text-foam/80 md:mx-0 md:text-xl">
                {descripcion}
              </p>
            </Anim>
          )}

          {destacado && (
            <Anim animar={animar} y={14} delay={0.24} duration={0.6}>
              <p className="mt-5 flex items-center justify-center gap-3 font-display text-lg font-semibold tracking-tight text-accent-lift md:justify-start">
                <span aria-hidden="true" className="h-px w-10 bg-accent-lift/70" />
                {destacado}
              </p>
            </Anim>
          )}

          {cta && (
            <Anim animar={animar} y={14} delay={0.32} duration={0.6} className="w-full sm:w-auto">
              <div className="mt-8 [&>a]:w-full sm:[&>a]:w-auto">
                <BotonCta texto={cta.texto} enlace={cta.enlace} color={v.colorBoton} tamano={tamanoBoton ?? "grande"} />
              </div>
            </Anim>
          )}
        </div>
      </div>
    </section>
  );
}
