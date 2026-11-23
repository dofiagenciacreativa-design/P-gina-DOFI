# Panel propio de DOFI: diseño

Fecha: 2026-11-23 · Rama de trabajo: `panel-propio-sin-sanity` · Estado: **diseño, nada construido**.

Documentos hermanos (leer antes de construir):

- `inventario-esquema.md` — todo lo que hoy se edita en Sanity, campo por campo.
- `inventario-lectura.md` — cómo la web lee hoy ese contenido, consulta por consulta.
- `plan.md` — las etapas y tareas para construirlo.
- `ENCARGO.md` — instrucciones de arranque para quien lo ejecute.

## 1. Qué se pidió y por qué

Pedido del propietario (2026-11-23), en sus palabras: un panel administrativo propio «donde podamos configurar absolutamente todo lo del Sanity», con «vistas previas de cada sección» para «ver cómo va a quedar aplicado», y **reemplazar Sanity del todo**.

Motivos, vistos ese mismo día:

- En el Studio un cambio se publica sin ver antes cómo queda en la página.
- Desde la computadora de trabajo no se pudo manejar el Studio de forma fiable ni escribir en Sanity sin crear claves a mano.
- El documento `banners` tiene un borrador viejo sin publicar (14-oct) que, si se publica desde el Studio, pisa cambios posteriores hechos por script. El modelo borrador/publicado de Sanity ya causó un riesgo real.

Decisiones tomadas por el propietario:

| Decisión | Elegido |
|---|---|
| ¿Panel encima de Sanity o reemplazo total? | **Reemplazo total** |
| ¿Quién entra al panel? | **Equipo pequeño (2 a 5 personas), cada una con su usuario** |
| ¿Dónde se guardan imágenes y videos? | **Cloudflare R2** (el propietario activa R2 en la cuenta de DOFI) |

## 2. Qué es «terminado»

1. Todo lo que hoy se edita en el Studio se edita en `https://dofiagenciacreativa.com/admin`: los 11 tipos de documento, sus 36 tipos de contenido, imágenes y videos.
2. Cada pantalla de edición muestra **la página real con el cambio aplicado antes de publicar**, en vista de computadora y de teléfono.
3. Nada se publica sin pulsar «Publicar». Existe «Descartar cambios» y un historial para volver a una versión anterior.
4. La web publicada no lee nada de Sanity: ni contenido, ni imágenes, ni videos.
5. La web se ve y se comporta igual que antes del cambio (mismos textos, mismas imágenes, mismo orden), comprobado con una prueba de paridad automática y una revisión visual de todas las páginas.
6. Sanity queda como copia congelada 30 días y después se da de baja; la carpeta `studio/` sale del repositorio.

Fuera de alcance (no hacer en este proyecto): rediseñar páginas, cambiar textos, SEO/GEO, el formulario de contacto, absorber en el panel los datos fijos que hoy viven en el código (`src/config/company.ts`, `src/data/clients.ts`, respaldos `*-respaldo.ts`), multi-idioma, programar publicaciones para una fecha.

## 3. Restricciones del proyecto (valen para todo)

- **No tocar** DNS, la zona de Cloudflare, el túnel, n8n ni el NAS. No usar la cuenta de Cloudflare «Feniax» ni la de GitHub «feniaxcrm-cloud».
- **No subir claves ni secretos** al repositorio. Los secretos van como *Secrets* del Worker.
- **No actualizar Next.js a 16** (el proyecto usa `--dangerouslyUseUnsupportedNextVersion` a propósito). Nada de `npm audit fix --force`.
- **No quitar** la variable de build `NEXT_PUBLIC_SITE_URL`.
- Trabajar siempre en rama aparte → vista previa en `https://<rama>-pagina-dofi.dofiagenciacreativa.workers.dev` → visto bueno del propietario → `main`. Cada push a `main` se publica solo.
- Commits en español. Hablarle al propietario en español sencillo: no es programador.
- La computadora de trabajo tiene 7,7 GB de RAM casi llenos: **una sola tarea pesada a la vez** (build, navegador de pruebas, ffmpeg).
- Todo cabe en el mismo Worker `pagina-dofi` (Next.js 15 + OpenNext). No se crea un segundo servicio ni un subdominio (eso sería tocar DNS).
- El panel va en español. Nombres de archivos, tablas y funciones nuevas en español, como el resto del código.

## 4. Arquitectura

