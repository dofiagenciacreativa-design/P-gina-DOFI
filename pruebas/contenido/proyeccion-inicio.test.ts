import { expect, test } from "vitest";
import consulta from "../fixtures/sanity/consulta-inicio.json";
import documentos from "../fixtures/sanity/documentos-inicio.json";
import { resolverDeSanity } from "@/lib/contenido/archivos-sanity";
import { proyectarPaginaInicio, documentosInicio } from "@/lib/contenido/proyecciones/pagina-inicio";
import type { Doc } from "@/lib/contenido/tipos";

const resolver = resolverDeSanity({ projectId: "59r5krzd", dataset: "production" });

test("la proyección da exactamente lo mismo que la consulta GROQ de Sanity", () => {
  const docs = documentosInicio(documentos as unknown as Doc[]);
  expect(proyectarPaginaInicio(docs, resolver)).toEqual(consulta);
});

test("sin documentos, todo es null como en GROQ", () => {
  expect(proyectarPaginaInicio({ paginaInicio: null, banners: null, hero: null }, resolver)).toEqual({
    pagina: null,
    bannersDoc: null,
    heroDoc: null,
  });
});

test("resolverDeSanity convierte referencias de imagen y de archivo", () => {
  expect(resolver({ _type: "image", asset: { _ref: "image-abc123-2077x757-png" } })).toEqual({
    url: "https://cdn.sanity.io/images/59r5krzd/production/abc123-2077x757.png",
    ancho: 2077,
    alto: 757,
  });
  expect(resolver({ asset: { _ref: "file-def456-mp4" } })).toEqual({
    url: "https://cdn.sanity.io/files/59r5krzd/production/def456.mp4",
    ancho: null,
    alto: null,
  });
  expect(resolver(null)).toBeNull();
  expect(resolver({ asset: {} })).toBeNull();
  expect(resolver({ asset: { _ref: "otra-cosa" } })).toBeNull();
});
