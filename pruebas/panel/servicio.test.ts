import { expect, test } from "vitest";
import asesorias from "../../contenido/asesoriasPage.json";
import { CONJUNTO } from "@/lib/contenido/conjunto";
import { consultarSobre } from "@/lib/contenido/consulta-local";
import { QUERY_ASESORIAS, armarPaginaAsesorias, type RespuestaAsesorias } from "@/lib/asesorias";
import type { Doc } from "@/lib/contenido/tipos";
import { TIPOS_DE_PAGINA, definicionBloque, tieneFormulario } from "@/panel/esquema/bloques";
import { seccionesDeServicio } from "@/panel/esquema/servicio";
import { conClavesNuevas, escribir, leer } from "@/panel/motor/rutas";

const doc = asesorias as unknown as Doc;
const docs = { asesoriasPage: doc };

test("Asesorías: una sección del panel por cada elemento de sections[], en orden y con su lugar", () => {
  const s = seccionesDeServicio("asesorias", docs);
  const crudas = doc.sections as { _key: string; _type: string }[];
  expect(s.map((x) => x.clave)).toEqual(crudas.map((x) => x._key));
  expect(s.map((x) => x.titulo)).toEqual(["Portada", "Introducción", "Logros", "Videos en celulares", "Cierre"]);
  for (const x of s) {
    expect(x.aviso).toBeUndefined(); // las 5 tienen formulario
    for (const b of x.bloques) expect(b.ruta).toEqual(["sections", { _key: x.clave }]);
  }
});

test("los campos de Asesorías leen los datos que ya existen (ningún nombre cambió)", () => {
  const s = seccionesDeServicio("asesorias", docs);
  const valor = (clave: string, nombre: string) =>
    leer(doc, [...(s.find((x) => x.clave === clave)!.bloques[0].ruta), nombre]);
  const [portada, , logros, celulares] = s;
  expect(valor(portada.clave, "titulo")).toBeTruthy();
  expect(valor(portada.clave, "cta.enlace")).toBe("/contactanos?servicio=asesorias");
  expect(Array.isArray(valor(logros.clave, "logros"))).toBe(true);
  expect(valor(celulares.clave, "celularCentral.video")).toMatchObject({ _type: "file" });
  // Cada campo declarado existe como nombre en el inventario: comprobamos que ninguno de los
  // valores actuales de los bloques queda sin campo (salvo _key/_type).
  for (const x of s) {
    const cruda = (doc.sections as Record<string, unknown>[]).find((c) => c._key === x.clave)!;
    const declarados = new Set(x.bloques.flatMap((b) => b.campos.map((c) => c.nombre.split(".")[0])));
    const sinCampo = Object.keys(cruda).filter((k) => !k.startsWith("_") && !declarados.has(k));
    expect(sinCampo, `${x.titulo}`).toEqual([]);
  }
});

test("cambiar un video escribe solo esa referencia", () => {
  const s = seccionesDeServicio("asesorias", docs);
  const celulares = s[3];
  const ruta = [...celulares.bloques[0].ruta, "celularCentral.video"];
  const nuevo = { _type: "file", asset: { _ref: `file-${"a".repeat(40)}-mp4`, _type: "reference" } };
  const cambiado = escribir(doc, ruta, nuevo);
  expect(leer(cambiado, ruta)).toEqual(nuevo);
  // Lo demás del documento queda igual.
  expect(escribir(cambiado, ruta, leer(doc, ruta))).toEqual(doc);
});

test("duplicar da claves nuevas también a los elementos de las listas internas", () => {
  const logros = (doc.sections as Record<string, unknown>[])[2];
  const copia = conClavesNuevas(logros) as { _key: string; logros: { _key: string }[] };
  expect(copia._key).not.toBe(logros._key);
  const originales = new Set((logros.logros as { _key: string }[]).map((l) => l._key));
  expect(copia.logros.every((l) => !originales.has(l._key))).toBe(true);
});

test("solo se pueden agregar los tipos que ya tienen formulario", () => {
  expect(TIPOS_DE_PAGINA.asesorias.filter(tieneFormulario)).toEqual([
    "splitHeroBanner",
    "aboutBanner",
    "achievementsBanner",
    "celularesBanner",
    "ctaBanner",
  ]);
  expect(definicionBloque("methodBanner", "asesorias").aviso).toBeTruthy();
});

test("la vista previa arma Asesorías igual que la web (misma consulta, mismo armado)", async () => {
  const respuesta = await consultarSobre<RespuestaAsesorias>(CONJUNTO, QUERY_ASESORIAS);
  const { secciones } = armarPaginaAsesorias(respuesta, null);
  expect(secciones.map((x) => x.tipo)).toEqual(["splitHeroBanner", "aboutBanner", "achievementsBanner", "celularesBanner", "ctaBanner"]);
  // Los 3 videos (de Sanity en main; de /videos/ en R2 cuando se pasan desde el panel).
  const celulares = secciones.find((x) => x.tipo === "celularesBanner") as unknown as Record<"izquierdo" | "central" | "derecho", { url: string | null }>;
  for (const lado of ["izquierdo", "central", "derecho"] as const) expect(celulares[lado].url).toMatch(/\.mp4$/);
});
