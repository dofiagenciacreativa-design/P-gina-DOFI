# Inventario exacto del esquema de contenido (Sanity Studio -> panel propio)

Fecha del inventario: 2026-11-23 · Rama: `panel-propio-sin-sanity`.

Fuentes leidas (todas, completas, solo lectura):

- `studio/schemaTypes/index.ts` y los 10 archivos de documento de `studio/schemaTypes/*.ts`
- `studio/schemaTypes/objects/*.ts` (13 archivos)
- `studio/schemaTypes/marketing/*.ts` (17 archivos)
- `studio/deskStructure.ts`, `studio/sanity.config.ts`
- `studio/components/SelectorGiro.tsx` (unico archivo de `studio/components/`)
- Solo como contexto para la seccion 5 (una busqueda de texto, no lectura completa): consultas GROQ de `src/lib/*.ts`.

Convenciones de este documento:

- Los nombres tecnicos van en `codigo` y respetan mayusculas/minusculas tal cual estan en el esquema.
- «—» significa «no definido en el esquema» (sin validacion, sin opciones, sin valor inicial, etc.).
- «Oblig.» = `Rule.required()`. Si un campo no dice «Oblig.», es opcional.
- En las listas de opciones el formato es `value` = «titulo visible».
- Las descripciones de ayuda estan resumidas, salvo cuando van entre «comillas» (literal).
- Todo elemento de un array de objetos lleva en Sanity un `_key` (string unico) y un `_type`; todo documento lleva `_id`, `_type`, `_createdAt`, `_updatedAt`, `_rev`. No estan en el esquema pero existen en los datos (ver seccion 5).

Conteo total de tipos registrados en `index.ts` (36): **11 documentos**, **11 objetos reutilizables**, **14 bloques de marketing**. Ademas hay 10 objetos «en linea» (definidos dentro de un campo, no registrados globalmente) y 5 archivos de helpers que generan campos.

---

## 1. Resumen: tipos de DOCUMENTO

| `_type` | Titulo en el Studio | Unico o coleccion | Id fijo (deskStructure) | N.º de campos de primer nivel | Donde se usa en la web (segun el esquema) |
|---|---|---|---|---|---|
| `hero` | Hero | Unico (singleton) | `hero` | 2 | Home: la fotografia principal del Hero (solo imagen + alt). |
| `paginaInicio` | Página de inicio | Unico (singleton) | `paginaInicio` | 3 (`titulo`, `hero` con 7 subcampos, `capacidades[]`) | Home: textos y botones del Hero + banda de tarjetas «Capacidades» debajo del Hero. |
| `banners` | Banners | Unico (singleton) | `banners` | 2 | Home: los banners full-width debajo de las tarjetas del Hero. |
| `marketingDigitalPage` | Marketing Digital | Unico (singleton) | `marketingDigitalPage` | 2 (`titulo`, `sections[]`) | Pagina `/marketing-digital`. |
| `traficoAdsPage` | Tráfico / Ads | Unico (singleton) | `traficoAdsPage` | 2 (`titulo`, `sections[]`) | Pagina `/trafico-ads`. |
| `chatbotsCrmPage` | ChatBots / CRM | Unico (singleton) | `chatbotsCrmPage` | 2 (`titulo`, `sections[]`) | Pagina `/chatbots-crm` (FENIAX). |
| `asesoriasPage` | Asesorías | Unico (singleton) | `asesoriasPage` | 2 (`titulo`, `sections[]`) | Pagina `/asesorias` (Asesorias 1 a 1 · Rescatando Emprendedores). |
| `resena` | Reseña | Coleccion | — | 9 | Seccion «Reseñas de Google» (`reviewsBanner`) de las paginas de servicio, cuando la API de Google no devuelve reseñas. |
| `cuenta` | Cuenta | Coleccion | — | 16 | Carrusel de clientes, muro de logos, pagina individual `/clientes/<slug>`, sitemap; ademas se referencia desde los giros de «Clientes». |
| `contenido` | Contenido | Coleccion | — | 15 | Pagina `/clientes/<slug>`: arma `videos[]` y `gallery[]` de la cuenta referenciada. |
| `servicio` | Servicio | Coleccion | — | 1 | Taxonomia: las cuentas referencian estos documentos (`cuenta.servicios[]`). |

Tipos NO documento registrados (detalle en la seccion 3):

- Objetos reutilizables (11): `resultado`, `testimonio`, `redesSociales`, `capacidad`, `seccionContenido`, `posicionCta`, `ajusteLogos`, `videoCelular`, `ctaSimple`, `chatDemo`, `metricasDemo`.
- Bloques de marketing (14): `teamBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `clientsBanner`, `chatClientsBanner`, `platformsBanner`, `ecosystemBanner`, `metricsClientsBanner`, `splitHeroBanner`, `achievementsBanner`, `celularesBanner`, `reviewsBanner`, `ctaBanner`.
- Objetos en linea (10, no registrados, solo existen dentro de su padre): `paginaInicio.hero` (anonimo), `chatDemo.mensajes[]` -> `mensajeChat`, `chatDemo.aviso` (anonimo), `metricasDemo.hitos[]` -> `hito`, `redesSociales.otros[]` -> `enlace`, giro -> `categoriaIcono`, empresa de un giro -> `empresaGiro`, `achievementsBanner.logros[]` -> `logro`, `methodBanner.pasos[]` -> `pasoMetodo`, `platformsBanner.plataformas[]` -> `plataforma`.
- Helpers (no son tipos; generan campos): `campoImagen`, `campoLogoCircular`, `camposBase` (+ `campoAlineacion`, `campoOverlay`), `camposVideoTikTok`, `miembroGiro` (+ constante `OPCIONES_ICONO`).

---

## 2. Arbol de menu del Studio (`deskStructure.ts`)

Titulo de la lista raiz: **«DOFI CMS»**. Orden exacto:

```
DOFI CMS
├─ 1. Hero                -> formulario directo del documento unico  _type=hero                  _id="hero"
├─ 2. Página de inicio    -> formulario directo del documento unico  _type=paginaInicio          _id="paginaInicio"
├─ 3. Banners             -> formulario directo del documento unico  _type=banners               _id="banners"
├─ 4. Marketing Digital   -> formulario directo del documento unico  _type=marketingDigitalPage  _id="marketingDigitalPage"
├─ 5. Tráfico / Ads       -> formulario directo del documento unico  _type=traficoAdsPage        _id="traficoAdsPage"
├─ 6. ChatBots / CRM      -> formulario directo del documento unico  _type=chatbotsCrmPage       _id="chatbotsCrmPage"
├─ 7. Asesorías           -> formulario directo del documento unico  _type=asesoriasPage         _id="asesoriasPage"
├─ 8. Reseñas             -> LISTA de documentos _type=resena   (titulo de la lista: «Reseñas»)
├─ ───────── divisor ─────────
├─ 9. Cuentas             -> LISTA de documentos _type=cuenta    (titulo: «Cuentas»)
├─ 10. Contenidos         -> LISTA de documentos _type=contenido (titulo: «Contenidos»)
├─ 11. Servicios          -> LISTA de documentos _type=servicio  (titulo: «Servicios»)
├─ ───────── divisor ─────────
└─ (resto) cualquier tipo de documento que NO este en la lista de exclusion
```

Notas:

- Los 7 primeros se abren directo en su formulario (sin lista ni boton «Crear nuevo»): `S.document().schemaType(X).documentId(ID)`. El titulo del panel del documento es el mismo de la entrada de menu.
- «Hero» va primero a proposito: es lo que mas se toca.
- Las 4 listas usan `S.documentTypeList(tipo)` (lista estandar con «Crear nuevo»). Solo `resena` define un orden propio en el esquema: `orderings: [{ title: "Orden", name: "orden", by: [{ field: "orden", direction: "asc" }] }]`.
- La ultima entrada es `...S.documentTypeListItems().filter(...)` excluyendo `cuenta`, `contenido`, `servicio`, `paginaInicio`, `hero`, `banners`, `marketingDigitalPage`, `traficoAdsPage`, `chatbotsCrmPage`, `asesoriasPage`, `resena`. Como esos son los 11 tipos de documento que existen, **hoy esa zona esta vacia** (queda el divisor suelto). Solo sirve para que un tipo de documento futuro aparezca sin tocar el archivo.
- `sanity.config.ts`: Studio titulado «DOFI CMS», plugins `structureTool({ structure: deskStructure })` y `visionTool()` (consola GROQ; no es contenido).

---

## 3. Tipos, campo por campo

Columnas de las tablas: **nombre tecnico** | **titulo visible** | **tipo** | **obligatorio / validaciones** | **opciones** | **valor inicial** | **oculto / solo lectura** | **ayuda** | **fieldset / grupo**.

### 3.1 Documentos

#### 3.1.1 `hero` — «Hero» (documento unico, `_id` fijo `hero`)

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `heroImage` | Imagen principal | image | Oblig. | `hotspot: true` | — | — | Fotografia grande de todo el Hero, detras del texto y los overlays morados. Elegir el punto focal sobre el sujeto: la web recorta distinto segun pantalla y respeta ese punto. | — |
| `heroImageAlt` | Texto alternativo | string | Oblig. | — | — | — | «Texto alternativo descriptivo de la imagen del Hero.» | — |

Preview: `select: { media: "heroImage" }` -> `prepare: ({ media }) => ({ title: "Hero", subtitle: "Imagen principal del sitio", media })`.

Nota: el alt es un campo HERMANO (`heroImageAlt`), no `heroImage.alt`.

#### 3.1.2 `paginaInicio` — «Página de inicio» (documento unico, `_id` fijo `paginaInicio`)

Grupos (pestañas): `hero` = «Hero» (por defecto), `capacidades` = «Capacidades».

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `titulo` | Título interno | string | — | — | `"Página de inicio"` | — (editable, NO es solo lectura) | Solo para identificar el documento. No se muestra en la web. | sin grupo (solo se ve en «todos los campos») |
| `hero` | Hero | objeto en linea (anonimo) | — | — | — | — | — | grupo `hero` |
| `hero.titulo` | Título (H1) | string | Oblig. | — | — | — | Ej. «Un Mar de Ideas». | (dentro de `hero`) |
| `hero.marca` | Marca | string | — | — | — | — | Ej. «DOFI Agencia Creativa». | (dentro de `hero`) |
| `hero.mensaje` | Propuesta comercial | string | — | — | — | — | Ej. «Convertimos atención en Ventas Inteligentes». | (dentro de `hero`) |
| `hero.ctaPrincipalTexto` | Texto del botón principal | string | — | — | — | — | Ej. «Quiero Mejorar mis Ventas». | (dentro de `hero`) |
| `hero.ctaPrincipalEnlace` | Enlace del botón principal | string | — (sin validacion de formato) | — | — | — | Ruta interna (ej. «/contactanos») o URL completa. | (dentro de `hero`) |
| `hero.ctaSecundarioTexto` | Texto del botón secundario | string | — | — | — | — | Ej. «Mira Nuestro Trabajo». | (dentro de `hero`) |
| `hero.ctaSecundarioEnlace` | Enlace del botón secundario | string | — | — | — | — | — | (dentro de `hero`) |
| `capacidades` | Capacidades | array de `capacidad` | — (sin min/max) | `of: [{ type: "capacidad" }]` | — | — | Banda de tarjetas debajo del Hero (hoy 5, con Academia). Arrastrar para reordenar. Con la lista vacia, la web muestra las 5 de fabrica. | grupo `capacidades` |

Preview: `select: { title: "titulo" }` -> `prepare: ({ title }) => ({ title: title || "Página de inicio" })`.

#### 3.1.3 `banners` — «Banners» (documento unico, `_id` fijo `banners`)

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `titulo` | Título interno | string | — | — | `"Banners"` | `readOnly: true` (siempre; visible) | Solo para identificar el documento en el menu. No se muestra en la web. | — |
| `seccionesContenido` | Banners de la home | array de `seccionContenido` | — (sin min/max, aunque la ayuda habla de «los 4 banners») | `of: [{ type: "seccionContenido" }]` | — | — | Los 4 banners full-width debajo de las tarjetas del Hero, en este orden (el primero es el Banner 01). Arrastrar para reordenar. El boton de cada uno se configura adentro. | — |

Preview: `select: { title: "titulo" }` -> `prepare: ({ title }) => ({ title: title || "Banners" })`.

#### 3.1.4 `marketingDigitalPage` — «Marketing Digital» (documento unico, `_id` fijo `marketingDigitalPage`)

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `titulo` | Título interno | string | — | — | `"Marketing Digital"` | `readOnly: true` y `hidden: true` (siempre) | — | — |
| `sections` | Secciones | array (7 tipos, ver seccion 4) | — (sin min/max) | `of`: `teamBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `clientsBanner`, `reviewsBanner`, `ctaBanner` | — | — | Las secciones de la pagina en este mismo orden: arrastrar para reordenar. «Agregar elemento» elige el tipo. Para ocultar una sin borrarla, apagar «Mostrar en la página» dentro de ella. | — |

