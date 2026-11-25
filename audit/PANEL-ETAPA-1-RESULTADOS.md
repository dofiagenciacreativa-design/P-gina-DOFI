# Panel propio — Etapa 1: resultados

Fecha: 2026-11-24 · Rama: `panel-con-vista-previa` · Estado: **en vista previa, esperando el visto bueno del propietario. No pasa a `main` sola** (no tiene inicio de sesión; entra junto con la etapa 2).

Plan: `docs/panel-propio/cambios-2026-11-24.md` §7 y `docs/panel-propio/plan-etapa-1.md`.

## Qué se hizo

- **`/admin`**: el panel con el aspecto aprobado (referencias del portal de ALEY, identidad de DOFI). Barra superior, franja «Etapa 1, de prueba», pestañas por página (solo Inicio activa), lista de secciones (Portada, Tarjetas, Banner 1–4), tarjeta de la sección con «¿Cómo funciona?», campos con contador de letras y notas de ayuda, y vista previa a la derecha.
- **Vista previa en vivo** (`/admin/lienzo` dentro de un iframe): dibuja `Nav`, `Hero`, `ContentBanner` y `Footer` reales con lo que manda el panel por `postMessage`. Computadora (1440×900) o Celular (390×844), «Esta sección» o «Página completa», y «Ampliar». Solo acepta mensajes del mismo origen.
- **Datos**: `/admin` lee de Sanity al construir los documentos completos `hero`, `paginaInicio` y `banners` (la API pública no ve borradores). El panel los edita en memoria; en cada cambio, `proyectarPaginaInicio()` los convierte en la forma cruda de la consulta GROQ y `armarPaginaInicio()` (el normalizador de siempre) los deja listos para los componentes.
- **Guardar y Publicar** se ven, pero explican que se activan en la etapa 3. «Deshacer cambios» vuelve la sección a lo publicado. Aviso del navegador si se cierra con cambios.
- **Tarjetas**: el documento no tiene `capacidades` (la web muestra las 5 de fábrica). El panel lo explica y ofrece copiarlas para editarlas.
- **Fuera del panel**: los normalizadores del Inicio pasaron tal cual de `src/lib/sanity.ts` a `src/lib/inicio.ts` (sin fetch, para usarlos en el navegador); `sanity.ts` los re-exporta. `/admin` en `disallow` de `robots.ts` y con `noindex`.
- **Pruebas** (Vitest, nuevo, solo desarrollo): 12, en `pruebas/`. La principal compara la proyección contra la respuesta real de Sanity: **idénticas**.

## Qué se comprobó (local, `next build` + `next start`)

| Comprobación | Resultado |
|---|---|
| `/admin`, `/admin/lienzo` y `/` en la salida de `next build` | Las tres «○ Static» |
| Escribir en «Título» de la Portada | El título de la vista previa cambia al instante, con la última palabra en naranja |
| Celular | El iframe mide 390 px y la web se dibuja con su diseño de teléfono |
| Banner 2: cambiar el texto del botón | El botón del banner 2 cambia; los demás siguen igual |
| Peticiones de red al escribir | **Ninguna** (61 antes y 61 después) |
| «Página completa» sin tocar nada vs `/` (1440 px) | Mismo texto, carácter por carácter, y misma imagen a la vista |
| `/` de la rama vs `https://dofiagenciacreativa.com/` | Mismo texto, carácter por carácter |
| Tarjetas: copiar de fábrica, editar, deshacer | Funciona; al deshacer vuelve el aviso y el estado «PUBLICADO» |
| Panel a 400 px de ancho | Sin desplazamiento horizontal; columnas apiladas |
| Errores en la consola | Ninguno |

## Hallazgo para las etapas siguientes

La web **reemplaza textos genéricos** por variantes propias (`src/lib/cta.ts`):
- botones: si el texto es «Quiero mejorar mis ventas» (sin importar mayúsculas), cada lugar muestra su variante (en el Inicio: «Quiero redes que vendan», «Quiero vender con publicidad», …);
- cierres de Marketing y Tráfico: si el título sigue siendo el anterior, se muestra el nuevo.

La vista previa lo refleja bien (usa los mismos componentes), pero el formulario debe explicarlo: en los banners del Inicio ya lo dice la nota del campo. **En la etapa 4 hay que hacer lo mismo con los cierres.**

## Pendiente

- Visto bueno del propietario al aspecto y al funcionamiento, en la vista previa de Cloudflare.
- Etapa 2 (base, archivos y usuarios): necesita que el propietario active R2 con su tarjeta y cree las bases y el secreto (`plan.md` tarea 0.1).
- Detalles menores vistos: en «Página completa» la barra de navegación no marca «Inicio» como activo (el lienzo vive en otra dirección); los nombres largos se recortan en la lista de secciones («Banner 3 · CRM y Cha…»).
