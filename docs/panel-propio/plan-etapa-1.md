# Etapa 1 — El panel y su vista previa en vivo (Inicio): plan de ejecución

> **Para quien lo ejecute:** se ejecuta en línea (`superpowers:executing-plans`), tarea por tarea, en la rama `panel-con-vista-previa`. Leer antes `cambios-2026-11-24.md` §4, §5 y §7.

**Objetivo:** el panel en `/admin` con el aspecto aprobado (pestañas, lista de secciones, formulario con contadores, vista previa Computadora/Celular y Esta sección/Página completa) para la página de Inicio, dibujando la vista previa en el navegador con los componentes reales mientras se escribe. No guarda nada.

**Arquitectura:** `/admin` es una página estática que, al construir, lee de Sanity los documentos completos `hero`, `paginaInicio` y `banners` y se los entrega al panel (cliente). El panel edita esos documentos en memoria; en cada cambio los pasa por la proyección (documentos → la misma forma cruda que devuelve hoy la consulta GROQ del Inicio) y por el normalizador de siempre, y manda el resultado por `postMessage` a `/admin/lienzo`, otra página estática que dibuja `Hero`, `ContentBanner`, `Nav` y `Footer` reales dentro de un marco de 1440 o 390 px.

**Tecnología:** Next.js 15.5 (App Router), React 19, TypeScript, Tailwind v4 (tokens de `globals.css`), Vitest (nuevo, solo desarrollo).

## Restricciones

- No cambia nada de lo que ve el visitante en las páginas públicas. La única modificación fuera del panel es un traslado de código sin cambios de comportamiento (tarea 1) y `/admin` en `robots.ts`.
- `/admin` y `/admin/lienzo` son **estáticas** (○ en la salida de `next build`): no gastan CPU del Worker. Nada de `force-dynamic`, nada de middleware.
- Sin dependencias nuevas de ejecución. Solo `vitest` en `devDependencies`.
- `/admin` no tiene inicio de sesión: **esta rama no pasa a `main`** hasta que exista la etapa 2. Solo muestra contenido que ya es público y no puede guardar.
- `noindex` en todo `/admin`, y `/admin` en `disallow` de `robots.ts`.
- El lienzo solo acepta mensajes del mismo origen y de la ventana que lo contiene.
- Commits en español con la línea `Co-Authored-By`.

## Mapa de archivos

```
src/lib/inicio.ts                          NUEVO. Tipos, respaldos y normalizadores del Inicio, sin fetch (movidos de sanity.ts tal cual) + armarPaginaInicio()
src/lib/sanity.ts                          Quita lo movido; getPaginaInicio() = armarPaginaInicio(await sanityQuery(...)); re-exporta inicio.ts
src/lib/contenido/tipos.ts                 NUEVO. Doc, InfoArchivo, ResolverArchivo
src/lib/contenido/archivos-sanity.ts       NUEVO. resolverDeSanity(): referencia de imagen de Sanity → URL de la CDN y medidas
src/lib/contenido/proyecciones/pagina-inicio.ts  NUEVO. proyectarPaginaInicio(): documentos → forma cruda de QUERY_PAGINA_INICIO
src/panel/esquema/tipos.ts                 NUEVO. Campo, Bloque, SeccionPanel, Ruta
src/panel/esquema/inicio.ts                NUEVO. seccionesInicio(): las secciones del Inicio con sus campos
src/panel/motor/rutas.ts                   NUEVO. leer() / escribir() por ruta, nuevaClave()
src/panel/motor/CampoPanel.tsx             NUEVO. Un campo según su clase (texto con contador, enlace, opción, número, sí/no, líneas, imagen)
src/panel/motor/TarjetaSeccion.tsx         NUEVO. La tarjeta de una sección (cabecera, ¿Cómo funciona?, grupos, Guardar)
src/panel/vista-previa/mensajes.ts         NUEVO. Forma de los mensajes panel ↔ lienzo
src/panel/vista-previa/Marco.tsx           NUEVO. El iframe a escala con sus conmutadores
src/panel/vista-previa/Lienzo.tsx          NUEVO. Dibuja la página con los componentes reales
src/panel/ui/Panel.tsx                     NUEVO. Barra, pestañas, columnas, estado
src/panel/ui/iconos.tsx                    NUEVO. Iconos de las secciones (Phosphor)
src/app/admin/layout.tsx                   NUEVO. noindex
src/app/admin/page.tsx                     NUEVO. Lee los 3 documentos al construir y monta el panel
src/app/admin/lienzo/page.tsx              NUEVO. Monta el lienzo
src/app/robots.ts                          /admin en disallow
vitest.config.ts, package.json             Vitest y el script "probar"
pruebas/fixtures/sanity/documentos-inicio.json   Los 3 documentos tal como los devuelve la API pública
pruebas/fixtures/sanity/consulta-inicio.json     El resultado real de QUERY_PAGINA_INICIO
pruebas/contenido/*.test.ts, pruebas/panel/*.test.ts
```

