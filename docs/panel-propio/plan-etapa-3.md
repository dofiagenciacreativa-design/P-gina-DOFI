# Etapa 3 — Entrar y publicar: plan de ejecución

> En línea, rama `panel-3-publicar` (sobre `panel-2-contenido-github`). Manda `cambios-2026-11-25.md` §4.

**Objetivo:** el propietario entra al panel con su contraseña, cambia textos y fotos del Inicio, y al pulsar «Publicar cambios» el panel guarda el cambio en GitHub; Cloudflare vuelve a armar la web sola y el panel avisa cuando ya está. Los videos pasan a R2.

## Lo que pone el propietario (secretos y recursos; nunca pasan por la conversación)

- `PANEL_CLAVE` (secreto del Worker, *Production* y *Previews Base*): su contraseña, 16+ caracteres.
- `GITHUB_TOKEN_PANEL` (ídem): *fine-grained token* solo de `P-gina-DOFI`, *Contents: Read and write*.
- R2: almacenes `dofi-media` y `dofi-media-pruebas`.
- Los secretos de *Previews Base* solo llegan a las vistas previas creadas **después**: la rama se sube cuando ya estén.

## Piezas

| Pieza | Archivo | Qué hace |
|---|---|---|
| Sesión | `src/lib/panel/sesion.ts` | Cookie `dofi_panel` = `<vence>.<firma>`; firma HMAC-SHA256 con una clave derivada de `PANEL_CLAVE`; 14 días; comparación en tiempo constante. Cambiar la contraseña cierra todas las sesiones |
| Configuración | `src/lib/panel/config.ts` | Repositorio (`dofiagenciacreativa-design/P-gina-DOFI`), rama destino (`PANEL_RAMA_DESTINO`: `main` en producción, `panel-pruebas-contenido` en vistas previas), qué falta configurar |
| GitHub | `src/lib/panel/github.ts` | Leer la rama, reenviar blobs sin leerlos, crear árbol + commit + mover la rama, comprobar si un commit ya está construido |
| Serializar | `src/lib/contenido/serializar.ts` | JSON con claves ordenadas y dos espacios, igual que la copia (diferencias limpias) y ruta de cada documento en `contenido/` |
| API | `src/app/api/admin/{entrar,salir,yo,publicar,blob,incluye}/route.ts` | Todas dinámicas, `no-store`, `noindex`; escrituras exigen sesión y mismo origen |
| Versión publicada | `src/app/contenido-version.json/route.ts` | Estático: el commit y la hora de la construcción (`WORKERS_CI_COMMIT_SHA`) |
| Panel | `src/panel/ui/Panel.tsx`, `Entrar.tsx`, `Publicar.tsx` | Pantalla de entrada; cambios guardados en el navegador; «Publicar cambios (n)» con confirmación, «Publicando…» y «✓ Ya está en la web» |
| Fotos | `src/panel/archivos/subir-imagen.ts`, `CampoPanel` | «Cambiar foto»: el navegador genera el WebP y las variantes, los sube como blobs y el documento pasa a apuntar a la foto nueva; `archivos.json` se actualiza en el mismo commit |
| Videos | `wrangler.jsonc` (`MEDIA`), `src/app/videos/[...ruta]/route.ts`, subida por partes | Cuando existan los almacenes. Los 3 videos de Asesorías se copian a R2 y `archivos.json` apunta a `/videos/…` |

## Publicar (servidor, 6 llamadas a GitHub como máximo)

1. `GET refs/heads/<rama>` → commit actual.
2. Si el panel trae un commit base distinto del actual: `GET compare/<base>...<actual>`; si algún archivo que se publica cambió ahí → 409 «Esta sección cambió mientras la editabas».
3. `GET commits/<actual>` → árbol.
4. `POST git/trees` con el texto de los JSON en línea y los blobs ya subidos.
5. `POST git/commits` «Contenido: <lista> (publicado desde el panel)».
6. `PATCH refs/heads/<rama>`; si GitHub lo rechaza por carrera → 409 «Intenta de nuevo».

Solo se aceptan rutas dentro de `contenido/`, `public/media/` y `media-originales/`.

## Criterios de aceptación (vista previa)

- Sin contraseña no se ve el formulario; con la correcta, sí; con una incorrecta, «Contraseña incorrecta» tras un segundo.
- Cambiar el título de la portada, recargar la página: el cambio sigue ahí (guardado en el navegador).
- «Publicar cambios» crea un commit en `panel-pruebas-contenido`, su vista previa se construye sola y el panel muestra «✓ Ya está en la web» cuando corresponde.
- Cambiar una foto del Inicio y publicarla: se ve en la vista previa de `panel-pruebas-contenido`.
- `npm run probar` y `tsc` en verde; las páginas públicas siguen «○».
