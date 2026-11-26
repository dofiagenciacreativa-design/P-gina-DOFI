# Panel propio — Etapa 2: el contenido pasa a GitHub — resultados

Fecha: 2026-11-25 · Rama: `panel-2-contenido-github` (sobre `panel-con-vista-previa` y con `main` al día) · Estado: **en vista previa, esperando el visto bueno del propietario**. Entra a `main` junto con las etapas 1 y 3.

Plan: `docs/panel-propio/plan-etapa-2.md` · Decisiones: `docs/panel-propio/cambios-2026-11-25.md`.

## Qué se hizo

- **Copia** (`npm run contenido:copiar`, `scripts/contenido-desde-sanity.mts`): los 55 documentos publicados de Sanity a `contenido/` (un archivo por página única y uno por colección: 26 cuentas, 16 reseñas, 6 servicios), con su misma forma (solo se quitan `_rev` y `_system`). Las 180 fotos en uso a `public/media/` como WebP a tamaño completo más sus variantes por ancho (883 archivos, 21 MB), y el archivo bajado de Sanity a `media-originales/` (33 MB, no se publica). Los 3 videos de Asesorías siguen en Sanity hasta la etapa 3 (R2). Repetible.
- **Lectura**: con `CONTENT_SOURCE=archivos` la web ejecuta **las mismas consultas GROQ** sobre `contenido/` con `groq-js@2.0.1` (evaluador oficial de GROQ, MIT), en vez de pedirlas a Sanity. Cambio de diseño respecto del plan del 25: no hicieron falta proyecciones a mano ni reescribir las imágenes. Por defecto todo sigue leyendo de Sanity.
- **Imágenes**: el cargador de `next/image` entiende `/media/<sha1>-<ancho>x<alto>.webp` y entrega la variante WebP más angosta que alcance. Las fotos son archivos estáticos: no pasan por el Worker.
- **Panel**: `/admin` lee documentos y fotos de la misma fuente que la web.
- **Seguro**: `scripts/cf-deploy.mjs` detiene la construcción de `main` si `CONTENT_SOURCE=archivos` antes de que exista `contenido/LISTO-PARA-PRODUCCION` (se crea en la etapa 6). Probado.
- **Vista previa de la rama**: un commit aparte pone `CONTENT_SOURCE=archivos` en `.env.production`. **Hay que revertirlo antes de pasar a `main`** (el seguro lo recuerda si se olvida).

## Qué se comprobó

| Comprobación | Resultado |
|---|---|
| `npm run contenido:paridad`: cada consulta contra Sanity y contra los archivos (Inicio, Marketing, Tráfico, ChatBots/CRM, Asesorías, cuentas activas, slugs y las 26 cuentas) | **0 diferencias**, también después de traer de `main` el campo nuevo «integración de la foto» |
| `next build` leyendo de archivos | Todas las páginas «○»/«●», igual que con Sanity |
| Texto de `/`, `/marketing-digital`, `/chatbots-crm`, `/asesorias` y 3 `/clientes/<slug>` contra `https://dofiagenciacreativa.com` | Idéntico, carácter por carácter |
| `/trafico-ads` | Ver «Notas» |
| Fotos de esas páginas | 0 errores; ninguna sale ya de `cdn.sanity.io` |
| Pruebas | `npm run probar` en verde |

## Notas

- Mientras se trabajaba, entraron a `main` cuatro cambios de la sesión de las portadas (fotos integradas y la «diana» de Pauta). La primera comparación de `/trafico-ads` mostró la frase vieja de la portada; era código, no contenido. Se trajo `main` a la rama, se volvió a copiar el contenido (sin cambios) y se repitió la paridad (0 diferencias).
- La CDN de Sanity no entrega las fotos byte a byte como se subieron (las vuelve a codificar; los WebP los da como PNG si no se pide WebP). Por eso la copia comprueba medidas, no huellas sha1, y `media-originales/` guarda lo que entrega Sanity a la mejor calidad disponible.
- `groq-js` es una dependencia nueva de ejecución: **necesita el visto bueno del propietario** junto con la etapa.

## Pendiente

- Visto bueno del propietario en la vista previa.
- Etapa 3: contraseña, «Publicar cambios» con GitHub y videos en R2. Antes, el propietario activa R2 y crea `GITHUB_TOKEN_PANEL` y `PANEL_CLAVE`.