```
                         dofiagenciacreativa.com  (Worker pagina-dofi)
 ┌────────────────────────────────────────────────────────────────────────────┐
 │  Páginas públicas (/ , /marketing-digital, /clientes/[slug] ...)           │
 │        │ leen                                                              │
 │        ▼                                                                   │
 │  src/lib/contenido/  ── capa de lectura ──►  D1  «dofi-contenido»          │
 │        ▲                                      (documentos, versiones,      │
 │        │ borrador si hay «modo vista previa»   archivos, usuarios, ...)    │
 │        │                                                                   │
 │  /admin/**  panel (formularios + vista previa en un marco)                 │
 │        │ escribe por                                                       │
 │        ▼                                                                   │
 │  /api/admin/**  API con sesión  ──────────►  D1  +  R2 «dofi-media»        │
 │                                                                            │
 │  /media/**  sirve imágenes y videos  ◄─────  R2 «dofi-media»               │
 └────────────────────────────────────────────────────────────────────────────┘
```

Cuatro piezas, cada una con una sola responsabilidad:

| Pieza | Carpeta | Qué hace | De qué depende |
|---|---|---|---|
| **Almacén** | `src/almacen/` | Habla con D1 y R2. Guarda y devuelve documentos, versiones, archivos, usuarios y sesiones. No sabe nada de páginas ni de formularios. | Los enlaces `DB` y `MEDIA` del Worker |
| **Lectura** | `src/lib/contenido/` | Convierte un documento guardado en la forma «cruda» que hoy devuelve cada consulta GROQ. Los normalizadores actuales (`src/lib/sanity.ts`, `marketing-digital.ts`, `trafico.ts`, `feniax.ts`, `asesorias.ts`) siguen igual y reciben esa forma. | Almacén |
| **Panel** | `src/app/admin/`, `src/panel/` | Pantallas del panel: entrar, menú, formularios armados desde un esquema, biblioteca de archivos, vista previa, historial, usuarios. | La API |
| **API** | `src/app/api/admin/` | Comprueba la sesión y el rol, valida lo que llega contra el esquema y llama al almacén. Único camino de escritura. | Almacén, esquema |

Regla de oro: **los componentes de las páginas no cambian**. Cambia de dónde sale el dato, no su forma.

### 4.1 Por qué D1 + R2 y no otra cosa

- **D1** (base SQLite de Cloudflare): el contenido son 55 documentos pequeños; una tabla con el documento en JSON alcanza y sobra. Transacciones, historial y consultas simples. Capa gratuita: 5 GB.
- **R2**: archivos de cualquier tamaño (hay un video de 102 MB), sin costo de salida. Capa gratuita: 10 GB; hoy se usan 0,2 GB.
- **KV** se descartó para el contenido (sin transacciones, límite de 25 MB por valor) y para archivos.
- **Guardar el contenido como archivos en el repositorio** se descartó: cada cambio de texto exigiría una construcción de 8 minutos y no habría vista previa inmediata.

## 5. Datos

### 5.1 Forma de los documentos

Se conserva **la misma forma JSON que tiene hoy cada documento en Sanity** (mismos nombres de campo, `_type`, `_key` en los elementos de listas), con tres cambios:

1. **Imágenes y archivos.** Donde Sanity guarda `{ _type: "image", asset: { _ref: "image-<sha>-<ancho>x<alto>-<ext>" }, hotspot, crop }`, se guarda `{ _type: "image", archivo: "<id de archivo>", hotspot, crop }`. Para archivos: `{ _type: "file", archivo: "<id>" }`. El punto focal y el recorte se quedan **en el documento**, como hoy.
2. **Referencias entre documentos** (`{ _type: "reference", _ref: "<id>" }`) se conservan tal cual; los ids de documento se conservan idénticos a los de Sanity.
3. **Campos de sistema.** `_id`, `_type`, `_createdAt` y `_updatedAt` se conservan dentro del JSON (las reseñas se ordenan por `_createdAt`). `_rev` desaparece: lo reemplaza la columna `version`.
4. **Los campos que el panel no conoce se conservan.** Hay datos guardados que ningún formulario muestra (por ejemplo `paginaInicio.secciones[]`, `temaChat`, `chat`/`metricas` por giro; ver `inventario-esquema.md` §5.4 y §5.8). Al guardar, el panel mezcla sus cambios sobre el documento completo: nunca borra un campo que no dibuja.

Conservar la forma tiene un motivo: la migración es casi una copia, y la prueba de paridad puede comparar salida contra salida.

Nombres históricos que **no se renombran** (ver `inventario-esquema.md` §5.5): `categorias`, `categoriaIcono`, `seccionContenido`, etc.

