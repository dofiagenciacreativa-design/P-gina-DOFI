import { expect, test } from "vitest";
import { escribir, leer, nuevaClave } from "@/panel/motor/rutas";

const doc = {
  _id: "banners",
  _type: "banners",
  seccionesContenido: [
    { _key: "a1", ctaTexto: "Uno", ctaPosicionDesktop: { horizontal: "centro" } },
    { _key: "b2", ctaTexto: "Dos" },
  ],
};

test("lee por nombre, por _key, por posición y con puntos", () => {
  expect(leer(doc, ["seccionesContenido", { _key: "b2" }, "ctaTexto"])).toBe("Dos");
  expect(leer(doc, ["seccionesContenido", 0, "ctaPosicionDesktop.horizontal"])).toBe("centro");
  expect(leer(doc, ["seccionesContenido", { _key: "zz" }, "ctaTexto"])).toBeUndefined();
  expect(leer(doc, ["noExiste", "tampoco"])).toBeUndefined();
});

test("escribe sin tocar el original y crea los objetos que falten", () => {
  const nuevo = escribir(doc, ["seccionesContenido", { _key: "b2" }, "ctaPosicionMobile.vertical"], "arriba");
  expect(leer(nuevo, ["seccionesContenido", { _key: "b2" }, "ctaPosicionMobile"])).toEqual({ vertical: "arriba" });
  expect(leer(doc, ["seccionesContenido", { _key: "b2" }, "ctaPosicionMobile"])).toBeUndefined();
  expect(nuevo.seccionesContenido[0]).toBe(doc.seccionesContenido[0]);
});

test("escribir undefined borra el campo", () => {
  const nuevo = escribir(doc, ["seccionesContenido", { _key: "a1" }, "ctaTexto"], undefined);
  expect("ctaTexto" in (nuevo.seccionesContenido[0] as object)).toBe(false);
});

test("las claves nuevas tienen 12 caracteres hexadecimales y no se repiten", () => {
  const a = nuevaClave();
  expect(a).toMatch(/^[0-9a-f]{12}$/);
  expect(nuevaClave()).not.toBe(a);
});
