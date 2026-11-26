import type { Doc } from "./tipos";

/**
 * Las colecciones (listas de documentos) de contenido/: un archivo por tipo,
 * con los documentos ordenados por _id (como los escribió la copia desde
 * Sanity). Al publicar, el servidor lee el archivo de la rama en ese momento
 * y reemplaza, agrega o quita solo los documentos que cambiaron
 * (docs/panel-propio/plan-etapa-5.md).
 */

export const ARCHIVO_DE_COLECCION: Record<string, string> = {
  cuenta: "contenido/cuentas.json",
  resena: "contenido/resenas.json",
  servicio: "contenido/servicios.json",
  contenido: "contenido/contenidos.json",
};

/** Un documento que el panel manda a borrar: { _id, _type, __borrar: true }. */
export const BORRAR = "__borrar";

/** _id aceptable para un documento de colección (nada de borradores de Sanity ni rutas raras). */
export const ID_DE_COLECCION = /^(?!drafts\.)[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

/** Lo que no se puede repetir en cada colección, con el mensaje para el propietario. */
const UNICOS: Record<string, { valor: (d: Doc) => unknown; mensaje: (v: string) => string }> = {
  cuenta: {
    valor: (d) => (d.slug as { current?: unknown } | undefined)?.current,
    mensaje: (v) => `Hay dos clientes con la misma dirección «/clientes/${v}». Cambia una de las dos.`,
  },
  servicio: {
    valor: (d) => d.nombre ?? d.titulo,
    mensaje: (v) => `Hay dos servicios llamados «${v}». Cambia el nombre de uno.`,
  },
};

/** El primer valor repetido de la colección, como mensaje; null si no hay. */
export function repetido(lista: Doc[], tipo: string): string | null {
  const regla = UNICOS[tipo];
  if (!regla) return null;
  const vistos = new Set<string>();
  for (const d of lista) {
    const v = regla.valor(d);
    if (typeof v !== "string" || !v.trim()) continue;
    const clave = v.trim().toLowerCase();
    if (vistos.has(clave)) return regla.mensaje(v.trim());
    vistos.add(clave);
  }
  return null;
}

/**
 * Aplica los cambios a la lista actual: reemplaza los que existen, agrega
 * los nuevos y quita los marcados con __borrar. Devuelve la lista ordenada
 * por _id. `ahora` marca _updatedAt (y _createdAt de los nuevos).
 */
export function mezclarColeccion(actuales: Doc[], cambios: Doc[], ahora: string): Doc[] {
  const porId = new Map(actuales.map((d) => [d._id, d]));
  for (const c of cambios) {
    if (c[BORRAR] === true) {
      porId.delete(c._id);
      continue;
    }
    const antes = porId.get(c._id);
    const { [BORRAR]: _b, ...limpio } = c;
    void _b;
    porId.set(c._id, {
      ...limpio,
      _createdAt: (antes?._createdAt as string | undefined) ?? (limpio._createdAt as string | undefined) ?? ahora,
      _updatedAt: ahora,
    } as Doc);
  }
  return [...porId.values()].sort((a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0));
}
