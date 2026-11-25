# Panel propio de DOFI: plan de ejecución

> **Para quien lo ejecute (agente):** SUB-SKILL REQUERIDA: `superpowers:subagent-driven-development` (recomendada) o `superpowers:executing-plans`, tarea por tarea. Los pasos usan casillas (`- [ ]`) para llevar el avance. Lee primero `ENCARGO.md` y `diseno.md`.

> **Actualizado el 2026-11-24 — leer primero `cambios-2026-11-24.md`.** Manda sobre este plan donde se contradigan. Cambios principales: (1) las etapas se renumeran (la nueva etapa 1 es el panel con su vista previa en vivo para el Inicio; las etapas 0 y 1 de abajo pasan a ser la nueva etapa 2, la 2 pasa a la 3, y la 7 de abajo, baja de Sanity, sigue siendo la 7; el asistente de Claude que se agregó el 2026-11-24 se descartó el 2026-11-25); (2) quedan **obsoletas** la tarea 0.6 paso 4 (medición de CPU para decidir `force-dynamic`), la tarea 2.5 (rutas `force-dynamic`) y las tareas 3 y 4 de la etapa 3 (guardado automático y vista previa con `draftMode`); (3) la construcción lee D1 por su API REST y «Publicar» dispara el Deploy Hook. Los nombres de rama de abajo (`panel-0-cimientos`, …) se ajustan a la numeración nueva.

**Objetivo:** reemplazar Sanity por un panel propio en `/admin`, con vista previa antes de publicar, y con el contenido y los archivos guardados en la cuenta de Cloudflare de DOFI.

**Arquitectura:** todo dentro del Worker `pagina-dofi` (Next.js 15 + OpenNext). El contenido vive en D1 con la misma forma JSON que tiene en Sanity; los archivos en R2, servidos por `/media`. Una capa de lectura nueva entrega a los normalizadores actuales la misma forma cruda que hoy entregan las consultas GROQ, así que los componentes no cambian. El cambio de fuente es una variable (`CONTENT_SOURCE`).

**Tecnología:** Next.js 15.5 (App Router), React 19, TypeScript, Tailwind v4, `@opennextjs/cloudflare` 1.20, Cloudflare D1 y R2, WebCrypto, Vitest (nuevo, solo desarrollo), `node:sqlite` para las pruebas, `sharp` (ya instalado) para la migración.

## Restricciones globales

Copiadas de `diseno.md` §3. Valen para todas las tareas.

- No tocar DNS, la zona de Cloudflare, el túnel, n8n ni el NAS. No usar la cuenta de Cloudflare «Feniax» ni la de GitHub «feniaxcrm-cloud».
- No subir claves ni secretos al repositorio. No imprimir secretos en la conversación.
- No actualizar Next.js a 16. Nada de `npm audit fix --force`.
- No quitar la variable de build `NEXT_PUBLIC_SITE_URL`.
- Rama aparte por etapa → vista previa (`https://<rama>-pagina-dofi.dofiagenciacreativa.workers.dev`) → visto bueno del propietario → `main`. Nunca empujar a `main` sin su «sí».
- Commits en español, terminados con la línea `Co-Authored-By:` del modelo que los hace.
- Español sencillo con el propietario: no es programador.
- Computadora de trabajo con poca memoria: **una sola tarea pesada a la vez**. No usar `npm run dev` para probar flujos largos; preferir `npm run build:next` + `npx next start -p 3001`.
- Empujar a GitHub con la cuenta `dofiagenciacreativa-design` (comando exacto en `ENCARGO.md`).
- Panel y código nuevo en español. Sin dependencias nuevas de ejecución: lo nuevo en `dependencies` exige el visto bueno del propietario. En `devDependencies` solo `vitest`.
- Los componentes de las páginas públicas **no se modifican**, salvo donde este plan lo dice.
- Hasta la etapa 6 la web publicada sigue leyendo de Sanity (`CONTENT_SOURCE` sin definir o `sanity`).

## Cómo está partido

| Etapa | Rama | Entregable comprobable | Detalle en este documento |
|---|---|---|---|
| 0 | `panel-0-cimientos` | D1 y R2 enlazados; almacén de documentos con pruebas; `/media`; `/api/admin/estado`; medición de CPU | Completo, paso a paso |
| 1 | `panel-1-usuarios-archivos` | Entrar/salir, usuarios, subir archivos (incluido por partes), biblioteca | Completo en interfaces y pruebas; pantallas descritas |
| 2 | `panel-2-contenido` | Contenido copiado a D1/R2; lectura propia detrás de `CONTENT_SOURCE`; paridad en cero | Completo en interfaces, algoritmo y criterios |
| 3 | `panel-3-formularios` | Motor de formularios, vista previa, y Banners + Hero + Página de inicio editables | Tareas y criterios |
| 4 | `panel-4-paginas` | Las 4 páginas de servicio editables (14 bloques) | Tareas y criterios |
| 5 | `panel-5-colecciones` | Cuentas, Contenidos, Servicios, Reseñas; historial; actividad | Tareas y criterios |
| 6 | `panel-6-cambio` | La web lee del almacén propio | Lista de control |
| 7 | `panel-7-baja-sanity` | Sanity fuera del código | Lista de control |

**Regla para las etapas 3, 4 y 5:** sus tareas dependen de decisiones que se toman al ver funcionando las etapas anteriores. Antes de empezar cada una, quien ejecute escribe el plan fino de esa etapa con este mismo formato (código completo por paso) en `docs/panel-propio/plan-etapa-N.md`, usando `inventario-esquema.md`, y lo hace confirmar. Lo que sigue fija sus archivos, interfaces y criterios de aceptación; eso no se renegocia.

## Mapa de archivos

```
src/almacen/                      Habla con D1 y R2. No sabe de páginas ni de formularios.
  sql.ts                          Interfaz mínima de base de datos (la cumple D1 y la base de pruebas)
  migraciones.ts                  Lista ordenada de cambios de esquema + aplicarMigraciones()
  documentos.ts                   leer, guardar borrador, publicar, descartar, historial, restaurar, borrar
  archivos.ts                     registrar, buscar, usos, borrar; claves de R2; elegir variante
  usuarios.ts                     crear, buscar, cambiar clave/rol/activo
  sesiones.ts                     crear, validar, renovar, cerrar; freno de intentos
  claves.ts                       hash y verificación de contraseñas (PBKDF2, WebCrypto)
  auditoria.ts                    anotar y listar
  entorno.ts                      obtenerEntorno(): { DB, MEDIA, ... } desde getCloudflareContext()
src/lib/contenido/                Capa de lectura que usan las páginas
  tipos.ts                        Doc, Lector, ArchivoInfo, Fuente
  fuente.ts                       fuenteActual(): "sanity" | "propio"
  lector.ts                       crearLector({ borrador }): Lector (con memoria por petición)
  imagenes.ts                     urlDeArchivo(), forma de imagen equivalente a asset->{...}
  proyecciones/                   Un archivo por consulta GROQ de hoy (8)
src/panel/                        Todo lo del panel que no es una ruta
  esquema/                        tipos.ts + un archivo por tipo de documento, objeto y bloque
  motor/                          Formulario, Campo*, Lista, Objeto, validar.ts, mezclar.ts
  vista-previa/                   Marco, franja «cambios sin publicar»
  archivos/                       subir.ts (variantes en el navegador, subida por partes), Biblioteca
  ui/                             Botón, Campo de texto, Diálogo... del panel
src/app/admin/                    Rutas del panel (grupo aparte, con su propio layout)
src/app/api/admin/                API de escritura
src/app/media/[...ruta]/route.ts  Sirve archivos de R2
scripts/migrar-desde-sanity.mts   Copia Sanity → almacén propio (cliente de la API)
scripts/paridad.mts               Compara lectura Sanity contra lectura propia
pruebas/                          Vitest: ayudas/, almacen/, contenido/, panel/, fixtures/
```

---

## Etapa 0 — Cimientos

Rama `panel-0-cimientos`, creada desde `main`.

### Tarea 0.1: Recursos de Cloudflare (la hace el propietario, guiado)

Sin esto no se puede seguir. Pedírselo en un solo mensaje, con estos pasos, y esperar su confirmación. **No pedir que pegue secretos en la conversación.**

- [ ] **Paso 1: pedir al propietario** (texto listo para enviar):

  > Necesito que hagas 5 cosas en Cloudflare, en la cuenta de DOFI. Son clics, sin programar:
  > 1. **Activar R2:** menú *Storage & databases → R2 Object Storage*. Te pedirá registrar una tarjeta; el plan gratis cubre 10 GB y hoy usamos 0,2 GB.
  > 2. **Crear dos almacenes** en R2 (botón *Create bucket*), con estos nombres exactos: `dofi-media` y `dofi-media-pruebas`. Ubicación automática.
  > 3. **Crear dos bases** en *Storage & databases → D1 SQL Database* (botón *Create*): `dofi-contenido` y `dofi-contenido-pruebas`.
  > 4. Abre cada base y **cópiame su «Database ID»** (un código largo con guiones). No es secreto.
  > 5. En *Workers & Pages → pagina-dofi → Settings → Variables and Secrets*, crea un **Secret** (tipo *Secret*, no *Text*) llamado `ADMIN_SETUP_TOKEN`. Inventa un texto largo (40 caracteres o más, letras y números) y **guárdalo**: lo vas a necesitar para crear tu usuario. No me lo pegues aquí. Repítelo en la pestaña *Previews Base*.

- [ ] **Paso 2: comprobar** con el navegador del propietario (solo lectura) que existen los 4 recursos y el secreto en *Production* y en *Previews Base*.

### Tarea 0.2: Enlaces en `wrangler.jsonc` y tipos

**Archivos:**
- Modificar: `wrangler.jsonc`
- Modificar: `next.config.ts`
- Crear: `src/almacen/entorno.ts`