### 5.2 Tablas de D1

```sql
-- Cambio de esquema n.º 1 (vive en src/almacen/migraciones.ts; lo aplica el propio Worker)
CREATE TABLE documentos (
  id            TEXT PRIMARY KEY,            -- el mismo _id que en Sanity
  tipo          TEXT NOT NULL,               -- _type
  publicado     TEXT,                        -- JSON; NULL = nunca publicado
  borrador      TEXT,                        -- JSON; NULL = sin cambios pendientes
  version       INTEGER NOT NULL DEFAULT 0,  -- sube en cada publicación
  creado_en     TEXT NOT NULL,               -- ISO 8601 UTC
  publicado_en  TEXT,
  borrador_en   TEXT,
  publicado_por TEXT,                        -- id de usuario
  borrador_por  TEXT
);
CREATE INDEX documentos_tipo ON documentos (tipo);

CREATE TABLE versiones (                      -- historial: una fila por publicación
  documento_id  TEXT NOT NULL,
  version       INTEGER NOT NULL,
  contenido     TEXT NOT NULL,               -- JSON publicado en esa versión
  publicado_en  TEXT NOT NULL,
  publicado_por TEXT,
  nota          TEXT,                        -- «migrado de Sanity», «restaurado de v3», ...
  PRIMARY KEY (documento_id, version)
);

CREATE TABLE archivos (
  id          TEXT PRIMARY KEY,              -- sha1 del contenido (igual que usa Sanity)
  clase       TEXT NOT NULL,                 -- 'imagen' | 'video' | 'archivo'
  mime        TEXT NOT NULL,
  extension   TEXT NOT NULL,
  bytes       INTEGER NOT NULL,
  ancho       INTEGER,                       -- solo imágenes
  alto        INTEGER,
  variantes   TEXT NOT NULL DEFAULT '[]',    -- JSON: anchos generados, p. ej. [480,828,1200,1920]
  nombre      TEXT,                          -- nombre original del archivo
  origen      TEXT,                          -- id del asset de Sanity si vino de la migración
  subido_en   TEXT NOT NULL,
  subido_por  TEXT
);

CREATE TABLE usuarios (
  id          TEXT PRIMARY KEY,
  correo      TEXT NOT NULL UNIQUE,          -- en minúsculas
  nombre      TEXT NOT NULL,
  rol         TEXT NOT NULL,                 -- 'admin' | 'editor'
  clave_hash  TEXT NOT NULL,                 -- PBKDF2-SHA256, base64
  clave_sal   TEXT NOT NULL,                 -- base64, 16 bytes
  activo      INTEGER NOT NULL DEFAULT 1,
  creado_en   TEXT NOT NULL,
  ultimo_ingreso TEXT
);

CREATE TABLE sesiones (
  id          TEXT PRIMARY KEY,              -- sha256 del token de la cookie
  usuario_id  TEXT NOT NULL,
  creada_en   TEXT NOT NULL,
  vence_en    TEXT NOT NULL,
  ip          TEXT,
  agente      TEXT
);
CREATE INDEX sesiones_usuario ON sesiones (usuario_id);

CREATE TABLE intentos_ingreso (               -- freno a fuerza bruta
  clave       TEXT PRIMARY KEY,              -- 'correo:<correo>' o 'ip:<ip>'
  fallos      INTEGER NOT NULL,
  bloqueado_hasta TEXT
);

CREATE TABLE auditoria (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cuando      TEXT NOT NULL,
  usuario_id  TEXT,
  accion      TEXT NOT NULL,                 -- 'guardar-borrador' | 'publicar' | 'descartar' | 'restaurar' | 'subir-archivo' | 'borrar-archivo' | 'crear-usuario' | ...
  objeto      TEXT,                          -- id de documento, archivo o usuario
  detalle     TEXT                           -- JSON corto
);
CREATE INDEX auditoria_cuando ON auditoria (cuando);
```

Se guardan **las últimas 30 versiones** por documento; al publicar la 31 se borra la más vieja.

### 5.3 Archivos en R2

Claves del almacén `dofi-media`:

```
orig/<id>.<ext>            el archivo tal como se subió
img/<id>/w<ancho>.webp     variantes de imagen; anchos: 160, 320, 480, 640, 828, 1080, 1200, 1600, 1920, 2400
                           (solo las más angostas que el original)
```

