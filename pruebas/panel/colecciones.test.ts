import { describe, expect, test } from "vitest";
import cuentas from "../../contenido/cuentas.json";
import resenas from "../../contenido/resenas.json";
import servicios from "../../contenido/servicios.json";
import contenidos from "../../contenido/contenidos.json";
import type { Doc } from "@/lib/contenido/tipos";
import { consultarSobre } from "@/lib/contenido/consulta-local";
import { COLECCIONES, ORDEN_COLECCIONES } from "@/panel/esquema/colecciones";
import type { Campo, DefinicionColeccion, TipoColeccion, TipoElemento } from "@/panel/esquema/tipos";

/**
 * Etapa 5: las cuatro colecciones (Clientes, Contenidos, Servicios y
 * Reseñas). Las pruebas recorren los documentos REALES de contenido/ y
 * comprueban que ninguna clave con datos quede sin su campo en el panel (así
 * nada se pierde ni queda fuera del alcance del dueño), también dentro de los
 * objetos y de los elementos de las listas. Como los datos reales no traen
 * testimonio, redes ni resultados, se revisa además un documento completo
 * con la forma exacta del Studio (studio/schemaTypes/).
 */

type Obj = Record<string, unknown>;
const esObjeto = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);

const REALES: Record<TipoColeccion, Doc[]> = {
  cuenta: cuentas as unknown as Doc[],
  resena: resenas as unknown as Doc[],
  servicio: servicios as unknown as Doc[],
  contenido: contenidos as unknown as Doc[],
};

const camposDe = (def: DefinicionColeccion) => def.grupos.flatMap((g) => g.campos);

/**
 * Las claves con datos de `valor` que ningún campo declara, a cualquier
 * profundidad: objetos anidados («testimonio.cita», «redes.instagram») y
 * elementos de listas (y listas dentro de objetos: «redes.otros»). Un campo
 * con el nombre exacto de la clave la cubre entera (una imagen cubre su
 * `asset`, el slug su `current`, las referencias su `_ref`).
 * `vistos` cuenta cuántos elementos de cada tipo se revisaron.
 */
function sinCampo(valor: Obj, campos: Campo[], vistos: Map<string, number>, donde = ""): string[] {
  const faltan: string[] = [];
  const rutas = campos.map((c) => ({ partes: c.nombre.split("."), campo: c }));
  for (const [k, v] of Object.entries(valor)) {
    if (k.startsWith("_")) continue;
    const aqui = `${donde}${k}`;
    const exacto = rutas.find((r) => r.partes.length === 1 && r.partes[0] === k)?.campo;
    if (exacto) {
      if (exacto.clase === "lista" && Array.isArray(v)) faltan.push(...enLista(v, exacto.elemento, vistos, aqui));
      continue;
    }
    const hijos = rutas.filter((r) => r.partes.length > 1 && r.partes[0] === k);
    if (hijos.length === 0) faltan.push(aqui);
    else if (esObjeto(v)) faltan.push(...sinCampo(v, hijos.map((r) => ({ ...r.campo, nombre: r.partes.slice(1).join(".") }) as Campo), vistos, `${aqui}.`));
  }
  return faltan;
}

function enLista(lista: unknown[], elemento: TipoElemento, vistos: Map<string, number>, donde: string): string[] {
  return lista.flatMap((el, i) => {
    if (!esObjeto(el)) return [`${donde}[${i}]`];
    if (el._type !== elemento.tipo) return [`${donde}[${i}] (_type «${String(el._type)}», se esperaba «${elemento.tipo}»)`];
    vistos.set(elemento.tipo, (vistos.get(elemento.tipo) ?? 0) + 1);
    return sinCampo(el, elemento.campos, vistos, `${donde}[${i}].`);
  });
}

/** Lee «a.b.c» dentro de un objeto. */
const leer = (o: Obj, nombre: string): unknown =>
  nombre.split(".").reduce<unknown>((v, k) => (esObjeto(v) ? v[k] : undefined), o);

/** Los campos declarados que no tienen valor en `valor` (también dentro de los elementos de las listas). */
function sinValor(valor: Obj, campos: Campo[], donde = ""): string[] {
  return campos.flatMap((c) => {
    const v = leer(valor, c.nombre);
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return [`${donde}${c.nombre}`];
    if (c.clase === "lista" && Array.isArray(v)) return v.flatMap((el, i) => sinValor(el as Obj, c.elemento.campos, `${donde}${c.nombre}[${i}].`));
    return [];
  });
}

const imagen = (id: string) => ({ _type: "image", asset: { _type: "reference", _ref: `image-${id}-800x800-png` } });