---

### Tarea 1: Vitest y separar el normalizador del Inicio

**Archivos:** `package.json`, `vitest.config.ts`, `src/lib/inicio.ts`, `src/lib/sanity.ts`, `pruebas/contenido/inicio.test.ts`, `pruebas/fixtures/sanity/consulta-inicio.json`.

**Produce:**
```ts
// src/lib/inicio.ts
export type RespuestaCrudaInicio = { pagina: PaginaInicioRaw | null; bannersDoc: BannersDocRaw; heroDoc: HeroDocRaw };
export type PaginaInicio = { secciones: SeccionData[]; hero: HeroContent; capacidades: Capacidad[]; seccionesContenido: SeccionContenido[] };
export function armarPaginaInicio(respuesta: RespuestaCrudaInicio | null): PaginaInicio;
// + todos los tipos, HERO_FALLBACK y CAPACIDADES_FALLBACK que hoy exporta sanity.ts
```

- [ ] `npm install -D vitest`; script `"probar": "vitest run"`; `vitest.config.ts` con `include: ["pruebas/**/*.test.ts"]` y el alias `@` → `src`.
- [ ] Guardar el fixture: el resultado de `QUERY_PAGINA_INICIO` contra la API pública (`https://59r5krzd.api.sanity.io/v2024-01-01/data/query/production`), solo el campo `result`.
- [ ] Prueba que falla (`pruebas/contenido/inicio.test.ts`): con el fixture, `armarPaginaInicio` da el título «Ventas Inteligentes», 5 capacidades de respaldo (el documento no tiene `capacidades`), 4 banners con escena `redes`, `pauta`, `crm`, `asesorias`, botón «Quiero Mejorar mis Ventas» en el primero; con `null`, todo el respaldo (`HERO_FALLBACK`, 5 capacidades, 4 banners sin imagen).
- [ ] Mover de `sanity.ts` a `inicio.ts`, **sin cambiar una línea de lógica**, desde «Tipos de las secciones ya conectadas a un componente» hasta el final de `normalizarSeccion`, menos `QUERY_PAGINA_INICIO`, que se queda en `sanity.ts`. Exportar los tipos crudos que hagan falta. Escribir `armarPaginaInicio` con el cuerpo actual de `getPaginaInicio` después del `sanityQuery`.
- [ ] `sanity.ts`: `export * from "./inicio";` y `getPaginaInicio()` = `armarPaginaInicio(await sanityQuery<RespuestaCrudaInicio>(QUERY_PAGINA_INICIO))`.
- [ ] `npm run probar` y `npx tsc --noEmit -p .` en verde. Commit «Inicio: los normalizadores pasan a un módulo sin fetch (para la vista previa del panel)».

### Tarea 2: Proyección documentos → forma cruda del Inicio

**Archivos:** `src/lib/contenido/tipos.ts`, `src/lib/contenido/archivos-sanity.ts`, `src/lib/contenido/proyecciones/pagina-inicio.ts`, `pruebas/contenido/proyeccion-inicio.test.ts`, `pruebas/fixtures/sanity/documentos-inicio.json`.

**Produce:**
```ts
export type Doc = Record<string, unknown> & { _id: string; _type: string };
export type InfoArchivo = { url: string; ancho: number | null; alto: number | null };
/** Recibe el valor guardado de un campo de imagen o archivo y devuelve su dirección y medidas. */
export type ResolverArchivo = (valor: unknown) => InfoArchivo | null;
export function resolverDeSanity(o: { projectId: string; dataset: string }): ResolverArchivo;
export type DocsInicio = { paginaInicio: Doc | null; banners: Doc | null; hero: Doc | null };
export function proyectarPaginaInicio(d: DocsInicio, resolver: ResolverArchivo): RespuestaCrudaInicio;
```

