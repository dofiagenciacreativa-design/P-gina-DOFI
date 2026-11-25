"use client";

import type { ResolverArchivo } from "@/lib/contenido/tipos";
import type { Campo } from "@/panel/esquema/tipos";

/**
 * Un campo del formulario según su clase (src/panel/esquema/tipos.ts).
 * No guarda nada: avisa cada cambio con `alCambiar` y el panel decide.
 */

const ENLACE_VALIDO = /^(https?:\/\/|mailto:|tel:|\/)/;
const largo = (t: string) => Array.from(t).length;

const estiloEntrada =
  "w-full rounded-[10px] border border-canvas-border bg-white px-3 py-2 text-[0.94rem] text-ink outline-none transition-colors placeholder:text-ink-subtle/70 focus:border-transparent focus:ring-2 focus:ring-brand";

function Contador({ n, max }: { n: number; max?: number }) {
  if (!max) return null;
  const pasado = n > max;
  return (
    <span
      className={`text-xs tabular-nums ${pasado ? "font-semibold text-[#B4520B]" : "text-ink-subtle"}`}
      title={pasado ? "Pasa del largo recomendado. Se puede guardar igual." : undefined}
    >
      {n}/{max}
    </span>
  );
}

function Etiqueta({ campo, id, derecha }: { campo: Campo; id: string; derecha?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {campo.titulo}
        {campo.obligatorio ? <span className="text-[#B4520B]"> *</span> : null}
      </label>
      {derecha}
    </div>
  );
}

function Nota({ children, aviso }: { children: React.ReactNode; aviso?: boolean }) {
  return <p className={`text-xs leading-snug ${aviso ? "font-medium text-[#B4520B]" : "text-ink-subtle"}`}>{children}</p>;
}

