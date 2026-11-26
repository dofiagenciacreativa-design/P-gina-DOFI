import { expect, test } from "vitest";
import { COOKIE, claveCorrecta, cookieDeSesion, sesionValida, valorDeSesion } from "@/lib/panel/sesion";

const CLAVE = "una-contraseña-larga-de-prueba";

test("la contraseña correcta entra; otra, o una corta en el secreto, no", async () => {
  expect(await claveCorrecta(CLAVE, CLAVE)).toBe(true);
  expect(await claveCorrecta("otra-contraseña-larga-x", CLAVE)).toBe(false);
  expect(await claveCorrecta("corta", "corta")).toBe(false);
  expect(await claveCorrecta(CLAVE, undefined)).toBe(false);
});

test("una sesión recién creada vale; vencida, alterada o con otra contraseña, no", async () => {
  const ahora = 1_800_000_000_000;
  const { valor, vence } = await valorDeSesion(CLAVE, ahora);
  expect(await sesionValida(valor, CLAVE, ahora)).toBe(true);
  expect(await sesionValida(valor, CLAVE, vence + 1)).toBe(false);
  expect(await sesionValida(valor, "otra-contraseña-larga-x", ahora)).toBe(false);
  const [, firma] = valor.split(".");
  expect(await sesionValida(`${vence + 999999}.${firma}`, CLAVE, ahora)).toBe(false);
  expect(await sesionValida("basura", CLAVE, ahora)).toBe(false);
  expect(await sesionValida(null, CLAVE, ahora)).toBe(false);
});

test("lee la cookie de sesión entre otras", () => {
  expect(cookieDeSesion(`a=1; ${COOKIE}=123.abc-_; b=2`)).toBe("123.abc-_");
  expect(cookieDeSesion("a=1")).toBeNull();
  expect(cookieDeSesion(null)).toBeNull();
});
