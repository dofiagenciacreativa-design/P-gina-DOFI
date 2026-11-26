# Etapa 2 — El contenido pasa a GitHub: plan de ejecución

> Se ejecuta en línea, en la rama `panel-2-contenido-github` (cortada de `panel-con-vista-previa`). Manda `cambios-2026-11-25.md`; este plan corrige un punto de su §2 (ver «Cambio de diseño»).

**Objetivo:** que la web pueda armarse leyendo el contenido desde archivos del repositorio, con **exactamente** el mismo resultado que leyendo de Sanity, sin cambiar lo que ve el visitante. En `main` la web sigue leyendo de Sanity hasta la etapa 6.

## Cambio de diseño (medido el 2026-11-25)

En vez de escribir a mano una «proyección» por cada una de las 8 consultas GROQ, la web **ejecuta las mismas consultas GROQ sobre los archivos** con `groq-js` (el evaluador oficial de GROQ, licencia MIT, sin servicio externo). Probado con la consulta del Inicio: resultado **idéntico** al de la API de Sanity, en 26 ms.

Consecuencias:
- Los documentos se guardan **con la misma forma de Sanity, sin reescribir nada**: las imágenes siguen como `asset: { _ref: "image-<sha1>-<ancho>x<alto>-<ext>" }`. Se quitan solo `_rev` y `_system` (internos de Sanity).
- Los activos (imágenes y videos) se guardan como sus documentos de Sanity (`sanity.imageAsset` / `sanity.fileAsset`) en `contenido/archivos.json`, con `url` local. Así `asset->url` y `asset->metadata.dimensions` funcionan igual.
- No hacen falta proyecciones por consulta ni `resolverDeArchivos`. La proyección del Inicio de la etapa 1 se queda para la vista previa del panel, que recibe el mapa de activos.
- `groq-js@2.0.1` (fijo; la 2.0.3 es de hace 6 días) entra en `dependencies`: se usa al construir la web y en el panel. **Necesita el visto bueno del propietario** junto con el de la etapa.

## Archivos

```
contenido/<_id>.json                    documentos únicos (paginaInicio, hero, banners, 4 páginas de servicio)
contenido/cuentas.json, servicios.json, resenas.json   colecciones (listas)
contenido/archivos.json                 documentos de activos en uso, con url local (imágenes) o de Sanity (videos, hasta la etapa 3)
public/media/<sha1>-<ancho>x<alto>.webp           imagen a tamaño completo, WebP
public/media/<sha1>-<ancho>x<alto>/w<N>.webp      variantes (N de ANCHOS menores que el ancho)
media-originales/<sha1>-<ancho>x<alto>.<ext>      el archivo original (no se publica; respaldo para cuando Sanity se dé de baja)
scripts/contenido-desde-sanity.mts                la copia, repetible
scripts/paridad-contenido.mts                     compara cada consulta: Sanity contra archivos
src/lib/contenido/conjunto.ts                     importa todos los JSON (estático) → CONJUNTO
src/lib/contenido/consulta-local.ts               consultarLocal(query, params) con groq-js
src/lib/contenido/fuente.ts                       fuenteActual(): "sanity" | "archivos" (CONTENT_SOURCE)
src/lib/sanity.ts                                 sanityQuery y las 3 funciones de cuentas eligen la fuente
src/lib/cargador-imagenes.ts                      entiende /media/<sha1>-<ancho>x<alto>.webp
```

## Tareas

1. **Copia** (`scripts/contenido-desde-sanity.mts`, `npm run contenido:copiar`): lee de la API (sin CDN, sin clave) todos los documentos publicados que no sean `system.*`/`sanity.*`; calcula los activos referenciados; por cada imagen en uso descarga el original, comprueba el sha1, lo guarda en `media-originales/`, genera con `sharp` el WebP completo (calidad 85) y las variantes (calidad 80); escribe los JSON con dos espacios y claves ordenadas (diferencias limpias en git). Repetible: no rehace imágenes que ya existen. Los videos no se descargan.
2. **Lectura local**: `conjunto.ts`, `consulta-local.ts` (con memoria de consultas ya interpretadas), `fuente.ts`; `sanityQuery()` y `getActiveAccounts`/`getAllActiveSlugs`/`getAccountBySlug` usan `consultarLocal` cuando la fuente es `archivos`. Los respaldos de siempre no cambian.
3. **Imágenes**: `cargador-imagenes.ts` convierte `/media/<sha1>-<A>x<B>.webp?w=…` en la variante más angosta que alcance (`/media/<sha1>-<A>x<B>/w<N>.webp`) o en el archivo completo. Pruebas.
4. **Paridad**: `scripts/paridad-contenido.mts` corre las consultas exportadas (Inicio, Marketing, Tráfico, FENIAX, Asesorías, cuentas activas, slugs y cada cuenta por slug) contra Sanity y contra los archivos, igualando las URL de imágenes, y lista las diferencias. Debe dar **cero**. Prueba automática: la consulta del Inicio sobre `contenido/` da lo mismo que el fixture de la etapa 1.
5. **Comprobación en local**: `next build` con `CONTENT_SOURCE=archivos`; todas las páginas siguen «○»; el texto de `/`, `/marketing-digital`, `/trafico-ads`, `/chatbots-crm`, `/asesorias` y tres `/clientes/<slug>` es idéntico al de la web publicada; ninguna imagen da 404; ninguna petición a `cdn.sanity.io` salvo los 3 videos.
6. **Vista previa**: un commit aparte pone `CONTENT_SOURCE=archivos` en `.env.production` **solo para la vista previa de la rama**; `scripts/cf-deploy.mjs` se niega a construir `main` con `archivos` mientras no exista `contenido/LISTO-PARA-PRODUCCION` (se crea en la etapa 6). El panel `/admin` lee de la misma fuente y recibe el mapa de activos.
7. **Cierre**: `npm run probar`, `tsc`, reporte `audit/PANEL-ETAPA-2-RESULTADOS.md`, casilla en `ENCARGO.md`.

## Qué no cambia

Componentes públicos, consultas GROQ, normalizadores y respaldos. En `main`, la fuente sigue siendo Sanity.
