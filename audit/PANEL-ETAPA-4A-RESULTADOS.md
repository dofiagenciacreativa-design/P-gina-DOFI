# Panel propio — Etapa 4a: el motor de las páginas de servicio y Asesorías — resultados

Fecha: 2026-11-26 · Rama: `panel-4-paginas-servicio` (sale de `main` 8761015 + la marca de etapas) · Plan: `docs/panel-propio/plan-etapa-4.md`.

## Qué se hizo

- **Lectura pura de las 4 páginas de servicio**: cada `getPaginaX()` se partió en `armarPaginaX(respuesta, reseñas)` + la lectura, y el armado de secciones de cada página quedó en un componente exportado (`SeccionesMarketing`, `SeccionesTrafico`, `SeccionesFeniax`, `SeccionesAsesorias`). La web no cambia.
- **Vista previa de las páginas de servicio en el navegador**: `/admin` trae al construir el conjunto (las páginas, cuentas, reseñas, servicios, contenidos y los activos con id, dirección y medidas) y las reseñas de Google; mientras se edita, el panel corre la misma consulta GROQ (`groq-js`) y el mismo armado que la web sobre el borrador, y el lienzo lo dibuja con las mismas piezas.
- **Motor**: campos `lista` (abrir, subir, bajar, duplicar con claves nuevas, quitar con confirmación, agregar) y `video`; «Cambiar foto» devuelve el valor al campo, así que también sirve dentro de listas.
- **Secciones de servicio**: salen solas de `sections[]` (`src/panel/esquema/servicio.ts`), con los bloques de `src/panel/esquema/bloques.ts` (mismos nombres de campo que en Sanity). En la columna: Subir, Bajar, Duplicar, Ocultar/Mostrar, Quitar y «Agregar una sección» (los tipos con formulario). «Deshacer cambios» devuelve la sección a como estaba, o la quita si era nueva. El orden cambiado cuenta como cambio («Asesorías · orden de las secciones»).
- **Asesorías completa**: Portada, Introducción, Logros (lista de tarjetas con foto), Videos en celulares (3 videos) y Cierre, con ayudas en español sencillo y las reglas de `src/lib/cta.ts` explicadas en el botón y el título del cierre.
- **«Cambiar video»**: el navegador calcula el SHA-1 y sube el video a R2 en partes de 20 MB por `/api/admin/videos/subir` (el Worker pasa cada parte sin leerla); si ya está, no se sube de nuevo. Se ve enseguida en la vista previa (`/videos/…`). Al publicar, el activo `file-<sha1>-<ext>` entra a `contenido/archivos.json` en el mismo commit, solo si el video está en R2. En la web real («solo para mirar») el botón está apagado y la ruta lo rechaza.
- Pestañas: Inicio y Asesorías se editan; Marketing Digital, Tráfico/Ads y ChatBots/CRM llegan en la 4b.

## Qué se comprobó

| Prueba | Resultado |
|---|---|
| `npm run probar` | 26 pruebas en verde (6 nuevas: secciones de Asesorías, campos que leen los datos actuales, cambiar un video escribe solo esa referencia, duplicar da claves nuevas, tipos que se pueden agregar, vista previa = misma consulta y armado) |
| `next build` | sin errores; `/admin` 246 KB de HTML + 213 KB de datos (el conjunto) |
| Panel en local, Asesorías | las 5 secciones; la vista previa dibuja los 3 celulares con sus videos |
| Cambiar el título de «Videos en celulares» | se ve al escribir en la vista previa; «1 sección cambiada» |
| «Cambiar video» sin R2 (local) | mensaje claro: «El almacén de videos (R2) no está conectado a este sitio.» |
| Logros | 8 tarjetas; cada una abre sus 7 campos con su foto |
| Bajar, Ocultar, Agregar, Deshacer | orden correcto; la oculta aparece tachada y la vista previa lo dice; la nueva se agrega debajo; Deshacer la quita |
| Página completa | Nav, las secciones en el orden nuevo sin la oculta, Footer |
| Publicar | envía solo `asesoriasPage`, con el orden nuevo y la sección oculta; resumen «Asesorías · Videos en celulares, Asesorías · Logros, Asesorías · orden de las secciones» (en local se detiene en GitHub porque la llave de prueba no es real) |
| Inicio | sigue igual (6 secciones, vista previa con la portada) |
| Subida por partes a R2 (Miniflare, local) | 45 MB en 3 partes pasando `request.body`; guardado idéntico (mismo SHA-1), lectura por rango 206, una segunda subida detecta que ya existe |

## Pendiente

- El propietario prueba en la vista previa `https://panel-4-paginas-servicio-pagina-dofi.dofiagenciacreativa.workers.dev/admin`: cambiar un video de Asesorías, mover/ocultar una sección y publicar (va a `panel-pruebas-contenido`).
- Etapa 4b: Marketing Digital, Tráfico/Ads y ChatBots/CRM (9 tipos de bloque más).
- Un video subido y nunca publicado queda en R2 sin usarse (limpieza en la etapa 5).
