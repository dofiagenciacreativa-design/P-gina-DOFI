"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, CaretRight, Copy, Plus, Trash } from "@phosphor-icons/react";

import type { ResolverArchivo } from "@/lib/contenido/tipos";
import type { Campo, TipoElemento } from "@/panel/esquema/tipos";
import { direccionParaAncho } from "@/lib/contenido/medios";
import { conClavesNuevas, escribir, leer, nuevaClave } from "./rutas";

/** Sube un archivo elegido y devuelve el valor nuevo del campo ({ _type, asset: { _ref } }). */
export type Subir = (archivo: File, avance: (texto: string) => void) => Promise<Record<string, unknown>>;

/** Cómo se suben las fotos y los videos (undefined = no se puede, p. ej. «solo para mirar»). */
export type Subidas = { foto?: Subir; video?: Subir; motivoSinVideo?: string };

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
  subidas,
}: {
  campo: Campo;
  valor: unknown;
  alCambiar: (nuevo: unknown) => void;
  id: string;
  resolver: ResolverArchivo;
  subidas: Subidas;
}) {
  const texto = typeof valor === "string" ? valor : "";
  const falta =
    campo.obligatorio &&
    (campo.clase === "texto" || campo.clase === "textoLargo" || campo.clase === "enlace") &&
    texto.trim() === "";

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

    case "imagen":
      return <CampoArchivo campo={campo} valor={valor} resolver={resolver} subir={subidas.foto} alCambiar={alCambiar} />;

    case "video":
      return (
        <CampoArchivo campo={campo} valor={valor} resolver={resolver} subir={subidas.video} motivoSinSubir={subidas.motivoSinVideo} alCambiar={alCambiar} />
      );

    case "lista":
      return <CampoLista campo={campo} valor={valor} alCambiar={alCambiar} id={id} resolver={resolver} subidas={subidas} />;
  }
}

