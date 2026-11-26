# Encargo: construir el panel propio de DOFI

Este archivo es el punto de partida para quien ejecute el proyecto (pensado para Opus 5.5 en Claude Code). Para arrancar, basta con abrir una sesión en `C:\WEB DOFI` y escribir:

> Lee `docs/panel-propio/ENCARGO.md` y ejecuta la siguiente etapa pendiente del plan.

## Qué hay que lograr

Reemplazar Sanity por un panel administrativo propio en `https://dofiagenciacreativa.com/admin`, donde DOFI edite todo el contenido de la web **viendo cómo queda antes de publicar**, con un solo usuario administrador. Desde el 2026-11-25 el contenido (textos y fotos) se guarda **como archivos en este repositorio** (`contenido/`, `public/media/`) y los videos en R2; publicar es un commit a `main`. Ver `cambios-2026-11-25.md`.

## Qué leer, en este orden

1. **Este archivo.**
2. `docs/panel-propio/cambios-2026-11-25.md` — **manda sobre todo lo demás**: un solo usuario, contenido en GitHub, videos en R2, sin asistente de Claude y el orden actual de las etapas.
3. `docs/panel-propio/cambios-2026-11-24.md` — lo que cambió el 2026-11-24 (vigente salvo lo que corrige el del 25): páginas armadas al construir, Guardar/Publicar con el Deploy Hook, vista previa en el navegador, aspecto del panel según las referencias del propietario y el orden nuevo de etapas. (El asistente de Claude dentro del panel se descartó el 2026-11-25: los cambios con Claude se hacen desde Claude Desktop.)
4. `docs/panel-propio/diseno.md` — qué se construye y por qué. Las decisiones ya están tomadas con el propietario; no se reabren sin preguntarle.
5. `docs/panel-propio/plan.md` — tareas detalladas de la versión original (numeración vieja; muchas quedaron obsoletas con D1: la numeración y el alcance actuales están en `cambios-2026-11-25.md` §5).
6. `docs/panel-propio/inventario-esquema.md` — todo lo que se edita hoy en Sanity, campo por campo (consultarlo al escribir cada esquema del panel).
7. `docs/panel-propio/inventario-lectura.md` — cómo la web lee hoy el contenido, consulta por consulta (consultarlo al escribir cada proyección).
8. `README.md`, `DESIGN.md` y `audit/AJUSTES-2026-11-23-RESULTADOS.md` del repositorio.

## En qué etapa estamos

Numeración del 2026-11-25 (`cambios-2026-11-25.md` §5). Marcar aquí al terminar cada una (fecha y commit de `main`):

- [x] Etapa 1 — El panel y su vista previa en vivo (Inicio). **En `main` el 2026-11-26 (`8761015`).** Rama `panel-con-vista-previa`; entra a `main` junto con las etapas 2 y 3. **Construida el 2026-11-24; aprobada por el propietario el 2026-11-25** (`audit/PANEL-ETAPA-1-RESULTADOS.md`)
- [x] Etapa 2 — El contenido pasa a GitHub (copia de Sanity a `contenido/` y `public/media/`, lectura propia, paridad). **Construida el 2026-11-25 en la rama `panel-2-contenido-github`: paridad 0.** El propietario pasó a la etapa 3 sin pedir cambios y aprobó la 3, que corre sobre esta (`audit/PANEL-ETAPA-2-RESULTADOS.md`). **En `main` el 2026-11-26 (`8761015`)**, con la web todavía leyendo de Sanity. Su commit «SOLO VISTA PREVIA» de `.env.production` se revierte antes de `main`.
- [x] Etapa 3 — Entrar y publicar (contraseña, publicar con GitHub, videos en R2). **Construida y probada en local el 2026-11-26 en `panel-3-publicar`** (`audit/PANEL-ETAPA-3-RESULTADOS.md`). El propietario la probó en la vista previa `panel-3-vista-2` el mismo día: publicar y videos en R2 funcionan; el aviso «Ya está en la web» no llegaba y se arregló (`8d5768b`). **Aprobada por el propietario el 2026-11-26.** **En `main` el 2026-11-26 (`8761015`) con su «Sí, pásalas»**: en la web real el panel es «solo para mirar» hasta la etapa 6.
- [x] Etapa 4 — Las cuatro páginas de servicio — **4a construida el 2026-11-26 en `panel-4-paginas-servicio`**: motor (listas, video, secciones) y Asesorías completa con «Cambiar video» (`audit/PANEL-ETAPA-4A-RESULTADOS.md`, plan en `plan-etapa-4.md`); **4b construida el mismo día** (Marketing Digital, Tráfico/Ads y ChatBots/CRM, `audit/PANEL-ETAPA-4B-RESULTADOS.md`). **Aprobada por el propietario el 2026-11-26 y en `main` el mismo día (`1ea086d`) con su «Sí, pásala»**: la web se vio igual en las 9 páginas comparadas; en la web real el panel muestra las 4 páginas «solo para mirar».
- [x] Etapa 5 — Clientes, reseñas e historial — **construida el 2026-11-26 en `panel-5-colecciones`** (`audit/PANEL-ETAPA-5-RESULTADOS.md`, plan en `plan-etapa-5.md`); **aprobada por el propietario el 2026-11-26 y en `main` el mismo día (`1aa1b3b`) con su «Sí, pásala»**: la web se vio igual en 11 páginas (3 de clientes); en la web real el panel muestra las colecciones «solo para mirar».
- [x] Etapa 6 — El cambio (la web deja de leer de Sanity) — **hecho el 2026-11-26: `main` = `4a16e55`** con su «Hoy mismo» y «Sí, hazlo» (`plan-etapa-6.md`). La web lee `contenido/`, igual a antes en 12 páginas, sin fotos de Sanity; el panel publica en `main`. El propietario pasó los 3 videos a R2 de producción desde el panel (`200d138`): la web ya no pide nada a Sanity. Su primer cambio desde el panel (la frase de la Portada, `e19249b`) se publicó y se vio en la web: el ciclo completo funciona. Siguiente: etapa 7 (baja de Sanity) hacia el 2026-12-26. Volver atrás: revertir `c96018c`.
- [ ] Etapa 7 — Baja de Sanity (30 días después del cambio) — **adelantada a pedido del propietario el 2026-11-26** en `panel-7-sin-sanity` (`audit/PANEL-ETAPA-7-RESULTADOS.md`): el código ya no usa Sanity. Falta su «sí» para pasar a `main` y que él borre lo de fuera (webhook y proyecto en Sanity, «studio» en Vercel, deploy hook y secreto en Cloudflare).