/** Un cliente con TODOS los campos del Studio, con la forma exacta en que Sanity los guarda. */
const CUENTA_COMPLETA = {
  _id: "cuenta-prueba",
  _type: "cuenta",
  nombre: "Cliente de prueba",
  slug: { _type: "slug", current: "cliente-de-prueba" },
  activa: true,
  orden: 3,
  logo: imagen("logo"),
  logoCircular: imagen("logocircular"),
  portada: imagen("portada"),
  categoria: "Gastronomía",
  ciudad: "Cuenca",
  resumen: "Una frase corta de lo que se hizo.",
  servicios: [{ _key: "servicio-crm", _type: "reference", _ref: "servicio-crm" }],
  reto: "El reto.",
  enfoque: "Lo que hicimos.",
  resultados: [
    { _key: "r1", _type: "resultado", valor: "3x", etiqueta: "leads por semana" },
    { _key: "r2", _type: "resultado", valor: "-40%", etiqueta: "costo por cliente" },
  ],
  testimonio: { _type: "testimonio", cita: "Muy buenos.", autor: "Ana Pérez", cargo: "Gerente General, Prueba" },
  redes: {
    _type: "redesSociales",
    instagram: "https://instagram.com/prueba",
    facebook: "https://facebook.com/prueba",
    tiktok: "https://tiktok.com/@prueba",
    sitioWeb: "https://prueba.com",
    otros: [{ _key: "e1", _type: "enlace", etiqueta: "Menú", url: "https://prueba.com/menu" }],
  },
} as unknown as Doc;

const RESENA_COMPLETA = {
  _id: "resena-prueba",
  _type: "resena",
  nombre: "Ana Pérez",
  estrellas: 4,
  comentario: "Muy buenos.",
  empresa: "Prueba",
  foto: imagen("foto"),
  enlaceOriginal: "https://maps.app.goo.gl/prueba",
  fecha: "hace 2 semanas",
  activa: true,
  orden: 1,
} as unknown as Doc;

const CONTENIDO_COMPLETO = {
  _id: "contenido-prueba",
  _type: "contenido",
  titulo: "Spot de verano",
  cuenta: { _type: "reference", _ref: "cuenta-taitico" },
  tipoMedia: "video",
  imagen: imagen("imagen"),
  tipoVideo: "archivo",
  youtubeId: "AbC123xYz",
  archivoVideo: { _type: "file", asset: { _type: "reference", _ref: "file-abc-mp4" } },
  poster: imagen("poster"),
  formatoVideo: "Spot 30s",
  relacionAspecto: "9/16",
  descripcion: "Para la temporada.",
  categoria: "Campaña",
  fecha: "2026-11-26",
  orden: 2,
  publicado: true,
} as unknown as Doc;

const SERVICIO_COMPLETO = {
  _id: "servicio-prueba",
  _type: "servicio",
  nombre: "Branding",
  titulo: "Branding",
  descripcion: "De la versión anterior.",
  imagen: imagen("servicio"),
} as unknown as Doc;

const COMPLETOS: Record<TipoColeccion, Doc> = {
  cuenta: CUENTA_COMPLETA,
  resena: RESENA_COMPLETA,
  servicio: SERVICIO_COMPLETO,
  contenido: CONTENIDO_COMPLETO,
};

test("las cuatro pestañas, en el orden del menú del Studio y con Reseñas al final", () => {
  expect(ORDEN_COLECCIONES).toEqual(["cuenta", "contenido", "servicio", "resena"]);
  expect(Object.keys(COLECCIONES).sort()).toEqual([...ORDEN_COLECCIONES].sort());
  expect(ORDEN_COLECCIONES.map((t) => COLECCIONES[t].titulo)).toEqual(["Clientes", "Contenidos", "Servicios", "Reseñas"]);
  for (const t of ORDEN_COLECCIONES) {
    expect(COLECCIONES[t].tipo).toBe(t);
    expect(COLECCIONES[t].prefijoId).toBe(`${t}-`);
  }
});

test("los datos reales se recorrieron de verdad (no pasó por estar vacíos)", () => {
  expect(REALES.cuenta).toHaveLength(26);
  expect(REALES.resena).toHaveLength(16);
  expect(REALES.servicio).toHaveLength(6);
});

