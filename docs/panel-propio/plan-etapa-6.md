# Etapa 6 — El cambio (plan fino y lista del día)

Fecha de preparación: 2026-11-26 · Rama: `panel-6-cambio` (sale de `panel-5-colecciones`, igual a `main` 1aa1b3b + las marcas de etapas). Pedido del propietario: «Sí, prepárala» (para elegir el día).

Adaptado a cómo quedó el panel (`cambios-2026-11-25.md`): ya no hay migración a D1 ni copia de seguridad aparte; el contenido ya está en `contenido/` (etapa 2) y la paridad se mide con `npm run contenido:paridad`. `FOTOS_RETIRADAS` ya no existe en el código.

## Qué cambia ese día

| Hoy | Después del cambio |
|---|---|
| La web se arma leyendo Sanity | La web se arma leyendo `contenido/` del repositorio (`CONTENT_SOURCE=archivos` en `.env.production`) |
| `/admin` es «solo para mirar» | «Publicar cambios» publica en `main` (`PANEL_RAMA_DESTINO=main` en `wrangler.jsonc`): Cloudflare arma la web sola en unos 5 minutos |
| Se edita en Sanity | Se edita en el panel (o con Claude Desktop, que cambia los mismos archivos). **Lo que se cambie en Sanity ya no aparece** |
| Los 3 videos de Asesorías salen de Sanity | Siguen saliendo de Sanity hasta que el propietario pulse «Pasar los videos a Cloudflare» en el panel (los copia a `dofi-media` y publica las direcciones nuevas). Sanity los sigue sirviendo hasta la etapa 7 |

El seguro de `scripts/cf-deploy.mjs` deja construir `main` con archivos solo si existe `contenido/LISTO-PARA-PRODUCCION` (lo crea el commit del cambio).

## Lo que está preparado (en la rama)

1. Copia nueva de Sanity a `contenido/` (`npm run contenido:copiar`) y paridad en 0.
2. El commit del cambio: `.env.production` con `CONTENT_SOURCE=archivos`, `contenido/LISTO-PARA-PRODUCCION` y `PANEL_RAMA_DESTINO=main` en las variables de producción de `wrangler.jsonc` (las vistas previas siguen publicando en `panel-pruebas-contenido`).
3. La vista previa de la rama se armó con archivos y se comparó con la web real.

## Lista del día

**El propietario:** elige el día y esa mañana **no edita nada en Sanity**.

**Claude (el día, antes del «sí»):**
- [ ] Traer `main` a la rama si cambió (y volver a probar).
- [ ] `npm run contenido:copiar` otra vez (por si se editó Sanity desde la preparación) y `npm run contenido:paridad` = 0. Si hubo cambios, commit «Contenido: copia final de Sanity».
- [ ] Subir la rama y comparar su vista previa con la web real: mismas páginas, textos, fotos y videos.

**Con el «sí» del propietario:**
- [ ] Pasar la rama a `main` (avance rápido). Esperar la construcción.
- [ ] Revisar en producción: `/`, `/marketing-digital`, `/trafico-ads`, `/chatbots-crm`, `/asesorias`, tres `/clientes/<slug>`, `/sitemap.xml`: iguales a antes. Las fotos ya salen de `/media/…`; de `cdn.sanity.io` solo quedan los 3 videos.
- [ ] `/api/admin/yo` dice `rama: "main"`.

**El propietario, en `dofiagenciacreativa.com/admin`:**
- [ ] «Pasar los videos a Cloudflare» (una vez; tarda un par de minutos).
- [ ] Un cambio pequeño de prueba, «Publicar cambios», y ver «✓ Ya está en la web».

## Cómo volver atrás

Revertir el commit del cambio y pasarlo a `main`: la web vuelve a leer Sanity (que sigue intacto). Lo que se haya publicado desde el panel después del cambio no está en Sanity: habría que volver a escribirlo ahí.

## Después (etapa 7, unos 30 días más tarde)

Quitar el código de Sanity, `studio/`, `/api/revalidate` y el webhook de Sanity, y dar de baja Sanity y el «studio» de Vercel. Hasta entonces Sanity sigue como respaldo (si alguien publica ahí, Cloudflare vuelve a armar la web, pero con el contenido del repositorio: no se ve el cambio).
