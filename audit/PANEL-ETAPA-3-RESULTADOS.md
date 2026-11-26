# Panel propio — Etapa 3: entrar y publicar — resultados

Fecha: 2026-11-26 · Rama: `panel-3-publicar` (sobre `panel-2-contenido-github`) · Rama destino de pruebas: `panel-pruebas-contenido` · Estado: **probada en local; falta la prueba en la vista previa con los secretos del propietario**.

Plan: `docs/panel-propio/plan-etapa-3.md`.

## Qué se hizo

- **Entrar**: una contraseña (secreto `PANEL_CLAVE`, 16+ caracteres). Sesión en cookie `dofi_panel` firmada con HMAC-SHA256 (clave derivada de la contraseña), 14 días, `HttpOnly; Secure; SameSite=Strict`. Sin base de datos: cambiar la contraseña cierra todas las sesiones. Un segundo de espera por intento fallido. Escrituras solo desde el mismo origen.
- **Editar**: lo cambiado se guarda en el navegador (`localStorage`) hasta publicar; al volver, el panel lo recupera y ofrece descartarlo. Ya no hay «Guardar» por sección.
- **Publicar cambios (n)**: confirmación con la lista → `POST /api/admin/publicar` → commit en la rama destino con la API de GitHub (secreto `GITHUB_TOKEN_PANEL`), mensaje «Contenido: Inicio · Portada (publicado desde el panel)». Antes comprueba que nadie haya cambiado los mismos archivos desde que se armó la página (commit base); si sí, 409 y no escribe nada. Luego «Publicando…» y «✓ Ya está en la web» mirando `/contenido-version.json` (o la vista previa de la rama de pruebas).
- **Cambiar foto** (Inicio): el navegador genera el WebP y las variantes, los sube como blobs (el Worker los reenvía sin leerlos) y el documento apunta a la foto nueva; la foto y su registro en `contenido/archivos.json` salen en el mismo commit.
- **Videos en R2**: enlace `MEDIA` (`dofi-media` / `dofi-media-pruebas`), `/videos/<sha1>.<ext>` con pedidos por rango, y un botón de una sola vez en el panel que pasa a R2 los 3 videos de Asesorías que todavía salen de Sanity y publica sus direcciones nuevas.
- **Dónde publica**: variable `PANEL_RAMA_DESTINO`. En las vistas previas, `panel-pruebas-contenido`. En producción **no se define todavía**: sin ella el panel no publica (la web real lee de Sanity hasta la etapa 6).

## Qué se comprobó (local, `next build` + `next start`, publicando en `panel-pruebas-contenido`)

| Prueba | Resultado |
|---|---|
| `/admin` y `/contenido-version.json` estáticos; rutas del panel dinámicas | ✓ |
| Sin sesión `/api/admin/yo` dice `sesion: false` | ✓ |
| Contraseña equivocada | 401 tras 1,05 s ✓ |
| Petición sin cabecera `Origin` | 403 ✓ |
| Contraseña correcta | cookie `dofi_panel` ✓ |
| Publicar sin cookie | 401 ✓ |
| Blob reenviado a GitHub | sha devuelto ✓ |
| Publicar el título de la Portada | commit `8222354` en `panel-pruebas-contenido`: **una sola línea cambiada** en `contenido/paginaInicio.json` ✓ |
| Publicar desde una página construida con un commit viejo, el mismo archivo | 409 «Esta sección cambió…» ✓ |
| Publicar un documento no permitido | 400 ✓ |
| Conteo de videos pendientes | 3 ✓ |
| `npm run probar` | 20 pruebas en verde |

## Pendiente

- El propietario guarda `PANEL_CLAVE` y `GITHUB_TOKEN_PANEL` en *Production* y *Previews Base* (los de *Previews Base* solo llegan a las vistas previas creadas después: por eso `panel-3-publicar` se sube cuando ya estén).
- En la vista previa: entrar con su contraseña, publicar un cambio, cambiar una foto y pasar los videos.
- Etapa 4: los videos en el formulario de Asesorías («Cambiar video», con subida por partes) y las cuatro páginas de servicio.
- Etapa 6: definir `PANEL_RAMA_DESTINO=main` en producción, `CONTENT_SOURCE=archivos`, pasar los videos en producción con el mismo botón.
