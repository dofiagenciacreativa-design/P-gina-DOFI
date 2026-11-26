"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowSquareOut, ArrowsOut, X } from "@phosphor-icons/react";
import { armarPaginaInicio } from "@/lib/inicio";
import { resolverDeActivos, type Activo } from "@/lib/contenido/archivos-activos";
import { proyectarPaginaInicio } from "@/lib/contenido/proyecciones/pagina-inicio";
import type { Doc } from "@/lib/contenido/tipos";
import { seccionesInicio } from "@/panel/esquema/inicio";
import type { Ruta, SeccionPanel } from "@/panel/esquema/tipos";
import { escribir, leer } from "@/panel/motor/rutas";
import { TarjetaSeccion } from "@/panel/motor/TarjetaSeccion";
import { Marco } from "@/panel/vista-previa/Marco";
import type { Dispositivo, ModoVista, VistaPrevia } from "@/panel/vista-previa/mensajes";
import { IconoSeccion } from "./iconos";

/**
 * El panel (etapa 1): la página de Inicio, editable en memoria, con la vista
 * previa al lado. Nada se guarda todavía (docs/panel-propio/cambios-2026-11-24.md §7).
 */

const PESTANAS = ["Inicio", "Marketing Digital", "Tráfico / Ads", "ChatBots / CRM", "Asesorías", "Clientes", "Reseñas", "Archivos"];

/** Esconde, solo en esta página, el grano y el botón de WhatsApp que el layout del sitio pone en todas. */
const SIN_ADORNOS_DEL_SITIO = `body:has(.panel-dofi) > .grain-layer, body:has(.panel-dofi) > a[aria-label="Ir al formulario de contacto"] { display: none !important; }`;

const mismo = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Las zonas de los documentos que toca una sección: si alguna difiere del original, la sección cambió. */
function zonas(s: SeccionPanel, original: Record<string, Doc>): { documento: string; ruta: Ruta }[] {
  const vistas = new Set<string>();
  const salida: { documento: string; ruta: Ruta }[] = [];
  for (const b of s.bloques) {
    // Un elemento de lista que no existía en el original (p. ej. tarjetas copiadas de fábrica):
    // la zona es la lista entera.
    const corte = b.ruta.findIndex((seg, i) => typeof seg === "object" && leer(original[b.documento], b.ruta.slice(0, i + 1)) === undefined);
    const ruta = corte >= 0 ? b.ruta.slice(0, corte) : b.ruta;
    const id = `${b.documento}:${JSON.stringify(ruta)}`;
    if (!vistas.has(id)) {
      vistas.add(id);
      salida.push({ documento: b.documento, ruta });
    }
  }
  return salida;
}

