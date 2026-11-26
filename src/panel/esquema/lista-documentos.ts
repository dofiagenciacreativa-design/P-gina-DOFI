import type { Doc } from "@/lib/contenido/tipos";
import { BORRAR } from "@/lib/contenido/colecciones";
import { COLECCIONES } from "./colecciones";
import type { SeccionPanel, TipoColeccion } from "./tipos";

/**
 * Las colecciones en el panel (etapa 5, plan-etapa-5.md): cada documento de
 * la colección es una «sección» de la pestaña, con los campos de su
 * definición (src/panel/esquema/colecciones.ts) escritos en la raíz del
 * documento. Un documento marcado con __borrar se quita al publicar.
 */

export const estaBorrado = (d: Doc | undefined) => d?.[BORRAR] === true;

/** Los documentos de un tipo, en el orden de su colección. */
export function documentosDe(tipo: TipoColeccion, docs: Record<string, Doc>): Doc[] {
  const def = COLECCIONES[tipo];
  const lista = Object.values(docs).filter((d) => d._type === tipo);
  const orden = def.orden ?? ((a: Doc, b: Doc) => def.resumen(a).localeCompare(def.resumen(b), "es"));
  return lista.sort(orden);
}

export function seccionesDeColeccion(tipo: TipoColeccion, docs: Record<string, Doc>, original: Record<string, Doc>): SeccionPanel[] {
  const def = COLECCIONES[tipo];
  return documentosDe(tipo, docs).map((d) => {
    const borrado = estaBorrado(d);
    const nuevo = !original[d._id];
    const actual = borrado ? (original[d._id] ?? d) : d;
    const detalle = def.detalle?.(actual) ?? "";
    return {
      clave: d._id,
      titulo: def.resumen(actual),
      icono: def.icono,
      apareceEn: [detalle, nuevo ? (def.femenino ? "nueva, sin publicar" : "nuevo, sin publicar") : "", borrado ? "se borra al publicar" : ""].filter(Boolean).join(" · ") || def.titulo,
      ayuda: def.ayuda,
      vista: d._id,
      oculta: borrado || (def.oculto?.(actual) ?? false),
      aviso: borrado ? `${def.femenino ? "Esta" : "Este"} ${def.singular} se borra al publicar. «Deshacer cambios» ${def.femenino ? "la" : "lo"} recupera.` : undefined,
      bloques: borrado
        ? []
        : def.grupos.map((g) => ({ titulo: g.titulo, nota: g.nota, documento: d._id, ruta: [], campos: g.campos })),
    };
  });
}

/** Un documento nuevo de la colección, con sus valores iniciales. */
export function documentoNuevo(tipo: TipoColeccion, clave: string): Doc {
  const def = COLECCIONES[tipo];
  return { _id: `${def.prefijoId}${clave}`, _type: tipo, ...def.nuevo() };
}

/** Quiénes usan un documento (lo referencian), para no borrar algo en uso. */
export function usadoPor(id: string, docs: Doc[]): Doc[] {
  const usa = (v: unknown): boolean => {
    if (Array.isArray(v)) return v.some(usa);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      return o._ref === id || Object.values(o).some(usa);
    }
    return false;
  };
  return docs.filter((d) => d._id !== id && !estaBorrado(d) && usa(d));
}

/** El nombre legible de cualquier documento (para «lo usa …»). */
export function nombreDeDocumento(d: Doc): string {
  const def = COLECCIONES[d._type as TipoColeccion];
  if (def) return `${def.singular} «${def.resumen(d)}»`;
  const nombres: Record<string, string> = {
    marketingDigitalPage: "la página Marketing Digital",
    traficoAdsPage: "la página Tráfico / Ads",
    chatbotsCrmPage: "la página ChatBots / CRM",
    asesoriasPage: "la página Asesorías",
    paginaInicio: "la página de Inicio",
    banners: "los banners del Inicio",
    hero: "la portada del Inicio",
  };
  return nombres[d._type] ?? d._id;
}