Preview: `prepare: () => ({ title: "Marketing Digital" })` (sin `select`).

#### 3.1.5 `traficoAdsPage` — «Tráfico / Ads» (documento unico, `_id` fijo `traficoAdsPage`)

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `titulo` | Título interno | string | — | — | `"Tráfico / Ads"` | `readOnly: true` y `hidden: true` (siempre) | — | — |
| `sections` | Secciones | array (9 tipos, ver seccion 4) | — | `of`: `teamBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `platformsBanner`, `ecosystemBanner`, `metricsClientsBanner`, `reviewsBanner`, `ctaBanner` | — | — | (misma ayuda que en Marketing Digital) | — |

Preview: `prepare: () => ({ title: "Tráfico / Ads" })`.

#### 3.1.6 `chatbotsCrmPage` — «ChatBots / CRM» (documento unico, `_id` fijo `chatbotsCrmPage`)

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `titulo` | Título interno | string | — | — | `"ChatBots / CRM"` | `readOnly: true` y `hidden: true` (siempre) | — | — |
| `sections` | Secciones | array (7 tipos, ver seccion 4) | — | `of`: `teamBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `chatClientsBanner`, `reviewsBanner`, `ctaBanner` | — | — | (misma ayuda que en Marketing Digital) | — |

Preview: `prepare: () => ({ title: "ChatBots / CRM" })`.

#### 3.1.7 `asesoriasPage` — «Asesorías» (documento unico, `_id` fijo `asesoriasPage`)

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `titulo` | Título interno | string | — | — | `"Asesorías"` | `readOnly: true` y `hidden: true` (siempre) | — | — |
| `sections` | Secciones | array (9 tipos, ver seccion 4) | — | `of`: `splitHeroBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `clientsBanner`, `achievementsBanner`, `celularesBanner`, `reviewsBanner`, `ctaBanner` | — | — | (misma ayuda que en Marketing Digital) | — |

Preview: `prepare: () => ({ title: "Asesorías" })`.

#### 3.1.8 `resena` — «Reseña» (coleccion)

Orden de lista definido: `orderings: [{ title: "Orden", name: "orden", by: [{ field: "orden", direction: "asc" }] }]`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `nombre` | Nombre | string | Oblig. | — | — | — | Tal como aparece en Google. | — |
| `estrellas` | Estrellas | number | Oblig., entero, min 1, max 5 | lista (layout `radio`), valores NUMERICOS: `5` = «★★★★★  5», `4` = «★★★★☆  4», `3` = «★★★☆☆  3», `2` = «★★☆☆☆  2», `1` = «★☆☆☆☆  1» | `5` | — | — | — |
| `comentario` | Comentario | text (rows 5) | Oblig. | — | — | — | Copiado textual de Google, sin corregir ni recortar. | — |
| `empresa` | Empresa (opcional) | string | — | — | — | — | Solo si la persona la menciona o es cliente conocido. | — |
| `foto` | Foto (opcional) | image | — | `hotspot: true` | — | — | Foto de perfil de Google. Sin ella se muestran las iniciales. | — |
| `enlaceOriginal` | Enlace a la reseña en Google (opcional) | url | — (solo la validacion por defecto del tipo `url`) | — | — | — | Permite verificar que la reseña es real. | — |
| `fecha` | Fecha (opcional) | string (texto libre, NO es fecha) | — | — | — | — | Tal como la muestra Google. Ej.: «hace 2 semanas», «agosto 2026». | — |
| `activa` | Mostrar en la web | boolean | — | — | `true` | — | — | — |
| `orden` | Orden | number | — | — | — | — | Las de numero mas bajo aparecen primero. | — |

Preview: `select: { title: "nombre", estrellas: "estrellas", empresa: "empresa", media: "foto", activa: "activa" }` -> `prepare`: `title: title || "Reseña sin nombre"`, `subtitle: "★".repeat(estrellas ?? 0) + (empresa ? " · " + empresa : "") + (activa === false ? " · Oculta" : "")`, `media`.

#### 3.1.9 `cuenta` — «Cuenta» (coleccion)

Grupos (pestañas): `principal` = «Informacion principal» (por defecto), `detalle` = «Pagina individual», `redes` = «Redes y enlaces».

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `nombre` | Nombre | string | Oblig. | — | — | — | — | grupo `principal` |
| `slug` | Slug | slug | Oblig. | `source: "nombre"`, `maxLength: 96` | — | — | Se usa en la URL: `/clientes/<slug>`. | grupo `principal` |
| `activa` | Activa | boolean | — | — | `true` | — | Desactivarla en vez de borrarla: deja de aparecer en carrusel, muro de logos, pagina individual y sitemap, pero se conserva con sus contenidos. | grupo `principal` |
| `orden` | Orden de aparicion | number | — | — | — | — | Numero mas bajo aparece primero. | grupo `principal` |
| `logo` | Logo | image | — | `hotspot: true` | — | — | Opcional. Sin logo, la web muestra un monograma con las iniciales. | grupo `principal` |
| `logoCircular` | Logo circular | image | — | — (sin hotspot) | — | — | Helper `campoLogoCircular({ group: "principal" })`, ver 3.2.2. | grupo `principal` |
| `portada` | Imagen principal | image | — | `hotspot: true` | — | — | Opcional. Sin ella, la pagina de la cuenta usa una portada generica. | grupo `principal` |
| `categoria` | Categoria | string (libre) | — | — | — | — | Rubro. Ej. «Restaurante», «Movilidad», «Alimentos». | grupo `principal` |
| `ciudad` | Ciudad | string | — | — | — | — | — | grupo `principal` |
| `resumen` | Resumen | text (rows 2) | Oblig., max 220 caracteres | — | — | — | Frase corta de que se hizo. Se ve en la tarjeta y el carrusel. Maximo ~18 palabras. | grupo `principal` |
| `servicios` | Servicios | array de reference a `servicio` | — | `of: [{ type: "reference", to: [{ type: "servicio" }] }]` | — | — | — | grupo `principal` |
| `reto` | El reto | text (rows 4) | — | — | — | — | Reto del negocio antes de entrar. 1-2 parrafos. Opcional. | grupo `detalle` |
| `enfoque` | Lo que hicimos | text (rows 4) | — | — | — | — | Que se hizo. 1-2 parrafos. Opcional. | grupo `detalle` |
| `resultados` | Resultados | array de `resultado` | — | `of: [{ type: "resultado" }]` | — | — | Datos duros. Solo los confirmados por el cliente; no inventar. | grupo `detalle` |
| `testimonio` | Testimonio | objeto `testimonio` | — (pero sus 3 subcampos son obligatorios, ver 3.3.2) | — | — | — | — | grupo `detalle` |
| `redes` | Redes y enlaces | objeto `redesSociales` | — | — | — | — | — | grupo `redes` |

Preview: `select: { title: "nombre", subtitle: "categoria", media: "logo", activa: "activa" }` -> `prepare`: `title`, `subtitle: activa === false ? (subtitle ?? "Sin categoria") + " · Inactiva" : subtitle`, `media`.

#### 3.1.10 `contenido` — «Contenido» (coleccion)

`Padre` = el propio documento (los `hidden` y la validacion custom leen `parent.tipoMedia` y `parent.tipoVideo`).

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `titulo` | Titulo | string | Oblig. | — | — | — | — | — |
| `cuenta` | Cuenta | reference a `cuenta` | Oblig. | `to: [{ type: "cuenta" }]` | — | — | A que cuenta pertenece este trabajo. | — |
| `tipoMedia` | Tipo de contenido | string | Oblig. | lista (layout `radio`): `imagen` = «Imagen», `video` = «Video» | `"imagen"` | — | — | — |
| `imagen` | Imagen | image | CUSTOM: si `tipoMedia === "imagen"` y no hay valor -> error «Falta la imagen»; en otro caso valido | `hotspot: true` | — | Oculto si `tipoMedia !== "imagen"` | — | — |
| `tipoVideo` | Fuente del video | string | — (no obligatorio ni siquiera en video) | lista (layout `radio`): `youtube` = «YouTube», `archivo` = «Archivo subido» | — | Oculto si `tipoMedia !== "video"` | — | — |
| `youtubeId` | ID de YouTube | string | — | — | — | Oculto salvo `tipoMedia === "video"` Y `tipoVideo === "youtube"` | El codigo que va despues de «v=» en la URL del video. | — |
| `archivoVideo` | Archivo de video | file | — | `accept: "video/mp4"` | — | Oculto salvo `tipoMedia === "video"` Y `tipoVideo === "archivo"` | — | — |
| `poster` | Portada del video | image | — | `hotspot: true` | — | Oculto si `tipoMedia !== "video"` | — | — |
| `formatoVideo` | Formato | string (libre) | — | — | — | Oculto si `tipoMedia !== "video"` | Etiqueta corta. Ej. «Spot 30s», «Vertical 9:16». | — |
| `relacionAspecto` | Relacion de aspecto | string | — | lista (desplegable): `16/9` = «16:9 (horizontal)», `9/16` = «9:16 (vertical)», `1/1` = «1:1 (cuadrado)» | `"16/9"` | Oculto si `tipoMedia !== "video"` | — | — |
| `descripcion` | Descripcion | text (rows 3) | — | — | — | — | — | — |
| `categoria` | Categoria / tipo | string (libre) | — | — | — | — | Libre. Ej. «Campaña», «Reel», «Fotografia». | — |
| `fecha` | Fecha | date (AAAA-MM-DD) | — | — | — | — | — | — |
| `orden` | Orden | number | — | — | — | — | — | — |
| `publicado` | Publicado | boolean | — | — | `true` | — | Apagado: no aparece en la pagina de la cuenta aunque exista. | — |

Preview: `select: { title: "titulo", cuenta: "cuenta.nombre", media: "imagen", publicado: "publicado" }` -> `prepare`: `title`, `subtitle: publicado === false ? (cuenta ?? "Sin cuenta") + " · Sin publicar" : cuenta ?? "Sin cuenta"`, `media`. (El subtitulo desreferencia la cuenta: `cuenta.nombre`.)

#### 3.1.11 `servicio` — «Servicio» (coleccion)

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `nombre` | Nombre | string | Oblig. + CUSTOM ASINCRONA de unicidad: consulta si existe otro `servicio` con el mismo `nombre` (comparacion exacta) excluyendo el propio borrador y publicado; si existe -> «Ya existe un servicio con este nombre» | — | — | — | — | — |

Preview: `select: { title: "nombre" }`.

Consulta exacta de la validacion: `!defined(*[_type == "servicio" && nombre == $nombre && !(_id in [$draft, $published])][0]._id)` con `apiVersion "2024-01-01"`.

---

### 3.2 Helpers compartidos (funciones que generan campos; NO son tipos)

#### 3.2.1 `campoImagen({ name, title, description?, recortable = true, fieldset? })` — `objects/campoImagen.ts`

Devuelve UN campo `image` con el texto alternativo ADENTRO (`<campo>.alt`):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `<name>` | `<title>` | image | — | `hotspot: <recortable>` (true por defecto; false = sin punto focal ni recorte, la pieza se muestra completa) | — | — | `<description>` | `<fieldset>` si se pasa |
| `<name>.alt` | Texto alternativo | string | — | — | — | — | «Qué muestra la imagen, en una frase. Lo leen los lectores de pantalla y Google. Si la imagen tiene texto dibujado, escribilo acá.» | (subcampo de la imagen) |

Usado en: `camposBase` (`imagen`, `imagenMovil`), `camposVideoTikTok` (`portadaVideo`), `miembroGiro` (`imagen`), `videoCelular` (`portada`), `splitHeroBanner` (`logo`), `achievementsBanner` -> `logro` (`foto`).

#### 3.2.2 `campoLogoCircular(extra: { group?: string } = {})` — `objects/campoLogoCircular.ts`

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `logoCircular` | Logo circular | image | — | — (sin hotspot, sin alt) | — | — | Version REDONDA del logo para «Clientes y casos de éxito» (PNG o WebP cuadrado, exterior del circulo transparente). Se genera sola a partir del logo (`scripts/logos-circulares.mts`); se puede reemplazar a mano. Si se cambia el logo, borrar esta para que se regenere (mientras tanto la web recorta el logo en circulo). | `group` si se pasa |

Usado en: `cuenta` (con `{ group: "principal" }`) y `empresaGiro` (sin parametros).

#### 3.2.3 `camposBase({ conImagen = true, imagenRecortable = true, textos = {}, extras = [], diseno = [], omitir = [] })` — `marketing/camposBase.ts`

Devuelve la lista de campos comunes de los bloques de seccion, EN ESTE ORDEN:

1. `activo`
2. `imagen` (solo si `conImagen`)
3. `imagenMovil` (solo si `conImagen`)
4. `subtitulo`
5. `titulo`
6. `descripcion`
7. `destacado`
8. ...`extras` (campos propios del bloque)
9. `cta`
10. `animar`
11. ...`diseno` (campos de diseño propios del bloque)

Al final se filtra: se quitan los campos cuyo `name` este en `omitir` (valores posibles: `"subtitulo"`, `"descripcion"`, `"destacado"`, `"cta"`). `textos` permite sobreescribir la ayuda de `imagen`, `imagenMovil`, `subtitulo`, `titulo`, `descripcion`, `destacado`, `cta`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda (por defecto) | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` | Mostrar en la página | boolean | — | — | `true` | — | «Apágalo para ocultar la sección sin borrarla.» | — |
| `imagen` | Imagen | image con `alt` (`campoImagen`) | — | `hotspot: <imagenRecortable>` | — | — | `textos.imagen` (sin texto por defecto) | — |
| `imagenMovil` | Imagen para móvil (opcional) | image con `alt` (`campoImagen`) | — | `hotspot: <imagenRecortable>` | — | — | `textos.imagenMovil` o, por defecto, «Una versión compuesta para teléfono. Sin ella, en móvil se usa la imagen de arriba.» | — |
| `subtitulo` | Subtítulo | string | — | — | — | — | `textos.subtitulo` (sin texto por defecto) | — |
| `titulo` | Título | string | Oblig. | — | — | — | `textos.titulo` (sin texto por defecto) | — |
| `descripcion` | Descripción | text (rows 4) | — | — | — | — | `textos.descripcion` o, por defecto, «Deja una línea en blanco para separar párrafos.» | — |
| `destacado` | Texto destacado | string | — | — | — | — | `textos.destacado` (sin texto por defecto) | — |
| `cta` | Botón (CTA) | objeto `ctaSimple` | — (ver validacion de `ctaSimple.enlace`) | — | — | — | `textos.cta` (sin texto por defecto) | — |
| `animar` | Animaciones | boolean | — | — | `true` | — | «Entradas suaves al hacer scroll. Apágalas para que todo aparezca quieto.» | — |