**Interfaces — produce:**
```ts
// src/almacen/entorno.ts
export type Entorno = { DB: D1Database; MEDIA: R2Bucket; ADMIN_SETUP_TOKEN?: string };
export function obtenerEntorno(): Entorno | null;   // null durante la construcción o si faltan los enlaces
```

- [ ] **Paso 1: agregar los enlaces** a `wrangler.jsonc`, a nivel raíz y dentro de `previews` (los ids son los que dio el propietario):

```jsonc
  "d1_databases": [
    { "binding": "DB", "database_name": "dofi-contenido", "database_id": "<ID de dofi-contenido>" }
  ],
  "r2_buckets": [
    { "binding": "MEDIA", "bucket_name": "dofi-media" }
  ],
```

  y dentro del bloque `"previews"` existente:

```jsonc
    "d1_databases": [
      { "binding": "DB", "database_name": "dofi-contenido-pruebas", "database_id": "<ID de dofi-contenido-pruebas>" }
    ],
    "r2_buckets": [
      { "binding": "MEDIA", "bucket_name": "dofi-media-pruebas" }
    ]
```

- [ ] **Paso 2: enlaces en desarrollo local.** En `next.config.ts`, antes de `export default`:

```ts
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// En `next dev` da una base D1 y un almacén R2 locales (carpeta .wrangler/, fuera del repositorio).
initOpenNextCloudflareForDev();
```

- [ ] **Paso 3: escribir `src/almacen/entorno.ts`:**

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Entorno = { DB: D1Database; MEDIA: R2Bucket; ADMIN_SETUP_TOKEN?: string };