Reglas (las de `plan.md` tarea 2.4): campo ausente → `null`; `url + "?w=…"` con URL `null` → `null`; `hotspot{ x, y }` copia solo `x` e `y`; `coalesce(a, "")` → `a ?? ""`; listas ausentes → `null`.

- [ ] Guardar el fixture de documentos: `*[_id in ["hero","paginaInicio","banners"]]` (API sin CDN, sin clave).
- [ ] Prueba que falla: `proyectarPaginaInicio(documentos, resolverDeSanity({ projectId: "59r5krzd", dataset: "production" }))` es **igual** (`toEqual`) a `consulta-inicio.json`. Prueba de `resolverDeSanity`: `{ asset: { _ref: "image-abc-2077x757-png" } }` → `{ url: "https://cdn.sanity.io/images/59r5krzd/production/abc-2077x757.png", ancho: 2077, alto: 757 }`; `{ asset: { _ref: "file-abc-mp4" } }` → `/files/…/abc.mp4` sin medidas; cualquier otra cosa → `null`.
- [ ] Escribir las tres piezas hasta que pase. Commit «Contenido: proyección del Inicio desde los documentos, igual a la consulta de Sanity».

### Tarea 3: Esquema del Inicio y motor de campos

**Archivos:** `src/panel/esquema/tipos.ts`, `src/panel/esquema/inicio.ts`, `src/panel/motor/rutas.ts`, `src/panel/motor/CampoPanel.tsx`, `src/panel/motor/TarjetaSeccion.tsx`, `src/panel/ui/iconos.tsx`, `pruebas/panel/rutas.test.ts`, `pruebas/panel/esquema-inicio.test.ts`.

**Produce:**
```ts
export type Segmento = string | number | { _key: string };
export type Ruta = Segmento[];
export function leer(valor: unknown, ruta: Ruta): unknown;
export function escribir<T>(valor: T, ruta: Ruta, nuevo: unknown): T;   // copia inmutable; crea objetos intermedios
export const nuevaClave: () => string;                                  // 12 caracteres hexadecimales
export type Campo = …texto | textoLargo | enlace | opcion | booleano | numero | lineas | imagen;   // nombre admite "a.b"
export type Bloque = { titulo: string; documento: string; ruta: Ruta; campos: Campo[]; nota?: string };
export type SeccionPanel = { clave: string; titulo: string; icono: NombreIcono; apareceEn: string; ayuda: string; vista: string; cuenta?: number; bloques: Bloque[]; vacia?: { texto: string; boton: string; aplicar: (docs: Record<string, Doc>) => Record<string, Doc> } };
export function seccionesInicio(docs: Record<string, Doc>): SeccionPanel[];
```

Secciones del Inicio, en el orden de la página:

| Sección | Documento y ruta | Campos (largo recomendado) |
|---|---|---|
| Portada | `paginaInicio` → `hero`; `hero` (foto) | Título 40, Marca 40, Propuesta comercial 110 (texto largo); botón principal: texto 32 + enlace; botón secundario: texto 32 + enlace; foto (solo verla) y su texto alternativo 120 |
| Tarjetas | `paginaInicio` → `capacidades[_key]`, un grupo por tarjeta | Título 32, Descripción 90, Icono (redes, pauta, crecimiento, rescate, academia), Mostrar (sí/no), Enlace. Si la lista está vacía: «Hoy se ven las 5 tarjetas de fábrica» y un botón que las copia para editarlas |
| Banner 1–4 | `banners` → `seccionesContenido[_key]` | Texto de la escena (una línea por renglón; aviso de video), botón: texto 32, enlace, color (naranja, morado, blanco, oscuro); posición en computadora y en celular (horizontal, vertical, ajuste fino −30…30); descripción de la imagen 120; foto de primer plano (solo verla) |

- [ ] Pruebas de `leer`/`escribir` (por índice, por `_key`, crea intermedios, no muta el original) y de `seccionesInicio` con el fixture (6 secciones, títulos «Portada», «Tarjetas», «Banner 1 · Redes»…, la de tarjetas con `vacia` porque el documento no tiene capacidades). Hacerlas pasar.
- [ ] Componentes `CampoPanel` y `TarjetaSeccion` (sin pruebas automáticas: se revisan en el navegador en la tarea 5).
- [ ] Commit «Panel: esquema del Inicio y motor de campos».