No hay campo numerico de orden: el orden de las secciones es el del array `sections[]`.

`campoAlineacion(porDefecto: "izquierda" | "centro" | "derecha")`:

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `alineacion` | Posición del contenido | string | — | lista (layout `radio`, direction `horizontal`): `izquierda` = «Izquierda», `centro` = «Centro», `derecha` = «Derecha» | `<porDefecto>` | — | «En escritorio. En móvil el texto va siempre abajo.» | — |

`campoOverlay()`:

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `overlay` | Oscurecer la foto (overlay) | string | — | lista (layout `radio`, direction `horizontal`): `ninguno` = «Nada», `suave` = «Suave», `medio` = «Medio», `fuerte` = «Fuerte» | `"medio"` | — | Oscurece la foto del lado del texto para que se lea bien. Si la foto es clara, subirlo. | — |

Usan `campoAlineacion` + `campoOverlay`: `teamBanner` (alineacion por defecto `izquierda`) y `ctaBanner` (por defecto `centro`).

#### 3.2.4 `camposVideoTikTok({ fieldset, hidden? })` — `marketing/camposVideoTikTok.ts`

Devuelve 9 campos, todos con el `fieldset` y el `hidden` recibidos. Unico uso: `teamBanner`, con `fieldset: "celular"` y `hidden: (contexto) => contexto.document?._type !== "chatbotsCrmPage"`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `video` | Video | file | — | `accept: "video/mp4,video/webm"` | — | `hidden` recibido | Video VERTICAL 9:16, MP4 (H.264) liviano, idealmente < 15 MB. Arranca solo y en silencio al verse, una vez; tocarlo lo pausa; al terminar aparece «Ver de nuevo». | `fieldset` recibido |
| `ajusteVideo` | Ajuste del video | string | — | lista (layout `radio`): `rellenar` = «Rellenar la pantalla (puede recortar los bordes)», `completo` = «Mostrar el video completo (sin recortes)» | `"rellenar"` | `hidden` recibido | Como entra el video en la pantalla del telefono (9:16). Nunca se deforma. | idem |
| `portadaVideo` | Portada del video (opcional) | image con `alt` (`campoImagen`, `hotspot: true`) | — | `hotspot: true` | — | `hidden` recibido (añadido con spread sobre el campo) | Se ve mientras el video carga. Idealmente, un cuadro del mismo video. | idem |
| `sonidoVideo` | Mostrar botón de sonido | boolean | — | — | `false` | `hidden` recibido | — | idem |
| `usuarioTikTok` | Usuario | string | — | — | `"@dofiagenciacreativa"` | `hidden` recibido | El usuario que firma la publicacion. | idem |
| `descripcionVideo` | Descripción del video | string | max 150 caracteres | — | — | `hidden` recibido | Opcional. Frase corta debajo del usuario (se ven hasta dos lineas). | idem |
| `meGusta` | Me gusta (al empezar) | number | min 0, entero | — | `8240` | `hidden` recibido | Los contadores son una simulacion: arrancan en este numero y suben mientras el video corre. | idem |
| `comentarios` | Comentarios (al empezar) | number | min 0, entero | — | `312` | `hidden` recibido | — | idem |
| `compartidos` | Compartidos (al empezar) | number | min 0, entero | — | `145` | `hidden` recibido | — | idem |

#### 3.2.5 `miembroGiro({ descripcionImagen, extras = [] })` y `OPCIONES_ICONO` — `marketing/giroNegocio.ts`

Devuelve UN miembro de array: objeto en linea con **`name: "categoriaIcono"`** (nombre historico, es el `_type` de cada giro en los datos), titulo «Giro de negocio». Se usa como unico tipo admitido del array `categorias` en `clientsBanner`, `chatClientsBanner` y `metricsClientsBanner`.

Campos del giro (`categoriaIcono`):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `nombre` | Nombre del giro | string | Oblig. | — | — | — | — | — |
| `icono` | Ícono (opcional) | string | — | lista `OPCIONES_ICONO` (desplegable, ver abajo) | — | — | Se ve en el panel del giro. Sin icono, el panel muestra solo el nombre. | — |
| `imagen` | Foto del giro (opcional) | image con `alt` (`campoImagen`, `hotspot: true`) | — | `hotspot: true` | — | — | `<descripcionImagen>` (parametro; cambia segun el bloque) | — |
| `empresas` | Empresas y logos de este giro | array MIXTO: reference a `cuenta` O objeto `empresaGiro` | — (sin min/max) | `of`: (1) `reference` titulo «Cuenta existente», `to: [{ type: "cuenta" }]`, `options: { disableNew: true }`; (2) objeto `empresaGiro` titulo «Empresa con logo propio» | — | — | Sus logos aparecen al abrir el giro, en este orden (arrastrar para reordenar). Elegir una Cuenta existente o, si la empresa no es Cuenta, agregarla con su logo. | — |
| ...`extras` | (segun el bloque) | | | | | | | |

`OPCIONES_ICONO` (12): `construccion` = «Edificio — construcción», `belleza` = «Destello — belleza», `servicios` = «Apretón de manos — servicios», `comercio` = «Tienda — comercio», `emprendedores` = «Cohete — emprendedores», `salud` = «Pulso — salud», `gastronomia` = «Cubiertos — gastronomía», `tecnologia` = «Chip — tecnología», `automotriz` = «Auto — automotriz», `inmobiliaria` = «Casa — inmobiliaria», `educacion` = «Birrete — educación», `turismo` = «Avión — turismo».

Objeto en linea `empresaGiro` («Empresa con logo propio»):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `nombre` | Nombre de la empresa | string | Oblig. | — | — | — | — | — |
| `logo` | Logo | image | Oblig. | — (sin hotspot, sin alt) | — | — | PNG o SVG, idealmente con fondo transparente. Es el archivo original: no se recorta ni se deforma. | — |
| `logoCircular` | Logo circular | image | — | — | — | — | `campoLogoCircular()`, ver 3.2.2. | — |

Preview de `empresaGiro`: `select: { title: "nombre", media: "logo" }`.

Preview del giro: `select: { nombre: "nombre", empresas: "empresas", media: "imagen" }` -> `prepare`: `title: nombre || "Giro sin nombre"`, `subtitle: total === 1 ? "1 empresa" : total + " empresas"` (con `total = Array.isArray(empresas) ? empresas.length : 0`), `media`.

---

### 3.3 Objetos reutilizables (registrados en `index.ts`)

#### 3.3.1 `resultado` — «Resultado»

Usado en: `cuenta.resultados[]`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `valor` | Valor | string | Oblig. | — | — | — | El numero, tal cual. Ej. «3x», «-40%», «88». | — |
| `etiqueta` | Etiqueta | string | Oblig. | — | — | — | Que mide ese numero. Ej. «leads por semana». | — |

Preview: `select: { valor: "valor", etiqueta: "etiqueta" }` -> `prepare`: `title: [valor, etiqueta].filter(Boolean).join(" — ") || "Resultado"`.

#### 3.3.2 `testimonio` — «Testimonio»

Usado en: `cuenta.testimonio`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `cita` | Cita | text (rows 3) | Oblig. | — | — | — | — | — |
| `autor` | Autor | string | Oblig. | — | — | — | Nombre de quien lo dice. Nunca solo el nombre sin cargo. | — |
| `cargo` | Cargo | string | Oblig. | — | — | — | Cargo y empresa. Ej. «Gerente General, Taitico». | — |

Preview: `select: { title: "autor", subtitle: "cargo" }`.

#### 3.3.3 `redesSociales` — «Redes y enlaces»

Usado en: `cuenta.redes`. `urlValidation` = `Rule.uri({ scheme: ["http", "https"], allowRelative: false })`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `instagram` | Instagram | url | URI absoluta, solo `http`/`https` | — | — | — | — | — |
| `facebook` | Facebook | url | URI absoluta, solo `http`/`https` | — | — | — | — | — |
| `tiktok` | TikTok | url | URI absoluta, solo `http`/`https` | — | — | — | — | — |
| `sitioWeb` | Sitio web | url | URI absoluta, solo `http`/`https` | — | — | — | — | — |
| `otros` | Otros enlaces | array de objeto en linea `enlace` | — | `of: [{ type: "object", name: "enlace" }]` | — | — | — | — |

Objeto en linea `enlace` (sin titulo definido):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `etiqueta` | Etiqueta | string | Oblig. | — | — | — | — | — |
| `url` | URL | url | Oblig. + URI absoluta, solo `http`/`https` | — | — | — | — | — |

Preview de `enlace`: `select: { title: "etiqueta", subtitle: "url" }`. `redesSociales` no define preview.

#### 3.3.4 `capacidad` — «Capacidad»

Usado en: `paginaInicio.capacidades[]`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `titulo` | Título | string | Oblig. | — | — | — | — | — |
| `descripcion` | Descripción | text (rows 2) | Oblig., max 170 caracteres | — | — | — | Breve. Una frase, no un parrafo: la tarjeta es compacta. | — |
| `icono` | Ícono | string | Oblig. | lista (layout `radio`): `social` = «Compartir en red — redes sociales», `ads` = «Megáfono — pauta / campañas pagadas», `growth` = «Gráfico ascendente — resultados / ventas», `rescue` = «Salvavidas — acompañamiento a emprendedores», `academia` = «Birrete — academia / formación» | — | — | Define que icono se dibuja. No es un archivo: es una clave fija. | — |
| `activa` | Activa | boolean | — | — | `true` | — | Desactivarla para ocultarla de la home sin borrarla. | — |
| `enlace` | Enlace (opcional) | string | — (sin validacion de formato) | — | — | — | Si se completa, la tarjeta se vuelve clickeable. Vacio = tarjeta informativa. | — |

Preview: `select: { title: "titulo", icono: "icono", activa: "activa" }` -> `prepare`: `title`, `subtitle: (icono ?? "sin ícono") + (activa === false ? " · Inactiva" : "")`.

#### 3.3.5 `seccionContenido` — «Banner»

Usado en: `banners.seccionesContenido[]`. El nombre del tipo es historico y NO debe cambiarse (identifica los items ya publicados).

Fieldsets: `hibrido` = «Escena y foto (banner híbrido)» (colapsable, abierto; ayuda: un banner puede ser mitad escena animada dibujada con codigo y mitad foto subida); `cta` = «Botón (CTA)» (colapsable, abierto; ayuda: el boton va encima de la imagen; si texto o enlace quedan vacios, el banner se muestra sin boton).

