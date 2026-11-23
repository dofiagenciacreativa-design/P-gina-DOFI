# Ajustes del 2026-11-23 · El Home va a saltos

Rama `velocidad-e-imagenes-home`. Sin publicar todavía. No hubo cambios en Sanity ni en el Studio.

Pedido: «la página principal carga muy lenta, no fluida; no sé si son los efectos, los puntos…».

## Qué pasaba

La descarga no era el problema: tras el arreglo del 2026-10-28 el Home pesa 0,7–1 MB y carga en poco más de 1 s. El problema era la **fluidez**: la computadora trabajaba de más para dibujar los efectos. Se nota sobre todo en equipos con gráfica integrada (medido en una laptop con Intel Iris Xe; fluido son 60 cuadros por segundo).

Se encontraron dos causas, apagando cada efecto por separado sobre la web publicada:

| Causa | Con el efecto | Sin el efecto |
|---|---|---|
| **Capa de grano** (cubre toda la pantalla, con `mix-blend-mode`) durante el scroll | 14 | 26 |
| La misma capa sobre la portada quieta | 34–37 | 51–56 |
| **Escenas animadas de los 4 banners** (Remotion en vivo) | 6–14 | 45–60 |

- **Grano:** una capa fija con modo de mezcla obliga al navegador a recomponer la pantalla entera en cada cuadro de scroll o de animación.
- **Banners:** cada escena se redibujaba 30 veces por segundo con decenas de brillos, sombras, desenfoques y máscaras (filtros SVG, `drop-shadow`, `blur`). Los «puntos» que viajan por las líneas del banner de Chatbots son parte de eso.
- **Portada:** no había un tercer problema. Con el grano corregido va fluida, así que sus efectos (resplandores, vidrio, flotación del texto) quedaron intactos.

## Arreglos

1. **Grano sin modo de mezcla** (`globals.css`, `.grain-layer`): de `soft-light` al 22 % a mezcla normal al 4 %. Comparado píxel por píxel, la diferencia media con la versión anterior es de 0,7 sobre 255 por canal (quitarlo del todo daba 1,5). Afecta a todas las páginas.
2. **Las escenas de los banners son ahora video** (WebM con transparencia), grabado de la misma escena con `npm run grabar:escenas`. Se ve igual; el navegador solo reproduce.
   - Dos versiones por escena: computadora (0,39–0,60 MB) y teléfono (0,29–0,39 MB). Se descargan al acercarse a cada banner.
   - Con «movimiento reducido» no se descarga el video: queda una imagen quieta.
   - El código de Remotion ya no se descarga en el Home cuando se usa el video.
3. **Respaldo en vivo.** La escena se sigue dibujando con Remotion, como antes, cuando:
   - el texto del banner se cambió en Sanity y ya no coincide con el del video (nunca se muestra un texto viejo);
   - el navegador es Safari o cualquiera de iPhone/iPad (reproducen WebM pero sin transparencia);
   - el video falla al cargar.

## Resultado (Home en computadora, 1440×900, versión compilada en local)

| | Publicada | Nueva |
|---|---|---|
| Scroll de arriba a abajo | 14–45 | 32–58 |
| Banner en pantalla | 6–19 | 23–34 (el video va a 30, su velocidad de diseño) |
| Portada quieta | 34–37 | 51–56 |
| Descarga al abrir | ≈1,0 MB | ≈1,4 MB |
| Descarga tras bajar hasta el final | ≈1,0 MB | ≈2,7 MB (teléfono: ≈2,0 MB) |

Las cifras de fluidez varían bastante entre medidas: la computadora de pruebas estaba con la memoria casi llena (0,3 GB libres de 7,7). La comparación más limpia es la de cada efecto encendido y apagado en la misma página (tabla de arriba).

**Costo:** el Home descarga más (los videos). Es el precio de que la animación no la calcule cada computadora.

## Pendiente / a tener en cuenta

- **iPhone, iPad y Safari** siguen con la animación en vivo (igual que antes; sus gráficas la mueven mejor que una laptop con gráfica integrada). Darles video requiere otro formato (HEVC con transparencia, que solo se genera en Mac) o una técnica con WebGL.
- **Si se cambia el texto de un banner en Sanity**, ese banner vuelve a la animación en vivo hasta volver a grabar: `npm run grabar:escenas` y publicar `public/home/escenas` y `src/remotion/home/videos.json`.
- No medido en un teléfono real.

## Archivos

- **Nuevos:**
  - `scripts/grabar-escenas.mjs` y el comando `npm run grabar:escenas` (necesita Chrome y ffmpeg; usa `playwright-core`, nueva dependencia de desarrollo).
  - `src/app/render-escena/` — la escena sola sobre fondo transparente, para grabarla. En el sitio publicado responde 404.
  - `src/components/home/VideoEscena.tsx`
  - `src/remotion/home/videos.json` — con qué texto se grabó cada video.
  - `public/home/escenas/` — 4 videos de computadora, 4 de teléfono y 4 imágenes quietas (3,9 MB en total).
- **Modificados:**
  - `src/app/globals.css` — la capa de grano.
  - `src/components/home/EscenaBanner.tsx` — video o en vivo.
  - `src/components/home/BannerHibrido.tsx` — el banner del teléfono pide el video chico.
  - `.gitignore` — carpetas de trabajo (`.grabacion/`, `.playwright-mcp/`).

## Validación

- `tsc` sin errores y `next build` correcto.
- Computadora (1440×900): los 4 videos cargan y se reproducen; sin errores en la consola; Remotion no se descarga.
- Teléfono (390×844): los 4 banners usan la versión chica; sin errores.
- Movimiento reducido: 0 videos, 4 imágenes quietas.
- `/render-escena` en la versión compilada: 404.
