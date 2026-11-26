import { expect, test } from "vitest";
import cuentas from "../../contenido/cuentas.json";
import type { Doc } from "@/lib/contenido/tipos";
import { BORRAR, ID_DE_COLECCION, mezclarColeccion, repetido } from "@/lib/contenido/colecciones";

const lista = cuentas as unknown as Doc[];
const AHORA = "2026-11-26T20:00:00Z";

test("cambiar un cliente toca solo ese documento y conserva el orden por _id", () => {
  const cambiado = { ...lista[3], resumen: "Otro resumen" };
  const salida = mezclarColeccion(lista, [cambiado], AHORA);
  expect(salida.map((d) => d._id)).toEqual(lista.map((d) => d._id));
  expect(salida[3].resumen).toBe("Otro resumen");
  expect(salida[3]._createdAt).toBe(lista[3]._createdAt);
  expect(salida[3]._updatedAt).toBe(AHORA);
  for (let i = 0; i < lista.length; i++) if (i !== 3) expect(salida[i]).toBe(lista[i]);
});

test("un cliente nuevo entra en su lugar por _id; uno marcado se borra", () => {
  const nuevo = { _id: "cuenta-aaa-nueva", _type: "cuenta", nombre: "Nueva", slug: { _type: "slug", current: "nueva" } } as Doc;
  const borrar = { _id: lista[0]._id, _type: "cuenta", [BORRAR]: true } as Doc;
  const salida = mezclarColeccion(lista, [nuevo, borrar], AHORA);
  expect(salida).toHaveLength(lista.length);
  expect(salida.some((d) => d._id === lista[0]._id)).toBe(false);
  const n = salida.find((d) => d._id === "cuenta-aaa-nueva")!;
  expect(n._createdAt).toBe(AHORA);
  expect(BORRAR in n).toBe(false);
  expect(salida.map((d) => d._id)).toEqual([...salida.map((d) => d._id)].sort());
});

test("no se repiten direcciones de clientes ni nombres de servicios", () => {
  expect(repetido(lista, "cuenta")).toBeNull();
  const copia = { ...lista[1], _id: "cuenta-copia" } as Doc;
  expect(repetido([...lista, copia], "cuenta")).toContain("/clientes/");
  expect(repetido([{ _id: "a", _type: "servicio", titulo: "CRM" }, { _id: "b", _type: "servicio", titulo: "crm" }] as Doc[], "servicio")).toMatch(/crm/i);
});

test("ids aceptados", () => {
  expect(ID_DE_COLECCION.test("cuenta-baby-dance")).toBe(true);
  expect(ID_DE_COLECCION.test("2ee3db3c-85b2-455a-8562-bb9a0ebe3076")).toBe(true);
  expect(ID_DE_COLECCION.test("drafts.cuenta-x")).toBe(false);
  expect(ID_DE_COLECCION.test("../x")).toBe(false);
});
