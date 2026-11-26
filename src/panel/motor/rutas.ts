import type { Ruta, Segmento } from "@/panel/esquema/tipos";

/**
 * Leer y escribir dentro de un documento siguiendo una ruta
 * (["seccionesContenido", { _key: "abc" }, "ctaTexto"]). Escribir nunca
 * modifica el original: devuelve una copia con el cambio, para que React vea
 * el estado nuevo y el documento publicado siga intacto para comparar.
 */

type Obj = Record<string, unknown>;
const esObjeto = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);

/** Convierte "a.b" en ["a", "b"] y deja los demás segmentos como están. */
export function expandir(ruta: Ruta): Segmento[] {
  return ruta.flatMap((s): Segmento[] => (typeof s === "string" ? s.split(".") : [s]));
}

function indice(lista: unknown[], s: Segmento): number {
  if (typeof s === "number") return s;
  if (typeof s === "object") return lista.findIndex((e) => esObjeto(e) && e._key === s._key);
  return -1;
}

export function leer(valor: unknown, ruta: Ruta): unknown {
  let actual: unknown = valor;
  for (const s of expandir(ruta)) {
    if (Array.isArray(actual)) {
      const i = indice(actual, s);
      actual = i >= 0 ? actual[i] : undefined;
    } else if (esObjeto(actual) && typeof s === "string") {
      actual = actual[s];
    } else {
      return undefined;
    }
  }
  return actual;
}

function escribirEn(actual: unknown, segmentos: Segmento[], nuevo: unknown): unknown {
  if (segmentos.length === 0) return nuevo;
  const [s, ...resto] = segmentos;

  if (Array.isArray(actual)) {
    const i = indice(actual, s);
    if (i < 0) throw new Error(`No existe el elemento ${JSON.stringify(s)} en la lista`);
    const copia = actual.slice();
    copia[i] = escribirEn(actual[i], resto, nuevo);
    return copia;
  }

  if (typeof s !== "string") throw new Error(`Se esperaba una lista para ${JSON.stringify(s)}`);
  const base = esObjeto(actual) ? actual : {};
  const copia: Obj = { ...base };
  const siguiente = escribirEn(base[s], resto, nuevo);
  if (siguiente === undefined) delete copia[s];
  else copia[s] = siguiente;
  return copia;
}

/** Devuelve una copia de `valor` con `nuevo` en `ruta`. `undefined` borra el campo. */
export function escribir<T>(valor: T, ruta: Ruta, nuevo: unknown): T {
  return escribirEn(valor, expandir(ruta), nuevo) as T;
}

/** Clave de 12 caracteres hexadecimales para los elementos nuevos de una lista (_key). */
export function nuevaClave(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Copia un elemento con claves nuevas (también las de sus listas internas). */
export function conClavesNuevas(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(conClavesNuevas);
  if (v && typeof v === "object") {
    const o = Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, conClavesNuevas(x)]));
    return "_key" in o ? { ...o, _key: nuevaClave() } : o;
  }
  return v;
}