- El **id es el sha1 del contenido**: subir dos veces el mismo archivo no lo duplica, y un archivo nunca cambia bajo la misma dirección (se puede cachear para siempre).
- Las **variantes se generan al subir, en el navegador del panel** (con `<canvas>` → WebP). Motivo: redimensionar en Cloudflare exige activar «Image Transformations» en la zona, y la zona no se toca. En la migración las genera el script con `sharp`.
- SVG y GIF no llevan variantes: se sirve el original.
- **Videos de más de 50 MB** se suben por partes (subida multiparte de R2 a través de la API del panel, en trozos de 20 MB), porque un Worker no acepta peticiones de más de 100 MB.

Dirección pública, servida por el propio Worker, **con el mismo contrato que la CDN de Sanity** para no tocar los normalizadores:

```
/media/<id>.<ext>            el original
/media/<id>.<ext>?w=<N>      la variante WebP más angosta que sea >= N (si no hay ninguna, el original)
```

Hoy el código agrega `?w=...&auto=format` (y a veces `&h=..&fit=crop` o `&q=..`) a las direcciones de Sanity en tres sitios: dentro de las consultas, en los normalizadores y en el cargador de `next/image` (lista completa en `inventario-lectura.md` §3.1). Con este contrato todos esos sitios siguen funcionando sin cambios: `/media` lee `w`, ignora `h`, `fit`, `q` y `auto`, y responde WebP.

- Cabeceras: `Cache-Control: public, max-age=31536000, immutable` (el id es el contenido: nunca cambia bajo la misma dirección).
- `/media` acepta peticiones con rango (`Range`), necesarias para que los videos se puedan adelantar.
- **Recortes cuadrados.** Dos usos piden hoy un recorte a la CDN (`w=160&h=160&fit=crop` en la foto de las reseñas y `w=120&h=120&fit=crop` en el avatar del chat). `/media` no recorta: el componente debe recortar con CSS (`object-fit: cover` en una caja cuadrada). Se comprueba en la etapa 1 y se corrige el componente si hiciera falta.
- `src/lib/cargador-imagenes.ts` pasa a tratar las direcciones que empiezan con `/media/` igual que las de `cdn.sanity.io` (pone `w` y `q`). Las de Sanity siguen funcionando mientras dure la convivencia.

## 6. Lectura y vista previa

### 6.1 Capa de lectura

Por cada función que hoy consulta Sanity (lista exacta en `inventario-lectura.md` §2) se escribe una **proyección**: una función TypeScript pura que recibe documentos del almacén y devuelve exactamente la forma cruda que hoy devuelve su consulta GROQ.

```ts
// src/lib/contenido/tipos.ts
export type Fuente = "sanity" | "propio";
export type Lector = {
  documento(id: string): Promise<Doc | null>;          // publicado, o borrador si hay vista previa
  porTipo(tipo: string): Promise<Doc[]>;
  archivo(id: string): Promise<ArchivoInfo | null>;    // url, ancho, alto, mime
  precargarArchivos(ids: string[]): Promise<void>;     // una sola consulta para todos
};
```

`src/lib/contenido/fuente.ts` decide de dónde se lee con la variable de entorno **`CONTENT_SOURCE`** (`sanity` por defecto; `propio` para leer de D1). Así las etapas 1 y 2 se publican sin cambiar lo que ve el visitante, y el cambio final es una variable.

Los respaldos de hoy se conservan: si la lectura falla o un documento no existe, cada función devuelve el mismo respaldo que devuelve hoy cuando Sanity falla.

### 6.2 Caché: se mantiene lo que hay hoy, pero dicho en claro

**Cómo funciona hoy** (medido el 2026-11-23): ninguna página declara `revalidate`; lo heredan del `fetch` a Sanity (60 s). Pero OpenNext está sin caché incremental (`open-next.config.ts` usa `defineCloudflareConfig()` a secas) y el Worker no tiene dónde guardar páginas. Resultado: **cada visita ya se dibuja en el Worker** (todas las respuestas llevan `x-nextjs-cache: MISS`), y el HTML de la construcción solo contiene el texto de respaldo, porque durante la construcción no hay variables de Sanity.

**Diseño:** las rutas que leen contenido declaran `export const dynamic = "force-dynamic"` y leen de D1 en cada visita.

