# Panel propio — Etapa 5: clientes, reseñas e historial — resultados

Fecha: 2026-11-26 · Rama: `panel-5-colecciones` (sale de `panel-4-paginas-servicio`) · Plan: `docs/panel-propio/plan-etapa-5.md`.

## Qué se hizo

- **Pestañas de las 4 colecciones**, en el orden del menú del Studio: Clientes (26), Contenidos (0), Servicios (6) y Reseñas (16). Buscador, «+ Nuevo», Duplicar, Borrar / Recuperar.
- **No se borra lo que se usa**: el panel dice quién lo usa (p. ej. el servicio «CRM» lo usan 26 clientes) y no lo borra. Un documento borrado sale al publicar; antes, «Deshacer cambios» o «Recuperar» lo devuelve.
- **Únicos**: dirección del cliente (`slug`) y nombre del servicio. Si se repiten, aviso arriba y «Publicar cambios» apagado; el servidor lo vuelve a revisar.
- **Formularios** (`src/panel/esquema/colecciones.ts`, escritos por un subagente y revisados) con los mismos campos que en Sanity y ayudas que dicen qué usa la web (p. ej. la web solo muestra clientes con «Activa» encendido; el servicio viejo «Publicidad» no tiene «Nombre» y la web no lo muestra; los contenidos hoy no están en ninguna página). Campos nuevos del motor: dirección (`slug`, con «Crear desde el nombre»), `referencia`, `referencias` (casillas) y `fecha`.
- **Vista previa**: un cliente se ve en su página `/clientes/<slug>` con las mismas piezas (el cuerpo de la página pasó a `src/components/clientes/FichaCliente.tsx`; la web queda igual); las reseñas, en la sección de reseñas de Marketing Digital; servicios y contenidos dicen dónde se ven.
- **Publicar una colección**: el servidor lee el archivo de la rama (`contenido/cuentas.json`…) y cambia solo esos documentos (`src/lib/contenido/colecciones.ts`: reemplaza, agrega, quita, ordena por `_id`, marca `_updatedAt`).
- **«Versiones anteriores»** en cada sección y documento (`/api/admin/historial`): los commits que tocaron su archivo, con fecha y mensaje, y «Traer esta versión», que la pone en el formulario como cambio sin publicar.
- No se hizo (decidido en el plan): la página «Actividad» (un solo usuario; git ya guarda quién y cuándo) ni el script de copia de seguridad (el contenido ya está en el repositorio).

## Qué se comprobó

| Prueba | Resultado |
|---|---|
| `npm run probar` | 84 pruebas en verde (nuevas: mezcla de colecciones al publicar, únicos, ids; cada dato de cada cliente, reseña y servicio real tiene su campo; el orden del panel es el de la web) |
| `next build` | sin errores |
| Clientes en local | 26 en la lista; la vista previa dibuja la página de «Dukare»; «Nuevo cliente» + nombre «Panadería La Prueba» + «Crear desde el nombre» → `panaderia-la-prueba` y su página en la vista previa al escribir |
| Dirección repetida (`dukare`) | aviso y «Publicar cambios» apagado; al corregirla se vuelve a encender |
| Borrar el servicio «CRM» | impedido: «lo usa cliente «Baby Dance», … y 22 más» |
| Reseñas | 16; la vista previa muestra la sección «Reseñas en Google» de Marketing Digital |
| Versiones anteriores | la ventana se abre y dice el problema de la llave (en local la llave es de prueba); la consulta a GitHub que usa (`commits?sha=…&path=…`) devuelve las versiones reales |

## Pendiente

- El propietario prueba la vista previa `https://panel-5-colecciones-pagina-dofi.dofiagenciacreativa.workers.dev/admin`: crear un cliente con logo y publicarlo (se ve en `/clientes/<dirección>` del sitio de pruebas) y traer una versión anterior.
- Etapa 6: el cambio (la web deja de leer de Sanity).
