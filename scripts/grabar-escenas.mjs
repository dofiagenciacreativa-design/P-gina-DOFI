/**
 * Graba las escenas animadas de los banners del Home como VIDEO.
 *
 *   npm run dev              (en otra terminal: la web en http://localhost:3000)
 *   npm run grabar:escenas   (todas)   ·   npm run grabar:escenas -- crm pauta
 *
 *   npm run grabar:escenas -- --solo-video    vuelve a armar los videos con los
 *                                             cuadros ya capturados (para probar
 *                                             otra calidad o tamaño sin recapturar)
 *
 * Mas rapido y estable que contra `npm run dev` (que compila sobre la marcha):
 * grabar contra la version compilada.
 *   $env:GRABAR_ESCENAS = "1"; npm run build:next; npx next start -p 3001
 *   $env:GRABAR_BASE_URL = "http://localhost:3001"; npm run grabar:escenas
 *
 * POR QUE: dibujadas en vivo (Remotion <Player>), las escenas redibujan 30
 * veces por segundo decenas de brillos, sombras y desenfoques. En una laptop
 * con grafica integrada el banner iba a 8-14 cuadros por segundo. Como video,
 * el navegador solo reproduce: mismo dibujo, sin ese trabajo.
 *
 * QUE HACE, por cada escena (redes, pauta, crm, asesorias):
 *   1. Abre /render-escena?escena=... (la escena sola, fondo transparente, con
 *      el texto que tiene hoy el banner en Sanity).
 *   2. Captura sus 240 cuadros (una vuelta de 8 s) en .grabacion/<escena>/
 *      (carpeta de trabajo, fuera del repositorio). Si se corta, al volver a
 *      correr sigue desde el ultimo cuadro guardado.
 *   3. Con ffmpeg arma dos WebM (VP9) CON TRANSPARENCIA -- uno para
 *      computadora y uno mas chico para telefono -- y con sharp guarda el
 *      primer cuadro como WebP (lo que se ve mientras el video llega y con
 *      «movimiento reducido»).
 *   4. Anota en src/remotion/home/videos.json el texto con el que se grabo.
 *
 * SI SE CAMBIA EL TEXTO DE UN BANNER EN SANITY: el Home lo nota (compara el
 * texto con el de videos.json) y vuelve a dibujar esa escena en vivo, asi
 * nunca muestra un texto viejo. Para recuperar la fluidez, volver a correr
 * este script y publicar.
 *
 * Necesita Google Chrome y ffmpeg instalados en la computadora.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.GRABAR_BASE_URL ?? "http://localhost:3000";
const SALIDA = join(RAIZ, "public", "home", "escenas");
const TRABAJO = join(RAIZ, ".grabacion");
const MANIFIESTO = join(RAIZ, "src", "remotion", "home", "videos.json");

// Deben coincidir con src/remotion/home/tema.ts.
const FPS = 30;
const DURACION = 240;
const ALTO = 757;
const ANCHOS = { redes: 1010, pauta: 1287, crm: 980, asesorias: 1197 };

/** Los cuadros se capturan a 1,5x del tamaño de la escena (margen para
 *  reducir con buena calidad). */
const ESCALA_CAPTURA = 1.5;
/** Las dos versiones de cada video: tamaño respecto de la escena y calidad
 *  (CRF de VP9: menor = mejor y mas pesado). */
const VERSIONES = {
  escritorio: { escala: 1, crf: 44 },
  movil: { escala: 0.75, crf: 44 },
};
const par = (n) => 2 * Math.round(n / 2);

const args = process.argv.slice(2);
const soloVideo = args.includes("--solo-video");
const pedidas = args.filter((a) => a in ANCHOS);
const escenas = pedidas.length > 0 ? pedidas : Object.keys(ANCHOS);

