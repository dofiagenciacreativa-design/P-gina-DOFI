import { expect, test } from "vitest";
import consulta from "../fixtures/sanity/consulta-inicio.json";
import documentos from "../fixtures/sanity/documentos-inicio.json";
import archivos from "../../contenido/archivos.json";
import { QUERY_PAGINA_INICIO } from "@/lib/sanity";
import { consultarSobre } from "@/lib/contenido/consulta-local";
import type { Doc } from "@/lib/contenido/tipos";

/** Iguala las direcciones de imagen de Sanity y las del repositorio. */
const igualar = (v: unknown) =>
  JSON.parse(
    JSON.stringify(v)
      .replace(/https:\/\/cdn\.sanity\.io\/images\/[^/]+\/[^/]+\/([a-f0-9]{40}-\d+x\d+)\.[a-z0-9]+/g, "imagen:$1")
      .replace(/\/media\/([a-f0-9]{40}-\d+x\d+)\.webp/g, "imagen:$1")
  );

test("la consulta GROQ del Inicio sobre archivos da lo mismo que Sanity", async () => {
  const conjunto = [...(documentos as unknown as Doc[]), ...(archivos as unknown as Doc[])];
  const local = await consultarSobre(conjunto, QUERY_PAGINA_INICIO);
  expect(igualar(local)).toEqual(igualar(consulta));
});

test("los parámetros de la consulta no se mezclan entre llamadas", async () => {
  const conjunto = [
    { _id: "a", _type: "cuenta", slug: { current: "uno" } },
    { _id: "b", _type: "cuenta", slug: { current: "dos" } },
  ] as Doc[];
  const q = `*[_type == "cuenta" && slug.current == $slug][0]._id`;
  expect(await consultarSobre(conjunto, q, { slug: "uno" })).toBe("a");
  expect(await consultarSobre(conjunto, q, { slug: "dos" })).toBe("b");
});
