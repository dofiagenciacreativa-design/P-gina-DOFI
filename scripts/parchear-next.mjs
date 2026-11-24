/**
 * Parche de Next.js para Cloudflare Workers (2026-11-24).
 *
 * EL PROBLEMA: en dofiagenciacreativa.com 1 de cada 4-5 visitas recibia
 * «Internal Server Error». Registro de Cloudflare: «This promise was created
 * by a request that has since ended, so it can never settle».
 *
 * LA CAUSA: el «Batcher» de Next.js (lo usa su ResponseCache) guarda, por
 * pagina, el trabajo que esta en curso, y la siguiente visita a esa pagina
 * ESPERA ese mismo trabajo en vez de hacer el suyo. Ese registro vive en la
 * memoria del Worker y lo comparten todas las visitas. Si la visita que
 * empezo el trabajo se corta (un robot que se desconecta, alguien que cierra
 * la pagina), Cloudflare cancela su trabajo: queda anotado «en curso» para
 * siempre y cada visita siguiente a esa pagina falla (o, con el compatibility
 * flag no_handle_cross_request_promise_resolution, se queda colgada: se probo
 * el 2026-11-24 y hubo que revertirlo).
 *
 * EL ARREGLO: cada visita hace y espera SOLO su propio trabajo; nunca el de
 * otra. Se cambia una linea del Batcher en cada copia que trae Next.js (el
 * codigo fuente y los paquetes ya compilados que usa el servidor):
 *
 *     let n=this.pending.get(r);if(n)return n;   ->   let n=void 0;
 *
 * Lo que se pierde: si dos visitas piden la MISMA pagina en el mismo
 * instante, cada una la arma (antes la segunda esperaba a la primera). En un
 * sitio de este tamaño son muy pocas; se midio en la vista previa antes de
 * publicar.
 *
 * CUANDO CORRE: en `postinstall` (cada `npm install` / `npm ci`, tambien en
 * Cloudflare), al empezar `npm run cf:deploy` y JUSTO DESPUES de `next build`
 * (buildCommand de open-next.config.ts). Esto ultimo hace falta porque
 * `next build` copia el Batcher dentro de sus propios archivos (.next/server)
 * y puede reusar una cache vieja de antes del parche: se parchan tambien esos
 * archivos y se revisa que no quede ninguna copia sin parchar.
 *
 * Es idempotente: si ya esta aplicado no hace nada. Si una version nueva de
 * Next.js cambia ese codigo y el parche no encuentra que cambiar, o queda
 * alguna copia sin parchar, la construccion FALLA a proposito, en vez de
 * publicar una version que vuelva a tener el error.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(raiz, "node_modules", "next", "dist");
const MARCA = "/*dofi:batcher-sin-compartir*/";

// Version compilada (minificada): los nombres de las variables cambian de un
// paquete a otro, por eso la expresion los captura.
const MINIFICADO = /let (\w+)=this\.pending\.get\((\w+)\);if\(\1\)return \1;/g;
// Codigo fuente (dist/lib/batcher.js y dist/esm/lib/batcher.js).
const FUENTE = /const pending = this\.pending\.get\(cacheKey\);\s*if \(pending\) return pending;/g;

/** Todos los .js de una carpeta, recorriendo subcarpetas. */
function jsDe(carpeta) {
  if (!fs.existsSync(carpeta)) return [];
  return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(carpeta, e.name);
    if (e.isDirectory()) return jsDe(ruta);
    return e.name.endsWith(".js") ? [ruta] : [];
  });
}

/** Los archivos de Next.js que traen el Batcher, dentro de un `next/dist`. */
function deNext(distNext) {
  const comp = path.join(distNext, "compiled", "next-server");
  if (!fs.existsSync(comp)) return [];
  return [
    path.join(distNext, "lib", "batcher.js"),
    path.join(distNext, "esm", "lib", "batcher.js"),
    ...fs
      .readdirSync(comp)
      .filter((f) => f.endsWith(".runtime.prod.js"))
      .map((f) => path.join(comp, f)),
  ];
}

const compilados = path.join(dist, "compiled", "next-server");
// Lo que arma `next build` (si ya se construyo): ahi tambien hay copias, y
// otra vez en la version «standalone» (.next/standalone), que es la que
// empaqueta OpenNext para Cloudflare.
const standalone = path.join(raiz, ".next", "standalone");
const archivos = [
  ...deNext(dist),
  ...jsDe(path.join(raiz, ".next", "server")),
  ...jsDe(path.join(standalone, ".next", "server")),
  ...deNext(path.join(standalone, "node_modules", "next", "dist")),
];

let cambiados = 0;
let yaListos = 0;
const conBatcher = [];

for (const archivo of archivos) {
  if (!fs.existsSync(archivo)) continue;
  const texto = fs.readFileSync(archivo, "utf8");
  if (!texto.includes("this.pending")) continue;
  conBatcher.push(path.relative(raiz, archivo));

  if (texto.includes(MARCA)) {
    yaListos++;
    continue;
  }

  let n = 0;
  const nuevo = texto
    .replace(MINIFICADO, (_, v) => {
      n++;
      return `let ${v}=void 0;${MARCA}`;
    })
    .replace(FUENTE, () => {
      n++;
      return `${MARCA} // cada visita hace su propio trabajo (scripts/parchear-next.mjs)`;
    });

  if (n > 0) {
    fs.writeFileSync(archivo, nuevo);
    cambiados++;
    console.log(`[parchear-next] ${path.relative(raiz, archivo)}: ${n} cambio(s)`);
  }
}

// El paquete que arma las paginas (app-page) es el que fallaba: tiene que
// quedar parchado si o si.
const imprescindible = path.join(compilados, "app-page.runtime.prod.js");
if (!fs.readFileSync(imprescindible, "utf8").includes(MARCA)) {
  console.error(
    "[parchear-next] ERROR: no se pudo parchar el Batcher de Next.js en app-page.runtime.prod.js. " +
      "Probablemente cambio la version de Next.js: revisar scripts/parchear-next.mjs antes de publicar."
  );
  process.exit(1);
}

// Ninguna copia sin parchar, en ningun archivo revisado.
const sinParchar = archivos.filter((a) => {
  if (!fs.existsSync(a)) return false;
  const t = fs.readFileSync(a, "utf8");
  MINIFICADO.lastIndex = 0;
  FUENTE.lastIndex = 0;
  return MINIFICADO.test(t) || FUENTE.test(t);
});
if (sinParchar.length > 0) {
  console.error(
    "[parchear-next] ERROR: quedan copias del Batcher sin parchar en: " +
      sinParchar.map((a) => path.relative(raiz, a)).join(", ")
  );
  process.exit(1);
}

console.log(
  `[parchear-next] listo: ${cambiados} archivo(s) parchados ahora, ${yaListos} ya estaban (de ${conBatcher.length} con Batcher).`
);