### Tarea 4: Lienzo y marco de la vista previa

**Archivos:** `src/panel/vista-previa/mensajes.ts`, `Marco.tsx`, `Lienzo.tsx`, `src/app/admin/lienzo/page.tsx`.

**Produce:**
```ts
export type VistaPrevia = { pagina: "inicio"; datos: PaginaInicio; modo: "seccion" | "completa"; vista: string };  // vista: "hero" | "banner:<id>"
export type MensajeAlLienzo = { tipo: "dibujar" } & VistaPrevia;
export type MensajeDelLienzo = { tipo: "listo" };
export function Marco(p: { vista: VistaPrevia; dispositivo: "computadora" | "celular" }): JSX.Element;
```

- [ ] `Lienzo`: escucha `message` solo si `event.origin === location.origin` y `event.source === window.parent`; avisa «listo» al montar; dibuja en «completa» `Nav` + `Hero` + los `ContentBanner` + `Footer` (como `src/app/page.tsx`) y en «seccion» solo la pieza elegida; cada pieza va envuelta en `<div data-vista="…">` y al cambiar de vista se desplaza hasta ella; los clics en enlaces no navegan.
- [ ] `Marco`: `<iframe src="/admin/lienzo">` de 1440×900 (computadora) o 390×844 (celular), escalado al ancho disponible con `transform: scale()`; manda la vista al recibir «listo» y en cada cambio.
- [ ] Commit «Panel: vista previa dibujada en el navegador con los componentes reales».

### Tarea 5: El panel

**Archivos:** `src/panel/ui/Panel.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/robots.ts`.

- [ ] `page.tsx` (estática): `sanityQuery<Doc[]>('*[_id in ["hero","paginaInicio","banners"]]')`, arma `{ paginaInicio, banners, hero }` y pasa `projectId`/`dataset` (públicos) al panel.
- [ ] `Panel.tsx`, según `cambios-2026-11-24.md` §4: barra abismo con logo, «Panel», estado de cambios y «Publicar cambios» (deshabilitado: «se activa en la etapa 3»); franja «Etapa 1 de prueba: nada se guarda»; pestañas (solo Inicio activa, las demás «próximamente»; «Ver la página →»); título «CONTENIDO · INICIO»; tres columnas (secciones con punto naranja si cambiaron / tarjeta / vista previa con estado, conmutadores y «Ampliar»); en pantallas angostas, dos y luego una columna. Esconde el grano y el botón de WhatsApp del sitio solo en esta página. «Guardar» y «Deshacer cambios» por sección: guardar explica que se activa en la etapa 3; deshacer vuelve a lo publicado.
- [ ] `robots.ts`: `/admin` en los `disallow`. `layout.tsx`: `robots: { index: false, follow: false }`.
- [ ] Commit «Panel: primera pantalla con la página de Inicio».

### Tarea 6: Comprobación y vista previa de la rama

- [ ] `npm run probar`, `npx tsc --noEmit -p .`, `npm run build:next`: `/admin` y `/admin/lienzo` salen «○ Static»; `/` sigue «○ Static».
- [ ] `npx next start -p 3001` y, en el navegador: escribir en «Título» de la Portada cambia el título de la vista previa al instante, en Computadora y en Celular; «Página completa» con el contenido sin tocar se ve igual que `/` (capturas lado a lado, 1440 y 390); escribir no genera peticiones de red; la página `/` es idéntica a antes (mismo texto).
- [ ] Subir la rama, esperar la construcción de Cloudflare y repetir la revisión en `https://panel-con-vista-previa-pagina-dofi.dofiagenciacreativa.workers.dev/admin`.
- [ ] Marcar la etapa 1 en `ENCARGO.md` como «en vista previa, esperando visto bueno» y escribir `audit/PANEL-ETAPA-1-RESULTADOS.md`.

## Autorrevisión

- Cobertura de `cambios-2026-11-24.md` §7 (etapa 1): aspecto §4 → tarea 5; vista previa §5 → tareas 2 y 4; proyección con `resolverArchivo` → tarea 2; normalizador separado → tarea 1; contadores con largo recomendado → tarea 3; criterios de aceptación → tarea 6.
- Fuera de esta etapa (a propósito): guardar, publicar, subir fotos, reordenar o agregar elementos, las otras páginas, inicio de sesión.
