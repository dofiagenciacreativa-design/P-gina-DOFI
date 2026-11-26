# Etapa 5 — Clientes, reseñas e historial (plan fino)

Fecha: 2026-11-26 · Rama: `panel-5-colecciones` (sale de `panel-4-paginas-servicio`, igual a `main` 1ea086d + la marca de etapas). Pedido del propietario: «Sí, etapa 5».

Adaptado a cómo quedó el panel (contenido en GitHub, un solo usuario; `cambios-2026-11-25.md`). De la etapa 5 de `plan.md` **no** se hace: la página «Actividad» (hay un solo usuario y el historial de git ya dice quién y cuándo) ni `scripts/copia-seguridad.mts` (el contenido ya vive en el repositorio: cada publicación es un commit).

## Parte 5a — Las colecciones

Pestañas **Clientes** (`cuenta`, 26), **Contenidos** (`contenido`, hoy 0), **Servicios** (`servicio`, 6) y **Reseñas** (`resena`, 16), en el orden del menú del Studio (`inventario-esquema.md` §2).

- Columna izquierda: buscador, la lista (nombre, una línea de detalle, tachado si está apagado en la web, punto naranja si tiene cambios, «nuevo» / «se borra»), «+ Nuevo …», y para el elegido: Duplicar y Borrar.
- **Borrar lo que se usa está impedido con explicación**: si otro documento lo referencia (un cliente que usa un servicio, un giro que enlaza una cuenta, un contenido de una cuenta), el panel dice quién lo usa y no lo borra.
- **Únicos**: la dirección de un cliente (`slug`) y el nombre de un servicio no se repiten (el panel avisa y no deja publicar; el servidor lo vuelve a comprobar).
- Campos nuevos del motor: `slug` (con «Crear desde el nombre»), `referencia`, `referencias` (casillas) y `fecha`.
- Vista previa: un cliente se ve en su página `/clientes/<slug>` con las mismas piezas de la web (el cuerpo de la página pasa a `src/components/clientes/FichaCliente.tsx`). Las reseñas se ven en la sección «Reseñas» de Marketing Digital (si la web tuviera reseñas de Google configuradas, esas mandan, y el panel lo dice). Servicios y contenidos dicen dónde se usan.
- **Publicar**: un documento de colección se guarda dentro de su archivo (`contenido/cuentas.json`, `resenas.json`, `servicios.json`, `contenidos.json`): el servidor lee el archivo de la rama en ese momento, reemplaza / agrega / quita solo esos documentos (por `_id`, la lista ordenada por `_id` como hoy) y lo escribe en el mismo commit. Borrar = un documento marcado para borrar.

## Parte 5b — «Versiones anteriores»

En cada sección y cada documento: la lista de commits que tocaron su archivo (API de GitHub, `commits?path=`), con fecha y mensaje, y «Traer esta versión»: carga esa versión de la sección / del documento en el formulario como cambio sin publicar, para revisarla en la vista previa y publicarla si sirve.

## Criterios de aceptación

- Crear un cliente con logo y portada, publicarlo y verlo en `/clientes/<slug>` del sitio de pruebas.
- Borrar un servicio en uso está impedido con explicación.
- Traer una versión vieja de una sección del Inicio y publicarla funciona.
- Todo lo del menú del Studio existe en el panel, en el mismo orden.
- `npm run probar` en verde y la web igual (comparación de páginas).
