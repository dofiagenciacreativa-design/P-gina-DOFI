import type { Doc } from "@/lib/contenido/tipos";
import { NOMBRE_PAGINA, definicionBloque, type PaginaServicio } from "./bloques";
import type { SeccionPanel } from "./tipos";

/**
 * Las secciones de una página de servicio en el panel: una por elemento de
 * `sections[]` del documento, en su orden, con los campos de su tipo de
 * bloque (src/panel/esquema/bloques.ts). Cada campo escribe dentro de
 * `sections[_key == …]`, igual que el Studio.
 */

export const DOCUMENTO_DE_PAGINA: Record<PaginaServicio, string> = {
  marketing: "marketingDigitalPage",
  trafico: "traficoAdsPage",
  feniax: "chatbotsCrmPage",
  asesorias: "asesoriasPage",
};

export type SeccionCruda = Record<string, unknown> & { _key: string; _type: string };

export const seccionesCrudas = (doc: Doc | undefined): SeccionCruda[] =>
  Array.isArray(doc?.sections) ? (doc.sections as SeccionCruda[]).filter((s) => s && typeof s._key === "string") : [];

export function seccionesDeServicio(pagina: PaginaServicio, docs: Record<string, Doc>): SeccionPanel[] {
  const documento = DOCUMENTO_DE_PAGINA[pagina];
  const crudas = seccionesCrudas(docs[documento]);
  const repetidos = new Map<string, number>();
  const total = new Map<string, number>();
  for (const s of crudas) total.set(s._type, (total.get(s._type) ?? 0) + 1);

  return crudas.map((s) => {
    const def = definicionBloque(s._type, pagina);
    const n = (repetidos.get(s._type) ?? 0) + 1;
    repetidos.set(s._type, n);
    const oculta = s.activo === false;
    const titulo = (total.get(s._type) ?? 0) > 1 ? `${def.titulo} ${n}` : def.titulo;
    const lista = [s.logros, s.pasos, s.categorias, s.plataformas].find(Array.isArray);
    const cuenta = lista ? lista.length : undefined;
    return {
      clave: s._key,
      titulo,
      icono: def.icono,
      apareceEn: `${NOMBRE_PAGINA[pagina]}${typeof s.titulo === "string" && s.titulo ? ` · «${s.titulo}»` : ""}${oculta ? " · oculta" : ""}`,
      ayuda: def.ayuda,
      vista: s._key,
      cuenta,
      aviso: def.aviso,
      oculta,
      bloques: def.grupos.map((g) => ({
        titulo: g.titulo,
        nota: g.nota,
        documento,
        ruta: ["sections", { _key: s._key }],
        campos: g.campos,
      })),
    };
  });
}
