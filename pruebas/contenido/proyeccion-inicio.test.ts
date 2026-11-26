import { expect, test } from "vitest";
import consulta from "../fixtures/inicio/consulta-inicio.json";
import documentos from "../fixtures/inicio/documentos-inicio.json";
import { proyectarPaginaInicio, documentosInicio } from "@/lib/contenido/proyecciones/pagina-inicio";
import type { Doc, ResolverArchivo } from "@/lib/contenido/tipos";

/**
 * Los datos de prueba (fixtures/inicio) se guardaron cuando el contenido vivía
 * en Sanity: sus direcciones de fotos son las de entonces. Este resolver las
 * arma igual a partir de la referencia (image-<sha1>-<ancho>x<alto>-<ext>).
 */
const resolver: ResolverArchivo = (valor) => {
  const ref = (valor as { asset?: { _ref?: unknown } } | null | undefined)?.asset?._ref;
  const m = typeof ref === "string" ? /^image-([a-f0-9]+)-(\d+)x(\d+)-([a-z0-9]+)$/i.exec(ref) : null;
  if (!m) return null;
  const [, sha, ancho, alto, ext] = m;
  return { url: `https://cdn.sanity.io/images/59r5krzd/production/${sha}-${ancho}x${alto}.${ext}`, ancho: Number(ancho), alto: Number(alto) };
};

test("la proyección da exactamente lo mismo que la consulta GROQ guardada", () => {
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
