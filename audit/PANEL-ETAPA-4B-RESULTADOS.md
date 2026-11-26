# Panel propio — Etapa 4b: Marketing Digital, Tráfico/Ads y ChatBots/CRM — resultados

Fecha: 2026-11-26 · Rama: `panel-4-paginas-servicio` (sigue a la 4a) · Plan: `docs/panel-propio/plan-etapa-4.md`.

## Qué se hizo

- Los **9 tipos de bloque** que faltaban, en `src/panel/esquema/bloques.ts`, con los mismos nombres de campo que en Sanity (`inventario-esquema.md` §3.2–3.4): Portada de equipo (`teamBanner`, distinta según la página), Bloque editorial (`navigationBanner`), Método en pasos (`methodBanner`), Clientes (`clientsBanner`) y sus variantes con métricas (`metricsClientsBanner`) y con chat (`chatClientsBanner`), Reseñas, Plataformas y Ecosistema.
- **Listas anidadas**: giros → empresas y logos; giro → chat → mensajes; giro → métricas → hitos. En `empresas`, una cuenta enlazada se muestra sin editar («se edita en Clientes»).
- **Las ayudas dicen qué usa de verdad la web** (revisado en el código):
  - Tráfico, ChatBots/CRM y Asesorías usan **sus propios giros y logos** si la lista tiene alguno; los de Marketing Digital solo si está vacía (`src/lib/trafico.ts:272`, `feniax.ts:246`, `asesorias.ts:357`). Hoy Tráfico y ChatBots tienen 6 giros propios (copias): cambiar un logo en Marketing no lo cambia ahí.
  - Las **métricas** de Tráfico hoy no se ven (la sección muestra los logos).
  - El **chat** de cada giro de ChatBots va al **celular de la Portada**, no a la sección Clientes; el tema del chat no se usa (siempre oscuro).
  - El **video TikTok** de la Portada de ChatBots y algunos ajustes de diseño (alineación/oscurecido en Tráfico y ChatBots; «Texto destacado» de Reseñas) se guardan, pero hoy no se ven.
  - El **Cierre** (las 4 páginas) no usa foto de fondo desde el 2026-11-23 (`CierreDofi`): sus campos viejos quedan en un grupo «Del diseño anterior (hoy no se ven)».
- La Portada de Marketing Digital y la de Asesorías suman «Integración con el fondo» (`integracionFoto`, que la web ya usa desde el 2026-11-25).
- Pestañas Marketing Digital, Tráfico/Ads y ChatBots/CRM habilitadas.

## Qué se comprobó

| Prueba | Resultado |
|---|---|
| `npm run probar` | 41 pruebas en verde (nuevas: en las 3 páginas cada dato de cada sección real tiene su campo, también dentro de listas y listas anidadas; ningún nombre repetido; la Portada cambia según la página; todos los tipos se pueden agregar) |
| `next build` | sin errores (`/admin` 47 KB de JS propio) |
| Panel en local: las 3 pestañas | todas las secciones con formulario (ninguna con aviso) y dibujadas en la vista previa con su título real: Marketing 7, Tráfico 9, ChatBots 7 |
| Marketing › Clientes | el giro «Construcción · 18 empresas» abre su lista de empresas; cambiar el nombre del giro se ve en la vista previa |
| Errores en la consola | ninguno nuevo |

## Pendiente

- El propietario prueba la vista previa `https://panel-4-paginas-servicio-pagina-dofi.dofiagenciacreativa.workers.dev/admin` (Asesorías con «Cambiar video» y las otras 3 páginas) y da su visto bueno de la etapa 4.
- Para decidir con el propietario (no se cambió nada): métricas de Tráfico y video TikTok de ChatBots que hoy no se ven; giros copiados en Tráfico y ChatBots (¿que lean siempre los de Marketing?).