export function CampoPanel({
  campo,
  valor,
  alCambiar,
  id,
  resolver,
}: {
  campo: Campo;
  valor: unknown;
  alCambiar: (nuevo: unknown) => void;
  id: string;
  resolver: ResolverArchivo;
}) {
  const texto = typeof valor === "string" ? valor : "";
  const falta = campo.obligatorio && campo.clase !== "imagen" && campo.clase !== "booleano" && (valor === undefined || valor === null || texto.trim() === "") && typeof valor !== "number";

  switch (campo.clase) {
    case "texto":
    case "textoLargo": {
      const comun = {
        id,
        value: texto,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => alCambiar(e.target.value === "" ? undefined : e.target.value),
        className: estiloEntrada,
        "aria-invalid": falta || undefined,
      };
      return (
        <div className="flex flex-col gap-1.5">
          <Etiqueta campo={campo} id={id} derecha={<Contador n={largo(texto)} max={campo.max} />} />
          {campo.clase === "texto" ? (
            <input type="text" autoComplete="off" {...comun} />
          ) : (
            <textarea rows={campo.filas ?? 3} {...comun} className={`${estiloEntrada} resize-y`} />
          )}
          {falta ? <Nota aviso>Falta este dato.</Nota> : campo.ayuda ? <Nota>{campo.ayuda}</Nota> : null}
        </div>
      );
    }

    case "enlace": {
      const invalido = texto !== "" && !ENLACE_VALIDO.test(texto.trim());
      return (
        <div className="flex flex-col gap-1.5">
          <Etiqueta campo={campo} id={id} />
          <input
            id={id}
            type="text"
            inputMode="url"
            autoComplete="off"
            value={texto}
            onChange={(e) => alCambiar(e.target.value === "" ? undefined : e.target.value)}
            className={`${estiloEntrada} font-mono text-[0.85rem]`}
            aria-invalid={invalido || undefined}
          />
          {invalido ? (
            <Nota aviso>Tiene que empezar con «/» (una página de esta web) o con https:// (un enlace externo).</Nota>
          ) : campo.ayuda ? (
            <Nota>{campo.ayuda}</Nota>
          ) : null}
        </div>
      );
    }

    case "opcion": {
      if (campo.forma === "botones") {
        return (
          <div className="flex flex-col gap-1.5">
            <span id={id} className="text-sm font-semibold text-ink">
              {campo.titulo}
            </span>
            <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-1.5">
              {campo.opciones.map((o) => {
                const activa = valor === o.valor;
                return (
                  <button
                    key={o.valor}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    onClick={() => alCambiar(o.valor)}
                    className={`rounded-full border px-3 py-1 text-[0.82rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      activa ? "border-brand bg-brand text-white" : "border-canvas-border bg-white text-ink-muted hover:border-brand/40"
                    }`}
                  >
                    {o.titulo}
                  </button>
                );
              })}
            </div>
            {campo.ayuda ? <Nota>{campo.ayuda}</Nota> : null}
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-1.5">
          <Etiqueta campo={campo} id={id} />
          <select
            id={id}
            value={typeof valor === "string" ? valor : ""}
            onChange={(e) => alCambiar(e.target.value === "" ? undefined : e.target.value)}
            className={estiloEntrada}
          >
            <option value="">Sin elegir (la web usa la de siempre)</option>
            {campo.opciones.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.titulo}
              </option>
            ))}
          </select>
          {campo.ayuda ? <Nota>{campo.ayuda}</Nota> : null}
        </div>
      );
    }

    case "booleano": {
      const activo = typeof valor === "boolean" ? valor : (campo.porDefecto ?? false);
      return (
        <div className="flex items-center justify-between gap-3">
          <span id={id} className="text-sm font-semibold text-ink">
            {campo.titulo}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={activo}
            aria-labelledby={id}
            onClick={() => alCambiar(!activo)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
              activo ? "bg-brand" : "bg-ink-subtle/40"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${activo ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
        </div>
      );
    }

    case "numero": {
      return (
        <div className="flex flex-col gap-1.5">
          <Etiqueta campo={campo} id={id} />
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={campo.min}
            max={campo.max}
            step={campo.paso ?? 1}
            value={typeof valor === "number" ? valor : ""}
            placeholder="0"
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              alCambiar(Number.isFinite(n) ? n : undefined);
            }}
            className={`${estiloEntrada} tabular-nums`}
          />
          {campo.ayuda ? <Nota>{campo.ayuda}</Nota> : null}
        </div>
      );
    }

    case "lineas": {
      const lineas = Array.isArray(valor) ? valor.map((l) => (typeof l === "string" ? l : "")) : [];
      const usadas = lineas.filter((l) => l.trim() !== "").length;
      const larga = campo.maxPorLinea ? lineas.some((l) => largo(l) > campo.maxPorLinea!) : false;
      const muchas = campo.maxLineas ? usadas > campo.maxLineas : false;
      return (
        <div className="flex flex-col gap-1.5">
          <Etiqueta
            campo={campo}
            id={id}
            derecha={
              campo.maxLineas ? (
                <span className={`text-xs tabular-nums ${muchas ? "font-semibold text-[#B4520B]" : "text-ink-subtle"}`}>
                  {usadas}/{campo.maxLineas} líneas
                </span>
              ) : null
            }
          />
          <textarea
            id={id}
            rows={Math.max(2, lineas.length)}
            value={lineas.join("\n")}
            onChange={(e) => alCambiar(e.target.value === "" ? undefined : e.target.value.split("\n"))}
            className={`${estiloEntrada} resize-y font-display font-semibold uppercase leading-snug tracking-tight`}
          />
          {muchas ? (
            <Nota aviso>Caben {campo.maxLineas} líneas como máximo.</Nota>
          ) : larga ? (
            <Nota aviso>Alguna línea pasa de {campo.maxPorLinea} letras: puede no caber en el banner.</Nota>
          ) : campo.ayuda ? (
            <Nota>{campo.ayuda}</Nota>
          ) : null}
        </div>
      );
    }

    case "imagen": {
      const info = resolver(valor);
      const miniatura = info ? (info.url.includes("cdn.sanity.io") ? `${info.url}?w=480&auto=format` : info.url) : null;
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">{campo.titulo}</span>
          <div className="flex items-center gap-3 rounded-[12px] border border-canvas-border bg-white p-2">
            {miniatura ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={miniatura} alt="" className="h-16 w-24 rounded-lg bg-canvas-raised object-cover" />
            ) : (
              <span className="grid h-16 w-24 place-items-center rounded-lg bg-canvas-raised text-xs text-ink-subtle">Sin foto</span>
            )}
            <div className="flex min-w-0 flex-col gap-0.5 text-xs text-ink-subtle">
              {info?.ancho && info.alto ? (
                <span className="tabular-nums">
                  {info.ancho} × {info.alto} px
                </span>
              ) : null}
              <span>Cambiar la foto se activa en la etapa 3, junto con la biblioteca de archivos.</span>
            </div>
          </div>
        </div>
      );
    }
  }
}