Estado al 2026-11-26: **etapas 1 a 3 construidas y aprobadas** (ramas `panel-con-vista-previa` → `panel-2-contenido-github` → `panel-3-publicar`). **Entraron juntas a `main` el 2026-11-26 (`8761015`)**: `dofiagenciacreativa.com/admin` pide la contraseña y es «solo para mirar» (sin `PANEL_RAMA_DESTINO`); la web sigue leyendo de Sanity hasta la etapa 6 y se vio igual en las 10 páginas. Siguiente: etapa 4, en una rama nueva desde `main`; para probar publicar se usa una vista previa (publica en `panel-pruebas-contenido`).

## Con quién se trabaja

El propietario no es programador. Hablarle en español sencillo, paso a paso, sin jerga. Quiere ver cada cosa antes de que salga publicada.

Su forma de trabajo, que no se negocia:

1. Una rama por etapa, nunca directo en `main`.
2. Subir la rama y revisar la vista previa en `https://<rama>-pagina-dofi.dofiagenciacreativa.workers.dev`.
3. Solo con su «sí», pasar a `main`. **Cada push a `main` se publica solo** en `dofiagenciacreativa.com`.
4. Commits en español.

## Lo que no se toca

- DNS, la zona de Cloudflare, el túnel, n8n, el NAS.
- La cuenta de Cloudflare «Feniax» y la de GitHub «feniaxcrm-cloud» (antiguas).
- Claves y secretos: nunca al repositorio, nunca pegados en la conversación.
- Next.js se queda en la 15 (`--dangerouslyUseUnsupportedNextVersion` es a propósito). Nada de `npm audit fix --force`.
- La variable de build `NEXT_PUBLIC_SITE_URL` (sin ella la web sale como «no indexar»).
- Los componentes de las páginas públicas, salvo donde el plan lo dice.

## Lo que hay que pedirle al propietario (y cuándo)

| Cuándo | Qué | Por qué no lo puede hacer el agente |
|---|---|---|
| Etapa 1 | Aprobar el aspecto del panel y su vista previa (hecho el 2026-11-25) | Es su gusto |
| Antes de la etapa 3 | Activar R2 con su tarjeta y crear los almacenes `dofi-media` y `dofi-media-pruebas`; crear en GitHub un *fine-grained token* solo para `P-gina-DOFI` con *Contents: Read and write* y guardarlo como secreto `GITHUB_TOKEN_PANEL` del Worker; elegir su contraseña del panel y guardarla como secreto `PANEL_CLAVE` (ambos en *Production* y en *Previews Base*) | Su tarjeta, sus cuentas y su contraseña: nada de eso pasa por la conversación |
| Etapa 6 | Elegir el día del cambio y no editar en Sanity esa mañana | Es su operación |
| Etapa 7 | Dar de baja Sanity y el proyecto «studio» de Vercel | Son sus cuentas |