describe.each(ORDEN_COLECCIONES)("%s", (tipo) => {
  const def = COLECCIONES[tipo];
  const campos = camposDe(def);

  test("cada clave con datos de cada documento real tiene su campo (primer segmento del nombre)", () => {
    const declarados = new Set(campos.map((c) => c.nombre.split(".")[0]));
    for (const doc of REALES[tipo]) {
      const sinDeclarar = Object.keys(doc).filter((k) => !k.startsWith("_") && !declarados.has(k));
      expect(sinDeclarar, doc._id).toEqual([]);
    }
  });

  test("también dentro de los objetos y de los elementos de las listas", () => {
    const vistos = new Map<string, number>();
    for (const doc of REALES[tipo]) expect(sinCampo(doc, campos, vistos), doc._id).toEqual([]);
  });

  test("un documento completo, con la forma del Studio: todas sus claves tienen campo y todos los campos tienen dato", () => {
    const vistos = new Map<string, number>();
    const completo = COMPLETOS[tipo];
    expect(sinCampo(completo, campos, vistos)).toEqual([]);
    expect(sinValor(completo, campos)).toEqual([]);
    if (tipo === "cuenta") {
      expect(vistos.get("resultado")).toBe(2);
      expect(vistos.get("enlace")).toBe(1);
    }
  });

  test("ningún nombre de campo se repite dentro de la colección ni dentro de un elemento", () => {
    const revisar = (lista: Campo[], donde: string) => {
      const nombres = lista.map((c) => c.nombre);
      expect(nombres.filter((n, i) => nombres.indexOf(n) !== i), donde).toEqual([]);
      for (const c of lista) if (c.clase === "lista") revisar(c.elemento.campos, `${donde} › ${c.nombre}`);
    };
    revisar(campos, tipo);
  });

  test("los grupos tienen título en MAYÚSCULAS y al menos un campo", () => {
    for (const g of def.grupos) {
      expect(g.titulo).toBe(g.titulo.toUpperCase());
      expect(g.campos.length, g.titulo).toBeGreaterThan(0);
    }
  });

  test("lo que nace con un documento nuevo, los únicos, el slug y las referencias apuntan a campos declarados", () => {
    const nombres = new Set(campos.map((c) => c.nombre));
    const primeros = new Set(campos.map((c) => c.nombre.split(".")[0]));
    for (const k of Object.keys(def.nuevo())) expect(nombres.has(k), k).toBe(true);
    for (const u of def.unicos ?? []) expect(primeros.has(u.campo.split(".")[0]), u.campo).toBe(true);
    for (const c of campos) {
      if (c.clase === "slug") expect(nombres.has(c.desde), c.nombre).toBe(true);
      if (c.clase === "referencia" || c.clase === "referencias") expect(ORDEN_COLECCIONES).toContain(c.a);
    }
  });

  test("el nombre en la lista nunca queda vacío y los reales usan su propio nombre", () => {
    for (const doc of REALES[tipo]) {
      const r = def.resumen(doc);
      expect(r.trim(), doc._id).not.toBe("");
      expect(r, doc._id).not.toMatch(/sin (nombre|título)/i);
    }
    // Un documento recién creado (vacío) también tiene un nombre que mostrar.
    expect(def.resumen({ _id: `${tipo}-nuevo`, _type: tipo, ...def.nuevo() }).trim()).not.toBe("");
  });

  test("el orden es estable: no depende de cómo vienen los documentos", () => {
    const docs = REALES[tipo];
    const ordenar = (lista: Doc[]) => [...lista].sort(def.orden).map((d) => d._id);
    const esperado = ordenar(docs);
    expect(ordenar([...docs].reverse())).toEqual(esperado);
    // Mezcla fija (sin azar): primero los de posición par y luego los impares.
    expect(ordenar([...docs.filter((_, i) => i % 2 === 0), ...docs.filter((_, i) => i % 2 === 1)])).toEqual(esperado);
    // Sin empates: dos documentos distintos nunca comparan igual.
    for (let i = 0; i < docs.length; i++) for (let j = 0; j < docs.length; j++) if (i !== j) expect(def.orden!(docs[i], docs[j])).not.toBe(0);
  });
});

test("Clientes: la lista sigue el orden de la web (order(orden asc)); ninguno real está apagado", async () => {
  const web = await consultarSobre<string[]>(REALES.cuenta, `*[_type == "cuenta" && activa == true] | order(orden asc)._id`);
  const panel = [...REALES.cuenta].sort(COLECCIONES.cuenta.orden).map((d) => d._id);
  expect(panel).toEqual(web);
  expect(REALES.cuenta.filter((d) => COLECCIONES.cuenta.oculto!(d))).toEqual([]);
  const baby = REALES.cuenta.find((d) => d._id === "cuenta-baby-dance")!;
  expect(COLECCIONES.cuenta.resumen(baby)).toBe("Baby Dance");
  expect(COLECCIONES.cuenta.detalle!(baby)).toBe("Moda infantil");
  // La web solo muestra las cuentas con activa == true: sin el valor, cuenta como apagada.
  expect(COLECCIONES.cuenta.oculto!({ _id: "x", _type: "cuenta" })).toBe(true);
  expect(COLECCIONES.cuenta.oculto!({ _id: "x", _type: "cuenta", activa: false })).toBe(true);
});