`esHibrido` = `parent.escena` tiene valor y es distinto de `"imagen"`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `escena` | Tipo de banner | string | — | lista (desplegable): `imagen` = «Imagen entera (como antes)», `redes` = «Híbrido · Redes Sociales (escena a la izquierda, foto a la derecha)», `pauta` = «Híbrido · Pauta Inteligente (foto a la izquierda, escena a la derecha)», `crm` = «Híbrido · CRM y Chatbots (escena a la izquierda, foto a la derecha)», `asesorias` = «Híbrido · Rescatando Emprendedores (foto a la izquierda, escena a la derecha)» | `"imagen"` | — | Con un hibrido, el banner muestra la escena animada de ese tema junto a la foto de primer plano. | fieldset `hibrido` |
| `fotoPrimerPlano` | Foto de primer plano | image | — | `hotspot: true` | — | Oculto si `!parent?.escena` o `parent.escena === "imagen"` | La foto que acompaña a la escena. Idealmente PNG/WebP con fondo recortado, min. 1100 px de ancho. Si no se sube, se usa la foto que ya trae el banner. | fieldset `hibrido` |
| `ajusteFoto` | Cómo se acomoda la foto | string | — | lista (layout `radio`): `cubrir` = «Llenar el espacio (puede recortar los bordes)», `completa` = «Mostrar completa (puede dejar aire alrededor)» | `"cubrir"` | Oculto si `!parent?.escena` o `parent.escena === "imagen"` | Con «Llenar» la foto cubre su mitad y el punto focal decide que se mantiene; con «Completa» se ve entera, apoyada abajo. | fieldset `hibrido` |
| `lineas` | Texto de la escena (línea por línea) | array de string (primitivos) | max 4 elementos | `of: [{ type: "string" }]` | — | Oculto si `!parent?.escena` o `parent.escena === "imagen"` | Opcional. Cada linea es una fila del titulo de la escena. Vacio: texto de fabrica. | fieldset `hibrido` |
| `backgroundImage` | Imagen de fondo del banner | image | CUSTOM: si es hibrido -> valido siempre; si no (escena vacia o `"imagen"`) y no hay imagen -> error «Falta la imagen del banner (o elegí un tipo híbrido arriba).» | `hotspot: true` | — | Oculto si `Boolean(parent?.escena) && parent.escena !== "imagen"` | La pieza grafica completa, a todo el ancho. Recorte y punto focal deciden que se ve en mobile. | — |
| `backgroundImageAlt` | Texto alternativo | string | Oblig. (SIEMPRE, tambien en hibridos) | — | — | — | Que dice y que muestra la pieza: es lo unico que leen lectores de pantalla y buscadores. | — |
| `ctaTexto` | Texto del botón | string | — | — | — | — | Ej. «Quiero Mejorar mis Ventas». Cuanto mas corto, mejor. | fieldset `cta` |
| `ctaEnlace` | Enlace del botón | string | CUSTOM (regex, ver abajo): vacio es valido; si tiene valor debe empezar con `http://`, `https://`, `mailto:`, `tel:` o `/` | — | — | — | Ruta interna empezando con «/» (misma pestaña) o direccion completa `https://...` (pestaña nueva). | fieldset `cta` |
| `ctaColor` | Color del botón | string | — | lista (layout `radio`, direction `horizontal`): `naranja` = «Naranja DOFI», `morado` = «Morado DOFI», `blanco` = «Blanco», `oscuro` = «Oscuro» | `"naranja"` | — | Elegir el que no se mezcle con el fondo de la pieza. | fieldset `cta` |
| `ctaPosicionDesktop` | Posición en desktop | objeto `posicionCta` | — | — | (los de `posicionCta`) | — | Donde se apoya el boton en pantallas de 768 px o mas. | fieldset `cta` |
| `ctaPosicionMobile` | Posición en mobile | objeto `posicionCta` | — | — | (los de `posicionCta`) | — | Donde se apoya el boton en pantallas de menos de 768 px. | fieldset `cta` |

Regex de `ctaEnlace` (identica a la de `ctaSimple.enlace`):

```
/^(https?:\/\/|mailto:|tel:|\/)/
```

Mensaje de error: «Tiene que empezar con "/" (una página de este sitio) o con https:// (un enlace externo).»

Preview: `select: { media: "backgroundImage", foto: "fotoPrimerPlano", escena: "escena", alt: "backgroundImageAlt", cta: "ctaTexto", color: "ctaColor", dh: "ctaPosicionDesktop.horizontal", dv: "ctaPosicionDesktop.vertical", dx: "ctaPosicionDesktop.desplazamientoX", dy: "ctaPosicionDesktop.desplazamientoY", mh: "ctaPosicionMobile.horizontal", mv: "ctaPosicionMobile.vertical" }` -> `prepare`: `title: alt || "Banner sin texto alternativo"`; `media` = `foto` si es hibrido y hay foto, si no `backgroundImage`; `subtitle` = prefijo `"Híbrido <escena> · "` si es hibrido + (`"Sin botón"` si no hay `ctaTexto`, o bien `"<punto de color> <color ?? naranja> · PC <dh>·<dv>[ (+dx, +dy)] · Móvil <mh>·<mv>"`, con «sin posición» cuando falta alguno; puntos: naranja 🟠, morado 🟣, blanco ⚪, oscuro ⚫).

#### 3.3.6 `posicionCta` — «Posición del botón»

Usado en: `seccionContenido.ctaPosicionDesktop` y `seccionContenido.ctaPosicionMobile`. Opciones del objeto: `columns: 2`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `horizontal` | Horizontal | string | Oblig. | lista (desplegable): `izquierda` = «Izquierda», `centro-izquierda` = «Centro-izquierda», `centro` = «Centro», `centro-derecha` = «Centro-derecha», `derecha` = «Derecha» | `"centro"` | — | — | — |
| `vertical` | Vertical | string | Oblig. | lista (desplegable): `arriba` = «Arriba», `centro-arriba` = «Centro-arriba», `centro` = «Centro», `centro-abajo` = «Centro-abajo», `abajo` = «Abajo» | `"abajo"` | — | — | — |
| `desplazamientoX` | Ajuste fino horizontal (%) | number | min -30, max 30 (admite decimales) | — | `0` | — | Corrimiento en % del ancho del banner. Negativo = izquierda. Dejar en 0 salvo ajuste fino. | — |
| `desplazamientoY` | Ajuste fino vertical (%) | number | min -30, max 30 (admite decimales) | — | `0` | — | Corrimiento en % del alto del banner. Negativo = arriba. | — |

Sin preview propia.

#### 3.3.7 `ajusteLogos` — «Presentación de los logos»

Usado en: campo `ajusteLogos` de `clientsBanner`, `chatClientsBanner` y `metricsClientsBanner`. Opciones del objeto: `collapsible: true, collapsed: false`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `forma` | Forma | string | — | lista (layout `radio`): `circular` = «Logos redondos (recomendado)», `original` = «Forma original de cada logo» | `"circular"` | — | «Logos redondos»: cada logo en su version circular (campo «Logo circular» de la empresa o de la Cuenta; si falta, la web recorta en circulo). «Forma original»: cada logo como es. | — |
| `tamano` | Tamaño en computadora (px) | number | min 72, max 180, entero | — | `120` | — | Diametro de cada logo en pantallas grandes (o su alto en «Forma original»). Recomendado: 120. | — |
| `tamanoMovil` | Tamaño en celular (px) | number | min 56, max 140, entero | — | `92` | — | Diametro de cada logo en el celular (o su alto en «Forma original»). Recomendado: 92. | — |

Sin preview propia.

#### 3.3.8 `videoCelular` — «Celular con video»

Usado en: `celularesBanner.celularIzquierdo`, `.celularCentral`, `.celularDerecho`. Opciones del objeto: `collapsible: true, collapsed: false`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `video` | Video | file | — | `accept: "video/mp4,video/webm"` | — | — | Video VERTICAL 9:16, MP4 (H.264) liviano, idealmente < 15 MB. No se descarga hasta que la seccion esta por verse; se reproduce al tocarlo. | — |
| `titulo` | Título sobre el video | string | max 40 caracteres | — | — | — | Opcional. Corto, va en mayusculas abajo del video. Ej.: «¿Cómo llegar?». | — |
| `portada` | Portada (opcional) | image con `alt` (`campoImagen`, `hotspot: true`) | — | `hotspot: true` | — | — | Lo que se ve antes de reproducir. Idealmente un cuadro del mismo video. Sin portada, se ve el primer cuadro. | — |

Preview: `select: { titulo: "titulo", media: "portada", archivo: "video.asset.originalFilename" }` -> `prepare`: `title: titulo || archivo || "Celular sin video"`, `subtitle: archivo ? "Con video" : "Sin video"`, `media`. (Lee el nombre original del archivo subido.)

#### 3.3.9 `ctaSimple` — «Botón»

Usado en: campo `cta` de `camposBase` (bloques que no lo omiten). Opciones del objeto: `columns: 2`. Regla de la web: si falta texto o enlace, no se muestra el boton.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `texto` | Texto del botón | string | — | — | — | — | Ej.: «Quiero Mejorar mis Ventas». | — |
| `enlace` | Enlace | string | CUSTOM (regex): vacio es valido; si tiene valor debe cumplir `/^(https?:\/\/` o `mailto:` o `tel:` o `\/)/` (misma regex que `seccionContenido.ctaEnlace`, ver 3.3.5) | — | — | — | Pagina del sitio empezando con «/» (ej. /contactanos). Una direccion completa `https://...` se abre en pestaña nueva. | — |

Sin preview propia.

#### 3.3.10 `chatDemo` — «Demo de WhatsApp»

Usado en: campo `chat` de cada giro de `chatClientsBanner`. Opciones del objeto: `collapsible: true, collapsed: true`. Todo opcional: con menos de dos mensajes, la web usa la conversacion por defecto del tipo de negocio.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `negocio` | Nombre en el chat | string | — | — | — | — | Lo que se lee arriba del chat. Recomendado: «Tu restaurante», «Tu concesionario»... | — |
| `estado` | Estado bajo el nombre | string | — | — | `"en línea"` | — | Mientras la IA escribe, la web muestra «escribiendo…» sola. | — |
| `avatar` | Foto de perfil (opcional) | image | — | `hotspot: true` | — | — | Cuadrada. Sin foto, se usa un circulo con el icono del giro. | — |
| `mensajes` | Mensajes | array de objeto en linea `mensajeChat` | — (sin min/max) | `of: [{ type: "object", name: "mensajeChat" }]` | — | — | En orden. Alternar cliente y negocio (IA). Mensajes cortos. Arrastrar para reordenar. | — |
| `aviso` | Aviso final del CRM (opcional) | objeto en linea (anonimo) | — | — | — | — | La tarjeta FENIAX CRM que cierra la demo. Ej.: «Reserva registrada» · «Andrea · 4 personas · Hoy 20:00». | — |
| `aviso.titulo` | Título | string | — | — | — | — | — | (dentro de `aviso`) |
| `aviso.texto` | Detalle | string | — | — | — | — | — | (dentro de `aviso`) |

Objeto en linea `mensajeChat` («Mensaje»):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `de` | Quién escribe | string | Oblig. | lista (layout `radio`, direction `horizontal`): `cliente` = «Cliente (burbuja verde, derecha)», `negocio` = «Negocio / IA (burbuja blanca, izquierda)» | `"cliente"` | — | — | — |
| `texto` | Texto | text (rows 2) | — | — | — | — | — | — |
| `imagen` | Foto adjunta (opcional) | image | — | `hotspot: true` | — | — | Ej.: el plato, el auto o el departamento que la IA envia. | — |

Preview de `mensajeChat`: `select: { de: "de", texto: "texto", media: "imagen" }` -> `prepare`: `title: texto || "(solo foto)"`, `subtitle: de === "negocio" ? "Negocio / IA" : "Cliente"`, `media`. `chatDemo` no define preview.

#### 3.3.11 `metricasDemo` — «Métricas de Meta Ads de este giro»

Usado en: campo `metricas` de cada giro de `metricsClientsBanner`. Opciones del objeto: `collapsible: true, collapsed: true`. Todo opcional: lo vacio o invalido se completa en la web con la campaña de ejemplo del tipo de negocio.

