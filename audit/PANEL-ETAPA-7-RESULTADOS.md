# Panel propio — Etapa 7: la web sin Sanity — resultados

Fecha: 2026-11-26 · Rama: `panel-7-sin-sanity` (sale de `panel-6-cambio` + `main` con el cambio, los videos en R2 y el primer cambio del propietario). Pedido del propietario, el mismo día del cambio: «quita todo lo referente a Sanity de DOFI si es que ya no dependemos de aquello». Se adelanta la etapa 7 (el plan decía «30 días después»): la red de seguridad deja de ser Sanity y pasa a ser el historial de git (todo el contenido y el código viejo siguen en el repositorio y se pueden recuperar).

## Qué se quitó del repositorio

- `studio/` (el Sanity Studio).
- 24 guiones que escribían o leían en Sanity (`scripts/sembrar-*`, `ajustar-*`, `migrar-*`, `seed-*`, `test-*-sanity`, `logos-circulares`, `crear-esqueleto…`, `contenido-desde-sanity`, `paridad-contenido`) y sus comandos de `package.json`.
- La dependencia `@sanity/client`.
- `/api/revalidate` (lo llamaba el webhook de Sanity).
- `/api/admin/videos/copiar` y el botón «Pasar los videos a Cloudflare» (ya se usó: los videos están en R2).
- La conexión a la API de Sanity: `src/lib/sanity.ts` pasó a `src/lib/consultas.ts` y solo lee `contenido/` (`consultar()`); se quitaron `src/lib/contenido/fuente.ts` (`CONTENT_SOURCE`) y `archivos-sanity.ts`.
- `.env.production` (solo tenía `SANITY_*` y `CONTENT_SOURCE`), `contenido/LISTO-PARA-PRODUCCION` y el seguro de `scripts/cf-deploy.mjs` que los usaba.
- `SANITY_PROJECT_ID` / `SANITY_DATASET` de `wrangler.jsonc` (producción y vistas previas).
- `cdn.sanity.io` de `next.config.ts`, del cargador de imágenes y de la miniatura del panel.
- Textos: README (sección del contenido reescrita: se edita en el panel), `.env.example`, mensajes de `google-places.ts`, el aviso «solo para mirar» del panel.
- Nombres en el código: `sanityQuery` → `consultar`, `ImagenSanity` → `ImagenContenido`, `SanityCuenta…` → `Cuenta…Cruda`.

## Qué queda, a propósito

- Los nombres de tipo dentro de los datos (`sanity.imageAsset`, `sanity.fileAsset`, `image-<sha1>-…`, `_type`, `_key`): son solo la forma de los archivos de `contenido/`, no una conexión. Cambiarlos sería migrar todos los archivos sin ningún beneficio.
- Comentarios históricos en algunos componentes que cuentan cómo se hizo algo «en el Studio» o «en Sanity»: no afectan nada.
- Los documentos de `docs/` y `audit/` (la historia del proyecto).

## Qué se comprobó

| Prueba | Resultado |
|---|---|
| `npm run probar` | 83 pruebas en verde (se quitó la que probaba el traductor de direcciones de Sanity) |
| `next build` sin ningún ajuste de Sanity | sin errores; 26 páginas de clientes armadas |
| Vista previa `https://panel-7-sin-sanity-pagina-dofi.dofiagenciacreativa.workers.dev` (`6e2f802`) contra la web real | **14 páginas iguales** (texto, y fotos y videos por su huella): Inicio, las 4 de servicio, /feniax, Redes, Contacto, El Socio, /clientes y 4 clientes |
| Pedidos a Sanity en esas páginas | 0 |
| `/api/revalidate` | ya no existe (404) |

## Lo que le toca al propietario (fuera del repositorio)

1. **Cloudflare** (cuenta DOFI) → Workers y Pages → `pagina-dofi`:
   - Ajustes → Variables y secretos: borrar `SANITY_REVALIDATE_SECRET` (ya nada lo usa).
   - Construcciones → Deploy hooks: borrar `sanity-publicar` (lo usaba el webhook de Sanity).
2. **Sanity** (sanity.io/manage), proyecto `59r5krzd`: borrar el webhook y, cuando quiera, el proyecto. Borrar el proyecto no se puede deshacer; el contenido ya está entero en el repositorio (copia idéntica comprobada el 2026-11-26).
3. **Vercel**: borrar el proyecto del «studio» (el Sanity Studio publicado ahí).