test("Reseñas: la lista sigue el orden de la web (orden y, sin número, las más nuevas primero)", async () => {
  const query = `*[_type == "resena" && activa != false] | order(orden asc, _createdAt desc)._id`;
  const web = await consultarSobre<string[]>(REALES.resena, query);
  expect([...REALES.resena].sort(COLECCIONES.resena.orden).map((d) => d._id)).toEqual(web);

  // Con números: los numerados primero (de menor a mayor) y luego los demás.
  const mezcla = REALES.resena.map((d, i) => (i % 3 === 0 ? { ...d, orden: 16 - i } : d));
  expect([...mezcla].sort(COLECCIONES.resena.orden).map((d) => d._id)).toEqual(await consultarSobre<string[]>(mezcla, query));

  expect(COLECCIONES.resena.detalle!(RESENA_COMPLETA)).toBe("★★★★ · Prueba");
  expect(COLECCIONES.resena.detalle!(REALES.resena[0])).toBe("★★★★★");
  // La web muestra las reseñas con activa != false: sin el valor, cuenta como encendida.
  expect(COLECCIONES.resena.oculto!({ _id: "x", _type: "resena" })).toBe(false);
  expect(COLECCIONES.resena.oculto!({ _id: "x", _type: "resena", activa: false })).toBe(true);
  expect(COLECCIONES.resena.nuevo()).toEqual({ activa: true, estrellas: 5 });
});

test("Servicios: el nombre vigente es `nombre`; el viejo con solo `titulo` se ve en la lista pero tachado", () => {
  const def = COLECCIONES.servicio;
  const viejo = REALES.servicio.find((d) => d.nombre === undefined)!;
  expect(viejo.titulo).toBe("Publicidad");
  expect(def.resumen(viejo)).toBe("Publicidad");
  expect(def.oculto!(viejo)).toBe(true);
  expect(REALES.servicio.filter((d) => d !== viejo).every((d) => !def.oculto!(d))).toBe(true);
  expect([...REALES.servicio].sort(def.orden).map((d) => def.resumen(d))).toEqual(["Audiovisual", "Bot IA", "Creatividad", "CRM", "Pauta", "Publicidad"]);
  expect(def.unicos).toEqual([{ campo: "nombre", mensaje: expect.stringMatching(/servicio con ese nombre/) }]);

  // Los servicios que usan los clientes existen todos.
  const ids = new Set(REALES.servicio.map((d) => d._id));
  for (const c of REALES.cuenta) for (const s of c.servicios as { _ref: string }[]) expect(ids.has(s._ref), s._ref).toBe(true);
});

test("Contenidos: oculto si no está publicado o no tiene cliente; el detalle dice el tipo", () => {
  const def = COLECCIONES.contenido;
  expect(def.oculto!(CONTENIDO_COMPLETO)).toBe(false);
  expect(def.oculto!({ ...CONTENIDO_COMPLETO, publicado: false })).toBe(true);
  expect(def.oculto!({ ...CONTENIDO_COMPLETO, publicado: undefined })).toBe(true);
  expect(def.oculto!({ ...CONTENIDO_COMPLETO, cuenta: undefined })).toBe(true);
  expect(def.detalle!(CONTENIDO_COMPLETO)).toBe("Video · Archivo");
  expect(def.detalle!({ _id: "c", _type: "contenido", tipoMedia: "imagen" })).toBe("Imagen · Sin cliente");
  expect(def.nuevo()).toEqual({ tipoMedia: "imagen", relacionAspecto: "16/9", publicado: true });

  // Los grupos de imagen y video separan los campos que el Studio ocultaba según el tipo.
  const grupo = (t: string) => def.grupos.find((g) => g.titulo === t)!.campos.map((c) => c.nombre);
  expect(grupo("SI ES IMAGEN")).toEqual(["imagen"]);
  expect(grupo("SI ES VIDEO")).toEqual(["tipoVideo", "youtubeId", "archivoVideo", "poster", "formatoVideo", "relacionAspecto"]);
  const cuenta = camposDe(def).find((c) => c.nombre === "cuenta");
  expect(cuenta).toMatchObject({ clase: "referencia", a: "cuenta", obligatorio: true });
});

test("Clientes: la dirección es un slug obligatorio que no se repite, y los servicios son referencias", () => {
  const campos = camposDe(COLECCIONES.cuenta);
  expect(campos.find((c) => c.nombre === "slug")).toMatchObject({ clase: "slug", desde: "nombre", obligatorio: true });
  expect(campos.find((c) => c.nombre === "servicios")).toMatchObject({ clase: "referencias", a: "servicio" });
  expect(COLECCIONES.cuenta.unicos?.map((u) => u.campo)).toEqual(["slug.current"]);
  // Las direcciones reales no se repiten hoy.
  const slugs = REALES.cuenta.map((d) => (d.slug as { current: string }).current);
  expect(new Set(slugs).size).toBe(slugs.length);
});