/** Una lista de elementos (logros, pasos…): cada uno se abre para editar sus campos. */
function CampoLista({
  campo,
  valor,
  alCambiar,
  id,
  resolver,
  subidas,
}: {
  campo: Campo & { clase: "lista" };
  valor: unknown;
  alCambiar: (nuevo: unknown) => void;
  id: string;
  resolver: ResolverArchivo;
  subidas: Subidas;
}) {
  const elementos = (Array.isArray(valor) ? valor : []) as Record<string, unknown>[];
  const [abierto, setAbierto] = useState<string | null>(null);
  const tipo: TipoElemento = campo.elemento;
  const lleno = campo.max !== undefined && elementos.length >= campo.max;

  const poner = (lista: Record<string, unknown>[]) => alCambiar(lista);
  const mover = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= elementos.length) return;
    const copia = elementos.slice();
    [copia[i], copia[j]] = [copia[j], copia[i]];
    poner(copia);
  };
  const agregar = () => {
    const nuevo = { _key: nuevaClave(), _type: tipo.tipo, ...(tipo.nuevo?.() ?? {}) };
    poner([...elementos, nuevo]);
    setAbierto(nuevo._key);
  };
  const duplicar = (i: number) => {
    const copia = conClavesNuevas(elementos[i]) as Record<string, unknown>;
    poner([...elementos.slice(0, i + 1), copia, ...elementos.slice(i + 1)]);
    setAbierto(copia._key as string);
  };
  const quitar = (i: number) => {
    if (!window.confirm(`¿Quitar «${tipo.resumen(elementos[i])}» de la lista? (Puedes recuperarlo con «Deshacer cambios» antes de publicar.)`)) return;
    poner(elementos.filter((_, k) => k !== i));
  };

  const botonChico =
    "grid h-7 w-7 place-items-center rounded-lg text-ink-muted hover:bg-brand/10 hover:text-brand disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-ink">
          {campo.titulo} <span className="font-normal text-ink-subtle">({elementos.length})</span>
        </span>
        {campo.ayuda ? <Nota>{campo.ayuda}</Nota> : null}
      </div>
      {elementos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-canvas-border px-3 py-3 text-sm text-ink-subtle">{campo.vacia ?? "La lista está vacía."}</p>
      ) : null}
      <ol className="flex flex-col gap-1.5">
        {elementos.map((el, i) => {
          const clave = typeof el._key === "string" ? el._key : String(i);
          const abiertoEste = abierto === clave;
          return (
            <li key={clave} className="rounded-xl border border-canvas-border bg-canvas">
              <div className="flex items-center gap-1 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => setAbierto(abiertoEste ? null : clave)}
                  aria-expanded={abiertoEste}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[0.88rem] text-ink hover:bg-brand/[0.06]"
                >
                  <CaretRight
                    size={13}
                    weight="bold"
                    className={`shrink-0 text-ink-subtle transition-transform ${abiertoEste ? "rotate-90" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="tabular-nums text-ink-subtle">{i + 1}.</span>
                  <span className="truncate">{tipo.resumen(el)}</span>
                </button>
                <button type="button" className={botonChico} onClick={() => mover(i, -1)} disabled={i === 0} title="Subir" aria-label="Subir">
                  <ArrowUp size={14} weight="bold" />
                </button>
                <button
                  type="button"
                  className={botonChico}
                  onClick={() => mover(i, 1)}
                  disabled={i === elementos.length - 1}
                  title="Bajar"
                  aria-label="Bajar"
                >
                  <ArrowDown size={14} weight="bold" />
                </button>
                <button type="button" className={botonChico} onClick={() => duplicar(i)} disabled={lleno} title="Duplicar" aria-label="Duplicar">
                  <Copy size={14} weight="bold" />
                </button>
                <button type="button" className={botonChico} onClick={() => quitar(i)} title="Quitar" aria-label="Quitar">
                  <Trash size={14} weight="bold" />
                </button>
              </div>
              {abiertoEste ? (
                <div className="grid gap-3 border-t border-canvas-border bg-white p-3 sm:grid-cols-2">
                  {tipo.campos.map((c) => (
                    <div key={c.nombre} className={c.clase === "numero" ? "" : "sm:col-span-2"}>
                      <CampoPanel
                        id={`${id}-${clave}-${c.nombre}`.replace(/[^a-zA-Z0-9-]+/g, "-")}
                        campo={c}
                        valor={leer(el, [c.nombre])}
                        alCambiar={(v) => poner(elementos.map((x, k) => (k === i ? escribir(x, [c.nombre], v) : x)))}
                        resolver={resolver}
                        subidas={subidas}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={agregar}
        disabled={lleno}
        className="inline-flex items-center gap-1.5 self-start rounded-full border border-brand px-3 py-1 text-[0.82rem] font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50"
      >
        <Plus size={14} weight="bold" aria-hidden="true" /> Agregar {tipo.titulo.toLowerCase()}
      </button>
    </div>
  );
}


/** Un campo de foto o de video: lo que hay ahora y «Cambiar foto» / «Cambiar video». */
function CampoArchivo({
  campo,
  valor,
  resolver,
  subir,
  motivoSinSubir,
  alCambiar,
}: {
  campo: Campo;
  valor: unknown;
  resolver: ResolverArchivo;
  subir?: Subir;
  motivoSinSubir?: string;
  alCambiar: (nuevo: unknown) => void;
}) {
  const esVideo = campo.clase === "video";
  const entrada = useRef<HTMLInputElement>(null);
  const [avance, setAvance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const info = resolver(valor);
  const miniatura =
    info && !esVideo ? (info.url.includes("cdn.sanity.io") ? `${info.url}?w=480&auto=format` : (direccionParaAncho(info.url, 240) ?? info.url)) : null;

  async function elegido(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo || !subir) return;
    setError(null);
    try {
      const nuevo = await subir(archivo, setAvance);
      // El punto focal y el recorte eran del archivo anterior; el texto alternativo se conserva.
      const actual = (valor && typeof valor === "object" ? valor : {}) as Record<string, unknown>;
      const { asset: _a, hotspot: _h, crop: _c, ...resto } = actual;
      void _a;
      void _h;
      void _c;
      alCambiar({ ...resto, ...nuevo });
    } catch (err) {
      setError(err instanceof Error ? err.message : esVideo ? "No se pudo cambiar el video." : "No se pudo cambiar la foto.");
    } finally {
      setAvance(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{campo.titulo}</span>
      <div className="flex items-center gap-3 rounded-[12px] border border-canvas-border bg-white p-2">
        {esVideo ? (
          info ? (
            <video src={info.url} muted playsInline preload="metadata" className="h-24 w-[54px] rounded-lg bg-abyss object-cover" />
          ) : (
            <span className="grid h-24 w-[54px] place-items-center rounded-lg bg-canvas-raised text-center text-[0.7rem] text-ink-subtle">Sin video</span>
          )
        ) : miniatura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={miniatura} alt="" className="h-16 w-24 rounded-lg bg-canvas-raised object-cover" />
        ) : (
          <span className="grid h-16 w-24 place-items-center rounded-lg bg-canvas-raised text-xs text-ink-subtle">Sin foto</span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-ink-subtle">
          {!esVideo && info?.ancho && info.alto ? (
            <span className="tabular-nums">
              {info.ancho} × {info.alto} px
            </span>
          ) : null}
          {subir ? (
            <>
              <input
                ref={entrada}
                type="file"
                accept={esVideo ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"}
                className="hidden"
                onChange={elegido}
              />
              <button
                type="button"
                disabled={avance !== null}
                onClick={() => entrada.current?.click()}
                className="self-start rounded-full border border-brand px-3 py-1 text-[0.8rem] font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-60"
              >
                {avance ?? (esVideo ? "Cambiar video" : "Cambiar foto")}
              </button>
              <span>
                {esVideo
                  ? "MP4 o WebM, hasta 200 MB. Se sube a Cloudflare y se ve enseguida en la vista previa; sale a la web al publicar."
                  : "JPG, PNG o WebP, hasta 15 MB. La web la recibe en el mismo tamaño y en versiones más livianas."}
              </span>
            </>
          ) : motivoSinSubir ? (
            <span>{motivoSinSubir}</span>
          ) : null}
          {error ? <span className="font-medium text-[#B4520B]">{error}</span> : null}
        </div>
      </div>
      {campo.ayuda ? <Nota>{campo.ayuda}</Nota> : null}
    </div>
  );
}
