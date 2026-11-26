/**
 * Sesión del panel con UNA contraseña (docs/panel-propio/cambios-2026-11-25.md §4).
 *
 * La contraseña vive solo en el secreto del Worker PANEL_CLAVE. La cookie es
 * `<vence>.<firma>`: la firma es HMAC-SHA256 de `vence` con una clave derivada
 * de la contraseña. Sin base de datos: si la contraseña cambia, todas las
 * firmas anteriores dejan de valer (se cierran todas las sesiones).
 *
 * Solo usa WebCrypto: funciona igual en el Worker, en Node y en las pruebas.
 */

export const COOKIE = "dofi_panel";
export const DIAS_DE_SESION = 14;
export const LARGO_MINIMO = 16;

const cod = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function claveDeFirma(clave: string): Promise<CryptoKey> {
  const material = await crypto.subtle.digest("SHA-256", cod.encode(`dofi-panel:firma:${clave}`));
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function firmar(texto: string, clave: string): Promise<string> {
  return base64url(await crypto.subtle.sign("HMAC", await claveDeFirma(clave), cod.encode(texto)));
}

/** Compara dos textos sin revelar por el tiempo dónde difieren. */
async function iguales(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", cod.encode(a)),
    crypto.subtle.digest("SHA-256", cod.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}

/** ¿La contraseña escrita es la del secreto? */
export async function claveCorrecta(intento: string, clave: string | undefined): Promise<boolean> {
  if (!clave || clave.length < LARGO_MINIMO) return false;
  return iguales(intento, clave);
}

/** El valor de la cookie para una sesión nueva. */
export async function valorDeSesion(clave: string, ahora = Date.now()): Promise<{ valor: string; vence: number }> {
  const vence = ahora + DIAS_DE_SESION * 24 * 60 * 60 * 1000;
  return { valor: `${vence}.${await firmar(String(vence), clave)}`, vence };
}

/** ¿La cookie es una sesión válida y vigente? */
export async function sesionValida(valor: string | undefined | null, clave: string | undefined, ahora = Date.now()): Promise<boolean> {
  if (!valor || !clave || clave.length < LARGO_MINIMO) return false;
  const punto = valor.indexOf(".");
  if (punto <= 0) return false;
  const vence = Number(valor.slice(0, punto));
  if (!Number.isFinite(vence) || vence <= ahora) return false;
  return iguales(valor.slice(punto + 1), await firmar(String(vence), clave));
}

/** Lee la cookie de sesión de una petición. */
export function cookieDeSesion(cabecera: string | null): string | null {
  if (!cabecera) return null;
  for (const parte of cabecera.split(";")) {
    const [nombre, ...resto] = parte.trim().split("=");
    if (nombre === COOKIE) return resto.join("=");
  }
  return null;
}
