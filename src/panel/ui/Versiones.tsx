"use client";

import { useEffect, useState } from "react";
import { ClockCounterClockwise, X } from "@phosphor-icons/react";

/**
 * «Versiones anteriores» de una sección o documento (plan-etapa-5.md): las
 * publicaciones que tocaron su archivo (historial de git, por
 * /api/admin/historial) y «Traer esta versión», que la pone en el formulario
 * como cambio sin publicar para revisarla en la vista previa.
 */
type Version = { commit: string; fecha: string; mensaje: string };

const fechaLegible = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("es-EC", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export function Versiones({
  archivo,
  titulo,
  alTraer,
  alCerrar,
}: {
  archivo: string;
  titulo: string;
  /** Pone esa versión en el formulario; devuelve un mensaje si no se pudo (p. ej. la sección no existía). */
  alTraer: (contenido: unknown, fecha: string) => string | null;
  alCerrar: () => void;
}) {
  const [versiones, setVersiones] = useState<Version[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trayendo, setTrayendo] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/admin/historial?archivo=${encodeURIComponent(archivo)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { versiones?: Version[]; error?: string };
        if (!vivo) return;
        if (!r.ok) setError(j.error ?? "No se pudo leer el historial.");
        else setVersiones(j.versiones ?? []);
      })
      .catch(() => vivo && setError("No hay conexión. Vuelve a intentar."));
    return () => {
      vivo = false;
    };
  }, [archivo]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [alCerrar]);

  async function traer(v: Version) {
    setTrayendo(v.commit);
    setError(null);
    try {
      const r = await fetch(`/api/admin/historial?archivo=${encodeURIComponent(archivo)}&commit=${v.commit}`, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as { contenido?: unknown; error?: string };
      if (!r.ok) {
        setError(j.error ?? "No se pudo traer esa versión.");
        return;
      }
      const problema = alTraer(j.contenido, fechaLegible(v.fecha));
      if (problema) setError(problema);
      else alCerrar();
    } catch {
      setError("No hay conexión. Vuelve a intentar.");
    } finally {
      setTrayendo(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex justify-end bg-abyss/40" role="dialog" aria-modal="true" aria-label={`Versiones anteriores de ${titulo}`} onClick={alCerrar}>
      <div className="flex h-full w-[min(100vw,460px)] flex-col gap-3 overflow-y-auto bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <ClockCounterClockwise size={22} weight="bold" className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-extrabold uppercase tracking-[0.04em] text-ink">Versiones anteriores</h2>
            <p className="text-[0.83rem] text-ink-subtle">{titulo}</p>
          </div>
          <button type="button" onClick={alCerrar} className="rounded-lg p-1.5 text-ink-muted hover:bg-brand/10" aria-label="Cerrar">
            <X size={18} weight="bold" />
          </button>
        </div>
        <p className="rounded-xl bg-canvas px-3 py-2 text-[0.83rem] leading-snug text-ink-muted">
          Cada vez que se publicó un cambio quedó una versión. «Traer esta versión» la pone en el formulario como cambio sin publicar: revísala en la vista
          previa y, si sirve, pulsa «Publicar cambios». Nada se pierde: la versión de hoy también queda en el historial.
        </p>
        {error ? <p className="rounded-xl bg-[#FFF0E3] px-3 py-2 text-[0.85rem] text-[#8A3F08]">{error}</p> : null}
        {versiones === null && !error ? <p className="text-sm text-ink-subtle">Buscando las versiones…</p> : null}
        {versiones?.length === 0 ? <p className="text-sm text-ink-subtle">Todavía no hay versiones anteriores de esto.</p> : null}
        <ol className="flex flex-col gap-2">
          {versiones?.map((v, i) => (
            <li key={v.commit} className="flex flex-col gap-1.5 rounded-xl border border-canvas-border p-3">
              <span className="text-[0.88rem] font-semibold text-ink">
                {fechaLegible(v.fecha)}
                {i === 0 ? <span className="ml-2 rounded-full bg-[#E2F3EA] px-2 py-0.5 text-[0.7rem] font-bold text-[#1F6B47]">LA ÚLTIMA</span> : null}
              </span>
              <span className="text-[0.82rem] text-ink-muted">{v.mensaje}</span>
              <button
                type="button"
                onClick={() => void traer(v)}
                disabled={trayendo !== null}
                className="self-start rounded-full border border-brand px-3 py-1 text-[0.8rem] font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50"
              >
                {trayendo === v.commit ? "Trayendo…" : "Traer esta versión"}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
