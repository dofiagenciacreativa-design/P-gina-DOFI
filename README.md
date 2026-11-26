# DOFI Agencia Creativa

Sitio de una sola pagina para DOFI (creatividad y produccion), FENIAX (CRM y
automatizacion) y Daniel Vallejo, El Socio.

Next.js 15 (App Router) + Tailwind v4 + Motion. Tema oscuro unico, acento
naranja unico, sin dependencias de imagen externas.

## Correr en local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build completo: Next.js + empaquetado para Cloudflare Workers
npm run build:next # solo build de Next.js, sin el paso de Cloudflare (para probar rapido)
```

## Despliegue en Cloudflare Workers

El despliegue es via OpenNext. La configuracion vive en `wrangler.jsonc` y
`open-next.config.ts`.

**Importante, configuracion requerida en el dashboard de Cloudflare**
(pagina-dofi → Settings → Build):

- **Deploy command:** `npm run cf:deploy`

Cloudflare corre el "Build command" y el "Deploy command" como dos fases que
NO comparten el `.open-next` que genera el build (se probo: build termina
bien, pero el deploy no encuentra lo que genero). Ademas, wrangler tiene su
propia logica que detecta un proyecto OpenNext y se salta cualquier paso de
build personalizado en `wrangler.jsonc`, delegando directo a
`opennextjs-cloudflare deploy` — un comando que NO construye nada, solo
despliega lo que ya existe.

La unica combinacion que funciona es que el **Deploy command mismo** incluya
el build: `npm run cf:deploy` corre `opennextjs-cloudflare build` seguido de
`opennextjs-cloudflare deploy` en un solo proceso, asi que siempre tiene el
`.open-next` fresco disponible. El "Build command" del dashboard puede
quedar en blanco o en `npm run build`; no es lo que soluciona el error.

Ver tambien `npm run cf:preview` para probar el Worker localmente antes de
subir.

**Vistas previas de ramas (desde el 2026-11-23).** En la cuenta de Cloudflare
de DOFI el "Build command" es `npm run cf:deploy` para todas las ramas, y el
"Deploy command" de las ramas que no son `main` es `npx wrangler preview`.
Para que eso funcione:

- `npm run cf:deploy` (`scripts/cf-deploy.mjs`) construye siempre, pero solo
  publica en `main` (o a mano). En otra rama Cloudflare rechaza publicar el
  Worker de produccion y la construccion fallaba entera.
- `wrangler.jsonc` repite dentro de `"previews"` el enlace
  `WORKER_SELF_REFERENCE`, el almacén de videos de pruebas y
  `PANEL_RAMA_DESTINO`: no se heredan de producción.

La vista previa de una rama queda en
`https://<rama>-pagina-dofi.dofiagenciacreativa.workers.dev`.

**Next.js 15 fuera de soporte (desde el 2026-10-21).** OpenNext corta el build
cuando la version mayor de Next.js paso sus 2 años de soporte oficial. Por
decision del propietario (2026-10-23) los scripts `build`, `cf:build`,
`cf:preview` y `cf:deploy` llevan `--dangerouslyUseUnsupportedNextVersion`
para seguir publicando con Next.js 15 mientras se planea la actualizacion a
Next.js 16. Next.js 15 ya no recibe parches de seguridad: al actualizar,
quitar esa opcion.

## Que vas a querer cambiar primero

### 1. El logo

Ya esta puesto el logo real. Vive en dos piezas dentro de `public/`:

| Archivo | Donde se usa | Por que |
| --- | --- | --- |
| `logo-dofi-compact.png` | Nav | Delfin + DOFi, sin el claim. En la nav el logo mide ~44px y "AGENCIA CREATIVA" seria ilegible |
| `logo-dofi.png` | Pie | Lockup completo, con el claim |

**Para cambiarlo por otro archivo** (o por el vector, cuando lo tengas):

```bash
node scripts/prepare-logo.mjs "C:/ruta/al/logo-nuevo.png"
```

El script calcula la caja real del contenido leyendo el canal alfa, detecta
solo la banda del claim para la version compacta y regenera ambas piezas.
Avisa por consola si la resolucion de origen es baja.

Para ver como queda un logo blanco sobre el fondo oscuro del sitio (no se puede
juzgar sobre fondo claro):

```bash
node scripts/preview-logo.mjs logo-dofi-compact.png
```

**Nota de calidad:** el PNG actual tiene solo 186x190 px de contenido real, asi
que se ve algo suave en pantallas grandes. Cuando consigas el vector
(SVG/AI/EPS) pasalo por el mismo script y gana nitidez.

### 2. Las imagenes

Todo lo visual vive en `public/media/` y hoy son degradados provisionales
generados con `node scripts/generate-placeholders.mjs`.

Reemplaza cada archivo **conservando el nombre y la relacion de aspecto** y no
hay que tocar codigo:

| Archivo | Proporcion | Donde sale |
| --- | --- | --- |
| `hero-oceano.jpg` | 4:5 vertical | Hero |
| `servicio-audiovisual.jpg` | 3:2 horizontal | Bento, celda grande |
| `servicio-crm.jpg` | ~8:7 | Bento, celda de CRM |
| `equipo-dofi.jpg` | 4:5 | Seccion Equipo |
| `equipo-feniax.jpg` | 4:5 | Seccion Equipo |
| `equipo-socio.jpg` | 4:5 | Seccion Equipo, Daniel Vallejo |
| `cover-16-9.jpg` | 16:9 | Portadas de video horizontal |
| `cover-9-16.jpg` | 9:16 | Portadas de video vertical |

### 3. El contenido: textos, fotos, videos, clientes y reseñas

**Se edita en el panel propio, `/admin`** (una contraseña; docs/panel-propio/).
Desde el 2026-11-26 la web ya no usa Sanity.

- **Dónde vive:** `contenido/*.json` (un archivo por página y uno por
  colección: cuentas, reseñas, servicios, contenidos), fotos en
  `public/media/` (WebP con variantes por ancho; los originales en
  `media-originales/`, que no se publica) y videos en Cloudflare R2
  (`/videos/<sha1>.<ext>`; almacén `dofi-media`, y `dofi-media-pruebas` para
  las vistas previas). `contenido/archivos.json` registra fotos y videos.
- **Cómo lo lee la web:** al construir, con consultas GROQ (`groq-js`) sobre
  esos archivos (`src/lib/consultas.ts` y el `armarPagina…` de cada página).
  Las páginas quedan armadas; no se consulta nada en cada visita.
- **Publicar:** «Publicar cambios» hace un commit a `main` con solo lo
  cambiado y Cloudflare vuelve a construir la web (unos 5 minutos). En una
  vista previa de rama el panel publica en `panel-pruebas-contenido`.
- **Historial:** «Versiones anteriores» en cada sección (el historial de git).
- **Cambios con Claude:** editar `contenido/*.json` en una rama → vista
  previa → visto bueno → `main`. Antes de pasar a `main`, traer `main`
  (el panel también publica ahí).
- **Respaldo:** si falta una cuenta, la web usa `src/data/clients.ts`.

### 3b. Los videos de los banners del Home

La mitad animada de cada banner del Home (redes, pauta, CRM, asesorías) se
reproduce como **video** (WebM con transparencia, en `public/home/escenas/`),
grabado de la escena Remotion de `src/remotion/home/`. Dibujada en vivo iba a
saltos en computadoras con gráfica integrada (ver
`audit/AJUSTES-2026-11-23-RESULTADOS.md`).

**Si cambias el texto de un banner en el panel**, ese banner vuelve solo a la
animación en vivo (nunca muestra un texto viejo). Para devolverle el video:

```bash
npm run dev               # en una terminal
npm run grabar:escenas    # en otra (necesita Chrome y ffmpeg)
```

y publica `public/home/escenas/` y `src/remotion/home/videos.json`. Más
opciones en el encabezado de `scripts/grabar-escenas.mjs`.

### 4. Contacto

Todos los datos corporativos viven en **`src/config/company.ts`** (fuente unica
de verdad: nombre, telefono, WhatsApp, correo, ciudad, horario, redes). Ningun
componente los escribe a mano. Para cambiar cualquiera sin tocar codigo, define
la variable de entorno correspondiente (ver `.env.example`).

- **WhatsApp**: el numero sale de `company.whatsapp.number` y la URL se arma con
  `createWhatsAppUrl()` en `src/lib/whatsapp.ts`. No escribas `wa.me/...` a mano
  en ningun componente.
- **Formulario**: postea a `src/app/api/contacto/route.ts`, que entrega el lead
  al webhook de `CONTACT_WEBHOOK_URL` (ver `src/lib/contact/delivery.ts`).
  **Si esa variable no esta definida, la API responde 503 y el formulario avisa
  al usuario y le ofrece WhatsApp.** Nunca confirma un envio que no ocurrio.
  El webhook puede ser n8n, Make o una funcion que cree el lead en Kommo.
- **Redes del pie**: cada icono se muestra solo si su
  `NEXT_PUBLIC_<RED>_URL` tiene la URL del perfil real. Sin ella, el icono no
  se pinta.
- **Atribucion**: los parametros `utm_*`, `gclid`, `fbclid` y `ttclid` se leen
  de la URL y viajan con el lead. No hay campos visibles nuevos.

## Desplegar en Vercel

```bash
npx vercel        # primera vez, vincula el proyecto
npx vercel --prod
```

Cuando conectes el formulario a un servicio real, agrega esas variables igual
y leelas desde el route handler.

## Accesibilidad y rendimiento

- Todo el texto pasa contraste WCAG AA sobre su fondo.
- Cada animacion respeta `prefers-reduced-motion`.
- El canvas del hero pausa su bucle cuando sale de pantalla o la pestana se
  oculta.
