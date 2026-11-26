import { describe, expect, test } from "vitest";
import marketingDigital from "../../contenido/marketingDigitalPage.json";
import traficoAds from "../../contenido/traficoAdsPage.json";
import chatbotsCrm from "../../contenido/chatbotsCrmPage.json";
import asesorias from "../../contenido/asesoriasPage.json";
import type { Doc } from "@/lib/contenido/tipos";
import { TIPOS_DE_PAGINA, definicionBloque, type PaginaServicio } from "@/panel/esquema/bloques";
import { DOCUMENTO_DE_PAGINA, seccionesDeServicio } from "@/panel/esquema/servicio";
import type { Campo, TipoElemento } from "@/panel/esquema/tipos";

/**
 * Etapa 4b: Marketing Digital, Tráfico / Ads y ChatBots / CRM se editan
 * enteras. Las pruebas recorren los datos REALES de contenido/ y comprueban
 * que ninguna clave con datos quede sin su campo en el panel (así nada se
 * pierde ni queda fuera de alcance del dueño), también dentro de las listas
 * y de las listas dentro de listas.
 */

type Obj = Record<string, unknown>;
const esObjeto = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);

const DOCS: Record<PaginaServicio, Doc> = {
  marketing: marketingDigital as unknown as Doc,
  trafico: traficoAds as unknown as Doc,
  feniax: chatbotsCrm as unknown as Doc,
  asesorias: asesorias as unknown as Doc,
};
const PAGINAS = ["marketing", "trafico", "feniax"] as const;

const secciones = (pagina: PaginaServicio) => seccionesDeServicio(pagina, { [DOCUMENTO_DE_PAGINA[pagina]]: DOCS[pagina] });
const crudas = (pagina: PaginaServicio) => DOCS[pagina].sections as Obj[];
const camposDe = (pagina: PaginaServicio, clave: string) =>
  secciones(pagina)
    .find((s) => s.clave === clave)!
    .bloques.flatMap((b) => b.campos);