- Es el mismo costo que hoy, con una lectura local (D1) en vez de una llamada HTTP a Sanity: debería bajar el tiempo de respuesta (hoy ~0,8 s).
- **Publicar se ve al instante**, sin `revalidateTag`, sin webhook y sin caché que invalidar. `/api/revalidate` deja de hacer falta y se borra en la etapa 7.
- Durante la construcción no se lee contenido (no hay D1 en la construcción): `generateStaticParams` de `/clientes/[slug]` devuelve `[]` y las páginas se dibujan a pedido.
- Para no repetir lecturas dentro de una misma visita, el lector guarda en memoria lo ya leído **solo durante esa petición** (`React.cache`).

Lo que se deja preparado pero **no se construye** salvo que haga falta: si en la etapa 0 se mide que el tiempo de CPU por visita se acerca al límite del plan de Workers, se activa la caché incremental de OpenNext en R2 con etiquetas en D1 (`r2IncrementalCache`, `d1NextTagCache`) y publicar llama a `revalidateTag`. El criterio y los pasos están en `plan.md`, tarea 0.6.

Observación aparte (no es de este proyecto, pero conviene saberlo): por la misma razón, la llamada a Google Places de las reseñas (`revalidate: 21600`) tampoco se estaría guardando entre visitas. Se verifica en la etapa 0; si se confirma, las reseñas de Google se guardan en D1 con una vigencia de 6 horas.

### 6.3 Vista previa

- El panel activa el **modo borrador de Next** (`draftMode()`) con `GET /api/admin/vista-previa?ruta=/...`, solo con sesión válida. En ese modo, **y solo si la petición trae además una sesión válida del panel**, la capa de lectura devuelve el **borrador** si existe. Sin sesión, el modo borrador no revela nada: se lee lo publicado.
- Cada pantalla de edición tiene a la derecha un marco (`<iframe>`) con **la página real** en modo borrador, con dos tamaños: computadora (1280 px de ancho, escalada) y teléfono (390 px).
- El formulario **guarda el borrador solo** (1,2 s después de dejar de escribir) y, al confirmar el guardado, recarga el marco conservando la posición de scroll. Cada documento declara en el esquema **en qué ruta se ve** y, para bloques, **a qué ancla desplazarse**.
- Una franja fija «Vista previa — cambios sin publicar» aparece arriba del marco para que nunca se confunda con la web publicada.
- Las páginas en modo borrador llevan `noindex` y no se cachean.

## 7. Panel

### 7.1 Pantallas

| Ruta | Pantalla |
|---|---|
| `/admin/entrar` | Correo y contraseña. |
| `/admin/instalar` | Solo mientras no exista ningún usuario: crea el primer administrador pidiendo el secreto `ADMIN_SETUP_TOKEN`. |
| `/admin` | Inicio: el mismo menú del Studio (orden de `inventario-esquema.md` §2), con una marca en lo que tiene cambios sin publicar. |
| `/admin/doc/<id>` | Editar un documento único (Hero, Página de inicio, Banners, las 4 páginas de servicio). |
| `/admin/lista/<tipo>` | Colecciones: Cuentas, Contenidos, Servicios, Reseñas. Buscar, crear, duplicar, borrar. |
| `/admin/doc/<id>/historial` | Versiones publicadas: ver, comparar con la actual y restaurar. |
| `/admin/archivos` | Biblioteca: subir, buscar, ver dónde se usa cada archivo, borrar lo que no se usa. |
| `/admin/usuarios` | Solo administradores: crear, desactivar, cambiar rol, poner contraseña nueva. |
| `/admin/actividad` | Solo administradores: registro de quién cambió qué. |

Cada pantalla de edición: formulario a la izquierda, vista previa a la derecha, y una barra inferior fija con el estado («Sin cambios» / «Cambios guardados sin publicar» / «Guardando…» / «No se pudo guardar») y los botones **Publicar** y **Descartar cambios**.

### 7.2 Formularios armados desde un esquema

Los formularios **no se escriben a mano**. Hay un esquema propio en `src/panel/esquema/` (un archivo por tipo, traducido del Studio con `inventario-esquema.md`) y un único motor que lo dibuja y lo valida. El mismo esquema valida en el navegador y en la API.

