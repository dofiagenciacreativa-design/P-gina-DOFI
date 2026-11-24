# Tanda 1 de la revisión de diseño · 2026-11-23

Rama `ajustes-tanda-1`. Puntos 1, 3 y 8 de `audit/REVISION-DISENO-2026-11-23.md`. No se cambió ningún texto ni nada en Sanity.

## 1. Secciones del tamaño de su contenido

- **Antes** (pedido del 2026-10-07): en tablet y computadora toda sección medía al menos una pantalla, y un «imán» del scroll la encuadraba al soltar la rueda.
- **Ahora:** solo la portada (primera sección de cada página) mide una pantalla. El resto mide lo que su contenido, con un margen fijo arriba y abajo (unos 56 px en teléfono, unos 90 px en una laptop). Se quitó el imán del scroll.
- Los enlaces a una sección (por ejemplo `#clientes`) la dejan debajo del menú, no tapada.
- Cambio en un solo lugar: `src/app/globals.css` (bloque «SECCIONES»).

Largo de cada página, en pantallas:

| Página | Computadora 1440×900 antes → ahora | Laptop 1366×650 ahora | Teléfono 390×844 antes → ahora |
|---|---|---|---|
| Marketing Digital | 7,7 → **6,0** | 7,1 | 8,6 → 8,4 |
| Tráfico / Ads | 9,7 → **8,0** | 9,5 | 12,5 → 12,2 |
| ChatBots / CRM | 7,7 → **6,5** | — | 10,4 → 10,2 |
| Asesorías | 5,7 → **4,8** | — | 6,5 → 6,4 |
| Inicio | 4,0 → 4,0 (sin cambio: portada + banners) | 5,0 | 6,4 → 6,4 |

En teléfono la diferencia es chica porque ahí las secciones ya medían lo que su contenido; ganan solo el margen.

## 3. Páginas de cada cliente (`/clientes/<nombre>`, 26 páginas)

- El texto «Tu marca puede ser la siguiente» y los títulos de las secciones se veían casi invisibles: eran claros sobre el fondo claro general del sitio. La página vuelve a su fondo oscuro.
- La portada de relleno (el mismo degradado en las 26 cuentas) ya no se muestra; aparece solo cuando el cliente tiene foto propia.

## 8. Letra más grande en textos de tarjetas

| Dónde | Antes | Ahora |
|---|---|---|
| Tarjetas de la portada del inicio | 13,5 px | 15 px (siguen entrando en la primera pantalla, también en 1366×650) |
| Pasos del método (Marketing, ChatBots) | 15 px | 16 px |
| Plataformas de Tráfico / Ads | 15 px | 16 px |
| Valores de FENIAX | 15 px | 16 px |
| Historias de Asesorías (texto y resultado) | 15 / 14 px | 16 / 15 px |
| Reseñas de Google en el teléfono | 15 px | 16 px |

## Comprobado (versión compilada en local, con el dominio real)

- `tsc` sin errores y `next build` correcto.
- 9 páginas en computadora (1440×900) y teléfono (390×844), y 3 en laptop (1366×650): sin errores en la consola, sin desborde horizontal, sin contenido cortado. Único aviso: el texto de la demostración de chat dentro del teléfono de la portada de ChatBots/CRM, que ya pasaba antes y es intencional.
- Revisión visual de las capturas: secciones, botones, tarjetas, videos de Asesorías y páginas de clientes.

## Pendiente, anotado para las próximas tandas

- El enlace «Todos los clientes» de las páginas de cada cliente lleva a `/#clientes`, una sección que ya no existe en el inicio (se quitó por un pedido anterior). Se resuelve con el punto 4 de la revisión.