/**
 * Las claves con datos de `valor` que ningún campo declara, a cualquier
 * profundidad: objetos anidados («cta.texto», «chat.aviso.titulo») y elementos
 * de listas (y listas dentro de listas). Los elementos de otro _type (las
 * referencias a una Cuenta en empresas[]) no tienen campos: se saltan.
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
    if (!esObjeto(el) || el._type !== elemento.tipo) return [];
    vistos.set(elemento.tipo, (vistos.get(elemento.tipo) ?? 0) + 1);
    return sinCampo(el, elemento.campos, vistos, `${donde}[${i}].`);
  });
}

describe.each(PAGINAS)("%s", (pagina) => {
  test("una sección del panel por cada elemento de sections[], en orden, y todas con formulario", () => {
    const s = secciones(pagina);
    expect(s.map((x) => x.clave)).toEqual(crudas(pagina).map((x) => x._key));
    for (const x of s) {
      expect(x.aviso, x.titulo).toBeUndefined();
      for (const b of x.bloques) expect(b.ruta).toEqual(["sections", { _key: x.clave }]);
    }
  });

  test("cada clave con datos de cada sección tiene su campo (primer segmento del nombre)", () => {
    for (const cruda of crudas(pagina)) {
      const declarados = new Set(camposDe(pagina, cruda._key as string).map((c) => c.nombre.split(".")[0]));
      const sinDeclarar = Object.keys(cruda).filter((k) => !k.startsWith("_") && !declarados.has(k));
      expect(sinDeclarar, `${cruda._type}`).toEqual([]);
    }
  });

  test("también dentro de los objetos, de los elementos de cada lista y de las listas anidadas", () => {
    const vistos = new Map<string, number>();
    for (const cruda of crudas(pagina)) {
      expect(sinCampo(cruda, camposDe(pagina, cruda._key as string), vistos), `${cruda._type}`).toEqual([]);
    }
    // Las listas de los datos reales se recorrieron de verdad (no pasó por estar vacías).
    expect(vistos.get("pasoMetodo")).toBeGreaterThan(0);
    expect(vistos.get("categoriaIcono")).toBeGreaterThan(0);
    expect(vistos.get("empresaGiro")).toBeGreaterThan(0);
  });

  test("ningún nombre de campo se repite dentro de un bloque ni dentro de un elemento", () => {
    const revisar = (campos: Campo[], donde: string) => {
      const nombres = campos.map((c) => c.nombre);
      expect(nombres.filter((n, i) => nombres.indexOf(n) !== i), donde).toEqual([]);
      for (const c of campos) if (c.clase === "lista") revisar(c.elemento.campos, `${donde} › ${c.nombre}`);
    };
    for (const tipo of TIPOS_DE_PAGINA[pagina]) {
      const def = definicionBloque(tipo, pagina);
      revisar(def.grupos.flatMap((g) => g.campos), `${pagina}:${tipo}`);
      // DISEÑO al final, con Animaciones y Mostrar en la página.
      const ultimo = def.grupos[def.grupos.length - 1];
      expect(ultimo.titulo, `${pagina}:${tipo}`).toBe("DISEÑO");
      expect(ultimo.campos.slice(-2).map((c) => c.nombre)).toEqual(["animar", "activo"]);
    }
  });
});

test("Tráfico: los giros con sus empresas y las métricas con sus optimizaciones (hitos)", () => {
  const vistos = new Map<string, number>();
  const clientes = crudas("trafico").find((s) => s._type === "metricsClientsBanner")!;
  expect(sinCampo(clientes, camposDe("trafico", clientes._key as string), vistos)).toEqual([]);
  expect(vistos.get("categoriaIcono")).toBe((clientes.categorias as unknown[]).length);
  expect(vistos.get("hito")).toBeGreaterThan(0);
  const plataformas = crudas("trafico").find((s) => s._type === "platformsBanner")!;
  expect(sinCampo(plataformas, camposDe("trafico", plataformas._key as string), vistos)).toEqual([]);
  expect(vistos.get("plataforma")).toBe((plataformas.plataformas as unknown[]).length);
});

test("ChatBots/CRM: los giros con su chat y los mensajes del chat", () => {
  const vistos = new Map<string, number>();
  const clientes = crudas("feniax").find((s) => s._type === "chatClientsBanner")!;
  const campos = camposDe("feniax", clientes._key as string);
  expect(sinCampo(clientes, campos, vistos)).toEqual([]);
  expect(vistos.get("mensajeChat")).toBeGreaterThan(0);

  // El nombre de cada mensaje en la lista dice quién habla.
  const giros = campos.find((c) => c.nombre === "categorias") as Campo & { clase: "lista" };
  const mensajes = giros.elemento.campos.find((c) => c.nombre === "chat.mensajes") as Campo & { clase: "lista" };
  expect(mensajes.elemento.resumen({ de: "cliente", texto: "Hola" })).toBe("Mensaje del cliente: Hola");
  expect(mensajes.elemento.resumen({ de: "negocio" })).toBe("Respuesta del negocio: (solo foto)");
  const primero = (clientes.categorias as Obj[])[0];
  expect(giros.elemento.resumen(primero)).toMatch(/ · \d+ empresas?$/);
});

test("la Portada (teamBanner) muestra campos distintos según la página", () => {
  const nombres = (pagina: PaginaServicio) => new Set(definicionBloque("teamBanner", pagina).grupos.flatMap((g) => g.campos.map((c) => c.nombre)));
  const marketing = nombres("marketing");
  const trafico = nombres("trafico");
  const feniax = nombres("feniax");
  const tiktok = ["video", "ajusteVideo", "portadaVideo", "sonidoVideo", "usuarioTikTok", "descripcionVideo", "meGusta", "comentarios", "compartidos"];

  // Marketing Digital: sin foto de fondo, con la imagen de la derecha.
  expect(marketing.has("imagen") || marketing.has("imagenMovil")).toBe(false);
  expect(marketing.has("imagenDerecha")).toBe(true);
  // Tráfico: foto de fondo, sin imagen de la derecha ni celular.
  expect(trafico.has("imagen") && trafico.has("imagenMovil")).toBe(true);
  expect(trafico.has("imagenDerecha")).toBe(false);
  // Solo ChatBots/CRM tiene los campos del celular estilo TikTok.
  for (const n of tiktok) {
    expect(feniax.has(n), n).toBe(true);
    expect(marketing.has(n) || trafico.has(n), n).toBe(false);
  }
  const video = definicionBloque("teamBanner", "feniax").grupos.flatMap((g) => g.campos).find((c) => c.nombre === "video");
  expect(video?.clase).toBe("video");
});