## Cosas prácticas que ahorran horas

**Empujar a GitHub.** El remoto usa la cuenta `dofiagenciacreativa-design`, pero la herramienta `gh` de la computadora tiene otra cuenta activa y `git push` a secas falla pidiendo contraseña. Sin cambiar la cuenta activa:

```bash
git -c credential.https://github.com.helper= \
    -c credential.https://github.com.helper='!f() { test "$1" = get && echo username=dofiagenciacreativa-design && echo "password=$(gh auth token --user dofiagenciacreativa-design)"; }; f' \
    push -u origin <rama>
```

**Saber si la construcción de Cloudflare terminó:**

```bash
GH_TOKEN=$(gh auth token --user dofiagenciacreativa-design) \
  gh api repos/dofiagenciacreativa-design/P-gina-DOFI/commits/<sha>/check-runs \
  --jq '.check_runs[] | select(.name|test("Workers")) | "\(.status) \(.conclusion)"'
```

Una construcción buena tarda de 3 a 8 minutos.

**Leer registros de Cloudflare.** `wrangler` en esta computadora está con sesión de **otra cuenta**: no usarlo contra Cloudflare. La cuenta de DOFI (id `dd321f912cdd9597548118be29d40bdc`) está abierta en el navegador Brave del propietario; se lee con la extensión de Chrome, solo lectura. El registro de construcción está virtualizado: hay que bajar el contenedor con scroll antes de leer el final.

**Vistas previas de ramas.** Funcionan desde el 2026-11-23: `npm run cf:deploy` (`scripts/cf-deploy.mjs`) construye siempre y solo publica en `main`; `wrangler.jsonc` repite variables y enlaces dentro de `"previews"` porque **no se heredan**. Todo enlace nuevo (D1, R2) hay que declararlo en los dos sitios.

**La computadora tiene poca memoria** (7,7 GB, casi siempre llenos). Una sola tarea pesada a la vez. `npm run dev` tarda minutos por página: para probar, `npm run build:next` y `npx next start -p 3001`. Las capturas del navegador del propietario solo funcionan si su ventana está al frente.

**Sanity hoy.** Proyecto `59r5krzd`, conjunto `production`, lectura pública sin clave. No hay clave de escritura guardada ni hace falta: la migración solo lee de Sanity. El documento `banners` tiene en el Studio un borrador viejo sin publicar (14-oct); no publicarlo.

**Fotos de los banners.** Las tres fotos de Sanity con la cara equivocada están retiradas por código (`FOTOS_RETIRADAS` en `src/components/ContentBanner.tsx`); las correctas son `public/home/banner-{redes,pauta,crm}-foto.webp`. La migración debe usar estas (tarea 2.2, paso 3).

**Videos de los banners.** Cada escena animada del Home se reproduce como video solo si el texto del banner es idéntico al de `src/remotion/home/videos.json`. La migración no debe alterar ni un carácter de `lineas`.

## Cómo ejecutar

- Usar la skill `superpowers:subagent-driven-development` (o `superpowers:executing-plans`) sobre `plan.md`, una etapa por vez.
- Las etapas 0, 1 y 2 están escritas al detalle. Para las etapas 3, 4 y 5: antes de empezar, escribir el plan fino en `docs/panel-propio/plan-etapa-N.md` con la skill `superpowers:writing-plans`, respetando los archivos, interfaces y criterios de aceptación que ya fija `plan.md`.
- Pruebas primero donde el plan trae pruebas. `npm run probar` y `npx tsc --noEmit -p .` en verde antes de cada commit.
- Al cerrar cada etapa: marcar la casilla de arriba, y agregar un reporte corto en `audit/` con el formato de los que ya hay (qué se hizo, qué se comprobó, qué quedó pendiente).
- Si algo del diseño resulta imposible o claramente peor al construirlo, **parar y contárselo al propietario** con la alternativa; no improvisar una arquitectura distinta.

## Qué sigue después de este proyecto (fuera de alcance, para no perderlo)

Pedidos del propietario del 2026-11-23 que quedaron en cola: posicionamiento SEO y GEO (aparecer primero como agencia de marketing en Cuenca, también en búsquedas con IA) y una revisión visual de todas las páginas. Hallazgos ya anotados para SEO: el mapa del sitio solo lista el inicio y los clientes; no hay datos estructurados; el título y el texto del inicio no mencionan la ciudad ni «agencia de marketing».
