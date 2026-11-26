import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Configuracion de OpenNext para Cloudflare Workers.
 *
 * PAGINAS YA ARMADAS (2026-11-24). Antes no habia cache ("dummy"): CADA
 * visita armaba la pagina desde cero (x-nextjs-cache: MISS siempre). En el
 * plan gratuito de Workers (10 ms de CPU por visita) eso dejaba al sitio al
 * borde del limite, y era la raiz del «Internal Server Error» intermitente:
 * ver la memoria del proyecto «error-500-paginas-pre-armadas».
 *
 * Ahora:
 *  - incrementalCache = archivos estaticos: las paginas se arman UNA vez,
 *    en la construccion, y se guardan junto a los archivos del sitio
 *    (.open-next/assets/cdn-cgi/_next_cache, solo legible por el Worker).
 *    Es de solo lectura: un cambio de contenido se ve al publicarlo desde
 *    el panel (cada publicacion es un commit a main y Cloudflare vuelve a
 *    construir la web).
 *  - enableCacheInterception: las paginas guardadas se entregan antes de
 *    cargar Next.js, casi sin CPU y sin pasar por el Batcher de Next (el
 *    origen del error).
 *
 * Para que esto sirva, las paginas NO deben caducar por tiempo: por eso el
 * fetch de src/lib/google-places.ts usa cache: "force-cache" (sin
 * revalidate). Si una pagina caducara, cada visita volveria a armarla.
 */
const config = defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});

/**
 * IMPORTANTE: no borrar esta linea.
 *
 * El script "build" de package.json es "opennextjs-cloudflare build" a
 * proposito: Cloudflare corre ese comando (o "npm run build", que apunta a
 * lo mismo) para producir la carpeta .open-next completa. Sin eso, el paso
 * de deploy falla con "Could not find compiled Open Next config" porque
 * nunca se genero .open-next (esto paso: era el error original).
 *
 * Pero por dentro, "opennextjs-cloudflare build" compila el Next.js
 * ejecutando `npm run build` como sub-paso (ver @opennextjs/aws
 * buildNextApp.js). Si esa linea de abajo no estuviera, ese sub-paso
 * volveria a resolver a "opennextjs-cloudflare build" (porque es lo que dice
 * el script "build"), y el proceso se llamaria a si mismo sin parar hasta
 * que Cloudflare mata el build por timeout (~29 min) sin compilar nada.
 * Tambien paso, una vez.
 *
 * Esta linea rompe ese ciclo: fija el comando de compilacion interno
 * directo a "next build", saltandose el script "build" de package.json.
 * Los dos problemas solo se evitan a la vez con AMBAS piezas en su lugar:
 * el script "build" apuntando a opennextjs-cloudflare build, Y esta linea.
 */
config.buildCommand = "npx next build";

export default config;