```ts
// src/panel/esquema/tipos.ts
export type Campo =
  | { clase: "texto"; nombre: string; titulo: string; ayuda?: string; obligatorio?: boolean; max?: number; patron?: RegExp; mensajePatron?: string }
  | { clase: "textoLargo"; nombre: string; titulo: string; ayuda?: string; obligatorio?: boolean; filas?: number; max?: number }
  | { clase: "numero"; nombre: string; titulo: string; ayuda?: string; obligatorio?: boolean; min?: number; max?: number; entero?: boolean }
  | { clase: "booleano"; nombre: string; titulo: string; ayuda?: string }
  | { clase: "opcion"; nombre: string; titulo: string; ayuda?: string; obligatorio?: boolean; opciones: { valor: string; titulo: string }[]; forma?: "lista" | "botones" }
  | { clase: "enlace"; nombre: string; titulo: string; ayuda?: string; obligatorio?: boolean }            // valida ^(https?://|mailto:|tel:|/)
  | { clase: "slug"; nombre: string; titulo: string; origen: string; obligatorio?: boolean }
  | { clase: "fecha"; nombre: string; titulo: string; ayuda?: string }
  | { clase: "imagen"; nombre: string; titulo: string; ayuda?: string; obligatorio?: boolean; puntoFocal?: boolean; soloPng?: boolean; alt?: "dentro" | "ninguno" }
  | { clase: "archivo"; nombre: string; titulo: string; ayuda?: string; acepta: string }
  | { clase: "objeto"; nombre: string; titulo: string; ayuda?: string; campos: Campo[]; plegable?: boolean }
  | { clase: "lista"; nombre: string; titulo: string; ayuda?: string; de: TipoElemento[]; min?: number; max?: number }
  | { clase: "referencia"; nombre: string; titulo: string; a: string[]; obligatorio?: boolean };

export type Condicion = (ctx: { valor: unknown; padre: Record<string, unknown>; documento: Record<string, unknown> }) => boolean;

export type CampoConReglas = Campo & {
  oculto?: Condicion;                 // equivale a `hidden` del Studio
  soloLectura?: Condicion;
  grupo?: string;                     // equivale a fieldset
  inicial?: unknown;
  validar?: (ctx: { valor: unknown; padre: Record<string, unknown>; documento: Record<string, unknown> }) => string | null; // texto del error o null
};

export type TipoElemento = { tipo: string; titulo: string; campos: CampoConReglas[]; resumen: (v: Record<string, unknown>) => { titulo: string; subtitulo?: string; imagen?: string } };

export type TipoDocumento = {
  tipo: string; titulo: string; unico: boolean; id?: string;
  campos: CampoConReglas[];
  vistaPrevia: { ruta: (doc: Record<string, unknown>) => string | null };   // null = sin página propia
  resumen: (doc: Record<string, unknown>) => { titulo: string; subtitulo?: string; imagen?: string };
};
```

Casos que el motor debe cubrir porque el Studio los tiene (detalle en `inventario-esquema.md` §5):

- Campos que se ocultan según **el documento que contiene el bloque** (`teamBanner` muestra campos distintos en Marketing Digital y en ChatBots/CRM): por eso la condición recibe `documento`.
- Obligatorios condicionales y validación cruzada (`metricasDemo.alcance <= visualizaciones`).
- Unicidad de `servicio.nombre`: la comprueba la API contra D1.
- Listas mixtas (`empresas[]` admite una referencia a `cuenta` o un objeto `empresaGiro`).
- Listas reordenables arrastrando; cada elemento con su `_key` (se genera con 12 caracteres hexadecimales al crearlo).
- Punto focal de imágenes: selector visual sobre la foto.
- Posición del botón sobre el banner (`posicionCta`): se ve en la vista previa, no hace falta un editor especial.

### 7.3 Avisos propios de este sitio

- **Banners del Home:** si se cambia el texto de un banner (`lineas`), el panel avisa que ese banner volverá a la animación en vivo hasta regrabar su video (`npm run grabar:escenas`); ver `src/remotion/home/videos.json`.
- **Fotos retiradas:** al terminar la migración se elimina `FOTOS_RETIRADAS` de `src/components/ContentBanner.tsx` y las tres fotos nuevas pasan a ser el dato real del documento `banners` (ver `plan.md`, etapa 1).

## 8. Usuarios y seguridad

