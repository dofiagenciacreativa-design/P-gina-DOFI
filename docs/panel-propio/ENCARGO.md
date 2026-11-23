# Encargo: construir el panel propio de DOFI

Este archivo es el punto de partida para quien ejecute el proyecto (pensado para Opus 5.5 en Claude Code). Para arrancar, basta con abrir una sesión en `C:\WEB DOFI` y escribir:

> Lee `docs/panel-propio/ENCARGO.md` y ejecuta la siguiente etapa pendiente del plan.

## Qué hay que lograr

Reemplazar Sanity por un panel administrativo propio en `https://dofiagenciacreativa.com/admin`, donde el equipo de DOFI edite todo el contenido de la web **viendo cómo queda antes de publicar**. El contenido pasa a guardarse en la cuenta de Cloudflare de DOFI (D1 para los datos, R2 para imágenes y videos).

## Qué leer, en este orden

1. **Este archivo.**
2. `docs/panel-propio/diseno.md` — qué se construye y por qué. Las decisiones ya están tomadas con el propietario; no se reabren sin preguntarle.
3. `docs/panel-propio/plan.md` — las 8 etapas y sus tareas.
4. `docs/panel-propio/inventario-esquema.md` — todo lo que se edita hoy en Sanity, campo por campo (consultarlo al escribir cada esquema del panel).
5. `docs/panel-propio/inventario-lectura.md` — cómo la web lee hoy el contenido, consulta por consulta (consultarlo al escribir cada proyección).
6. `README.md`, `DESIGN.md` y `audit/AJUSTES-2026-11-23-RESULTADOS.md` del repositorio.

## En qué etapa estamos

Marcar aquí al terminar cada una (fecha y commit de `main`):

- [ ] Etapa 0 — Cimientos
- [ ] Etapa 1 — Usuarios y archivos
- [ ] Etapa 2 — Copia del contenido y lectura propia
- [ ] Etapa 3 — Formularios, vista previa, Banners + Hero + Página de inicio
- [ ] Etapa 4 — Las cuatro páginas de servicio
- [ ] Etapa 5 — Colecciones, historial y actividad
- [ ] Etapa 6 — El cambio (la web deja de leer de Sanity)
- [ ] Etapa 7 — Baja de Sanity (30 días después)

Estado al 2026-11-23: **nada construido**. Solo existen estos documentos, en la rama `panel-propio-sin-sanity`.

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
| Antes de la etapa 0 | Activar R2, crear 2 almacenes y 2 bases, pasar los 2 ids de base, crear 1 secreto (texto listo en `plan.md`, tarea 0.1) | Requiere su tarjeta y su sesión de Cloudflare; el secreto no debe pasar por la conversación |
| Etapa 0 y 1 | Ejecutar «instalar» una vez en la vista previa y otra en producción con su `ADMIN_SETUP_TOKEN`, y crear su usuario | Es su contraseña |
| Etapa 2 | Escribir `PANEL_URL`, `PANEL_CORREO` y `PANEL_CLAVE` en `C:\WEB DOFI\.env.local` | Son sus credenciales del panel |
| Etapa 3 | Aprobar el aspecto del panel | Es su gusto |
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