export function Panel({
  documentos,
  activos,
}: {
  documentos: Record<string, Doc>;
  /** Las fotos que usan los documentos (de Sanity o del repositorio). */
  activos: Activo[];
}) {
  const [original] = useState(documentos);
  const [docs, setDocs] = useState(documentos);
  const [clave, setClave] = useState("portada");
  const [dispositivo, setDispositivo] = useState<Dispositivo>("computadora");
  const [modo, setModo] = useState<ModoVista>("seccion");
  const [ampliada, setAmpliada] = useState(false);
  const [brindis, setBrindis] = useState<string | null>(null);

  const resolver = useMemo(() => resolverDeActivos(activos), [activos]);
  const secciones = useMemo(() => seccionesInicio(docs), [docs]);
  const seccion = secciones.find((s) => s.clave === clave) ?? secciones[0];

  const cambiadas = useMemo(
    () =>
      new Set(
        seccionesInicio(docs)
          .filter((s) => zonas(s, original).some((z) => !mismo(leer(docs[z.documento], z.ruta), leer(original[z.documento], z.ruta))))
          .map((s) => s.clave)
      ),
    [docs, original]
  );

  const datos = useMemo(
    () =>
      armarPaginaInicio(
        proyectarPaginaInicio({ paginaInicio: docs.paginaInicio ?? null, banners: docs.banners ?? null, hero: docs.hero ?? null }, resolver)
      ),
    [docs, resolver]
  );
  const vista: VistaPrevia = useMemo(() => ({ pagina: "inicio", datos, modo, vista: seccion.vista }), [datos, modo, seccion.vista]);

  const avisar = useCallback((texto: string) => setBrindis(texto), []);
  useEffect(() => {
    if (!brindis) return;
    const t = setTimeout(() => setBrindis(null), 4500);
    return () => clearTimeout(t);
  }, [brindis]);

  useEffect(() => {
    if (!ampliada) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAmpliada(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [ampliada]);

  // Aviso del navegador si se cierra la pestaña con cambios (no se guardan en esta etapa).
  useEffect(() => {
    if (cambiadas.size === 0) return;
    const alSalir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [cambiadas.size]);

  const cambiar = (documento: string, ruta: Ruta, valor: unknown) =>
    setDocs((d) => ({ ...d, [documento]: escribir(d[documento], ruta, valor) }));

  const deshacer = () =>
    setDocs((d) => {
      let nuevo = d;
      for (const z of zonas(seccion, original)) {
        nuevo = { ...nuevo, [z.documento]: escribir(nuevo[z.documento], z.ruta, leer(original[z.documento], z.ruta)) };
      }
      return nuevo;
    });

  const cambiada = cambiadas.has(seccion.clave);
  const n = cambiadas.size;

  const conmutadores = (
    <div className="flex flex-wrap gap-2">
      <div className="inline-flex rounded-[10px] bg-brand/10 p-[3px]" role="group" aria-label="Tamaño de pantalla">
        {(["computadora", "celular"] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={dispositivo === d}
            onClick={() => setDispositivo(d)}
            className="rounded-lg px-3 py-1 text-[0.82rem] text-ink-muted aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-ink aria-pressed:shadow-sm"
          >
            {d === "computadora" ? "Computadora" : "Celular"}
          </button>
        ))}
      </div>
      <div className="inline-flex rounded-[10px] bg-brand/10 p-[3px]" role="group" aria-label="Qué mostrar">
        {(["seccion", "completa"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={modo === m}
            onClick={() => setModo(m)}
            className="rounded-lg px-3 py-1 text-[0.82rem] text-ink-muted aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-ink aria-pressed:shadow-sm"
          >
            {m === "seccion" ? "Esta sección" : "Página completa"}
          </button>
        ))}
      </div>
    </div>
  );

  const estado = cambiada ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0E3] px-2.5 py-1 font-display text-[0.68rem] font-bold tracking-[0.1em] text-[#8A3F08]">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      CAMBIOS SIN GUARDAR
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E2F3EA] px-2.5 py-1 font-display text-[0.68rem] font-bold tracking-[0.1em] text-[#1F6B47]">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      PUBLICADO
    </span>
  );

  return (
    <div className="panel-dofi min-h-screen bg-canvas font-sans text-ink">
      <style>{SIN_ADORNOS_DEL_SITIO}</style>

      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-abyss px-4 py-2.5 text-foam sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-dofi-compact-160.webp" alt="DOFI" width={160} height={130} className="h-9 w-auto" />
        <span className="font-display text-[0.95rem] font-semibold text-foam/80">Panel</span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-2 text-[0.85rem] text-foam/85" aria-live="polite">
          <span className={`h-2 w-2 rounded-full ${n ? "bg-accent" : "bg-[#5FD39A]"}`} />
          {n ? `${n} ${n === 1 ? "sección cambiada" : "secciones cambiadas"} sin guardar` : "Igual a la web publicada"}
        </span>
        <button
          type="button"
          onClick={() => avisar("«Publicar cambios» se activa en la etapa 3: subirá a la web todo lo guardado y tardará unos 5 a 7 minutos.")}
          className="rounded-[10px] bg-white/10 px-3.5 py-2 text-[0.88rem] font-semibold text-foam/55"
          aria-disabled="true"
        >
          Publicar cambios
        </button>
      </header>

      <p className="border-b border-brand/15 bg-brand/[0.07] px-4 py-2 text-[0.85rem] text-brand sm:px-6">
        <strong>Etapa 1, de prueba:</strong> puedes cambiar los textos y ver al instante cómo quedan, pero todavía nada se guarda ni se publica. Si recargas la página, vuelve todo a como está en la web.
      </p>

      <nav className="flex items-end gap-1 overflow-x-auto border-b border-canvas-border px-4 pt-2 sm:px-6" aria-label="Páginas de la web">
        {PESTANAS.map((p) =>
          p === "Inicio" ? (
            <span key={p} aria-current="page" className="whitespace-nowrap border-b-[3px] border-brand px-3 py-2 text-[0.9rem] font-semibold text-brand">
              {p}
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => avisar(`«${p}» llega en una etapa próxima. En esta etapa se prueba el panel con la página de Inicio.`)}
              className="whitespace-nowrap border-b-[3px] border-transparent px-3 py-2 text-[0.9rem] text-ink-subtle hover:text-ink"
              title="Próximamente"
            >
              {p}
            </button>
          )
        )}
        <a href="/" target="_blank" rel="noopener" className="ml-auto inline-flex items-center gap-1 whitespace-nowrap px-1 py-2 text-[0.88rem] font-medium text-brand hover:underline">
          Ver la página <ArrowSquareOut size={15} weight="bold" aria-hidden="true" />
        </a>
      </nav>

      <div className="flex flex-col gap-1.5 px-4 pb-4 pt-5 sm:px-6">
        <h1 className="font-display text-[clamp(1.35rem,1rem+1.2vw,1.9rem)] font-extrabold uppercase tracking-[0.01em]">Contenido · Inicio</h1>
        <p className="max-w-4xl text-[0.93rem] text-ink-muted">
          Portada, tarjetas y los cuatro banners de la página de Inicio. Escribe en los campos y mira el cambio en la vista previa. Cuando se active «Guardar» (etapa 3), el cambio quedará listo para publicar; al publicar, saldrá a la web en unos 5 a 7 minutos.
        </p>
      </div>

      <div className="grid gap-5 px-4 pb-10 sm:px-6 md:grid-cols-2 xl:grid-cols-[210px_minmax(380px,0.85fr)_minmax(0,1.15fr)]">
        <aside className="min-w-0 md:col-span-2 xl:col-span-1">
          <h2 className="mb-2 font-display text-[0.72rem] font-bold tracking-[0.12em] text-ink-subtle">EN ESTA PÁGINA</h2>
          <ul className="flex gap-1 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
            {secciones.map((s) => (
              <li key={s.clave} className="shrink-0">
                <button
                  type="button"
                  aria-current={s.clave === seccion.clave ? "true" : undefined}
                  onClick={() => setClave(s.clave)}
                  className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-[10px] px-2.5 py-2 text-left text-[0.9rem] text-ink hover:bg-brand/[0.06] aria-[current=true]:bg-white aria-[current=true]:font-semibold aria-[current=true]:shadow-[0_0_0_1px_rgba(75,42,147,0.16)]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <IconoSeccion nombre={s.icono} tamano={15} />
                  </span>
                  <span className="min-w-0 truncate">{s.titulo}</span>
                  {cambiadas.has(s.clave) ? (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent" title="Con cambios sin guardar" />
                  ) : s.cuenta ? (
                    <span className="ml-auto rounded-full bg-brand/10 px-2 text-[0.75rem] tabular-nums text-ink-muted">{s.cuenta}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <TarjetaSeccion
          key={seccion.clave}
          seccion={seccion}
          docs={docs}
          cambiada={cambiada}
          resolver={resolver}
          alCambiar={cambiar}
          alCopiarDeFabrica={() => seccion.vacia && setDocs((d) => seccion.vacia!.aplicar(d))}
          alDeshacer={deshacer}
          alGuardar={() => avisar("«Guardar» se activa en la etapa 3, cuando el panel tenga su propia base de datos. Por ahora el cambio vive solo en esta pestaña.")}
        />

        <section className="flex min-w-0 flex-col gap-3 md:sticky md:top-3 md:self-start" aria-label="Vista previa">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {estado}
            <button
              type="button"
              onClick={() => setAmpliada(true)}
              className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[0.82rem] font-medium text-brand hover:bg-brand/[0.06]"
            >
              <ArrowsOut size={15} weight="bold" aria-hidden="true" /> Ampliar
            </button>
          </div>
          {conmutadores}
          {!ampliada ? <Marco vista={vista} dispositivo={dispositivo} /> : <div className="h-40 rounded-lg border border-dashed border-canvas-border" />}
          <p className="text-[0.78rem] text-ink-subtle">
            {modo === "seccion"
              ? "Dibujada con las mismas piezas de la web, en tu navegador, mientras escribes."
              : "La página entera, llevada hasta esta sección. Desplázate dentro de la vista previa para ver el resto."}
          </p>
        </section>
      </div>

      {ampliada ? (
        <div className="fixed inset-0 z-[80] flex flex-col gap-3 bg-abyss/95 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Vista previa ampliada">
          <div className="flex flex-wrap items-center gap-3 text-foam">
            <span className="font-display text-sm font-semibold">{seccion.titulo}</span>
            <div className="rounded-xl bg-white p-1">{conmutadores}</div>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => setAmpliada(false)}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-white/10 px-3 py-1.5 text-sm font-semibold text-foam hover:bg-white/20"
            >
              <X size={15} weight="bold" aria-hidden="true" /> Cerrar (Esc)
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Marco vista={vista} dispositivo={dispositivo} ajustarAlto />
          </div>
        </div>
      ) : null}

      {brindis ? (
        <div
          role="status"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[90] w-[min(92vw,560px)] -translate-x-1/2 rounded-xl bg-abyss px-4 py-3 text-center text-[0.88rem] text-foam shadow-lg"
        >
          {brindis}
        </div>
      ) : null}
    </div>
  );
}