- **Entrar:** correo + contraseña. La contraseña se guarda como PBKDF2-SHA256 con 100 000 vueltas y sal de 16 bytes (WebCrypto del Worker). Mínimo 10 caracteres.
- **Sesión:** cookie `dofi_sesion` con un token aleatorio de 32 bytes; en D1 solo se guarda su sha256. `HttpOnly; Secure; SameSite=Lax; Path=/`. Dura 14 días y se renueva con el uso.
- **Roles:** `editor` edita, publica y sube archivos; `admin` además gestiona usuarios, borra documentos de colecciones y ve la actividad.
- **Sin recuperación por correo** (no hay servicio de correo): un administrador pone una contraseña nueva a otro usuario. El último administrador activo no se puede desactivar.
- **Primer administrador:** `/admin/instalar` exige el secreto `ADMIN_SETUP_TOKEN` y solo funciona si la tabla `usuarios` está vacía.
- **Fuerza bruta:** 5 fallos seguidos por correo o 20 por IP bloquean 15 minutos.
- **Peticiones de escritura:** solo `POST/PUT/DELETE` con sesión; se rechaza si la cabecera `Origin` no es la del sitio.
- **Archivos:** tipos permitidos por lista (`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/svg+xml`, `video/mp4`, `video/webm`); los SVG se sirven con `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'` para que no ejecuten código. Tamaño máximo: 15 MB por imagen, 300 MB por video.
- **Buscadores:** `/admin` y `/api/admin` van con `X-Robots-Tag: noindex` y `Disallow` en `robots.txt`.
- **Secreto del Worker:** `ADMIN_SETUP_TOKEN` (crear el primer administrador e instalar las tablas). Nunca en el repositorio. No hace falta ningún otro: las sesiones son tokens aleatorios guardados en D1, no llevan firma.

## 9. Recursos de Cloudflare

Todo en la cuenta de DOFI (`Dofiagenciacreativa@gmail.com`, id `dd321f912cdd9597548118be29d40bdc`).

| Recurso | Nombre | Enlace en el Worker | Para qué |
|---|---|---|---|
| Base D1 | `dofi-contenido` | `DB` | Producción |
| Base D1 | `dofi-contenido-pruebas` | `DB` (en `previews`) | Vistas previas de ramas: nunca escriben en producción |
| Almacén R2 | `dofi-media` | `MEDIA` | Producción |
| Almacén R2 | `dofi-media-pruebas` | `MEDIA` (en `previews`) | Vistas previas de ramas |

Pasos que **solo puede hacer el propietario** (hay que pedírselos con instrucciones paso a paso, ver `plan.md` tarea 0.1): registrar la tarjeta y activar R2; crear las dos bases y los dos almacenes desde el panel de Cloudflare; crear el secreto `ADMIN_SETUP_TOKEN`. La sesión de `wrangler` de la computadora de trabajo es de **otra cuenta** y no se usa.

Para no depender de `wrangler` con sesión, **las tablas las crea el propio Worker**: `src/almacen/migraciones.ts` lleva la lista ordenada de cambios de esquema y `POST /api/admin/instalar` aplica los que falten (pide `ADMIN_SETUP_TOKEN` mientras no haya usuarios; después, sesión de administrador). Por el mismo motivo, **la migración de contenido es un cliente de la API del panel**: sube archivos y documentos por `/api/admin/**` con un usuario administrador, igual que lo haría una persona.

Las vistas previas de ramas usan su propia base y su propio almacén, sembrados con una copia del contenido. Así se puede probar el panel entero en una rama sin riesgo.

## 10. Migración

Un solo script repetible, `scripts/migrar-desde-sanity.mts`:

1. Lee de la API pública de Sanity todos los documentos publicados (55) y la lista de archivos **en uso** (180 imágenes y 3 videos de 204 y 6).
2. Descarga cada archivo, comprueba que su sha1 coincide con el id de Sanity, genera las variantes de imagen con `sharp` y lo sube por la API del panel.
3. Reescribe cada documento a la forma de §5.1 (referencias de imagen → id de archivo) y lo importa por la API del panel como publicado, con la nota «migrado de Sanity».
4. Escribe un informe: documentos por tipo, archivos subidos, peso, y cualquier referencia que no pudo resolver. **Si hay una sola referencia sin resolver, falla.**

Es **repetible**: se corre una vez para construir y probar, y otra el día del cambio para traer lo que se haya editado en Sanity mientras tanto. No pisa documentos que ya se hayan editado en el panel: solo reemplaza aquellos cuya última versión sigue con la nota «migrado de Sanity».

Los **borradores** de Sanity no se migran (la API pública no los ve). Hay uno conocido: `banners`, del 14-oct, más viejo que lo publicado. Se le avisa al propietario antes del cambio.

**Prueba de paridad** (`scripts/paridad.mts`): para cada función de lectura, llama a la versión Sanity y a la versión propia y compara las salidas normalizadas campo por campo, igualando antes las direcciones de imagen (`cdn.sanity.io/...<sha>...` ≡ `/media/<sha>...`). El cambio de fuente no se hace hasta que da **cero diferencias**.

## 11. Orden de construcción

Detalle en `plan.md`. Resumen:

| Etapa | Qué se construye | Qué ve el visitante |
|---|---|---|
| 0 | Recursos de Cloudflare, almacén, tablas, `/media`, medición | Nada cambia |
| 1 | Entrar al panel, usuarios, subir archivos, biblioteca | Nada cambia |
| 2 | Copia del contenido (migración), capa de lectura con `CONTENT_SOURCE`, paridad | Nada cambia (sigue leyendo de Sanity) |
| 3 | Motor de formularios + vista previa + Banners, Hero y Página de inicio | Nada cambia |
| 4 | Las 4 páginas de servicio (los 14 bloques) | Nada cambia |
| 5 | Colecciones: Cuentas, Contenidos, Servicios, Reseñas; historial y actividad | Nada cambia |
| 6 | **El cambio:** migración final, `CONTENT_SOURCE=propio`, revisión de todas las páginas | La web pasa a leer del almacén propio; se ve igual |
| 7 | 30 días después: baja de Sanity, se borra `studio/` y el código de Sanity | Nada cambia |

Hasta la etapa 6 la web sigue leyendo de Sanity, así que **no hay ningún momento sin forma de editar**: se edita en el Studio hasta el día del cambio y en el panel desde ese día. Durante el día del cambio se pide no editar nada.

Cada etapa es una rama, una vista previa y un visto bueno del propietario.

## 12. Pruebas

El proyecto no tiene pruebas automáticas. Se agrega **Vitest** (solo desarrollo) para lo que no se puede revisar a ojo:

- Almacén: guardar borrador, publicar, descartar, historial y su límite de 30, restaurar.
- Contraseñas y sesiones: hash, comparación, caducidad, bloqueo por intentos.
- Validación del esquema: cada clase de campo, condiciones, validación cruzada.
- Proyecciones: cada una contra un documento de ejemplo real guardado en `pruebas/fixtures/` (tomado de la API pública).
- Cargador de imágenes: elección de variante.

Además: la prueba de paridad (§10), y una revisión visual de las 7 páginas más `/clientes/<slug>` en computadora y teléfono al final de las etapas 1 y 6, comparando capturas contra la web publicada.

## 13. Riesgos y cómo se cubren

| Riesgo | Cobertura |
|---|---|
| Una proyección no reproduce su consulta GROQ y una página cambia sin que nadie lo note | Prueba de paridad con cero diferencias antes del cambio; respaldos actuales intactos |
| Dibujar cada visita en el Worker resulta caro para el plan de Workers | Es lo que ya pasa hoy. Se mide en la etapa 0 (tarea 0.6); plan B listo: caché incremental de OpenNext en R2 + `revalidateTag` al publicar |
| Una imagen se ve deformada donde antes la CDN recortaba | Solo dos usos piden recorte (reseñas y avatar del chat); se revisan y se recortan con CSS en la etapa 1 |
| Las tres fotos retiradas de los banners vuelven a aparecer tras migrar | La migración no copia esos tres archivos: pone en `banners` las tres fotos nuevas del proyecto (tarea 1.3) |
| El texto de un banner cambia un carácter al migrar y la escena vuelve a la animación en vivo | La migración copia el texto tal cual; la paridad compara `lineas` contra `src/remotion/home/videos.json` |
| Subir un video grande falla a mitad | Subida por partes con reintento por parte; lo incompleto se aborta |
| Alguien borra un archivo que está en uso | La biblioteca muestra dónde se usa y no deja borrar si está referenciado en un publicado o borrador |
| El día del cambio algo se ve mal | Volver atrás es cambiar `CONTENT_SOURCE` a `sanity` y publicar: Sanity sigue intacto 30 días |
| Se pierde contenido | Historial de 30 versiones por documento; copia semanal de D1 a R2 (`scripts/copia-seguridad.mts`, se corre a mano o con un disparador programado del Worker en la etapa 7) |
| Contraseñas débiles o fuerza bruta | Mínimo 10 caracteres, bloqueo por intentos, sesiones revocables por un administrador |

## 14. Lo que este diseño no decide (queda para quien ejecute, con el propietario)

- El aspecto exacto del panel. Base: mismo lenguaje visual del sitio (`DESIGN.md`: morado `#4B2A93`, naranja `#F47B20` solo en botones de acción, tipografías Sora y Geist), sobrio y claro. Se le muestra al propietario la primera pantalla real (etapa 3) y se ajusta ahí.
- Si después de la etapa 7 se quiere llevar al panel lo que hoy vive en el código (datos de la empresa, clientes de respaldo). Es otro proyecto.
