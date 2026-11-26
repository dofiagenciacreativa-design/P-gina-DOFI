"use client";

import { useState } from "react";

/** Pantalla de entrada del panel: una sola contraseña (secreto PANEL_CLAVE del Worker). */
export function Entrar({ faltan, alEntrar }: { faltan: string[]; alEntrar: () => void }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      });
      if (r.ok) {
        setClave("");
        alEntrar();
        return;
      }
      setError(((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? "No se pudo entrar.");
    } catch {
      setError("No hay conexión. Revisa el internet e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="panel-dofi grid min-h-screen place-items-center bg-abyss px-4 font-sans text-foam">
      <style>{`body:has(.panel-dofi) > .grain-layer, body:has(.panel-dofi) > a[aria-label="Ir al formulario de contacto"] { display: none !important; }`}</style>
      <form onSubmit={entrar} className="flex w-full max-w-sm flex-col gap-4 rounded-[20px] bg-white/[0.06] p-6 ring-1 ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-dofi-compact-160.webp" alt="DOFI" width={160} height={130} className="h-12 w-auto self-start" />
        <h1 className="font-display text-xl font-bold">Panel de contenido</h1>
        <label htmlFor="clave-panel" className="text-sm text-foam/80">
          Contraseña
        </label>
        <input
          id="clave-panel"
          type="password"
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="rounded-[10px] border border-white/15 bg-white/10 px-3 py-2.5 text-foam outline-none focus:ring-2 focus:ring-accent"
          required
        />
        {error ? <p className="text-sm font-medium text-accent-lift">{error}</p> : null}
        {faltan.length ? (
          <p className="text-sm text-foam/70">Todavía falta configurar en Cloudflare: {faltan.join("; ")}.</p>
        ) : null}
        <button
          type="submit"
          disabled={enviando || !clave}
          className="rounded-[10px] bg-accent px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.06em] text-ink disabled:opacity-50"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
