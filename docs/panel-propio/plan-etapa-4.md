# Etapa 4 — Las cuatro páginas de servicio (plan fino)

Fecha: 2026-11-26 · Rama: `panel-4-paginas-servicio` (sale de `panel-1-3-a-main`, igual a `main` + la marca de etapas en `ENCARGO.md`).

Pedido del propietario: «Sí, etapa 4». Lo que más va a usar: **cambiar videos** (hoy, los 3 de Asesorías).

## Se hace en dos partes

| Parte | Qué | Por qué en ese orden |
|---|---|---|
| **4a** | El motor que necesitan las 4 páginas (listas, video, campos que dependen de la página, agregar/ordenar/quitar secciones) + **Asesorías completa con «Cambiar video»** | Asesorías es la página de los videos y la más chica (5 bloques): sirve para probar todo el motor |
| **4b** | Marketing Digital, Tráfico/Ads y ChatBots/CRM (los otros 9 tipos de bloque: equipo, navegación, método, clientes y sus variantes, reseñas, plataformas, ecosistema) | Con el motor listo, es escribir esquemas |

Cada parte se sube a su vista previa para que el propietario la pruebe (publicando en `panel-pruebas-contenido`).

## Vista previa de las páginas de servicio

La web arma cada página con una consulta GROQ (`QUERY_ASESORIAS`, …) + reseñas de Google + un normalizador (`getPaginaAsesorias`). El panel hace **lo mismo en el navegador**:

1. `/admin` (estática) trae al construir el **conjunto**: las 4 páginas, cuentas, reseñas, servicios, contenidos y los activos (solo `_id`, `url`, medidas), de la misma fuente que la web (Sanity o `contenido/`), más las reseñas de Google.
2. Mientras se edita, el panel corre la misma consulta con `groq-js` (`consultarSobre`) sobre el conjunto con el borrador, y el mismo normalizador → secciones.
3. El lienzo dibuja esas secciones con los mismos componentes de la página (el `switch` de cada página pasa a un componente exportado: `SeccionesAsesorias`, …).

Para eso cada `getPaginaX()` se parte en `armarPaginaX(respuesta, resenasGoogle)` (puro) + la lectura. La web sigue igual (paridad 0 y comparación de páginas).

## Motor (src/panel)

- Campos nuevos: `lista` (elementos con sus campos; agregar, subir/bajar, duplicar, quitar; título de cada elemento), `video` («Cambiar video»), y `oculto(contexto)` para campos que dependen de la página (p. ej. `teamBanner`).
- «Cambiar foto» y «Cambiar video» devuelven el valor nuevo al campo (sirven dentro de listas).
- Secciones de una página de servicio = `sections[]` del documento: el panel las arma solas por tipo de bloque. En la columna «En esta página»: subir/bajar, duplicar, ocultar/mostrar, quitar y «+ Agregar sección» (los tipos que admite esa página, `inventario-esquema.md` §4).
- Ningún campo histórico se renombra; abrir y no tocar nada deja el documento idéntico (prueba automática).

## «Cambiar video» (R2, subida por partes)

- El navegador calcula el SHA-1 del archivo (MP4 o WebM, hasta 200 MB) y lo sube a R2 en partes de 20 MB por `/api/admin/videos/subir` (iniciar → partes → terminar). El Worker pasa cada parte en flujo, sin leerla. Si ya existe en R2, no se sube de nuevo.
- Queda en `videos/<sha1>.<ext>` y se ve enseguida en la vista previa (`/videos/…`). Al publicar, el documento apunta al activo nuevo `file-<sha1>-<ext>` y `contenido/archivos.json` lo registra, en el mismo commit.
- Un video subido y nunca publicado queda en R2 sin usarse (se puede limpiar en la etapa 5).
- En la web real («solo para mirar») el botón está apagado, como «Publicar cambios».

## Botones de cierre (`src/lib/cta.ts`)

La web cambia el texto genérico «Quiero mejorar mis ventas» por una variante según la página y algunos títulos viejos de cierre. El panel lo explica en la ayuda de esos campos.

## Criterios de aceptación

- 4a: en Asesorías se editan los 5 bloques con vista previa; se cambia un video y se ve; se agrega, ordena, duplica, oculta y quita una sección; publicar deja en GitHub solo lo cambiado (+ el activo del video); abrir y no tocar nada no cambia nada.
- 4b: lo mismo en las otras 3 páginas.
- `npm run probar` en verde, `npm run contenido:paridad` en 0 y las 10 páginas iguales a la web real.