function correr(cmd, argumentos) {
  const r = spawnSync(cmd, argumentos, { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} fallo:\n${(r.stderr ?? "").split("\n").slice(-12).join("\n")}`);
}

const nombreCuadro = (n) => `${String(n).padStart(3, "0")}.png`;

/** Fase 1: los 240 cuadros de una escena, en .grabacion/<escena>/. */
async function capturar(navegador, escena) {
  const ancho = ANCHOS[escena];
  const carpeta = join(TRABAJO, escena);
  mkdirSync(carpeta, { recursive: true });
  const contexto = await navegador.newContext({
    viewport: { width: ancho + 40, height: ALTO + 40 },
    deviceScaleFactor: ESCALA_CAPTURA,
  });
  const pagina = await contexto.newPage();
  pagina.setDefaultTimeout(300_000);
  pagina.setDefaultNavigationTimeout(300_000);

  process.stdout.write(`\n${escena}: abriendo... `);
  await pagina.goto(`${BASE}/render-escena?escena=${escena}`, { waitUntil: "load" });
  await pagina.waitForFunction(() => typeof window.__ponerCuadro === "function");
  const esperarRecursos = () =>
    pagina.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))))
      );
    });
  await esperarRecursos();
  // Las fuentes de la escena (Sora, Archivo) se piden recien al pintarla.
  await pagina.waitForTimeout(2500);
  await esperarRecursos();

  const lienzo = pagina.locator("#lienzo");
  const lineas = (await lienzo.getAttribute("data-lineas")) ?? "[]";
  const archivoLineas = join(carpeta, "lineas.json");
  if (!existsSync(archivoLineas) || readFileSync(archivoLineas, "utf8") !== lineas) {
    // Texto nuevo: los cuadros guardados ya no sirven.
    for (const f of readdirSync(carpeta)) rmSync(join(carpeta, f));
    writeFileSync(archivoLineas, lineas);
  }

  for (let n = 0; n < DURACION; n++) {
    const archivo = join(carpeta, nombreCuadro(n));
    if (existsSync(archivo)) continue;
    await pagina.evaluate(
      (n) =>
        new Promise((listo) => {
          window.__ponerCuadro(n);
          requestAnimationFrame(() => requestAnimationFrame(() => listo()));
        }),
      n
    );
    await pagina.waitForFunction((n) => document.getElementById("lienzo")?.dataset.cuadro === String(n), n);
    await lienzo.screenshot({ path: archivo, omitBackground: true });
    if (n % 40 === 0) process.stdout.write(`${n} `);
  }
  await contexto.close();
  process.stdout.write("cuadros listos. ");
}

/** Fase 2: de los cuadros a los videos, el primer cuadro y el manifiesto. */
async function armar(escena, manifiesto) {
  const ancho = ANCHOS[escena];
  const carpeta = join(TRABAJO, escena);
  for (let n = 0; n < DURACION; n++) {
    if (!existsSync(join(carpeta, nombreCuadro(n)))) {
      throw new Error(`${escena}: falta el cuadro ${n}. Capturar primero (sin --solo-video).`);
    }
  }
  const lineas = JSON.parse(readFileSync(join(carpeta, "lineas.json"), "utf8"));
  process.stdout.write(`\n${escena}: armando videos... `);

  const hechos = {};
  for (const [nombre, { escala, crf }] of Object.entries(VERSIONES)) {
    const w = par(ancho * escala);
    const h = par(ALTO * escala);
    const temporal = join(carpeta, `${nombre}.webm`);
    correr("ffmpeg", [
      "-y", "-framerate", String(FPS), "-i", join(carpeta, "%03d.png"),
      "-vf", `scale=${w}:${h}:flags=lanczos`,
      "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", String(crf),
      "-deadline", "good", "-cpu-used", "2", "-row-mt", "1", "-auto-alt-ref", "0",
      "-g", String(DURACION), "-an",
      temporal,
    ]);
    hechos[nombre] = { temporal, w, h };
  }
  const { w, h } = hechos.escritorio;
  const posterTemporal = join(carpeta, "poster.webp");
  await sharp(join(carpeta, nombreCuadro(0)))
    .resize(w, h, { kernel: "lanczos3", fit: "fill" })
    .webp({ quality: 80, alphaQuality: 85 })
    .toFile(posterTemporal);

  // El nombre lleva una huella del contenido: si el video cambia, cambia el
  // nombre y ningun navegador ni CDN sirve una copia vieja.
  const huella = createHash("sha1").update(readFileSync(hechos.escritorio.temporal)).digest("hex").slice(0, 8);
  mkdirSync(SALIDA, { recursive: true });
  for (const viejo of readdirSync(SALIDA)) if (viejo.startsWith(`${escena}-`)) rmSync(join(SALIDA, viejo));
  const archivos = {
    video: `${escena}-${huella}.webm`,
    videoMovil: `${escena}-${huella}-movil.webm`,
    poster: `${escena}-${huella}.webp`,
  };
  writeFileSync(join(SALIDA, archivos.video), readFileSync(hechos.escritorio.temporal));
  writeFileSync(join(SALIDA, archivos.videoMovil), readFileSync(hechos.movil.temporal));
  writeFileSync(join(SALIDA, archivos.poster), readFileSync(posterTemporal));

  manifiesto[escena] = {
    lineas,
    video: `/home/escenas/${archivos.video}`,
    videoMovil: `/home/escenas/${archivos.videoMovil}`,
    poster: `/home/escenas/${archivos.poster}`,
  };
  writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2) + "\n");
  const kb = (f) => Math.round(statSync(join(SALIDA, f)).size / 1024);
  process.stdout.write(
    `listo: computadora ${kb(archivos.video)} KB (${w}x${h}), telefono ${kb(archivos.videoMovil)} KB, primer cuadro ${kb(archivos.poster)} KB.`
  );
}

const manifiesto = existsSync(MANIFIESTO) ? JSON.parse(readFileSync(MANIFIESTO, "utf8")) : {};

if (!soloVideo) {
  const { chromium } = await import("playwright-core");
  const navegador = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const escena of escenas) await capturar(navegador, escena);
  } finally {
    await navegador.close();
  }
}
for (const escena of escenas) await armar(escena, manifiesto);

console.log("\n\nHecho. Revisa el Home en local y publica public/home/escenas y src/remotion/home/videos.json.");