Helper local `numero(name, { title, description, min = 0.01, max? })`: campo `number` con `Rule.min(min)` y, si se pasa, `Rule.max(max)`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `campana` | Nombre de la campaña | string | — | — | — | — | Lo que se lee arriba del panel. Ej.: «Reservas por WhatsApp». | — |
| `objetivo` | Objetivo de la campaña | string | — | lista (desplegable): `mensajes` = «Mensajes», `clientes_potenciales` = «Clientes potenciales», `ventas` = «Ventas», `trafico` = «Tráfico», `reconocimiento` = «Reconocimiento» | — | — | Se muestra bajo el nombre: «Meta Ads · Objetivo: Mensajes». | — |
| `resultado` | Qué cuenta como resultado | string | — | — | — | — | Lo que Meta cuenta como resultado, en plural y corto. Ej.: «Conversaciones». El CPR es el costo de cada uno. | — |
| `adquisicion` | Qué es una adquisición en este negocio | string | — | — | — | — | En plural y corto. Ej.: «Reservas», «Citas». El CPA es el costo de cada una. | — |
| `inversion` | Inversión total (USD, 30 días) | number | min 0.01 | — | — | — | Cuanto se invirtio en los 30 dias, en dolares. Ej.: 450. | — |
| `cpr` | CPR · costo por resultado (USD) | number | min 0.01 | — | — | — | Ej.: 0.85. Los resultados salen de inversion ÷ CPR. | — |
| `ctr` | CTR · porcentaje de clics | number | min 0.01, max 100 | — | — | — | Clics sobre visualizaciones, en porcentaje. Ej.: 2.8. | — |
| `cpa` | CPA · costo por adquisición (USD) | number | min 0.01 | — | — | — | Ej.: 3.40. Las adquisiciones salen de inversion ÷ CPA y deben ser menos que los resultados (esto ultimo NO se valida). | — |
| `alcance` | Alcance · personas únicas | number | min 1 + CUSTOM: si `alcance` y `parent.visualizaciones` son numeros y `alcance > visualizaciones` -> error «El alcance no puede ser mayor que las visualizaciones: cada persona alcanzada vio el anuncio al menos una vez.» | — | — | — | Personas distintas que vieron el anuncio. Ej.: 48200. | — |
| `visualizaciones` | Visualizaciones | number | min 1 | — | — | — | Veces que se mostro el anuncio. Ej.: 126500. La frecuencia se calcula sola: visualizaciones ÷ alcance. | — |
| `hitos` | Optimizaciones que se marcan en el gráfico (opcional) | array de objeto en linea `hito` | max 4 elementos | `of: [{ type: "object", name: "hito" }]` | — | — | Hasta 4. Vacio: «Día 7 · Nueva creatividad», «Día 14 · Audiencia ajustada», «Día 21 · Presupuesto escalado». | — |
| `nota` | Aviso al pie del panel | string | — | — | — | — | Se ve siempre debajo del panel. Por defecto: «Cifras de ejemplo con fines ilustrativos: no corresponden a un cliente real.» Cambiar solo si se cargan resultados reales. | — |

Objeto en linea `hito` («Optimización»):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `dia` | Día de la campaña | number | Oblig., entero, min 2, max 29 | — | — | — | Entre el 2 y el 29. | — |
| `texto` | Qué se hizo | string | Oblig., max 28 caracteres | — | — | — | Corto: cabe una linea. Ej.: «Nueva creatividad». | — |

Preview de `hito`: `select: { dia: "dia", texto: "texto" }` -> `prepare`: `title: texto || "Optimización"`, `subtitle: dia ? "Día " + dia : ""`. `metricasDemo` no define preview.

---

### 3.4 Bloques de marketing (`marketing/*`, secciones de `sections[]`)

Todos son `type: "object"` y todos construyen sus campos con `camposBase` (3.2.3). En cada tabla se listan TODOS los campos del bloque en su orden final; las filas marcadas «(base)» son las de `camposBase` con la ayuda propia de ese bloque. Para tipo/validacion/valor inicial de las filas base vale lo dicho en 3.2.3 (`activo` boolean inicial `true`; `titulo` string Oblig.; `descripcion` text rows 4; `cta` objeto `ctaSimple`; `animar` boolean inicial `true`).

#### 3.4.1 `teamBanner` — «Equipo DOFI»

Portada de pagina. Admitido en: `marketingDigitalPage`, `traficoAdsPage`, `chatbotsCrmPage`.

Llamada: `camposBase({ textos: {...}, diseno: [campoAlineacion("izquierda"), campoOverlay()] })` (con imagen, recortable) + a `imagen` e `imagenMovil` se les añade `hidden: esMarketing` + `camposVideoTikTok({ fieldset: "celular", hidden: (ctx) => !esCrm(ctx) })` + campo propio `imagenDerecha`.

- `esMarketing(ctx)` = `ctx.document?._type === "marketingDigitalPage"`
- `esCrm(ctx)` = `ctx.document?._type === "chatbotsCrmPage"`

Fieldset: `celular` = «Celular con video estilo TikTok (derecha de la portada)», colapsable, abierto, **con `hidden: (ctx) => !esCrm(ctx)`** (el fieldset entero se oculta fuera de ChatBots/CRM). Ayuda del fieldset: el video se muestra dentro de un iPhone como una publicacion de TikTok; los contadores son una simulacion.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `imagen` (base) | Imagen | image con `alt` | — | `hotspot: true` | — | Oculto si el DOCUMENTO es `marketingDigitalPage` | Fotografia de fondo (Daniel con el equipo). Punto focal para que las caras queden visibles. Sin foto, fondo morado de marca. | — |
| `imagenMovil` (base) | Imagen para móvil (opcional) | image con `alt` | — | `hotspot: true` | — | Oculto si el DOCUMENTO es `marketingDigitalPage` | (por defecto) Version compuesta para telefono; sin ella se usa la imagen de arriba. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Etiqueta chica con pin de ubicacion. Ej: Cuenca - Ecuador. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | La pregunta principal. Breve: pensada para dos lineas. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Una frase corta. | — |
| `destacado` (base) | Texto destacado | string | — | — | — | — | Slogan en naranja. Ej: Un Mar de Ideas. | — |
| `cta` (base) | Botón (CTA) | objeto `ctaSimple` | — | — | — | — | — | — |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |
| `alineacion` | Posición del contenido | string | — | `izquierda` / `centro` / `derecha` (radio horizontal, ver 3.2.3) | `"izquierda"` | — | En escritorio. En movil el texto va siempre abajo. | — |
| `overlay` | Oscurecer la foto (overlay) | string | — | `ninguno` / `suave` / `medio` / `fuerte` (radio horizontal, ver 3.2.3) | `"medio"` | — | Oscurece la foto del lado del texto. | — |
| `video` | Video | file | — | `accept: "video/mp4,video/webm"` | — | Oculto si el DOCUMENTO NO es `chatbotsCrmPage` | ver 3.2.4 | fieldset `celular` |
| `ajusteVideo` | Ajuste del video | string | — | `rellenar` / `completo` (radio, ver 3.2.4) | `"rellenar"` | idem | ver 3.2.4 | fieldset `celular` |
| `portadaVideo` | Portada del video (opcional) | image con `alt` | — | `hotspot: true` | — | idem | ver 3.2.4 | fieldset `celular` |
| `sonidoVideo` | Mostrar botón de sonido | boolean | — | — | `false` | idem | — | fieldset `celular` |
| `usuarioTikTok` | Usuario | string | — | — | `"@dofiagenciacreativa"` | idem | ver 3.2.4 | fieldset `celular` |
| `descripcionVideo` | Descripción del video | string | max 150 caracteres | — | — | idem | ver 3.2.4 | fieldset `celular` |
| `meGusta` | Me gusta (al empezar) | number | min 0, entero | — | `8240` | idem | ver 3.2.4 | fieldset `celular` |
| `comentarios` | Comentarios (al empezar) | number | min 0, entero | — | `312` | idem | — | fieldset `celular` |
| `compartidos` | Compartidos (al empezar) | number | min 0, entero | — | `145` | idem | — | fieldset `celular` |
| `imagenDerecha` | Imagen de la derecha (PNG con transparencia) | image | — | `accept: "image/png"` (sin hotspot) | — | Oculto si el DOCUMENTO NO es `marketingDigitalPage` | Imagen del lado derecho de la portada. PNG con fondo transparente, recortada al contenido, min. 1600 px de ancho. En telefono va arriba del texto, centrada. | — |
| `imagenDerecha.alt` | Texto alternativo | string | — | — | — | (igual que su padre) | Que muestra la imagen, en una frase. Opcional. | (subcampo) |

Total: 21 campos de primer nivel. Resumen de visibilidad por pagina: en Marketing Digital se ven base sin `imagen`/`imagenMovil` + `imagenDerecha`; en ChatBots/CRM se ven base completa + los 9 de TikTok; en Trafico/Ads solo la base completa.

Preview: `select: { titulo: "titulo", activo: "activo", media: "imagen", derecha: "imagenDerecha" }` -> `prepare`: `title: titulo || "Equipo DOFI"`, `subtitle: "Equipo DOFI" + (activo === false ? " · Oculta" : "")`, `media: derecha ?? media`.

#### 3.4.2 `aboutBanner` — «Introducción»

Admitido en: las 4 paginas. Llamada: `camposBase({ imagenRecortable: false, textos: {...} })`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `imagen` (base) | Imagen | image con `alt` | — | `hotspot: false` | — | — | Opcional. Si se sube una pieza grafica terminada, se muestra completa (sin recortes) en lugar del diseño con texto, y el texto pasa a ser su descripcion para Google. | — |
| `imagenMovil` (base) | Imagen para móvil (opcional) | image con `alt` | — | `hotspot: false` | — | — | (por defecto) Version compuesta para telefono. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Opcional: etiqueta chica arriba del titulo. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | — | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | (por defecto) Dejar una linea en blanco para separar parrafos. | — |
| `destacado` (base) | Texto destacado | string | — | — | — | — | Frase de cierre en morado. Ej: Navegar en un Mar de Oportunidades. | — |
| `cta` (base) | Botón (CTA) | objeto `ctaSimple` | — | — | — | — | — | — |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Preview: `select: { titulo: "titulo", activo: "activo", media: "imagen" }` -> `prepare`: `title: titulo || "Introducción"`, `subtitle: "Introducción" + (activo === false ? " · Oculta" : "")`, `media`.

#### 3.4.3 `navigationBanner` — «Bloque editorial (fondo oscuro)»

Admitido en: las 4 paginas. Llamada: `camposBase({ imagenRecortable: false, textos: {...} })`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `imagen` (base) | Imagen | image con `alt` | — | `hotspot: false` | — | — | Opcional. Si se sube una pieza grafica terminada, se muestra completa en lugar de la composicion con brujula. | — |
| `imagenMovil` (base) | Imagen para móvil (opcional) | image con `alt` | — | `hotspot: false` | — | — | (por defecto) Version compuesta para telefono. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Opcional: etiqueta chica arriba del titulo. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | La ultima palabra se destaca en naranja. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Uno o dos parrafos breves, separados por una linea en blanco. Con dos, van en dos columnas. | — |
| `destacado` (base) | Texto destacado | string | — | — | — | — | Opcional: frase corta debajo de los parrafos. | — |
| `cta` (base) | Botón (CTA) | objeto `ctaSimple` | — | — | — | — | — | — |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Preview: `select: { titulo: "titulo", activo: "activo", media: "imagen" }` -> `prepare`: `title: titulo || "Bloque editorial"`, `subtitle: "Fondo oscuro" + (activo === false ? " · Oculta" : "")`, `media`.

#### 3.4.4 `methodBanner` — «Método en pasos»

Admitido en: las 4 paginas. Llamada: `camposBase({ imagenRecortable: false, textos: {...}, extras: [pasos, mostrarPasos] })`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `imagen` (base) | Imagen | image con `alt` | — | `hotspot: false` | — | — | Opcional: pieza grafica del metodo. Se muestra completa, arriba del recorrido. | — |
| `imagenMovil` (base) | Imagen para móvil (opcional) | image con `alt` | — | `hotspot: false` | — | — | (por defecto) Version compuesta para telefono. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Opcional: etiqueta chica arriba del titulo. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | — | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Opcional: una frase debajo del titulo. | — |
| `destacado` (base) | Texto destacado | string | — | — | — | — | El destino del recorrido: la ultima parada, destacada. Ej: Ventas Inteligentes Garantizadas. | — |
| `pasos` | Pasos | array de objeto en linea `pasoMetodo` | — (sin min/max) | `of: [{ type: "object", name: "pasoMetodo" }]` | — | — | En orden. Cada paso lleva un icono segun su POSICION (exploracion, ruta, lanzamiento, navegacion, resultados). | — |
| `mostrarPasos` | Mostrar el recorrido | boolean | — | — | `true` | — | Apagar si la pieza grafica ya muestra los pasos dibujados. | — |
| `cta` (base) | Botón (CTA) | objeto `ctaSimple` | — | — | — | — | — | — |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Objeto en linea `pasoMetodo` («Paso»):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `titulo` | Título | string | Oblig. | — | — | — | — | — |
| `descripcion` | Descripción | string (una linea, no `text`) | — | — | — | — | — | — |

Preview de `pasoMetodo`: `select: { title: "titulo", subtitle: "descripcion" }`.

Preview del bloque: `select: { titulo: "titulo", activo: "activo", media: "imagen" }` -> `prepare`: `title: titulo || "Método en pasos"`, `subtitle: "Método en pasos" + (activo === false ? " · Oculta" : "")`, `media`.

#### 3.4.5 `clientsBanner` — «Clientes y casos de éxito»

Admitido en: `marketingDigitalPage` y `asesoriasPage`. Descripcion del tipo: carrusel de giros de negocio con sus empresas y, al lado, los logos del giro abierto en circulos.

Llamada: `camposBase({ conImagen: false, omitir: ["destacado", "cta"], textos: {...}, extras: [categorias, rotacionAutomatica, ajusteLogos] })`.

