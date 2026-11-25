import { expect, test } from "vitest";
import documentos from "../fixtures/sanity/documentos-inicio.json";
import type { Doc } from "@/lib/contenido/tipos";
import { seccionesInicio } from "@/panel/esquema/inicio";
import { leer } from "@/panel/motor/rutas";

const docs = Object.fromEntries((documentos as unknown as Doc[]).map((d) => [d._id, d])) as Record<string, Doc>;

test("el Inicio tiene portada, tarjetas y los 4 banners, en orden", () => {
  const s = seccionesInicio(docs);
  expect(s.map((x) => x.titulo)).toEqual([
    "Portada",
    "Tarjetas",
    "Banner 1 · Redes",
    "Banner 2 · Pauta",
    "Banner 3 · CRM y Chatbots",
    "Banner 4 · Asesorías",
  ]);
  expect(s[2].vista).toBe("banner:axzhfwjOxKlDVob5Dbk8nh");
});

test("los campos apuntan a datos reales", () => {
  const [portada, , banner1] = seccionesInicio(docs);
  const texto = portada.bloques[0];
  expect(leer(docs[texto.documento], [...texto.ruta, "titulo"])).toBe("Ventas Inteligentes");
  const boton = banner1.bloques.find((b) => b.titulo === "BOTÓN")!;
  expect(leer(docs[boton.documento], [...boton.ruta, "ctaTexto"])).toBe("Quiero Mejorar mis Ventas");
  const pos = banner1.bloques.find((b) => b.titulo.includes("COMPUTADORA"))!;
  expect(leer(docs[pos.documento], [...pos.ruta, "ctaPosicionDesktop.horizontal"])).toBe("izquierda");
});

test("sin tarjetas guardadas, ofrece copiar las 5 de fábrica", () => {
  const tarjetas = seccionesInicio(docs)[1];
  expect(tarjetas.bloques).toHaveLength(0);
  expect(tarjetas.cuenta).toBe(5);
  const copiados = tarjetas.vacia!.aplicar(docs);
  const despues = seccionesInicio(copiados)[1];
  expect(despues.vacia).toBeUndefined();
  expect(despues.bloques).toHaveLength(5);
  expect(leer(copiados.paginaInicio, ["capacidades", 0, "titulo"])).toBe("Redes Sociales");
  // El documento original no cambia.
  expect(docs.paginaInicio.capacidades).toBeUndefined();
});
