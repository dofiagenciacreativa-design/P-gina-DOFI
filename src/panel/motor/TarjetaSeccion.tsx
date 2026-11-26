"use client";

import { Info, Warning } from "@phosphor-icons/react";
import type { Doc, ResolverArchivo } from "@/lib/contenido/tipos";
import type { Bloque, Ruta, SeccionPanel } from "@/panel/esquema/tipos";
import { IconoSeccion } from "@/panel/ui/iconos";
import { CampoPanel, type Subidas } from "./CampoPanel";
import { leer } from "./rutas";

/**
 * La tarjeta central: cabecera de la sección, «¿Cómo funciona?», los grupos
 * de campos y el botón Deshacer (lo cambiado se publica con «Publicar cambios», arriba).
 */
export function TarjetaSeccion({
  seccion,
  docs,
  cambiada,
  resolver,
  alCambiar,
  alCopiarDeFabrica,
  alDeshacer,
  subidas,
}: {
  seccion: SeccionPanel;
  docs: Record<string, Doc>;
  cambiada: boolean;
  resolver: ResolverArchivo;
  alCambiar: (documento: string, ruta: Ruta, valor: unknown) => void;
  alCopiarDeFabrica: () => void;
  alDeshacer: () => void;
  subidas: Subidas;
}) {
  const idCampo = (b: Bloque, nombre: string) =>
    `campo-${seccion.clave}-${b.titulo}-${nombre}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-canvas-border bg-white p-4 shadow-[0_1px_2px_rgba(26,15,61,0.04)] sm:p-5">
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white">
          <IconoSeccion nombre={seccion.icono} tamano={20} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-extrabold uppercase tracking-[0.04em] text-ink">{seccion.titulo}</h2>
          <p className="text-[0.83rem] text-ink-subtle">Aparece en: {seccion.apareceEn}</p>
        </div>
      </header>

      <details className="group rounded-xl border border-canvas-border bg-canvas px-3 py-2 text-sm">
        <summary className="cursor-pointer select-none font-semibold text-brand marker:text-brand">¿Cómo funciona?</summary>
        <p className="mt-1.5 leading-relaxed text-ink-muted">{seccion.ayuda}</p>
      </details>

      {seccion.aviso ? (
        <p className="flex gap-2 rounded-xl bg-[#FFF0E3] px-3 py-2 text-[0.83rem] leading-snug text-[#8A3F08]">
          <Warning size={18} weight="bold" className="mt-px shrink-0" aria-hidden="true" />
          <span>{seccion.aviso}</span>
        </p>
      ) : null}

      {seccion.vacia ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-brand/30 bg-brand/[0.04] p-4">
          <p className="flex gap-2 text-sm leading-relaxed text-ink-muted">
            <Info size={18} weight="bold" className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <span>{seccion.vacia.texto}</span>
          </p>
          <button
            type="button"
            onClick={alCopiarDeFabrica}
            className="rounded-full border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {seccion.vacia.boton}
          </button>
        </div>
      ) : null}

      {seccion.bloques.map((b) => (
        <section key={`${b.documento}-${JSON.stringify(b.ruta)}-${b.titulo}`} className="flex flex-col gap-3 border-t border-canvas-border pt-4">
          <h3 className="font-display text-[0.72rem] font-bold tracking-[0.12em] text-ink-subtle">{b.titulo}</h3>
          {b.nota ? <p className="-mt-1.5 text-xs text-ink-subtle">{b.nota}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {b.campos.map((c) => {
              const ancho = c.clase === "numero" || (c.clase === "opcion" && c.forma !== "botones");
              return (
                <div key={c.nombre} className={ancho ? "" : "sm:col-span-2"}>
                  <CampoPanel
                    id={idCampo(b, c.nombre)}
                    campo={c}
                    valor={leer(docs[b.documento], [...b.ruta, c.nombre])}
                    alCambiar={(v) => alCambiar(b.documento, [...b.ruta, c.nombre], v)}
                    resolver={resolver}
                    subidas={subidas}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <footer className="flex flex-wrap items-center gap-3 border-t border-canvas-border pt-4">
        <button
          type="button"
          onClick={alDeshacer}
          disabled={!cambiada}
          className="rounded-[10px] px-3 py-2.5 text-sm font-medium text-ink-muted underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-ink-subtle/50 disabled:no-underline"
        >
          Deshacer cambios
        </button>
      </footer>
    </article>
  );
}