Fieldsets: `giros` = «Carrusel de giros de negocio» (colapsable, abierto); `logos` = «Logos (columna derecha)» (colapsable, abierto; ayuda: la columna derecha muestra los logos del giro abierto; aca se elige forma y tamaño; los logos se cargan en cada giro).

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Opcional: etiqueta chica arriba del titulo. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | Se muestra en una sola linea en escritorio. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Opcional: una frase debajo del titulo. | — |
| `categorias` | Giros de negocio | array de `categoriaIcono` (`miembroGiro`, 3.2.5) | — (sin min/max) | `of: [miembroGiro({ descripcionImagen: "Llena el panel: a color cuando el giro está abierto y en gris cuando no. Sin foto, el panel usa los colores DOFI." })]` (sin extras) | — | — | Cada giro es un panel del carrusel; el orden de la lista es el del carrusel. Dentro de cada giro se agregan sus empresas. Sin giros, la seccion muestra la estructura vacia: nunca se inventan. | fieldset `giros` |
| `rotacionAutomatica` | Rotación automática | boolean | — | — | `true` | — | El carrusel avanza solo mientras nadie lo toca. Se detiene cuando el visitante elige un giro y despues de dos vueltas. | fieldset `giros` |
| `ajusteLogos` | Presentación de los logos | objeto `ajusteLogos` | — | — | (los de `ajusteLogos`) | — | — | fieldset `logos` |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Campos de cada giro en este bloque: `nombre`, `icono`, `imagen`, `empresas` (sin extras).

Preview: `select: { titulo: "titulo", activo: "activo" }` -> `prepare`: `title: titulo || "Clientes y casos de éxito"`, `subtitle: "Clientes" + (activo === false ? " · Oculta" : "")`.

#### 3.4.6 `chatClientsBanner` — «Clientes + demo de WhatsApp»

Admitido en: `chatbotsCrmPage`. Descripcion del tipo: carrusel de giros con sus empresas y, al lado, los logos del giro abierto en circulos.

Llamada: `camposBase({ conImagen: false, omitir: ["destacado", "cta"], textos: {...}, extras: [categorias, rotacionAutomatica, ajusteLogos, temaChat] })`.

Fieldsets: `giros` = «Giros de negocio» (colapsable, abierto); `logos` = «Logos (columna derecha)» (colapsable, abierto; misma ayuda que en `clientsBanner`, con la mencion «pedido del 2026-10-20»).

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Opcional: etiqueta chica arriba del titulo. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | Se muestra en una sola linea en escritorio. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Opcional: una frase debajo del titulo. Ej.: «Elige un giro y mira cómo responde la IA». | — |
| `categorias` | Giros de negocio | array de `categoriaIcono` (`miembroGiro`) + extra `chat` | — | `of: [miembroGiro({ descripcionImagen: "Llena el panel: a color cuando el giro está abierto y en gris cuando no. Sin foto, el panel usa los colores FENIAX.", extras: [chat] })]` | — | — | Cada giro es un panel del carrusel y tiene su demo de WhatsApp. Arrastrar para reordenar. Vacio: se usan los giros de Marketing Digital. | fieldset `giros` |
| `rotacionAutomatica` | Pasar solo al siguiente giro | boolean | — | — | `true` | — | El carrusel avanza solo mientras nadie lo toca. Se detiene cuando el visitante elige un giro. | fieldset `giros` |
| `ajusteLogos` | Presentación de los logos | objeto `ajusteLogos` | — | — | (los de `ajusteLogos`) | — | — | fieldset `logos` |
| `temaChat` | Apariencia de WhatsApp (hoy no se muestra) | string | — | lista (layout `radio`, direction `horizontal`): `claro` = «Claro», `oscuro` = «Oscuro» | `"claro"` | — (visible y editable, pero sin efecto en la web segun su titulo) | — | fieldset `giros` |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Campo extra de cada giro en este bloque (despues de `empresas`):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `chat` | Demo de WhatsApp de este giro (opcional) | objeto `chatDemo` | — | — | — | — | Vacia: se usa la conversacion por defecto segun el nombre o icono del giro (restaurante, autos, inmobiliaria, gimnasio, salon, consultorio, tienda, academia, turismo). | — |

Preview: `select: { titulo: "titulo", activo: "activo" }` -> `prepare`: `title: titulo || "Clientes y casos de éxito"`, `subtitle: "Clientes" + (activo === false ? " · Oculta" : "")`.

#### 3.4.7 `metricsClientsBanner` — «Clientes + métricas de Meta Ads»

Admitido en: `traficoAdsPage`. Descripcion del tipo: igual que la de `chatClientsBanner`.

Llamada: `camposBase({ conImagen: false, omitir: ["destacado", "cta"], textos: {...}, extras: [categorias, rotacionAutomatica, ajusteLogos] })`.

Fieldsets: `giros` = «Giros de negocio» (colapsable, abierto); `logos` = «Logos (columna derecha)» (colapsable, abierto).

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Opcional: etiqueta chica arriba del titulo. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | Se muestra en una sola linea en escritorio. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Opcional: una frase debajo del titulo. Ej.: «Elige un giro y mira cómo medimos una campaña». | — |
| `categorias` | Giros de negocio | array de `categoriaIcono` (`miembroGiro`) + extra `metricas` | — | `of: [miembroGiro({ descripcionImagen: "Llena el panel: a color cuando el giro está abierto y en gris cuando no. Sin foto, el panel usa los colores DOFI.", extras: [metricas] })]` | — | — | Cada giro es un panel del carrusel y tiene su panel de metricas. Arrastrar para reordenar. Vacio: se usan los giros de Marketing Digital. | fieldset `giros` |
| `rotacionAutomatica` | Pasar solo al siguiente giro | boolean | — | — | `true` | — | El carrusel avanza solo mientras nadie lo toca. Se detiene cuando el visitante elige un giro. | fieldset `giros` |
| `ajusteLogos` | Presentación de los logos | objeto `ajusteLogos` | — | — | (los de `ajusteLogos`) | — | — | fieldset `logos` |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Campo extra de cada giro en este bloque (despues de `empresas`):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `metricas` | Métricas de Meta Ads de este giro (hoy no se muestran) | objeto `metricasDemo` | — | — | — | — (visible y editable, sin efecto en la web segun su titulo) | Desde el 2026-10-20 la seccion muestra los logos en lugar del panel de Meta Ads; estas metricas quedan guardadas por si se vuelve a usar. | — |

Preview: `select: { titulo: "titulo", activo: "activo" }` -> `prepare`: `title: titulo || "Clientes y casos de éxito"`, `subtitle: "Clientes" + (activo === false ? " · Oculta" : "")`.

#### 3.4.8 `platformsBanner` — «Plataformas (¿Dónde traficamos?)»

Admitido en: `traficoAdsPage`. Descripcion del tipo: tarjetas de las plataformas donde se trafica.

Llamada: `camposBase({ conImagen: false, omitir: ["destacado", "cta"], textos: {...}, extras: [plataformas] })`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Etiqueta chica arriba del titulo. Ej.: «¿Dónde traficamos?». | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | Ej.: «El tráfico no tiene un solo destino.» | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Una frase debajo del titulo. | — |
| `plataformas` | Plataformas | array de objeto en linea `plataforma` | — (sin min/max) | `of: [{ type: "object", name: "plataforma" }]` | — | — | Arrastrar para reordenar. En pantallas grandes se ven 4 por fila. | — |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Objeto en linea `plataforma` («Plataforma»):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `nombre` | Nombre | string | Oblig. | — | — | — | — | — |
| `etiqueta` | Frase que la resume | string | — | — | — | — | Bajo el nombre. Ej.: «Facebook + Instagram». | — |
| `descripcion` | Qué hacemos en ella | text (rows 4) | — | — | — | — | — | — |
| `icono` | Ícono | string | — | lista (desplegable): `meta` = «Meta (Facebook + Instagram)», `tiktok` = «TikTok», `google` = «Google Ads», `youtube` = «YouTube», `instagram` = «Instagram», `facebook` = «Facebook», `whatsapp` = «WhatsApp», `linkedin` = «LinkedIn», `web` = «Tráfico web (globo)» | `"web"` | — | — | — |

Preview de `plataforma`: `select: { nombre: "nombre", etiqueta: "etiqueta" }` -> `prepare`: `title: nombre || "Plataforma sin nombre"`, `subtitle: etiqueta`.

Preview del bloque: `select: { titulo: "titulo", activo: "activo", plataformas: "plataformas" }` -> `prepare`: `title: titulo || "¿Dónde traficamos?"`, `subtitle: "Plataformas · " + (Array.isArray(plataformas) ? plataformas.length : 0) + (activo === false ? " · Oculta" : "")`.

#### 3.4.9 `ecosystemBanner` — «Ecosistema»

Admitido en: `traficoAdsPage`. Descripcion del tipo: seccion oscura con el recorrido Instagram -> Google -> web -> WhatsApp animado; subir una imagen reemplaza la animacion.

Llamada: `camposBase({ imagenRecortable: false, textos: {...} })`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `imagen` (base) | Imagen | image con `alt` | — | `hotspot: false` | — | — | Opcional. Si se sube, reemplaza la animacion del recorrido: se muestra completa, sin recortes. | — |
| `imagenMovil` (base) | Imagen para móvil (opcional) | image con `alt` | — | `hotspot: false` | — | — | (por defecto) Version compuesta para telefono. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Etiqueta chica arriba del titulo. Ej.: «Ecosistema». | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | La ultima palabra se destaca en naranja. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Dejar una linea en blanco para separar parrafos. | — |
| `destacado` (base) | Texto destacado | string | — | — | — | — | La frase que cierra el texto, mas grande. Opcional. | — |
| `cta` (base) | Botón (CTA) | objeto `ctaSimple` | — | — | — | — | — | — |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Preview: `select: { titulo: "titulo", activo: "activo", media: "imagen" }` -> `prepare`: `title: titulo || "Ecosistema"`, `subtitle: "Ecosistema" + (activo === false ? " · Oculta" : "")`, `media`.

#### 3.4.10 `splitHeroBanner` — «Portada con logo e imagen»

Admitido en: `asesoriasPage`. Llamada: `camposBase({ imagenRecortable: false, textos: {...}, extras: [campoImagen({ name: "logo", title: "Logo (debajo del título)", recortable: false, description })] })`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `imagen` (base) | Imagen | image con `alt` | — | `hotspot: false` | — | — | La imagen de la derecha (ej.: el grupo de emprendedores). Se muestra completa; ideal PNG o WebP con fondo transparente. | — |
| `imagenMovil` (base) | Imagen para móvil (opcional) | image con `alt` | — | `hotspot: false` | — | — | Opcional: otra version para telefono. Sin ella, en movil se usa la de arriba. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Opcional: etiqueta chica arriba del titulo. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | Ej.: Asesorías 1 a 1. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | La frase que va debajo del logo. | — |
| `destacado` (base) | Texto destacado | string | — | — | — | — | Opcional: una frase corta en naranja debajo de la descripcion. | — |
| `logo` | Logo (debajo del título) | image con `alt` (`campoImagen`) | — | `hotspot: false` | — | — | Ej.: el logo de «Rescatando Emprendedores». PNG o WebP con fondo transparente; se muestra completo. En el alt escribir lo que dice el logo. | — |
| `cta` (base) | Botón (CTA) | objeto `ctaSimple` | — | — | — | — | El boton de la portada. Ej.: «Quiero mejorar mis ventas» -> /contactanos?servicio=asesorias. | — |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Preview: `select: { titulo: "titulo", activo: "activo", media: "imagen" }` -> `prepare`: `title: titulo || "Portada con logo e imagen"`, `subtitle: "Portada" + (activo === false ? " · Oculta" : "")`, `media`.

#### 3.4.11 `achievementsBanner` — «Logros (tarjetas con foto)»

Admitido en: `asesoriasPage`. Descripcion del tipo: un mazo de tarjetas y, al lado, la foto de la historia que esta al frente; cada clic pasa a la siguiente y cambia la foto.

Llamada: `camposBase({ conImagen: false, omitir: ["destacado", "cta"], textos: {...}, extras: [logros, pasoAutomatico, segundosPorLogro] })`.

Fieldset: `logros` = «Logros» (colapsable, abierto).

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Etiqueta chica arriba del titulo. Ej.: «Logros de nuestros emprendedores». | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | Ej.: «Historias que nos enorgullecen». La ultima palabra se resalta con el color de marca y un subrayado. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Opcional: una frase debajo del titulo. | — |
| `logros` | Logros | array de objeto en linea `logro` | — (sin min/max) | `of: [{ type: "object", name: "logro" }]` | — | — | Cada logro es una tarjeta con su foto. El orden de la lista es el orden en la web. | fieldset `logros` |
| `pasoAutomatico` | Pasar solo a la siguiente tarjeta | boolean | — | — | `true` | — | El mazo avanza solo mientras la seccion esta en pantalla. Se pausa con el cursor encima y se detiene cuando el visitante pasa una tarjeta. | fieldset `logros` |
| `segundosPorLogro` | Segundos por tarjeta | number | entero, min 4, max 30 | — | `6` | Oculto si `parent?.pasoAutomatico === false` | Cuanto queda cada tarjeta al frente antes de pasar a la siguiente. | fieldset `logros` |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Objeto en linea `logro` («Logro»):

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `foto` | Foto | image con `alt` (`campoImagen`, `hotspot: true`) | — | `hotspot: true` | — | — | Se muestra grande a la izquierda mientras la tarjeta esta al frente. Vertical (4:5): usar el punto focal. | — |
| `titulo` | Frase del logro | string | Oblig., max 60 caracteres | — | — | — | La frase grande de la tarjeta. Ej.: «Duplicó sus clientes». | — |
| `texto` | Remate | text (rows 2) | max 160 caracteres | — | — | — | Completa la frase. Ej.: «en tres meses, con una ruta comercial clara». | — |
| `etiqueta` | Etiqueta | string | max 40 caracteres | — | — | — | Rubro o servicio; va en la tarjeta y sobre la foto. Si coincide con un giro de Clientes, lleva su icono. | — |
| `nombre` | Nombre (sobre la foto) | string | max 40 caracteres | — | — | — | Opcional: nombre de la persona o del negocio, arriba a la izquierda de la foto. | — |
| `firma` | Firma (al pie de la tarjeta) | string | max 70 caracteres | — | — | — | Opcional. Ej.: «María, dueña de Panadería La Esquina». | — |

