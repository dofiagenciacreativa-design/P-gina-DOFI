/**
 * `npm run cf:deploy` — lo que corre Cloudflare (Workers Builds) como
 * "Build command" del Worker pagina-dofi.
 *
 *   - En `main` (y a mano, desde una computadora): construye y publica, como
 *     siempre: `opennextjs-cloudflare build` + `opennextjs-cloudflare deploy`.
 *   - En cualquier OTRA RAMA dentro de Cloudflare: SOLO construye. La vista
 *     previa la sube despues el "Deploy command" de las ramas
 *     (`npx wrangler preview`), que usa el `.open-next` recien construido.
 *
 * POR QUE (2026-11-23): antes este comando publicaba siempre. En una rama,
 * Cloudflare rechaza ese intento de publicar el Worker de produccion («The
 * name in your wrangler.jsonc file (pagina-dofi) must match the name of your
 * Worker») y la construccion entera fallaba, asi que ninguna rama llegaba a
 * tener vista previa.
 *
 * Cloudflare define WORKERS_CI=1 y WORKERS_CI_BRANCH en sus construcciones.
 */
import { spawnSync } from "node:child_process";

const RAMA_DE_PRODUCCION = "main";

function correr(comando) {
  console.log(`\n> ${comando}\n`);
  const r = spawnSync(comando, { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// Parche de Next.js (ver scripts/parchear-next.mjs): ya corre en
// `postinstall`, se repite aqui por si la instalacion se hizo sin scripts.
// Si no puede aplicarse, la construccion se detiene antes de publicar.
correr("node scripts/parchear-next.mjs");

correr("opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion");

const rama = process.env.WORKERS_CI_BRANCH;
const enCloudflare = process.env.WORKERS_CI === "1";

if (enCloudflare && rama && rama !== RAMA_DE_PRODUCCION) {
  console.log(
    `\nRama "${rama}": construccion lista, sin publicar. La vista previa la sube el "Deploy command" de Cloudflare.\n`
  );
} else {
  correr("opennextjs-cloudflare deploy");
}