/** Los enlaces del Worker. null durante `next build` (no hay Worker) o si falta alguno. */
export function obtenerEntorno(): Entorno | null {
  try {
    const env = getCloudflareContext().env as unknown as Partial<Entorno>;
    if (!env?.DB || !env?.MEDIA) return null;
    return env as Entorno;
  } catch {
    return null;
  }
}
```

- [ ] **Paso 4: generar tipos y comprobar.** Ejecutar `npm run cf:typegen` (crea `cloudflare-env.d.ts`, ya ignorado por git) y `npx tsc --noEmit -p .`. Esperado: sin errores. Si `D1Database`/`R2Bucket` no se resuelven, agregar `"cloudflare-env.d.ts"` a `include` en `tsconfig.json`.

- [ ] **Paso 5: commit** — `git commit -m "Panel: enlaces de D1 y R2 en el Worker"`

### Tarea 0.3: Vitest y la base de pruebas

**Archivos:**
- Modificar: `package.json` (script `"probar": "vitest run"`, `devDependencies.vitest`)
- Crear: `vitest.config.ts`, `src/almacen/sql.ts`, `pruebas/ayudas/base-de-prueba.ts`, `pruebas/ayudas/base-de-prueba.test.ts`

**Interfaces — produce:**
```ts
// src/almacen/sql.ts — lo mínimo de D1 que usa el almacén. D1Database lo cumple tal cual.
export interface Sentencia {
  bind(...valores: unknown[]): Sentencia;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface BaseSql {
  prepare(sql: string): Sentencia;
  batch(sentencias: Sentencia[]): Promise<unknown[]>;   // todo o nada
}
```

- [ ] **Paso 1:** `npm install -D vitest` y agregar el script `"probar": "vitest run"`.

- [ ] **Paso 2: `vitest.config.ts`:**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["pruebas/**/*.test.ts"], environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

- [ ] **Paso 3: escribir `src/almacen/sql.ts`** con las dos interfaces de arriba.

- [ ] **Paso 4: escribir la prueba que falla** — `pruebas/ayudas/base-de-prueba.test.ts`:

```ts
import { expect, test } from "vitest";
import { baseDePrueba } from "./base-de-prueba";

test("la base de prueba guarda, lee y deshace un lote que falla", async () => {
  const db = baseDePrueba();
  await db.prepare("CREATE TABLE t (id TEXT PRIMARY KEY, n INTEGER)").run();
  await db.prepare("INSERT INTO t VALUES (?, ?)").bind("a", 1).run();
  expect(await db.prepare("SELECT n FROM t WHERE id = ?").bind("a").first<{ n: number }>()).toEqual({ n: 1 });
  expect((await db.prepare("SELECT id FROM t").all<{ id: string }>()).results).toEqual([{ id: "a" }]);
  await expect(
    db.batch([db.prepare("INSERT INTO t VALUES (?, ?)").bind("b", 2), db.prepare("INSERT INTO t VALUES (?, ?)").bind("a", 3)])
  ).rejects.toThrow();
  expect(await db.prepare("SELECT n FROM t WHERE id = ?").bind("b").first()).toBeNull();
});
```

- [ ] **Paso 5:** `npm run probar` → falla con «Cannot find module ./base-de-prueba».

- [ ] **Paso 6: escribir `pruebas/ayudas/base-de-prueba.ts`:**

```ts
import { DatabaseSync } from "node:sqlite";
import type { BaseSql, Sentencia } from "@/almacen/sql";

/** Una base SQLite en memoria con la misma cara que D1, para las pruebas. */
export function baseDePrueba(): BaseSql {
  const db = new DatabaseSync(":memory:");
  const hacer = (sql: string, params: unknown[] = []): Sentencia => ({
    bind: (...valores) => hacer(sql, valores),
    first: async <T>() => ((db.prepare(sql).get(...(params as never[])) as T | undefined) ?? null),
    all: async <T>() => ({ results: db.prepare(sql).all(...(params as never[])) as T[] }),
    run: async () => db.prepare(sql).run(...(params as never[])),
  });
  return {
    prepare: (sql) => hacer(sql),
    batch: async (sentencias) => {
      db.exec("BEGIN");
      try {
        const salida: unknown[] = [];
        for (const s of sentencias) salida.push(await s.run());
        db.exec("COMMIT");
        return salida;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
}
```

- [ ] **Paso 7:** `npm run probar` → 1 prueba pasa.
- [ ] **Paso 8: commit** — `git commit -m "Panel: Vitest y base de pruebas en memoria"`

### Tarea 0.4: Cambios de esquema que aplica el propio Worker

**Archivos:**
- Crear: `src/almacen/migraciones.ts`, `pruebas/almacen/migraciones.test.ts`

**Interfaces — produce:**
```ts
export const MIGRACIONES: { numero: number; nombre: string; sentencias: string[] }[];
export async function aplicarMigraciones(db: BaseSql): Promise<{ aplicadas: number[]; version: number }>;
export async function versionDeEsquema(db: BaseSql): Promise<number>;   // 0 si no hay nada
```

- [ ] **Paso 1: prueba que falla** — `pruebas/almacen/migraciones.test.ts`:

```ts
import { expect, test } from "vitest";
import { baseDePrueba } from "../ayudas/base-de-prueba";
import { MIGRACIONES, aplicarMigraciones, versionDeEsquema } from "@/almacen/migraciones";

test("aplica todo la primera vez y nada la segunda", async () => {
  const db = baseDePrueba();
  expect(await versionDeEsquema(db)).toBe(0);
  const primera = await aplicarMigraciones(db);
  expect(primera.aplicadas).toEqual(MIGRACIONES.map((m) => m.numero));
  const segunda = await aplicarMigraciones(db);
  expect(segunda.aplicadas).toEqual([]);
  expect(segunda.version).toBe(MIGRACIONES.at(-1)!.numero);
});

test("crea las siete tablas del diseño", async () => {
  const db = baseDePrueba();
  await aplicarMigraciones(db);
  const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all<{ name: string }>();
  expect(results.map((r) => r.name)).toEqual(
    expect.arrayContaining(["archivos", "auditoria", "documentos", "intentos_ingreso", "sesiones", "usuarios", "versiones"])
  );
});
```

- [ ] **Paso 2:** `npm run probar` → falla (módulo inexistente).

- [ ] **Paso 3: escribir `src/almacen/migraciones.ts`.** La migración 1 lleva, **una sentencia por elemento del arreglo**, exactamente las tablas e índices de `diseno.md` §5.2 (7 `CREATE TABLE` y 3 `CREATE INDEX`). Esqueleto completo:

```ts
import type { BaseSql } from "./sql";

export const MIGRACIONES: { numero: number; nombre: string; sentencias: string[] }[] = [
  {
    numero: 1,
    nombre: "inicial",
    sentencias: [
      `CREATE TABLE documentos (id TEXT PRIMARY KEY, tipo TEXT NOT NULL, publicado TEXT, borrador TEXT, version INTEGER NOT NULL DEFAULT 0, creado_en TEXT NOT NULL, publicado_en TEXT, borrador_en TEXT, publicado_por TEXT, borrador_por TEXT)`,
      `CREATE INDEX documentos_tipo ON documentos (tipo)`,
      `CREATE TABLE versiones (documento_id TEXT NOT NULL, version INTEGER NOT NULL, contenido TEXT NOT NULL, publicado_en TEXT NOT NULL, publicado_por TEXT, nota TEXT, PRIMARY KEY (documento_id, version))`,
      `CREATE TABLE archivos (id TEXT PRIMARY KEY, clase TEXT NOT NULL, mime TEXT NOT NULL, extension TEXT NOT NULL, bytes INTEGER NOT NULL, ancho INTEGER, alto INTEGER, variantes TEXT NOT NULL DEFAULT '[]', nombre TEXT, origen TEXT, subido_en TEXT NOT NULL, subido_por TEXT)`,
      `CREATE TABLE usuarios (id TEXT PRIMARY KEY, correo TEXT NOT NULL UNIQUE, nombre TEXT NOT NULL, rol TEXT NOT NULL, clave_hash TEXT NOT NULL, clave_sal TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1, creado_en TEXT NOT NULL, ultimo_ingreso TEXT)`,
      `CREATE TABLE sesiones (id TEXT PRIMARY KEY, usuario_id TEXT NOT NULL, creada_en TEXT NOT NULL, vence_en TEXT NOT NULL, ip TEXT, agente TEXT)`,
      `CREATE INDEX sesiones_usuario ON sesiones (usuario_id)`,
      `CREATE TABLE intentos_ingreso (clave TEXT PRIMARY KEY, fallos INTEGER NOT NULL, bloqueado_hasta TEXT)`,
      `CREATE TABLE auditoria (id INTEGER PRIMARY KEY AUTOINCREMENT, cuando TEXT NOT NULL, usuario_id TEXT, accion TEXT NOT NULL, objeto TEXT, detalle TEXT)`,
      `CREATE INDEX auditoria_cuando ON auditoria (cuando)`,
    ],
  },
];

export async function versionDeEsquema(db: BaseSql): Promise<number> {
  await db.prepare("CREATE TABLE IF NOT EXISTS _esquema (numero INTEGER PRIMARY KEY, nombre TEXT NOT NULL, aplicada_en TEXT NOT NULL)").run();
  const fila = await db.prepare("SELECT MAX(numero) AS n FROM _esquema").first<{ n: number | null }>();
  return fila?.n ?? 0;
}

export async function aplicarMigraciones(db: BaseSql): Promise<{ aplicadas: number[]; version: number }> {
  let version = await versionDeEsquema(db);
  const aplicadas: number[] = [];
  for (const m of MIGRACIONES) {
    if (m.numero <= version) continue;
    await db.batch([
      ...m.sentencias.map((s) => db.prepare(s)),
      db.prepare("INSERT INTO _esquema (numero, nombre, aplicada_en) VALUES (?, ?, ?)").bind(m.numero, m.nombre, new Date().toISOString()),
    ]);
    aplicadas.push(m.numero);
    version = m.numero;
  }
  return { aplicadas, version };
}
```

- [ ] **Paso 4:** `npm run probar` → pasan las 3 pruebas.
- [ ] **Paso 5: commit** — `git commit -m "Panel: tablas del almacén, aplicadas por el propio Worker"`

### Tarea 0.5: Almacén de documentos (borrador, publicar, historial)

**Archivos:**
- Crear: `src/almacen/documentos.ts`, `pruebas/almacen/documentos.test.ts`

**Interfaces — consume:** `BaseSql` (0.3), tablas (0.4). **Produce:**
```ts
export type Doc = Record<string, unknown> & { _id: string; _type: string };
export const MAX_VERSIONES = 30;
export async function leerDocumento(db: BaseSql, id: string, o: { borrador: boolean }): Promise<Doc | null>;
export async function listarPorTipo(db: BaseSql, tipo: string, o: { borrador: boolean }): Promise<Doc[]>;
export async function estadoDocumento(db: BaseSql, id: string): Promise<{ existe: boolean; version: number; tieneBorrador: boolean; publicadoEn: string | null; borradorEn: string | null }>;
export async function guardarBorrador(db: BaseSql, doc: Doc, usuarioId: string | null): Promise<void>;
export async function descartarBorrador(db: BaseSql, id: string): Promise<void>;
export async function publicar(db: BaseSql, id: string, usuarioId: string | null, nota?: string): Promise<number>;   // versión nueva
export async function historial(db: BaseSql, id: string): Promise<{ version: number; publicadoEn: string; publicadoPor: string | null; nota: string | null }[]>;
export async function leerVersion(db: BaseSql, id: string, version: number): Promise<Doc | null>;
export async function restaurarComoBorrador(db: BaseSql, id: string, version: number, usuarioId: string | null): Promise<void>;
export async function borrarDocumento(db: BaseSql, id: string): Promise<void>;
export class ErrorDeAlmacen extends Error { constructor(public codigo: "no-existe" | "sin-borrador" | "sin-version", mensaje: string); }
```

Reglas (cada una tiene su prueba):
1. `leerDocumento(..., { borrador: false })` devuelve lo publicado o `null`. Con `{ borrador: true }` devuelve el borrador si existe y, si no, lo publicado.
2. `listarPorTipo` sigue la misma regla, documento por documento, y omite los que no tengan nada que mostrar.
3. `guardarBorrador` crea la fila si no existe; si existe, reemplaza solo el borrador. No toca `publicado` ni `version`.
4. `publicar` exige borrador (`sin-borrador`); copia borrador → publicado, vacía el borrador, sube `version` en 1, agrega una fila a `versiones`, y borra las versiones más viejas hasta dejar `MAX_VERSIONES`. Todo en un solo `batch`.
5. `descartarBorrador` vacía el borrador; si el documento nunca se publicó, borra la fila.
6. `restaurarComoBorrador` copia el contenido de esa versión al borrador (no publica). `sin-version` si no existe.
7. `borrarDocumento` borra la fila y su historial.

- [ ] **Paso 1: escribir las pruebas** — `pruebas/almacen/documentos.test.ts`:

```ts
import { beforeEach, expect, test } from "vitest";
import { baseDePrueba } from "../ayudas/base-de-prueba";
import { aplicarMigraciones } from "@/almacen/migraciones";
import type { BaseSql } from "@/almacen/sql";
import * as D from "@/almacen/documentos";

let db: BaseSql;
const doc = (titulo: string): D.Doc => ({ _id: "banners", _type: "banners", titulo });
beforeEach(async () => { db = baseDePrueba(); await aplicarMigraciones(db); });

test("un borrador nuevo no se ve como publicado", async () => {
  await D.guardarBorrador(db, doc("uno"), "u1");
  expect(await D.leerDocumento(db, "banners", { borrador: false })).toBeNull();
  expect(await D.leerDocumento(db, "banners", { borrador: true })).toMatchObject({ titulo: "uno" });
  expect(await D.estadoDocumento(db, "banners")).toMatchObject({ existe: true, version: 0, tieneBorrador: true });
});

test("publicar copia el borrador, lo vacía y sube la versión", async () => {
  await D.guardarBorrador(db, doc("uno"), "u1");
  expect(await D.publicar(db, "banners", "u1")).toBe(1);
  expect(await D.leerDocumento(db, "banners", { borrador: false })).toMatchObject({ titulo: "uno" });
  expect(await D.estadoDocumento(db, "banners")).toMatchObject({ version: 1, tieneBorrador: false });
  expect(await D.historial(db, "banners")).toHaveLength(1);
});

test("publicar exige que el documento exista y que tenga borrador", async () => {
  await expect(D.publicar(db, "banners", "u1")).rejects.toMatchObject({ codigo: "no-existe" });
  await D.guardarBorrador(db, doc("uno"), "u1"); await D.publicar(db, "banners", "u1");
  await expect(D.publicar(db, "banners", "u1")).rejects.toMatchObject({ codigo: "sin-borrador" });
});

test("guardar un borrador no cambia lo publicado", async () => {
  await D.guardarBorrador(db, doc("uno"), "u1"); await D.publicar(db, "banners", "u1");
  await D.guardarBorrador(db, doc("dos"), "u2");
  expect(await D.leerDocumento(db, "banners", { borrador: false })).toMatchObject({ titulo: "uno" });
  expect(await D.leerDocumento(db, "banners", { borrador: true })).toMatchObject({ titulo: "dos" });
});

test("descartar vuelve a lo publicado; si nunca se publicó, borra el documento", async () => {
  await D.guardarBorrador(db, doc("uno"), "u1");
  await D.descartarBorrador(db, "banners");
  expect((await D.estadoDocumento(db, "banners")).existe).toBe(false);
  await D.guardarBorrador(db, doc("uno"), "u1"); await D.publicar(db, "banners", "u1");
  await D.guardarBorrador(db, doc("dos"), "u1"); await D.descartarBorrador(db, "banners");
  expect(await D.leerDocumento(db, "banners", { borrador: true })).toMatchObject({ titulo: "uno" });
});

test("el historial guarda como máximo MAX_VERSIONES", async () => {
  for (let i = 1; i <= D.MAX_VERSIONES + 3; i++) { await D.guardarBorrador(db, doc("v" + i), "u1"); await D.publicar(db, "banners", "u1"); }
  const h = await D.historial(db, "banners");
  expect(h).toHaveLength(D.MAX_VERSIONES);
  expect(h[0].version).toBe(D.MAX_VERSIONES + 3);          // la más nueva primero
  expect(h.at(-1)!.version).toBe(4);
});

test("restaurar deja la versión vieja como borrador, sin publicar", async () => {
  await D.guardarBorrador(db, doc("uno"), "u1"); await D.publicar(db, "banners", "u1");
  await D.guardarBorrador(db, doc("dos"), "u1"); await D.publicar(db, "banners", "u1");
  await D.restaurarComoBorrador(db, "banners", 1, "u1");
  expect(await D.leerDocumento(db, "banners", { borrador: false })).toMatchObject({ titulo: "dos" });
  expect(await D.leerDocumento(db, "banners", { borrador: true })).toMatchObject({ titulo: "uno" });
  await expect(D.restaurarComoBorrador(db, "banners", 99, "u1")).rejects.toMatchObject({ codigo: "sin-version" });
});

test("listarPorTipo aplica la regla de borrador documento por documento", async () => {
  await D.guardarBorrador(db, { _id: "a", _type: "resena", autor: "A" }, null); await D.publicar(db, "a", null);
  await D.guardarBorrador(db, { _id: "b", _type: "resena", autor: "B" }, null);
  expect((await D.listarPorTipo(db, "resena", { borrador: false })).map((d) => d._id)).toEqual(["a"]);
  expect((await D.listarPorTipo(db, "resena", { borrador: true })).map((d) => d._id).sort()).toEqual(["a", "b"]);
});
```

- [ ] **Paso 2:** `npm run probar` → fallan (módulo inexistente).

- [ ] **Paso 3: escribir `src/almacen/documentos.ts`:**

```ts
import type { BaseSql } from "./sql";

export type Doc = Record<string, unknown> & { _id: string; _type: string };
export const MAX_VERSIONES = 30;

export class ErrorDeAlmacen extends Error {
  constructor(public codigo: "no-existe" | "sin-borrador" | "sin-version", mensaje: string) { super(mensaje); }
}

type Fila = { id: string; tipo: string; publicado: string | null; borrador: string | null; version: number; publicado_en: string | null; borrador_en: string | null };
const ahora = () => new Date().toISOString();
const fila = (db: BaseSql, id: string) =>
  db.prepare("SELECT id, tipo, publicado, borrador, version, publicado_en, borrador_en FROM documentos WHERE id = ?").bind(id).first<Fila>();
const elegir = (f: Fila, borrador: boolean): Doc | null => {
  const texto = borrador ? (f.borrador ?? f.publicado) : f.publicado;
  return texto ? (JSON.parse(texto) as Doc) : null;
};

export async function leerDocumento(db: BaseSql, id: string, o: { borrador: boolean }): Promise<Doc | null> {
  const f = await fila(db, id);
  return f ? elegir(f, o.borrador) : null;
}

export async function listarPorTipo(db: BaseSql, tipo: string, o: { borrador: boolean }): Promise<Doc[]> {
  const { results } = await db
    .prepare("SELECT id, tipo, publicado, borrador, version, publicado_en, borrador_en FROM documentos WHERE tipo = ? ORDER BY creado_en")
    .bind(tipo).all<Fila>();
  return results.map((f) => elegir(f, o.borrador)).filter((d): d is Doc => d !== null);
}

export async function estadoDocumento(db: BaseSql, id: string) {
  const f = await fila(db, id);
  return { existe: f !== null, version: f?.version ?? 0, tieneBorrador: Boolean(f?.borrador), publicadoEn: f?.publicado_en ?? null, borradorEn: f?.borrador_en ?? null };
}

export async function guardarBorrador(db: BaseSql, doc: Doc, usuarioId: string | null): Promise<void> {
  const t = ahora();
  await db
    .prepare(
      `INSERT INTO documentos (id, tipo, borrador, version, creado_en, borrador_en, borrador_por) VALUES (?, ?, ?, 0, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET borrador = excluded.borrador, borrador_en = excluded.borrador_en, borrador_por = excluded.borrador_por`
    )
    .bind(doc._id, doc._type, JSON.stringify(doc), t, t, usuarioId).run();
}

export async function descartarBorrador(db: BaseSql, id: string): Promise<void> {
  const f = await fila(db, id);
  if (!f) return;
  if (f.publicado === null) await db.prepare("DELETE FROM documentos WHERE id = ?").bind(id).run();
  else await db.prepare("UPDATE documentos SET borrador = NULL, borrador_en = NULL, borrador_por = NULL WHERE id = ?").bind(id).run();
}

export async function publicar(db: BaseSql, id: string, usuarioId: string | null, nota?: string): Promise<number> {
  const f = await fila(db, id);
  if (!f) throw new ErrorDeAlmacen("no-existe", `No existe el documento ${id}`);
  if (f.borrador === null) throw new ErrorDeAlmacen("sin-borrador", `El documento ${id} no tiene cambios para publicar`);
  const version = f.version + 1;
  const t = ahora();
  await db.batch([
    db.prepare("UPDATE documentos SET publicado = borrador, borrador = NULL, borrador_en = NULL, borrador_por = NULL, version = ?, publicado_en = ?, publicado_por = ? WHERE id = ?")
      .bind(version, t, usuarioId, id),
    db.prepare("INSERT INTO versiones (documento_id, version, contenido, publicado_en, publicado_por, nota) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, version, f.borrador, t, usuarioId, nota ?? null),
    db.prepare("DELETE FROM versiones WHERE documento_id = ? AND version <= ?").bind(id, version - MAX_VERSIONES),
  ]);
  return version;
}

export async function historial(db: BaseSql, id: string) {
  const { results } = await db
    .prepare("SELECT version, publicado_en, publicado_por, nota FROM versiones WHERE documento_id = ? ORDER BY version DESC")
    .bind(id).all<{ version: number; publicado_en: string; publicado_por: string | null; nota: string | null }>();
  return results.map((r) => ({ version: r.version, publicadoEn: r.publicado_en, publicadoPor: r.publicado_por, nota: r.nota }));
}

export async function leerVersion(db: BaseSql, id: string, version: number): Promise<Doc | null> {
  const r = await db.prepare("SELECT contenido FROM versiones WHERE documento_id = ? AND version = ?").bind(id, version).first<{ contenido: string }>();
  return r ? (JSON.parse(r.contenido) as Doc) : null;
}

export async function restaurarComoBorrador(db: BaseSql, id: string, version: number, usuarioId: string | null): Promise<void> {
  const doc = await leerVersion(db, id, version);
  if (!doc) throw new ErrorDeAlmacen("sin-version", `El documento ${id} no tiene la versión ${version}`);
  await guardarBorrador(db, doc, usuarioId);
}

export async function borrarDocumento(db: BaseSql, id: string): Promise<void> {
  await db.batch([db.prepare("DELETE FROM documentos WHERE id = ?").bind(id), db.prepare("DELETE FROM versiones WHERE documento_id = ?").bind(id)]);
}
```

- [ ] **Paso 4:** `npm run probar` → pasan todas. `npx tsc --noEmit -p .` → sin errores.
- [ ] **Paso 5: commit** — `git commit -m "Panel: almacén de documentos con borrador, publicación e historial"`

### Tarea 0.6: Estado del sistema y medición de CPU

**Archivos:**
- Crear: `src/app/api/admin/estado/route.ts`, `src/app/api/admin/instalar/route.ts`

**Interfaces — produce:**
- `GET /api/admin/estado` → `200 { enlaces: { DB: boolean, MEDIA: boolean }, esquema: number, esquemaEsperado: number, usuarios: number, fuente: "sanity" | "propio" }`. No revela secretos. Sin sesión (todavía no existe): solo números y booleanos.
- `POST /api/admin/instalar` con cabecera `x-token-instalacion: <ADMIN_SETUP_TOKEN>` → aplica las migraciones pendientes → `200 { aplicadas: number[], version: number }`. `401` si el token no coincide (comparación en tiempo constante). En la etapa 1 pasa a aceptar también sesión de administrador.

- [ ] **Paso 1:** escribir las dos rutas con `export const dynamic = "force-dynamic"`, usando `obtenerEntorno()`, `versionDeEsquema`, `aplicarMigraciones` y `MIGRACIONES.at(-1)!.numero`. Si `obtenerEntorno()` es `null`, `estado` responde `enlaces: { DB: false, MEDIA: false }` con `200`.
- [ ] **Paso 2: probar en local** con la versión compilada (`npm run build:next`, `npx next start -p 3001`): `curl -s localhost:3001/api/admin/estado` → `esquema: 0`. Con `ADMIN_SETUP_TOKEN=prueba` en `.dev.vars` (archivo ignorado por git): `curl -s -X POST -H "x-token-instalacion: prueba" localhost:3001/api/admin/instalar` → `aplicadas: [1]`; repetir → `aplicadas: []`.
- [ ] **Paso 3: subir la rama**, esperar la vista previa y pedir al propietario que ejecute una sola vez (o hacerlo desde su navegador con su permiso, sin ver el token): `POST https://panel-0-cimientos-pagina-dofi.dofiagenciacreativa.workers.dev/api/admin/instalar` con su token. Comprobar `estado` → `esquema: 1`.
- **OBSOLETO (2026-11-24):** el paso 4 ya no aplica. Las páginas se arman al construir (`cambios-2026-11-24.md` §1); no hay decisión de `force-dynamic` que tomar.
- [ ] ~~**Paso 4: medir el costo de dibujar una página hoy.**~~ En el panel de Cloudflare (solo lectura): *Workers & Pages → pagina-dofi → Metrics → CPU Time* (mediana y P99 de las últimas 24 h) y el plan de la cuenta (*Workers plans*). Anotar los tres datos en `docs/panel-propio/mediciones.md`.
  - Si el plan es **Free** y el P99 supera 8 ms, o el plan es de pago y el P99 supera 40 ms: **activar el plan B de caché** (`diseno.md` §6.2) como tarea 2.0 antes de la etapa 2, y avisar al propietario.
  - En cualquier otro caso se sigue con `force-dynamic`.
- [ ] **Paso 5: comprobar la observación de Google Places.** En *Observability → Logs* del Worker, filtrar por `places.googleapis.com` o por el aviso que escribe `src/lib/google-places.ts`; contar llamadas en una hora contra visitas a las páginas de servicio. Anotar en `mediciones.md`. Si hay una llamada por visita, abrir la tarea 2.7.
- [ ] **Paso 6: commit** — `git commit -m "Panel: estado del sistema e instalación de tablas"`

### Tarea 0.7: `/media` — servir archivos de R2

**Archivos:**
- Crear: `src/almacen/archivos.ts`, `src/app/media/[...ruta]/route.ts`, `pruebas/almacen/archivos.test.ts`
- Modificar: `src/lib/cargador-imagenes.ts`, `pruebas/contenido/cargador-imagenes.test.ts` (nuevo)

**Interfaces — produce:**
```ts
// src/almacen/archivos.ts
export const ANCHOS_VARIANTE = [160, 320, 480, 640, 828, 1080, 1200, 1600, 1920, 2400] as const;
export type FilaArchivo = { id: string; clase: "imagen" | "video" | "archivo"; mime: string; extension: string; bytes: number; ancho: number | null; alto: number | null; variantes: number[]; nombre: string | null; origen: string | null; subidoEn: string; subidoPor: string | null };
export const claveOriginal = (id: string, extension: string) => `orig/${id}.${extension}`;
export const claveVariante = (id: string, ancho: number) => `img/${id}/w${ancho}.webp`;
/** La variante más angosta que sea >= pedido; null = servir el original. */
export function elegirVariante(variantes: number[], pedido: number | null): number | null;
export function anchosParaGenerar(anchoOriginal: number): number[];      // los de ANCHOS_VARIANTE menores que el original
export async function buscarArchivo(db: BaseSql, id: string): Promise<FilaArchivo | null>;
export async function buscarArchivos(db: BaseSql, ids: string[]): Promise<Map<string, FilaArchivo>>;   // una sola consulta
export async function registrarArchivo(db: BaseSql, a: Omit<FilaArchivo, "subidoEn">): Promise<void>;  // INSERT OR REPLACE
```

- [ ] **Paso 1: pruebas** — `pruebas/almacen/archivos.test.ts`:

```ts
import { expect, test } from "vitest";
import { anchosParaGenerar, elegirVariante } from "@/almacen/archivos";

test("elige la variante más angosta que alcance", () => {
  expect(elegirVariante([480, 828, 1200], 500)).toBe(828);
  expect(elegirVariante([480, 828, 1200], 480)).toBe(480);
  expect(elegirVariante([480, 828, 1200], 100)).toBe(480);
});
test("si ninguna alcanza o no se pide ancho, sirve el original", () => {
  expect(elegirVariante([480, 828], 1600)).toBeNull();
  expect(elegirVariante([480, 828], null)).toBeNull();
  expect(elegirVariante([], 300)).toBeNull();
});
test("solo genera variantes más angostas que el original", () => {
  expect(anchosParaGenerar(1137)).toEqual([160, 320, 480, 640, 828, 1080]);
  expect(anchosParaGenerar(120)).toEqual([]);
});
```

- [ ] **Paso 2:** `npm run probar` → fallan.
- [ ] **Paso 3: escribir `src/almacen/archivos.ts`** (funciones puras + las tres de base de datos; `variantes` se guarda como JSON de texto y se devuelve como `number[]`).
- [ ] **Paso 4: escribir la ruta `src/app/media/[...ruta]/route.ts`:**
  - `GET` y `HEAD`. La ruta es `<id>.<ext>`; cualquier otra forma → `404`.
  - Busca la fila; si no existe → `404`.
  - `w` = entero de `?w=` (ignorar `h`, `fit`, `q`, `auto`). Si la fila es imagen y `elegirVariante(...)` da un ancho, la clave es `claveVariante`, con `Content-Type: image/webp`; si no, `claveOriginal` con el `mime` de la fila.
  - `MEDIA.get(clave, { range: request.headers })`. Si viene `Range`, responder `206` con `Content-Range`; siempre `Accept-Ranges: bytes`, `ETag`, `Cache-Control: public, max-age=31536000, immutable`.
  - SVG: agregar `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'` y `X-Content-Type-Options: nosniff`.
  - Si la variante no está en R2 (subida a medias), servir el original en vez de fallar.
- [ ] **Paso 5: cargador de imágenes.** Prueba nueva `pruebas/contenido/cargador-imagenes.test.ts`:

```ts
import { expect, test } from "vitest";
import cargador from "@/lib/cargador-imagenes";

test("las direcciones de /media reciben w y q, como las de Sanity", () => {
  expect(cargador({ src: "/media/abc.webp", width: 828 })).toBe("/media/abc.webp?w=828&q=75");
  expect(cargador({ src: "/media/abc.webp?w=2400&auto=format", width: 640, quality: 60 })).toBe("/media/abc.webp?w=640&q=60");
});
test("lo demás de /public no se toca", () => {
  expect(cargador({ src: "/home/banner-redes-foto.webp", width: 828 })).toBe("/home/banner-redes-foto.webp");
});
```

  Ajustar `src/lib/cargador-imagenes.ts` para que pasen **sin cambiar** el comportamiento con `https://cdn.sanity.io/` (agregar antes una prueba que fije el resultado actual para una dirección de Sanity con `w` y `h`, tomada de `inventario-lectura.md` §3.2). Si el archivo no tiene exportación por defecto, importar el nombre que tenga.
- [ ] **Paso 6:** `npm run probar` y `npx tsc --noEmit -p .` → todo en verde.
- [ ] **Paso 7: commit, subir la rama, pedir visto bueno** de la etapa 0 (no hay nada visible: se le muestra `estado` y la medición) y pasar a `main`.

---

## Etapa 1 — Usuarios y archivos

Rama `panel-1-usuarios-archivos`. Al terminar, una persona puede entrar al panel, gestionar usuarios y subir archivos. Todavía no hay contenido.

### Tarea 1.1: Contraseñas

**Archivos:** crear `src/almacen/claves.ts`, `pruebas/almacen/claves.test.ts`.

**Produce:**
```ts
export const VUELTAS = 100_000;
export async function crearHash(clave: string): Promise<{ hash: string; sal: string }>;          // base64
export async function verificar(clave: string, hash: string, sal: string): Promise<boolean>;     // comparación en tiempo constante
export function claveValida(clave: string): string | null;   // null = vale; si no, el motivo en español (mínimo 10 caracteres)
```

Implementación: `crypto.subtle.importKey("raw", ...,"PBKDF2")` + `deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: VUELTAS }, clave, 256)`; sal de 16 bytes con `crypto.getRandomValues`. Pruebas: el mismo texto verifica; otro no; dos hashes del mismo texto son distintos (sal); `claveValida("corta")` devuelve un motivo.

### Tarea 1.2: Usuarios, sesiones y freno de intentos

**Archivos:** crear `src/almacen/usuarios.ts`, `src/almacen/sesiones.ts`, `src/almacen/auditoria.ts` y sus pruebas en `pruebas/almacen/`.

**Produce:**
```ts
// usuarios.ts
export type Rol = "admin" | "editor";
export type Usuario = { id: string; correo: string; nombre: string; rol: Rol; activo: boolean; creadoEn: string; ultimoIngreso: string | null };
export async function contarUsuarios(db: BaseSql): Promise<number>;
export async function crearUsuario(db: BaseSql, d: { correo: string; nombre: string; rol: Rol; clave: string }): Promise<Usuario>;   // correo en minúsculas; error si ya existe
export async function listarUsuarios(db: BaseSql): Promise<Usuario[]>;
export async function buscarPorCorreo(db: BaseSql, correo: string): Promise<(Usuario & { claveHash: string; claveSal: string }) | null>;
export async function cambiarClave(db: BaseSql, id: string, clave: string): Promise<void>;       // cierra todas sus sesiones
export async function cambiarRol(db: BaseSql, id: string, rol: Rol): Promise<void>;              // error si deja al sistema sin administradores activos
export async function cambiarActivo(db: BaseSql, id: string, activo: boolean): Promise<void>;    // ídem; al desactivar cierra sus sesiones

// sesiones.ts
export const DIAS_DE_SESION = 14;
export const COOKIE = "dofi_sesion";
export async function abrirSesion(db: BaseSql, usuarioId: string, d: { ip: string | null; agente: string | null }): Promise<{ token: string; venceEn: string }>;
export async function usuarioDeSesion(db: BaseSql, token: string | undefined): Promise<Usuario | null>;   // null si no existe, venció o el usuario está inactivo; renueva si le queda menos de la mitad
export async function cerrarSesion(db: BaseSql, token: string): Promise<void>;
export async function registrarFallo(db: BaseSql, correo: string, ip: string | null): Promise<void>;
export async function estaBloqueado(db: BaseSql, correo: string, ip: string | null): Promise<boolean>;   // 5 fallos por correo o 20 por IP → 15 minutos
export async function limpiarFallos(db: BaseSql, correo: string): Promise<void>;

// auditoria.ts
export async function anotar(db: BaseSql, e: { usuarioId: string | null; accion: string; objeto?: string; detalle?: unknown }): Promise<void>;
export async function listarActividad(db: BaseSql, o: { limite: number; antesDe?: number }): Promise<{ id: number; cuando: string; usuarioId: string | null; accion: string; objeto: string | null; detalle: unknown }[]>;
```

En D1 se guarda `sha256(token)` en hexadecimal como `sesiones.id`; el token (32 bytes aleatorios, base64url) solo viaja en la cookie. Pruebas mínimas: sesión válida devuelve el usuario; vencida no; usuario desactivado no; `cambiarClave` invalida sesiones; el último administrador no se puede degradar ni desactivar; 5 fallos bloquean y `limpiarFallos` desbloquea.

### Tarea 1.3: API de ingreso y guardia común

**Archivos:** crear `src/app/api/admin/_comun.ts` (guardia), `src/app/api/admin/entrar/route.ts`, `salir/route.ts`, `yo/route.ts`, `usuarios/route.ts`, `usuarios/[id]/route.ts`; modificar `instalar/route.ts`.

**Produce:**
```ts
// _comun.ts
export type Contexto = { db: BaseSql; media: R2Bucket; usuario: Usuario };
/** Envuelve una ruta: exige sesión (y rol si se pide), comprueba Origin en escrituras, convierte errores en JSON { error }. */
export function conSesion(manejador: (req: Request, ctx: Contexto, params: Record<string, string>) => Promise<Response>, o?: { rol?: "admin" }): (req: Request, extra: { params: Promise<Record<string, string>> }) => Promise<Response>;
export const json = (cuerpo: unknown, estado = 200) => Response.json(cuerpo, { status: estado, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
```

| Ruta | Método | Entra | Sale |
|---|---|---|---|
| `/api/admin/instalar` | POST | `{ correo, nombre, clave }` + cabecera `x-token-instalacion` | Aplica migraciones; si no hay usuarios y vino el cuerpo, crea el primer `admin` y abre sesión. Con usuarios ya creados exige sesión de admin y solo migra |
| `/api/admin/entrar` | POST | `{ correo, clave }` | `200 { usuario }` + cookie; `401 { error: "Correo o contraseña incorrectos" }` (mismo texto para ambos casos); `429` si está bloqueado |
| `/api/admin/salir` | POST | — | `200`, borra cookie y sesión |
| `/api/admin/yo` | GET | — | `200 { usuario }` o `401` |
| `/api/admin/usuarios` | GET, POST | POST `{ correo, nombre, rol, clave }` | Solo admin |
| `/api/admin/usuarios/[id]` | PATCH | `{ rol? , activo?, clave? }` | Solo admin |

Reglas: escrituras rechazadas con `403` si `Origin` no coincide con el host de la petición; todas las respuestas `no-store` y `noindex`; cada escritura llama a `anotar(...)`.

### Tarea 1.4: Subida de archivos

**Archivos:** crear `src/app/api/admin/archivos/route.ts` (listar, subir pequeño), `archivos/[id]/route.ts` (detalle, usos, borrar), `archivos/partes/route.ts` (subida por partes), `src/panel/archivos/subir.ts`; ampliar `src/almacen/archivos.ts`.

**Produce (almacén):**
```ts
export const TIPOS_PERMITIDOS: Record<string, { clase: "imagen" | "video"; extension: string; maxBytes: number }>;   // los 7 mime de diseno.md §8
export async function listarArchivos(db: BaseSql, o: { clase?: string; buscar?: string; limite: number; desde?: string }): Promise<FilaArchivo[]>;
export async function usosDeArchivo(db: BaseSql, id: string): Promise<{ documentoId: string; tipo: string; enPublicado: boolean; enBorrador: boolean }[]>;   // busca "archivo":"<id>" en publicado y borrador
export async function borrarArchivo(db: BaseSql, media: R2Bucket, id: string): Promise<void>;   // error si tiene usos
```

**Contrato de la API:**

| Ruta | Método | Entra | Sale |
|---|---|---|---|
| `/api/admin/archivos` | GET | `?clase=&buscar=&desde=` | `{ archivos: FilaArchivo[] }` (50 por página) |
| `/api/admin/archivos` | POST | `multipart/form-data`: `original` (archivo), `ancho`, `alto`, y `variante-<ancho>` (WebP) por cada variante | `201 { archivo }`. El servidor calcula el sha1 del original (ese es el id), valida mime y tamaño, guarda original y variantes en R2 y registra la fila. Si el id ya existe, devuelve el existente con `200` |
| `/api/admin/archivos/partes` | POST `?accion=iniciar` | `{ nombre, mime, bytes }` | `{ subida: string, clave: string }` (clave temporal `tmp/<uuid>`) |
| | PUT `?subida=&clave=&parte=N` | cuerpo binario (hasta 20 MB) | `{ parte: N, etag }` |
| | POST `?accion=terminar` | `{ subida, clave, partes: [{ parte, etag }], mime, nombre }` | Completa la subida, calcula el sha1 leyendo el objeto por tramos, lo copia a `orig/<sha1>.<ext>`, borra el temporal, registra la fila → `201 { archivo }` |
| | POST `?accion=cancelar` | `{ subida, clave }` | Aborta |
| `/api/admin/archivos/[id]` | GET | — | `{ archivo, usos }` |
| `/api/admin/archivos/[id]` | DELETE | — | `409 { error, usos }` si está en uso; si no, borra de R2 (original + variantes) y de D1 |

**Produce (navegador):**
```ts
// src/panel/archivos/subir.ts
export async function subirImagen(archivo: File, alAvanzar?: (p: number) => void): Promise<FilaArchivo>;   // mide, genera variantes WebP con <canvas> (calidad 0.82), sube en un POST
export async function subirVideo(archivo: File, alAvanzar?: (p: number) => void): Promise<FilaArchivo>;    // por partes de 20 MB, 3 reintentos por parte
```

`subirImagen`: SVG y GIF se suben sin variantes; el resto se decodifica con `createImageBitmap`, y para cada ancho de `anchosParaGenerar(ancho)` se dibuja en un `OffscreenCanvas` y se exporta con `convertToBlob({ type: "image/webp", quality: 0.82 })`.

Prueba de aceptación manual (vista previa de la rama): subir un PNG de 2400 px → 9 variantes en R2 y `GET /media/<id>.png?w=828` devuelve `image/webp`; subir un MP4 de más de 100 MB → se reproduce y se puede adelantar; subir dos veces el mismo archivo → una sola fila.

### Tarea 1.5: Pantallas mínimas del panel

**Archivos:** crear `src/app/admin/layout.tsx`, `src/app/admin/entrar/page.tsx`, `src/app/admin/instalar/page.tsx`, `src/app/admin/(dentro)/layout.tsx` (exige sesión; si no, redirige a `/admin/entrar`), `(dentro)/page.tsx`, `(dentro)/archivos/page.tsx`, `(dentro)/usuarios/page.tsx`, `src/panel/ui/*`, `src/panel/archivos/Biblioteca.tsx`; modificar `src/app/robots.ts` (agregar `/admin` y `/api/` a `disallow`) y `src/app/layout.tsx` **solo si** el layout raíz mete en `/admin` elementos del sitio público (grano, botón de WhatsApp): en ese caso mover las rutas públicas a un grupo `(sitio)` con su layout y dejar el raíz mínimo. Comprobar con capturas que el sitio público queda idéntico.

Criterios de aceptación:
- `/admin` sin sesión redirige a `/admin/entrar`; con sesión muestra el menú (por ahora solo «Archivos» y, para administradores, «Usuarios»).
- `/admin/instalar` solo funciona con cero usuarios; después redirige a `/admin/entrar`.
- Biblioteca: subir arrastrando, ver miniaturas (variante de 320), buscar por nombre, ver «usado en», borrar lo que no se usa.
- Usuarios: crear, desactivar, cambiar rol, poner contraseña nueva. Un editor no ve esta pantalla y la API le responde `403`.
- Todo `/admin` responde con `X-Robots-Tag: noindex`.
- Aspecto: tokens de `DESIGN.md` (lienzo claro `#FDFBF7`, tinta `#1A0F3D`, botón de acción naranja `#F47B20` con texto `#1A0F3D`, radios 12/20 px, Sora para títulos y Geist para texto). Sin animaciones decorativas.

Cierre de etapa: `npm run probar`, `tsc`, vista previa de la rama, el propietario crea su usuario con su token, prueba subir una imagen, da el visto bueno → `main`. En producción repite `/admin/instalar` una vez.

---

## Etapa 2 — Copia del contenido y lectura propia

Rama `panel-2-contenido`. Al terminar, D1 y R2 tienen una copia fiel de Sanity y la web **puede** leer de ahí, pero sigue leyendo de Sanity.

### Tarea 2.1: API de documentos

**Archivos:** crear `src/app/api/admin/documentos/route.ts`, `documentos/[id]/route.ts`, `documentos/[id]/publicar/route.ts`, `documentos/[id]/descartar/route.ts`, `documentos/[id]/historial/route.ts`, `documentos/importar/route.ts`.

| Ruta | Método | Qué hace |
|---|---|---|
| `/api/admin/documentos?tipo=` | GET | Lista (borrador si existe) con `estado` de cada uno |
| `/api/admin/documentos/[id]` | GET | `{ documento, estado }` (borrador si existe) |
| `/api/admin/documentos/[id]` | PUT | Guarda borrador. Hasta la etapa 3 no valida contra esquema; desde la 3, valida y responde `422 { errores: { ruta: string; mensaje: string }[] }` |
| `/api/admin/documentos/[id]/publicar` | POST | Publica; anota en auditoría |
| `/api/admin/documentos/[id]/descartar` | POST | Descarta el borrador |
| `/api/admin/documentos/[id]/historial` | GET / POST `{ version }` | Lista versiones / restaura una como borrador |
| `/api/admin/documentos/[id]` | DELETE | Solo admin y solo tipos de colección; `409` si otro documento lo referencia |
| `/api/admin/documentos/importar` | POST | Solo admin. `{ documentos: Doc[], nota: string }` → guarda y publica cada uno con esa nota. **No pisa** un documento cuya última versión tenga otra nota (ya fue editado en el panel): lo devuelve en `omitidos` |

### Tarea 2.2: Script de migración

**Archivos:** crear `scripts/migrar-desde-sanity.mts`, `scripts/lib/sanity-publico.mts`, `scripts/lib/cliente-panel.mts`; modificar `package.json` (`"migrar": "tsx --env-file=.env.local scripts/migrar-desde-sanity.mts"`).

Variables en `.env.local` (las escribe el propietario; nunca en el repositorio): `PANEL_URL`, `PANEL_CORREO`, `PANEL_CLAVE`.

Algoritmo, en este orden:

1. Leer de `https://<SANITY_PROJECT_ID>.api.sanity.io/v2024-01-01/data/query/<dataset>` (sin `apicdn`, sin token) todos los documentos con `!(_type match "system.*") && !(_type match "sanity.*")` y `!(_id in path("drafts.**"))`.
2. Recorrer cada documento y reunir todas las referencias `asset._ref` (`image-<sha1>-<ancho>x<alto>-<ext>` y `file-<sha1>-<ext>`). Esa es la lista de archivos **en uso**.
3. **Excluir** los tres ids de `FOTOS_RETIRADAS` (`src/components/ContentBanner.tsx`): `0c241a21778d9f184a4da28618af2374cfadbc41`, `ca26b0e956f056590179b6aeb0144cdd8fa86275`, `499bf6b37a83ffdf494743713d9e356283159a80`. En su lugar se suben `public/home/banner-redes-foto.webp`, `banner-pauta-foto.webp` y `banner-crm-foto.webp`, y el documento `banners` pasa a referenciarlos en `fotoPrimerPlano` de las escenas `redes`, `pauta` y `crm`.
4. Entrar al panel (`POST /api/admin/entrar`) y guardar la cookie.
5. Por cada archivo: si `GET /api/admin/archivos/<sha1>` responde 200, saltarlo. Si no, descargarlo de `cdn.sanity.io`, **comprobar que su sha1 coincide** con el del id, y subirlo: imágenes con sus variantes generadas con `sharp` (`anchosParaGenerar`, WebP calidad 82) por `POST /api/admin/archivos`; videos por partes.
6. Reescribir cada documento: toda forma `{ _type: "image"|"file", asset: { _ref } , ...resto }` pasa a `{ _type, archivo: "<sha1>", ...resto }` (se conservan `hotspot`, `crop`, `alt` y cualquier otro campo). Quitar `_rev`. Conservar `_id`, `_type`, `_createdAt`, `_updatedAt` y todo lo demás tal cual.
7. Comprobar que **no queda ningún `_ref` de asset** y que cada `archivo` existe en la biblioteca. Si falla, abortar sin importar nada.
8. `POST /api/admin/documentos/importar` con `nota: "migrado de Sanity"`.
9. Escribir `docs/panel-propio/informe-migracion-<fecha>.md`: documentos por tipo, archivos subidos y saltados, bytes, omitidos, y los archivos de Sanity que no están en uso (no se copian).

Opciones: `--simular` (hace 1–3, 6 y 7 sin escribir) y `--solo <tipo>`.

Criterio de aceptación: contra la vista previa de la rama, `--simular` no reporta referencias sin resolver; la corrida real termina con 0 errores; una segunda corrida seguida sube 0 archivos e importa 0 documentos cambiados.

### Tarea 2.3: Lector

**Archivos:** crear `src/lib/contenido/tipos.ts`, `fuente.ts`, `lector.ts`, `imagenes.ts`; pruebas en `pruebas/contenido/`.

**Produce:**
```ts
// tipos.ts
export type Fuente = "sanity" | "propio";
export type ArchivoInfo = { id: string; url: string; ancho: number | null; alto: number | null; mime: string };
export type Lector = {
  documento(id: string): Promise<Doc | null>;
  porTipo(tipo: string): Promise<Doc[]>;
  archivo(id: string): Promise<ArchivoInfo | null>;
  precargarArchivos(ids: string[]): Promise<void>;     // una consulta para todos
};
// fuente.ts
export function fuenteActual(): Fuente;                // process.env.CONTENT_SOURCE === "propio" ? "propio" : "sanity"
// lector.ts
export function crearLector(db: BaseSql, o: { borrador: boolean }): Lector;   // guarda en memoria lo leído durante la vida del objeto
export const lectorDeLaPeticion: () => Promise<Lector | null>;                // React.cache; null si no hay entorno.
// borrador = modo borrador de Next activado **y** cookie de sesión válida (usuarioDeSesion). Sin sesión se lee lo publicado.
// imagenes.ts
export const urlDeArchivo = (a: { id: string; extension: string }) => `/media/${a.id}.${a.extension}`;
/** Devuelve todos los ids de archivo que aparecen en un documento (recorrido profundo). */
export function idsDeArchivo(doc: unknown): string[];
```

### Tarea 2.4: Proyecciones (una por consulta GROQ)

**Archivos:** crear en `src/lib/contenido/proyecciones/`: `cuentas-activas.ts`, `slugs-activos.ts`, `cuenta-por-slug.ts`, `pagina-inicio.ts`, `marketing.ts`, `trafico.ts`, `feniax.ts`, `asesorias.ts`, y `comun.ts` (fragmentos compartidos: `IMG`, `LOGO`, `CHAT`, `CELULAR`, `TIKTOK_GROQ`, giros). Fixtures en `pruebas/fixtures/sanity/<consulta>.json` (la respuesta real de cada consulta, tomada de la API pública) y `pruebas/fixtures/documentos.json` (todos los documentos ya reescritos).

Cada proyección es una función pura:

```ts
export async function proyectarPaginaInicio(lector: Lector): Promise<RespuestaCrudaInicio>;   // el mismo tipo crudo que hoy recibe el normalizador
```

Reglas de traducción GROQ → TypeScript, que valen para las 8 (el texto exacto de cada consulta y su tipo crudo están en `inventario-lectura.md` §2; los acoplamientos en §8):

| En GROQ | En la proyección |
|---|---|
| `*[_type == "X"][0]` | `lector.documento("X")` para los únicos (su `_id` es igual a su `_type`); verificar en el informe de migración que así sea |
| `*[_type == "X" && cond] \| order(campo)` | `lector.porTipo("X")`, filtrar y ordenar en memoria con la misma condición y el mismo orden |
| `campo.asset->url` | `urlDeArchivo(...)` del archivo referenciado, o `null` si falta |
| `campo.asset->url + "?w=160&auto=format"` | la misma concatenación; **si la URL es `null`, el resultado es `null`** (en GROQ `null + texto` es `null`) |
| `asset->metadata.dimensions.width` | `archivo.ancho` |
| `hotspot{ x, y }` | copiar solo `x` e `y` |
| `coalesce(a, b)` | `a ?? b` |
| `defined(_ref) => @->{...}` (lista mixta de giros) | si el elemento tiene `_ref`, cargar ese documento y proyectarlo; si no, proyectar el objeto |
| `servicios[]->nombre` | cargar cada `servicio` referenciado y tomar `nombre` |
| `*[_type == "contenido" && references(^._id)]` | `porTipo("contenido")` filtrando los que contengan `_ref === cuenta._id` |
| Filtros de «activo» | respetar los **tres** distintos tal cual: `activa == true`, `publicado == true`, `activa != false` |
| Campo ausente | `null`, nunca `undefined`: GROQ devuelve `null` y los normalizadores lo comparan así |

Prueba por proyección: con un lector armado sobre `pruebas/fixtures/documentos.json`, el resultado debe ser **igual** (`toEqual`) a `pruebas/fixtures/sanity/<consulta>.json` después de pasar ambos por `igualarUrls` (tarea 2.6).

### Tarea 2.5: Conmutar la fuente y volver dinámicas las rutas

> **REEMPLAZADA (2026-11-24).** Las rutas NO se vuelven dinámicas: siguen armándose al construir. Lo que se conserva es la bifurcación `fuenteActual()` en cada función de lectura; con `propio`, la construcción lee D1 por la API REST con `D1_TOKEN_LECTURA` y falla si no puede leer (`cambios-2026-11-24.md` §3). La revisión del recorte cuadrado de reseñas y avatar del chat sigue valiendo.

**Archivos:** modificar `src/lib/sanity.ts`, `src/lib/marketing-digital.ts`, `src/lib/trafico.ts`, `src/lib/feniax.ts`, `src/lib/asesorias.ts` y las rutas que leen contenido.

- [ ] En cada función de lectura, **solo** el tramo que obtiene el dato crudo cambia:

```ts
const crudo = fuenteActual() === "propio" ? await leerPropio(proyectarPaginaInicio) : await sanityQuery<RespuestaCrudaInicio>(QUERY_PAGINA_INICIO);
```

  con un `leerPropio` común que obtiene `lectorDeLaPeticion()`, devuelve `null` si no hay entorno o si la proyección lanza (escribiendo el error con `console.error`), de modo que el respaldo actual siga funcionando igual.
- [ ] En `src/app/page.tsx`, `marketing-digital/page.tsx`, `trafico-ads/page.tsx`, `chatbots-crm/page.tsx`, `asesorias/page.tsx`, `clientes/[slug]/page.tsx` y `sitemap.ts`: `export const dynamic = "force-dynamic";`. En `clientes/[slug]`, `generateStaticParams` devuelve `[]` cuando la fuente es `propio`.
- [ ] `next.config.ts`: no hace falta permitir dominios nuevos (`/media` es del mismo sitio).
- [ ] Componentes de las reseñas y del avatar del chat (`inventario-lectura.md` §3.4): comprobar que recortan con `object-cover` en caja cuadrada; si alguno confiaba en el recorte de la CDN, agregarle `object-cover` y la relación 1:1. Es el único cambio de componentes públicos de esta etapa.

### Tarea 2.6: Prueba de paridad

**Archivos:** crear `scripts/paridad.mts`, `src/lib/contenido/paridad.ts` (`igualarUrls`, `diferencias`); `package.json`: `"paridad": "tsx --env-file=.env.local scripts/paridad.mts"`.

- `igualarUrls(valor)`: recorre en profundidad y reemplaza toda dirección `https://cdn.sanity.io/(images|files)/<proyecto>/<dataset>/<sha1>(-<ancho>x<alto>)?.<ext><consulta>` y toda `/media/<sha1>.<ext><consulta>` por `archivo:<sha1><consulta>`.
- El script pide `GET <PANEL_URL>/api/admin/paridad` (ruta nueva, solo admin), que ejecuta en el Worker las 9 funciones de lectura dos veces —forzando `sanity` y forzando `propio`— y devuelve ambas salidas **ya normalizadas**. El script las compara y escribe `docs/panel-propio/informe-paridad-<fecha>.md` con cada diferencia (ruta dentro del objeto, valor Sanity, valor propio).
- Excepción esperada y única: las tres fotos de los banners (ids distintos a propósito). El script las lista aparte y no las cuenta como diferencia.
- Comprobación extra: para cada banner con `escena`, `lineas.join(" | ")` debe ser idéntico al de `src/remotion/home/videos.json`.

**Criterio de cierre de la etapa 2:** paridad con **0 diferencias** en la vista previa de la rama; con `CONTENT_SOURCE=propio` puesto solo en *Previews Base*, capturas de las 6 páginas + una de `/clientes/<slug>` en 1440×900 y 390×844 comparadas contra producción sin diferencias visibles; `main` sigue sin la variable.

### Tarea 2.7 (solo si la 0.6 lo confirmó): guardar las reseñas de Google

Tabla nueva por migración 2 (`cache (clave TEXT PRIMARY KEY, valor TEXT NOT NULL, vence_en TEXT NOT NULL)`) y `obtenerResenasGoogle` la consulta antes de llamar a Google (vigencia 6 h). Sin cambios en lo que devuelve.

---

## Etapa 3 — Formularios, vista previa y los tres primeros documentos

Rama `panel-3-formularios`. Plan fino en `plan-etapa-3.md` antes de empezar.

**Archivos (fijos):** `src/panel/esquema/tipos.ts` (los tipos de `diseno.md` §7.2, tal cual), `src/panel/esquema/registro.ts` (`TIPOS: Record<string, TipoDocumento>`, `MENU`), un archivo por tipo en `src/panel/esquema/`, `src/panel/motor/validar.ts`, `mezclar.ts`, `Formulario.tsx` y un componente por clase de campo, `src/panel/vista-previa/Marco.tsx`, `src/app/api/admin/vista-previa/route.ts`, `src/app/admin/(dentro)/doc/[id]/page.tsx`.

**Interfaces que no cambian:**
```ts
// validar.ts — corre igual en el navegador y en la API
export function validar(tipo: TipoDocumento, doc: Record<string, unknown>): { ruta: string; mensaje: string }[];
// mezclar.ts — conserva los campos que el esquema no conoce (diseno.md §5.1 punto 4)
export function mezclar(original: Record<string, unknown>, editado: Record<string, unknown>, tipo: TipoDocumento): Record<string, unknown>;
export const nuevaClave = (): string;    // 12 caracteres hexadecimales para _key
```

**Tareas:**
1. `validar` y `mezclar` con pruebas: cada clase de campo; obligatorio; `oculto` no valida; lista con `min`/`max`; objeto anidado; campo desconocido se conserva en cualquier profundidad; elemento de lista se empareja por `_key`.
2. Motor: un componente por clase (`texto`, `textoLargo`, `numero`, `booleano`, `opcion`, `enlace`, `slug`, `fecha`, `imagen` con selector de punto focal, `archivo`, `objeto` plegable, `lista` reordenable con «agregar» por tipo de elemento, `referencia`). Los errores se muestran junto al campo y en un resumen arriba.
3. ~~Guardado solo~~ **REEMPLAZADA (2026-11-24):** botón «Guardar» por sección y «Publicar cambios» global con el Deploy Hook (`cambios-2026-11-24.md` §2). Si el guardado falla, no se pierde lo escrito.
4. ~~Vista previa con `draftMode()`~~ **REEMPLAZADA (2026-11-24):** la vista previa se dibuja en el navegador del panel (`cambios-2026-11-24.md` §5); se construye en la nueva etapa 1.
5. Esquemas de `banners` (+ `seccionContenido`, `posicionCta`), `hero` y `paginaInicio` (+ `capacidad`), traducidos de `inventario-esquema.md` §3. Aviso de video al cambiar `lineas` (`diseno.md` §7.3).
6. La API (`PUT`) pasa a validar con `validar` y responde `422`.

**Criterios de aceptación:**
- En la vista previa de la rama (base de pruebas ya migrada): cambiar el texto del botón de un banner se ve en el marco en menos de 3 s sin publicar; la web pública de esa rama no cambia hasta pulsar «Publicar»; «Descartar» devuelve el marco al estado publicado.
- Mover el punto focal de la foto del Hero cambia el encuadre en el marco de teléfono.
- Guardar un documento **no pierde** `paginaInicio.secciones[]` (campo que el panel no dibuja): se comprueba comparando el JSON antes y después.
- Publicar un documento sin cambios está deshabilitado. Un campo obligatorio vacío impide publicar y dice cuál.
- El propietario prueba y aprueba el aspecto. Es el momento de ajustar el diseño visual del panel.

## Etapa 4 — Las cuatro páginas de servicio

Rama `panel-4-paginas`. Plan fino en `plan-etapa-4.md`.

**Archivos:** un esquema por bloque en `src/panel/esquema/bloques/` (los 14 de `inventario-esquema.md` §3.4) y por objeto reutilizable (§3.3), los helpers (`campoImagen`, `campoLogoCircular`, `camposBase`, `camposVideoTikTok`, `miembroGiro`) como funciones que devuelven `CampoConReglas[]`, y los cuatro documentos de página.

**Puntos que no se pueden pasar por alto** (`inventario-esquema.md` §5):
- `teamBanner` muestra campos distintos según el documento que lo contiene: sus condiciones `oculto` usan `ctx.documento._type`.
- `empresas[]` de un giro admite referencia a `cuenta` u objeto `empresaGiro`: la lista ofrece los dos «agregar».
- Tráfico, ChatBots/CRM y Asesorías leen los giros del primer `clientsBanner` de Marketing Digital: el panel lo dice en la ayuda de esos bloques y enlaza a donde se editan.
- Validaciones: `metricasDemo.alcance <= visualizaciones`; obligatorios condicionales; patrón de enlaces.
- Cada bloque declara su ancla para que la vista previa se desplace hasta él al abrirlo.
- No se renombra ningún campo histórico.

**Criterios de aceptación:** se puede agregar, reordenar, duplicar y quitar bloques en las 4 páginas y verlo en la vista previa; abrir y guardar sin tocar nada cada uno de los 4 documentos produce un JSON **idéntico** al original (prueba automática con los fixtures); la paridad sigue en 0.

## Etapa 5 — Colecciones, historial y actividad

Rama `panel-5-colecciones`. Plan fino en `plan-etapa-5.md`.

**Tareas:**
1. Esquemas de `cuenta`, `contenido`, `servicio`, `resena` (+ `resultado`, `testimonio`, `redesSociales`).
2. `/admin/lista/<tipo>`: tabla con búsqueda, orden, estado (publicado / con cambios / nunca publicado), crear, duplicar, borrar (con el aviso de «lo usa…»).
3. Unicidad de `servicio.nombre` y de `cuenta.slug`, comprobadas en la API.
4. Campo `referencia`: buscador de documentos por tipo con su `resumen`.
5. Vista previa de `cuenta` y `contenido`: `/clientes/<slug>`.
6. `/admin/doc/<id>/historial`: lista de versiones, «ver» (solo lectura), «comparar con la actual» (campos que cambian) y «restaurar como borrador».
7. `/admin/actividad` (solo admin) y marca de «cambios sin publicar» en el menú.
8. `scripts/copia-seguridad.mts`: descarga todos los documentos por la API y escribe `copias/<fecha>.json` (carpeta ignorada por git). Se le enseña al propietario a correrlo.

**Criterios de aceptación:** crear una cuenta nueva con logo y portada, publicarla y verla en `/clientes/<slug>` de la vista previa de la rama; borrar un servicio en uso está impedido con explicación; restaurar una versión vieja de `banners` y publicarla funciona; todo lo que aparece en el menú del Studio (`inventario-esquema.md` §2) existe en el panel, en el mismo orden.

## Etapa 6 — El cambio

Rama `panel-6-cambio`. No hay código nuevo salvo la limpieza indicada. Lista de control:

- [ ] Avisar al propietario con dos días: «el día X por la mañana no se edita nada en Sanity».
- [ ] Recordarle el borrador viejo de `banners` en Sanity (14-oct): no se migra; si tenía algo que quería, que lo diga antes.
- [ ] Correr `npm run migrar` contra **producción** (`PANEL_URL=https://dofiagenciacreativa.com`). Revisar el informe: 0 errores.
- [ ] Correr `npm run paridad` contra producción: **0 diferencias**.
- [ ] Quitar `FOTOS_RETIRADAS` y su uso de `src/components/ContentBanner.tsx` (las fotos correctas ya son el dato real). Vista previa de la rama con `CONTENT_SOURCE=propio`: comprobar los tres banners.
- [ ] El propietario agrega la variable `CONTENT_SOURCE` = `propio` en *Production* (texto, no secreto). **Además** agregarla a `vars` en `wrangler.jsonc`: cada despliegue usa ese archivo como fuente de verdad y borra las variables que no estén ahí.
- [ ] Pasar a `main`. Esperar la construcción.
- [ ] Revisar en producción, en computadora y teléfono: `/`, `/marketing-digital`, `/trafico-ads`, `/chatbots-crm`, `/asesorias`, tres `/clientes/<slug>`, `/sitemap.xml`. Ninguna petición a `cdn.sanity.io` ni a `*.sanity.io` (pestaña de red). Tiempo de respuesta del Home menor o igual que antes.
- [ ] Hacer un cambio real desde el panel (un texto), publicarlo y verlo en la web.
- [ ] Correr la copia de seguridad.
- [ ] **Cómo volver atrás si algo sale mal:** poner `CONTENT_SOURCE` = `sanity` en `wrangler.jsonc` y publicar. Sanity sigue intacto.

## Etapa 7 — Baja de Sanity (30 días después del cambio)

Rama `panel-7-baja-sanity`. Solo con el «sí» del propietario.

- [ ] Copia final: `npm run migrar -- --simular` para confirmar que Sanity no cambió, y copia de seguridad del almacén propio.
- [ ] Borrar: la carpeta `studio/`; `QUERY_*` y `sanityQuery` de `src/lib/*.ts`; `fuente.ts` y cada bifurcación `fuenteActual()`; `src/app/api/revalidate/`; `scripts/seed-sanity-accounts.ts`, `sembrar-*`, `ajustar-*`, `logos-circulares.mts`, `migrar-desde-sanity.mts`, `paridad.mts`, la ruta `/api/admin/paridad`; `@sanity/client` de `devDependencies`; `SANITY_*` de `wrangler.jsonc`, `.env.example` y la rama de `cdn.sanity.io` en `cargador-imagenes.ts` y `next.config.ts`.
- [ ] Actualizar `README.md` y `DESIGN.md`: cómo se edita el contenido ahora.
- [ ] `npm run probar`, `tsc`, vista previa, visto bueno, `main`.
- [ ] El propietario da de baja el proyecto de Sanity y el proyecto «studio» de Vercel, y borra los webhooks. (Son sus cuentas: se le dan los pasos, no se hace por él.)

---

## Autorrevisión del plan

- **Cobertura del diseño:** §4 arquitectura → etapas 0–2; §5 datos → 0.4, 0.5, 0.7, 2.2; §6 lectura y vista previa → 2.3–2.6, etapa 3; §7 panel → 1.5, etapas 3–5; §8 seguridad → 1.1–1.4; §9 recursos → 0.1, 0.2; §10 migración → 2.2, 2.6, etapa 6; §12 pruebas → cada tarea; §13 riesgos → 0.6, 2.6, etapa 6.
- **Lo que este plan no trae escrito paso a paso:** las pantallas de la etapa 1 (1.5) y las etapas 3 a 5 llevan archivos, interfaces y criterios, no el código de cada paso. Es deliberado: dependen de ver funcionando lo anterior. Quien ejecute escribe el plan fino de cada una antes de empezarla.
- **Nombres:** `Doc`, `BaseSql`, `Lector`, `FilaArchivo`, `Usuario`, `TipoDocumento`, `CampoConReglas` se usan con la misma forma en todas las tareas.