Preview de `logro`: `select: { title: "titulo", etiqueta: "etiqueta", nombre: "nombre", media: "foto" }` -> `prepare`: `title: title || "Logro sin frase"`, `subtitle: [etiqueta, nombre].filter(Boolean).join(" · ") || "Sin etiqueta"`, `media`.

Preview del bloque: `select: { titulo: "titulo", activo: "activo", logros: "logros" }` -> `prepare`: `title: titulo || "Logros"`, `subtitle: (n === 1 ? "1 logro" : n + " logros") + (activo === false ? " · Oculta" : "")` con `n = Array.isArray(logros) ? logros.length : 0`.

#### 3.4.12 `celularesBanner` — «Videos en celulares»

Admitido en: `asesoriasPage`. Descripcion del tipo: tres celulares con video, el del centro mas grande; cada uno con su propio video.

Llamada: `camposBase({ conImagen: false, omitir: ["destacado", "cta"], textos: {...}, extras: [celularIzquierdo, celularCentral, celularDerecho] })`.

Fieldset: `celulares` = «Los tres celulares» (colapsable, abierto).

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Opcional: etiqueta chica arriba del titulo. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | El titulo de la seccion. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | Opcional: una frase debajo del titulo. | — |
| `celularIzquierdo` | Celular izquierdo | objeto `videoCelular` | — | — | — | — | — | fieldset `celulares` |
| `celularCentral` | Celular central (el principal, más grande) | objeto `videoCelular` | — | — | — | — | — | fieldset `celulares` |
| `celularDerecho` | Celular derecho | objeto `videoCelular` | — | — | — | — | — | fieldset `celulares` |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Preview: `select: { titulo: "titulo", activo: "activo" }` -> `prepare`: `title: titulo || "Videos en celulares"`, `subtitle: "Tres celulares con video" + (activo === false ? " · Oculta" : "")`.

#### 3.4.13 `reviewsBanner` — «Reseñas de Google»

Admitido en: las 4 paginas. Descripcion del tipo: tarjetas de reseñas; prioridad a las reseñas reales de Google si la API esta configurada; si no, las cargadas en el menu «Reseñas».

Llamada: `camposBase({ conImagen: false, omitir: ["cta"], textos: {...}, extras: [enlaceGoogle, cantidadMostrada] })`.

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Etiqueta chica junto al icono de Google. Vacio: dice «Google». | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | — | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | (por defecto) Dejar una linea en blanco para separar parrafos. | — |
| `destacado` (base) | Texto destacado | string | — | — | — | — | «Opcional.» | — |
| `enlaceGoogle` | Enlace al perfil de Google | url | — (solo la validacion por defecto del tipo `url`) | — | — | — | Donde estan todas las reseñas. Por defecto, la ficha de Google Maps del local. | — |
| `cantidadMostrada` | Cantidad de reseñas a mostrar | number | entero, min 1, max 50 | — | — | — | Maximo de tarjetas en la franja. Vacio: se muestran todas las disponibles. | — |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |

Preview: `select: { titulo: "titulo", activo: "activo" }` -> `prepare`: `title: titulo || "Reseñas de Google"`, `subtitle: "Reseñas" + (activo === false ? " · Oculta" : "")`.

#### 3.4.14 `ctaBanner` — «Cierre (CTA final)»

Admitido en: las 4 paginas. Llamada: `camposBase({ textos: {...}, diseno: [campoAlineacion("centro"), campoOverlay()] })` (con imagen, recortable).

| nombre tecnico | titulo visible | tipo | obligatorio / validaciones | opciones | valor inicial | oculto / solo lectura | ayuda | fieldset / grupo |
|---|---|---|---|---|---|---|---|---|
| `activo` (base) | Mostrar en la página | boolean | — | — | `true` | — | Apagar para ocultar la seccion sin borrarla. | — |
| `imagen` (base) | Imagen | image con `alt` | — | `hotspot: true` | — | — | Fotografia de fondo (Daniel dando la mano). Punto focal para elegir que queda visible. Sin foto, usa el fondo de marca. | — |
| `imagenMovil` (base) | Imagen para móvil (opcional) | image con `alt` | — | `hotspot: true` | — | — | (por defecto) Version compuesta para telefono. | — |
| `subtitulo` (base) | Subtítulo | string | — | — | — | — | Opcional: etiqueta chica arriba del titulo. | — |
| `titulo` (base) | Título | string | Oblig. | — | — | — | La pregunta de cierre. | — |
| `descripcion` (base) | Descripción | text (rows 4) | — | — | — | — | (por defecto) Dejar una linea en blanco para separar parrafos. | — |
| `destacado` (base) | Texto destacado | string | — | — | — | — | — | — |
| `cta` (base) | Botón (CTA) | objeto `ctaSimple` | — | — | — | — | El boton principal de la seccion: se muestra en tamaño grande. | — |
| `animar` (base) | Animaciones | boolean | — | — | `true` | — | Entradas suaves al hacer scroll. | — |
| `alineacion` | Posición del contenido | string | — | `izquierda` / `centro` / `derecha` (radio horizontal) | `"centro"` | — | En escritorio. En movil el texto va siempre abajo. | — |
| `overlay` | Oscurecer la foto (overlay) | string | — | `ninguno` / `suave` / `medio` / `fuerte` (radio horizontal) | `"medio"` | — | Oscurece la foto del lado del texto. | — |

Preview: `select: { titulo: "titulo", activo: "activo", media: "imagen" }` -> `prepare`: `title: titulo || "Cierre"`, `subtitle: "Cierre" + (activo === false ? " · Oculta" : "")`, `media`.

---

## 4. Tipos de seccion por pagina

Lista exacta de `of` del array de cada documento de pagina, en el orden en que el Studio los ofrece en «Agregar elemento». En ningun caso hay limite de cantidad ni restriccion de repetir el mismo tipo.

| Documento | Campo array | Tipos admitidos (en orden) |
|---|---|---|
| `marketingDigitalPage` | `sections` | `teamBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `clientsBanner`, `reviewsBanner`, `ctaBanner` (7) |
| `traficoAdsPage` | `sections` | `teamBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `platformsBanner`, `ecosystemBanner`, `metricsClientsBanner`, `reviewsBanner`, `ctaBanner` (9) |
| `chatbotsCrmPage` | `sections` | `teamBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `chatClientsBanner`, `reviewsBanner`, `ctaBanner` (7) |
| `asesoriasPage` | `sections` | `splitHeroBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `clientsBanner`, `achievementsBanner`, `celularesBanner`, `reviewsBanner`, `ctaBanner` (9) |
| `paginaInicio` | `capacidades` | `capacidad` (1). No tiene array de secciones; el otro contenido es el objeto fijo `hero`. |
| `banners` | `seccionesContenido` | `seccionContenido` (1) |
| `hero` | — | No tiene arrays: solo `heroImage` + `heroImageAlt`. |

Matriz bloque x pagina:

| Bloque | Marketing Digital | Tráfico / Ads | ChatBots / CRM | Asesorías |
|---|---|---|---|---|
| `teamBanner` | si | si | si | — |
| `splitHeroBanner` | — | — | — | si |
| `aboutBanner` | si | si | si | si |
| `navigationBanner` | si | si | si | si |
| `methodBanner` | si | si | si | si |
| `clientsBanner` | si | — | — | si |
| `chatClientsBanner` | — | — | si | — |
| `metricsClientsBanner` | — | si | — | — |
| `platformsBanner` | — | si | — | — |
| `ecosystemBanner` | — | si | — | — |
| `achievementsBanner` | — | — | — | si |
| `celularesBanner` | — | — | — | si |
| `reviewsBanner` | si | si | si | si |
| `ctaBanner` | si | si | si | si |

Arrays anidados dentro de los bloques (para el constructor de formularios):

| Padre | Campo | Elementos admitidos |
|---|---|---|
| `clientsBanner` / `chatClientsBanner` / `metricsClientsBanner` | `categorias` | objeto `categoriaIcono` (giro) |
| giro (`categoriaIcono`) | `empresas` | `reference` a `cuenta` O objeto `empresaGiro` (array mixto) |
| `methodBanner` | `pasos` | objeto `pasoMetodo` |
| `platformsBanner` | `plataformas` | objeto `plataforma` |
| `achievementsBanner` | `logros` | objeto `logro` |
| `chatDemo` | `mensajes` | objeto `mensajeChat` |
| `metricasDemo` | `hitos` | objeto `hito` (max 4) |
| `seccionContenido` | `lineas` | `string` (max 4) |
| `cuenta` | `servicios` | `reference` a `servicio` |
| `cuenta` | `resultados` | objeto `resultado` |
| `redesSociales` | `otros` | objeto `enlace` |

---

## 5. Rarezas y riesgos

### 5.1 Componentes de input personalizados (`studio/components/`)

Solo existe `SelectorGiro.tsx`, y **no esta conectado a ningun campo**: ningun archivo de `schemaTypes/` lo importa ni usa `components: { input: ... }`, y en el esquema actual no existe ningun campo `casos` ni `giro`. Es codigo huerfano (resto de una version anterior de «Clientes + casos de éxito» de Asesorias). No hay, por tanto, ningun input personalizado activo en el Studio.

Que haria si se conectara (por si el panel nuevo quiere recuperarlo):

- Es un input para un campo `string` llamado `giro` dentro de un elemento de un array `casos[]` de una seccion. Guarda el NOMBRE del giro (texto), no una referencia.
- Opciones del desplegable: los `nombre` de `categorias[]` de la MISMA seccion (leidos del formulario con `useFormValue`); si la seccion no tiene giros propios, hace una consulta a la base: `*[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0].categorias[].nombre` (los giros de Marketing Digital). Misma regla de «giros propios o, si no hay, los de Marketing Digital» que aplica la web.
- Primera opcion vacia: «— Sin giro (el carrusel no cambia de giro) —» (hace `unset`).
- Si el valor guardado ya no existe en la lista, lo conserva como opcion «<valor> (ya no existe)» y muestra un aviso de precaucion.
- Texto de ayuda dinamico: «Giros de esta sección.» o «Giros de Marketing Digital (esta sección no tiene giros propios cargados).»

### 5.2 Validaciones custom (todas las que hay)

1. `servicio.nombre`: unicidad ASINCRONA contra la base (consulta GROQ, comparacion exacta, excluye el propio documento en borrador y publicado). En D1 equivale a un indice UNIQUE o a una comprobacion en el servidor al guardar.
2. `contenido.imagen`: obligatoria solo si `tipoMedia === "imagen"` («Falta la imagen»).
3. `seccionContenido.backgroundImage`: obligatoria solo si el banner NO es hibrido (`escena` vacia o `"imagen"`).
4. `seccionContenido.ctaEnlace` y `ctaSimple.enlace`: regex `/^(https?:\/\/|mailto:|tel:|\/)/`; vacio es valido. Ojo: el mensaje de error solo menciona «/» y «https://», pero la regex tambien acepta `http://`, `mailto:` y `tel:`.
5. `metricasDemo.alcance`: no puede ser mayor que `visualizaciones` del mismo objeto (validacion cruzada entre hermanos).
6. `redesSociales.*` y `redesSociales.otros[].url`: `Rule.uri({ scheme: ["http", "https"], allowRelative: false })`.

Obligatorios dentro de objetos opcionales: `cuenta.testimonio` es opcional pero sus tres subcampos (`cita`, `autor`, `cargo`) son obligatorios; lo mismo `ctaPosicionDesktop` / `ctaPosicionMobile` (opcionales) con `horizontal` y `vertical` obligatorios. La regla practica para el panel: «o el objeto esta vacio, o esta completo». Como trata Sanity exactamente el caso del objeto sin crear no se verifico (ver 5.10).

