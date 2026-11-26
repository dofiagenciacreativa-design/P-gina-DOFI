import { expect, test } from "vitest";
import consulta from "../fixtures/inicio/consulta-inicio.json";
import {
  armarPaginaInicio,
  CAPACIDADES_FALLBACK,
  HERO_FALLBACK,
  type RespuestaCrudaInicio,
} from "@/lib/inicio";

const respuesta = consulta as unknown as RespuestaCrudaInicio;

test("arma el Inicio con el contenido real de Sanity", () => {
  const p = armarPaginaInicio(respuesta);
  expect(p.hero.titulo).toBe("Ventas Inteligentes");
  // El documento no trae marca: se usa la de respaldo.
  expect(p.hero.marca).toBe(HERO_FALLBACK.marca);
  expect(p.hero.imagen).toContain("cdn.sanity.io");
  // El documento no tiene capacidades: se ven las 5 de fabrica.
  expect(p.capacidades).toEqual(CAPACIDADES_FALLBACK);
  expect(p.seccionesContenido.map((b) => b.escena)).toEqual(["redes", "pauta", "crm", "asesorias"]);
  expect(p.seccionesContenido[0].cta?.texto).toBe("Quiero Mejorar mis Ventas");
  expect(p.seccionesContenido[0].lineas).toEqual(["Redes Sociales que", "SÍ VENDEN"]);
});

test("sin respuesta, todo cae a su respaldo", () => {
  const p = armarPaginaInicio(null);
  expect(p.hero).toEqual(HERO_FALLBACK);
  expect(p.capacidades).toHaveLength(5);
  expect(p.seccionesContenido).toHaveLength(4);
  expect(p.seccionesContenido.every((b) => b.backgroundImage === null && b.cta === null)).toBe(true);
});