Validaciones que la ayuda promete pero el esquema NO aplica: `metricasDemo.cpa` («las adquisiciones deben ser menos que los resultados»); `banners.seccionesContenido` («los 4 banners», sin min ni max); `contenido.youtubeId` / `contenido.archivoVideo` / `contenido.tipoVideo` (un contenido de tipo video puede guardarse sin fuente de video); `paginaInicio.hero.ctaPrincipalEnlace`, `ctaSecundarioEnlace` y `capacidad.enlace` (enlaces sin validar formato, a diferencia de `ctaSimple.enlace`).

### 5.3 Visibilidad condicional que un formulario generico no cubre

- **Depende del DOCUMENTO contenedor, no del objeto**: en `teamBanner`, `imagen` e `imagenMovil` se ocultan si el documento es `marketingDigitalPage`; `imagenDerecha` solo se ve en `marketingDigitalPage`; los 9 campos de TikTok y su fieldset `celular` solo se ven en `chatbotsCrmPage`. El formulario del bloque necesita saber en que pagina esta.
- Depende de hermanos: `contenido` (`tipoMedia`, `tipoVideo`), `seccionContenido` (`escena`), `achievementsBanner.segundosPorLogro` (`pasoAutomatico`).
- En Sanity un campo oculto CONSERVA su valor. Los datos pueden traer valores en campos que hoy no se ven (p. ej. `contenido.imagen` en un contenido que paso a video, `fotoPrimerPlano` en un banner que volvio a «imagen», campos TikTok en un `teamBanner`). La migracion debe copiarlos tal cual y la web decide que usar.
- `seccionContenido.backgroundImageAlt` es obligatorio SIEMPRE, incluso en banners hibridos donde `backgroundImage` esta oculto (el alt sigue visible).
- Las dos condiciones de `seccionContenido` son complementarias exactas: o se ven `fotoPrimerPlano` + `ajusteFoto` + `lineas` (hibrido) o se ve `backgroundImage`. Un banner con `escena` sin valor (items anteriores al banner hibrido) se trata como `"imagen"`.

### 5.4 Campos ocultos, de solo lectura o en desuso

- `titulo` de `marketingDigitalPage`, `traficoAdsPage`, `chatbotsCrmPage`, `asesoriasPage`: `readOnly` + `hidden`, con valor inicial fijo. `banners.titulo`: `readOnly` pero visible. `paginaInicio.titulo`: editable y sin grupo.
- `chatClientsBanner.temaChat` («hoy no se muestra») y el campo `chat` (`chatDemo`) de cada giro: la seccion ya no dibuja el telefono de WhatsApp; los datos se conservan «por si se vuelven a usar».
- Campo `metricas` (`metricasDemo`) de cada giro de `metricsClientsBanner` («hoy no se muestran»): idem.
- `reviewsBanner`: segun el comentario del esquema, antes tenia un interruptor de avance automatico y uno de velocidad; se quitaron del esquema y `scripts/ajustar-paginas.mts` borra esos valores. No verificado si queda algun documento con esos campos sueltos.
- `capacidad.icono`: las claves anteriores (estrategia / conversación / video / publicación, segun el comentario) ya no existen en la lista; un documento viejo podria conservar una, y la web la descarta (`normalizarCapacidades()` en `src/lib/sanity.ts`, segun el comentario). No se inspeccionaron los datos reales.
- `paginaInicio`: el comentario dice que la web espera ademas un campo `secciones[]` que NO esta en el esquema. La busqueda en `src/lib/sanity.ts` lo confirma: la consulta de la home lee `secciones[]` con tipos `seccionHacemos`, `seccionSocio`, `seccionPilares` y `seccionCierre`, ninguno definido en el Studio. No se puede editar desde el Studio actual; decidir si el panel nuevo lo incorpora o se elimina de la web.

### 5.5 Nombres historicos que NO se pueden renombrar sin migrar datos

- `seccionContenido`: es el `_type` de cada banner de la home (se llama «Banner» en el Studio).
- `categorias`: campo de los giros en los tres bloques de Clientes (se ve como «Giros de negocio»).
- `categoriaIcono`: `_type` de cada giro.
- `teamBanner` se titula «Equipo DOFI» pero es la portada de tres paginas distintas.
- `paginaInicio.hero` (objeto con textos y botones) y el documento `hero` (solo la foto) comparten nombre pero son cosas distintas; la web los combina en un solo Hero.
- `chatClientsBanner` y `metricsClientsBanner` usan en su preview el titulo de respaldo «Clientes y casos de éxito» (el mismo de `clientsBanner`).

### 5.6 Estructuras de datos que requieren cuidado en D1

- **Array mixto** `empresas[]` de cada giro: cada elemento es o bien una referencia a `cuenta` (`{ _type: "reference", _ref, _key }`, con `disableNew: true`: no se puede crear una cuenta desde ahi) o bien un objeto `empresaGiro` con `nombre`, `logo`, `logoCircular`. Hace falta un discriminador por elemento.
- **Referencias**: `contenido.cuenta` (obligatoria), `cuenta.servicios[]`, `empresas[]` -> `cuenta`. Sanity impide borrar un documento referenciado (referencias fuertes por defecto); el panel nuevo debe definir que pasa al borrar una cuenta o un servicio en uso.
- **Giros compartidos entre paginas**: `chatClientsBanner`, `metricsClientsBanner` y (segun las consultas de `src/lib`) las demas paginas usan los giros de `marketingDigitalPage.sections[_type == "clientsBanner"][0].categorias` cuando no tienen giros propios. Es una dependencia entre documentos que el esquema no declara.
- **Orden = posicion en el array** (`sections[]`, `seccionesContenido[]`, `capacidades[]`, `categorias[]`, `empresas[]`, `pasos[]`, `logros[]`, `mensajes[]`...). No hay campo numerico de orden; el panel debe permitir reordenar arrastrando y guardar la posicion. En `methodBanner.pasos` la posicion ademas decide el icono.
- **Colecciones con campo `orden` numerico**: `cuenta.orden`, `contenido.orden`, `resena.orden` (opcionales; pueden estar vacios o repetidos).
- **`_key`** de cada elemento de array y **`_createdAt`** de los documentos: la web usa `_key` (p. ej. en `plataformas[]`) y ordena reseñas por `orden asc, _createdAt desc`. Conviene migrarlos.
- **Borradores**: Sanity guarda borrador (`drafts.<id>`) y publicado por separado. La validacion de `servicio.nombre` lo tiene en cuenta. El panel nuevo debe decidir si mantiene el flujo borrador/publicar.
- **Slug**: `cuenta.slug` es de tipo `slug` (en los datos `{ _type: "slug", current: "..." }`), generado desde `nombre`, max 96. La unicidad no esta declarada en el esquema; depende del comportamiento por defecto del tipo `slug` de Sanity (no verificado aqui). La web busca por `slug.current`.
- **Semantica de los booleanos en las consultas de la web** (visto en `src/lib`): `cuenta` se filtra con `activa == true` y `contenido` con `publicado == true` (un valor ausente cuenta como apagado), mientras que `resena` se filtra con `activa != false` (un valor ausente cuenta como encendido). Mantener esa diferencia o normalizar en la migracion.

### 5.7 Imagenes y archivos

- **Hotspot y recorte**: los campos con `hotspot: true` guardan, ademas del archivo, un punto focal y un recorte (`hotspot { x, y, width, height }` y `crop { top, bottom, left, right }`) que la web usa al encuadrar. R2 solo guarda el archivo: esos datos deben ir a D1 y el panel necesita un selector de punto focal. Campos con hotspot: `hero.heroImage`, `cuenta.logo`, `cuenta.portada`, `contenido.imagen`, `contenido.poster`, `resena.foto`, `seccionContenido.fotoPrimerPlano`, `seccionContenido.backgroundImage`, `chatDemo.avatar`, `mensajeChat.imagen`, giro `imagen`, `logro.foto`, `videoCelular.portada`, `portadaVideo` (TikTok), e `imagen`/`imagenMovil` de `teamBanner` y `ctaBanner`.
- **Sin hotspot** (la pieza se muestra completa): `imagen`/`imagenMovil` de `aboutBanner`, `navigationBanner`, `methodBanner`, `ecosystemBanner`, `splitHeroBanner`; `splitHeroBanner.logo`; `teamBanner.imagenDerecha`; `empresaGiro.logo`; todos los `logoCircular`.
- **Tres formas distintas de guardar el texto alternativo**: (a) dentro de la imagen, `<campo>.alt` (todo lo creado con `campoImagen` y `teamBanner.imagenDerecha`); (b) campo hermano (`hero.heroImageAlt`, `seccionContenido.backgroundImageAlt`, ambos obligatorios); (c) sin alt (`cuenta.logo`, `cuenta.portada`, `logoCircular`, `contenido.imagen`, `contenido.poster`, `resena.foto`, `seccionContenido.fotoPrimerPlano`, `chatDemo.avatar`, `mensajeChat.imagen`, `empresaGiro.logo`).
- **Restricciones de tipo de archivo**: `contenido.archivoVideo` `video/mp4`; `teamBanner.video` y `videoCelular.video` `video/mp4,video/webm`; `teamBanner.imagenDerecha` `image/png`. El resto de imagenes no restringe formato (la ayuda sugiere PNG/WebP/SVG segun el caso). No hay limite de tamaño en el esquema (la ayuda recomienda videos de menos de 15 MB).
- **`logoCircular` se genera por script** (`scripts/logos-circulares.mts`) a partir del logo; el panel nuevo necesita un equivalente o un boton de «regenerar». La ayuda pide borrarlo a mano cuando cambia el logo.
- `videoCelular` muestra en su preview el nombre original del archivo (`video.asset.originalFilename`): conviene guardar el nombre original al subir a R2.

### 5.8 Singletons e incoherencias de documentacion interna

- La unicidad de los 7 documentos unicos solo la impone el menu (`documentId` fijo). El esquema no lo impide por si mismo.
- Las consultas de la web traen cada pagina con `*[_type == "X"][0]` (el primero de su tipo), no por `_id` fijo, aunque el comentario de `hero.ts` diga lo contrario. Si existiera un duplicado, la web podria tomar otro documento. En D1 basta una fila por tipo con clave unica.
- Mientras una pagina de servicio no tenga ninguna seccion activa, la web muestra un contenido de respaldo escrito en codigo (segun los comentarios: `src/lib/asesorias-respaldo.ts` y equivalentes). Lo mismo con `capacidades` vacio (5 tarjetas de fabrica), `lineas` vacio (texto de fabrica), `chat` y `metricas` vacios (ejemplos por tipo de negocio). El panel debe distinguir «vacio» de «no cargado» igual que hoy.
- El comentario de cabecera de `deskStructure.ts` y el de `sanity.config.ts` hablan de «tres secciones (Cuentas, Contenidos, Servicios)»: esta desactualizado; el menu real es el de la seccion 2.
- El comentario de `seccionContenido.ts` dice que el campo vive en `paginaInicio`; hoy vive en el documento `banners`.

### 5.9 Detalles de presentacion del Studio que conviene replicar

- Pestañas (`groups`) en `cuenta` y `paginaInicio`; fieldsets colapsables en `seccionContenido`, `teamBanner`, `clientsBanner`, `chatClientsBanner`, `metricsClientsBanner`, `achievementsBanner`, `celularesBanner`.
- Objetos colapsables: `ajusteLogos` y `videoCelular` (abiertos), `chatDemo` y `metricasDemo` (cerrados por defecto). Objetos a dos columnas: `ctaSimple`, `posicionCta`.
- Listas como botones de radio (`layout: "radio"`, a veces `direction: "horizontal"`) frente a desplegables (sin `layout`): indicado campo por campo en la seccion 3.
- `resena.estrellas` es una lista de valores NUMERICOS, no de strings.
- `resena.fecha` es texto libre; `contenido.fecha` es fecha real.
- Los valores iniciales de objetos anidados (`posicionCta`, `ajusteLogos`, `chatDemo.estado`, etc.) se aplican al crear el elemento padre; un elemento antiguo puede no tenerlos y la web usa sus propios valores por defecto.
- Las `preview` (titulo, subtitulo e imagen de cada elemento en las listas) son lo que permite reconocer cada seccion sin abrirla; estan copiadas en cada tipo de la seccion 3.

### 5.10 Lo que NO se pudo confirmar solo con el codigo leido

- El contenido real de la base (que documentos existen, si hay duplicados de singletons, si quedan campos de versiones anteriores). Este inventario describe el ESQUEMA, no los datos.
- La validacion por defecto de los tipos `url` y `slug` de Sanity (esquemas admitidos, unicidad del slug): no esta escrita en el esquema del proyecto.
- Si Sanity exige los subcampos obligatorios de un objeto opcional que nunca se creo (`cuenta.testimonio`, las dos `posicionCta` de un banner sin boton): depende del motor de validacion de Sanity, no del esquema.
- Si `scripts/ajustar-paginas.mts` y `scripts/logos-circulares.mts` siguen en uso: solo se conocen por los comentarios del esquema; no se leyeron.
- El uso exacto que la web hace de cada campo: fuera de la busqueda puntual de consultas en `src/lib`, no se leyo el codigo del sitio.
