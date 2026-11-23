# Inventario de lectura: cómo la web lee hoy el contenido de Sanity

- **Repositorio:** `C:\WEB DOFI` · rama `panel-propio-sin-sanity` · último commit leído `9b2b62c`.
- **Fecha del inventario:** 2026-11-23.
- **Para qué sirve:** sustituir la capa de datos (Sanity por HTTP + GROQ) por almacenamiento propio en Cloudflare (D1 + R2) **sin cambiar los tipos de salida** que consumen los componentes.
- **Cómo se hizo:** lectura estática del código. **No se ejecutó ningún build** ni se consultó Sanity: los modos de render de la sección 1 se deducen del código. Lo que no se pudo confirmar está en la sección 8, marcado como «SIN CONFIRMAR».
- **Las consultas GROQ están copiadas del código de forma mecánica** (un script extrae las líneas del archivo; no se reescribieron a mano). Cada consulta aparece dos veces: tal como está escrita en el archivo (con sus `${...}` de JavaScript) y ya **expandida** (con los fragmentos interpolados), que es el texto que realmente viaja a Sanity.

## Resumen rápido

- **9 funciones exportadas** consultan Sanity; todas viven en `src/lib/`. Una décima (`obtenerResenasGoogle`) lee de Google y participa de las mismas páginas.
- **8 consultas GROQ distintas**: 3 de Cuentas (`QUERY_CUENTAS_ACTIVAS`, `QUERY_SLUGS_ACTIVOS`, `QUERY_CUENTA_POR_SLUG`) y 5 de páginas (`QUERY_PAGINA_INICIO`, `QUERY_MARKETING`, `QUERY_TRAFICO`, `QUERY_FENIAX`, `QUERY_ASESORIAS`).
- **11 tipos de documento** en el Studio (`studio/schemaTypes/index.ts:38-49`): `cuenta`, `contenido`, `servicio`, `paginaInicio`, `banners`, `marketingDigitalPage`, `traficoAdsPage`, `chatbotsCrmPage`, `asesoriasPage`, `resena`, `hero`. Siete son **singleton con id fijo igual a su tipo** (`studio/deskStructure.ts:13-19`): `paginaInicio`, `hero`, `banners`, `marketingDigitalPage`, `traficoAdsPage`, `chatbotsCrmPage`, `asesoriasPage`.
- **Sin SDK en la web**: `fetch()` plano a `https://<projectId>.apicdn.sanity.io/v2024-01-01/data/query/<dataset>`, sin token ni cabeceras. `@sanity/client` solo está en `devDependencies` y lo usan los scripts de `scripts/`.
- **Toda lectura tiene respaldo en el código**: si Sanity falla o no hay variables, ninguna función lanza; devuelven contenido fijo.

---

## 1. Mapa general

No existe ningún `export const revalidate` en `src/`. El único `export const dynamic` es el de `/render-escena`. El tiempo de revalidación de las páginas con datos sale de las opciones del `fetch` (`next: { revalidate: 60 }`, `src/lib/sanity.ts:263`, `:289`, `:319`, `:375`), que Next toma como el `revalidate` de la ruta.

| Ruta de la web | Función(es) de datos | Documento(s) de Sanity | Modo de render | Respaldo si Sanity falla |
|---|---|---|---|---|
| `/` (`src/app/page.tsx`) | `getPaginaInicio()` (`page.tsx:37`). Usa solo `hero`, `capacidades` y `seccionesContenido`; `secciones` se devuelve pero **no se pinta** | `paginaInicio` (`hero{}`, `capacidades[]`, `secciones[]`), `banners` (`seccionesContenido[]`), `hero` (`heroImage`) | Sin `export const revalidate/dynamic`. Prerender + ISR de 60 s heredado del `fetch` de `sanityQuery` (`sanity.ts:375`) | `HERO_FALLBACK` (`sanity.ts:767`), `CAPACIDADES_FALLBACK` (`:791`, 5 tarjetas), `SECCIONES_CONTENIDO_FALLBACK` (`:834`, 4 banners sin imagen), `SECCIONES_FALLBACK` (`:715`) |
| `/marketing-digital` (`src/app/marketing-digital/page.tsx`) | `getPaginaMarketingDigital()` (`page.tsx:74`) → `sanityQuery` + `obtenerResenasGoogle` | `marketingDigitalPage` (`sections[]`), `resena`, `cuenta` (por referencia dentro de los giros) | Sin `export const revalidate/dynamic`. ISR 60 s heredado (el `fetch` de Google pide 21 600 s; manda el menor) | `SECCIONES_RESPALDO` (`marketing-digital.ts:224`, 7 secciones) solo si `sections[]` viene vacío o no hay respuesta |
| `/trafico-ads` (`src/app/trafico-ads/page.tsx` → `src/components/trafico/PaginaTrafico.tsx`) | `getPaginaTrafico()` (`PaginaTrafico.tsx:64`) | `traficoAdsPage`, `marketingDigitalPage` (giros de su primer `clientsBanner`), `resena`, `cuenta` (referencias) | Igual: ISR 60 s heredado | `respaldo()` (`trafico.ts:133`, 9 secciones con `COPY_TRAFICO`) cuando no queda ninguna sección válida |
| `/chatbots-crm` (`src/app/chatbots-crm/page.tsx` → `src/components/feniax/PaginaFeniax.tsx`) | `getPaginaFeniax()` (`PaginaFeniax.tsx:64`) | `chatbotsCrmPage`, `marketingDigitalPage` (giros), `resena`, `cuenta` (referencias) | Igual: ISR 60 s heredado | `respaldo()` (`feniax.ts:107`, 7 secciones con `COPY_FENIAX`) |
| `/asesorias` (`src/app/asesorias/page.tsx` → `src/components/asesorias/PaginaAsesorias.tsx`) | `getPaginaAsesorias()` (`PaginaAsesorias.tsx:78`) | `asesoriasPage`, `marketingDigitalPage` (giros y textos de su primer `clientsBanner`), `resena`, `cuenta` (referencias) | Igual: ISR 60 s heredado | `respaldo()` (`asesorias.ts:161`, 5 secciones con `COPY_ASESORIAS` e `IMAGENES_ASESORIAS`) |
| `/clientes/[slug]` (`src/app/clientes/[slug]/page.tsx`) | `generateStaticParams()` → `getAllActiveSlugs()` (`:26`); `generateMetadata()` y la página → `getAccountBySlug(slug)` (`:34`, `:61`) | `cuenta`, `contenido` (unión por `references(^._id)`), `servicio` (por referencia) | Sin `export const revalidate/dynamic/dynamicParams`. Una página por slug en el build; un slug nuevo se genera a pedido (`dynamicParams` por defecto). ISR 60 s heredado | `src/data/clients.ts` (26 cuentas). Si tampoco está ahí: `null` → `notFound()` (`:62`) |
| `/sitemap.xml` (`src/app/sitemap.ts`) | `getAllActiveSlugs()` (`sitemap.ts:26`) | `cuenta` | Sin exportaciones de segmento. ISR 60 s heredado | Slugs de `src/data/clients.ts` |
| `/render-escena` (`src/app/render-escena/page.tsx`) | `getPaginaInicio()` (`:33`), solo `seccionesContenido[].lineas` de la escena pedida | `banners` | `export const dynamic = "force-dynamic";` (`render-escena/page.tsx:18`). En producción responde 404 salvo `GRABAR_ESCENAS=1` (`:27`) | `GEOMETRIA[clave].lineasPorDefecto` (`src/remotion/home/tema.ts`) |
| `/clientes` (`src/app/clientes/page.tsx`) | Ninguna («Página en construcción») | — | Estática | — |
| `/contactanos` (`src/app/contactanos/page.tsx`) | Ninguna (el formulario es de cliente) | — | Estática | — |
| `/el-socio` (`src/app/el-socio/page.tsx`) | Ninguna («Página en construcción») | — | Estática | — |
| `/redes` (`src/app/redes/page.tsx`) | Ninguna (`perfilesRedes` de `src/config/company.ts`) | — | Estática | — |
| `/feniax` (`src/app/feniax/page.tsx`) | Ninguna: `permanentRedirect("/chatbots-crm")` (`:9`) | — | Redirección permanente | — |
| `/robots.txt` (`src/app/robots.ts`) | Ninguna (`site.isIndexable`) | — | Estática | — |
| `/api/revalidate` (`src/app/api/revalidate/route.ts`) | No lee contenido | — | Dinámica (`POST`) | — |
| `/api/contacto` (`src/app/api/contacto/route.ts`) | No lee contenido | — | Dinámica (`POST`) | — |
| `src/app/layout.tsx` | Ninguna (metadatos de `company` y `site`) | — | — | — |

**Lecturas que existen en el código pero hoy no llegan a ninguna ruta:** `getActiveAccounts()` la llaman `src/components/Clients.tsx:20` y `src/components/LogoWall.tsx:64`, pero ninguna página importa esos componentes (se retiraron del Home, ver el comentario de `src/app/page.tsx:20-34`). Lo mismo pasa con `Services`, `Socio` y `Contact`, que recibían `secciones` de `getPaginaInicio()`.

---

## 2. Funciones exportadas que consultan Sanity

### 2.0 Transporte común

- **Versión de API:** `const API_VERSION = "2024-01-01";` (`src/lib/sanity.ts:32`).
- **Host:** `https://${projectId}.apicdn.sanity.io` (la CDN de la API; `sanity.ts:70` y `:372`). Método `GET`, sin token, sin cabeceras.
- **Dos formas de armar la URL:**
  - `buildQueryUrl(projectId, dataset, query, params?)` (`sanity.ts:58-71`, no exportada): usa `URLSearchParams`; cada parámetro viaja como `$nombre=<JSON.stringify(valor)>`. La usan las tres funciones de Cuentas.
  - `sanityQuery` (`sanity.ts:372`): `?query=${encodeURIComponent(query)}`, **sin parámetros**. La usan las cinco funciones de página.
- **Forma de la respuesta:** JSON `{ result: ... }`. Todas leen solo `result`.
- **Sin borradores:** al no llevar token, la API pública solo entrega documentos publicados. Ninguna consulta filtra `drafts.` de forma explícita.
- **Selección de los singleton:** siempre `*[_type == "<tipo>"][0]` (el primero de ese tipo). **Ninguna consulta de la web filtra por `_id`**; el id fijo solo lo usan el Studio (`studio/deskStructure.ts:13-19`) y los scripts (`client.getDocument("banners")`, etc.).

### 2.1 `sanityQuery<T>(query: string): Promise<T | null>`

- **Archivo y línea:** `src/lib/sanity.ts:361-385`.
- **Consulta:** la que recibe; no tiene una propia.
- **Variables:** `SANITY_PROJECT_ID`, `SANITY_DATASET` (`:362-363`).
- **`fetch`:** `fetch(url, { next: { revalidate: 60 } })` (`:375`). Sin `tags`, sin `cache`.
- **Devuelve:** `result ?? null`.
- **Si falla:** `null` en los tres casos, siempre con `console.error` y sin lanzar: faltan variables (`:365-370`), respuesta no `ok` (`:376-378`), o cualquier excepción de red o de JSON (`:381-384`).
- **Quién la llama:** `getPaginaInicio` (`sanity.ts:1087`), `getPaginaMarketingDigital` (`marketing-digital.ts:654`), `getPaginaTrafico` (`trafico.ts:293`), `getPaginaFeniax` (`feniax.ts:265`), `getPaginaAsesorias` (`asesorias.ts:379`).

### 2.2 `getActiveAccounts(): Promise<Client[]>`

- **Archivo y línea:** `src/lib/sanity.ts:246-275`.
- **Consulta** (`QUERY_CUENTAS_ACTIVAS`, `sanity.ts:128-130`, con el fragmento `CAMPOS_CUENTA_RESUMEN`, `:118-126`). Fuente:

```ts
const CAMPOS_CUENTA_RESUMEN = `
  "slug": slug.current,
  "name": nombre,
  "summary": resumen,
  "sector": categoria,
  "logo": logo.asset->url + "?w=160&auto=format",
  "cover": portada.asset->url + "?w=1200&auto=format",
  "services": servicios[]->nombre
`;

const QUERY_CUENTAS_ACTIVAS = `*[_type == "cuenta" && activa == true] | order(orden asc){
  ${CAMPOS_CUENTA_RESUMEN}
}`;
```

Expandida:

```groq
*[_type == "cuenta" && activa == true] | order(orden asc){
  
  "slug": slug.current,
  "name": nombre,
  "summary": resumen,
  "sector": categoria,
  "logo": logo.asset->url + "?w=160&auto=format",
  "cover": portada.asset->url + "?w=1200&auto=format",
  "services": servicios[]->nombre

}
```

- **Tipo crudo:** `SanityCuentaResumen[]` (`sanity.ts:77-85`): `slug: string | null`, `name: string | null`, `summary: string | null`, `sector: string | null`, `logo: string | null`, `cover: string | null`, `services: (string | null)[] | null`.
- **Tipo de salida:** `Client[]` (`src/data/clients.ts:51-80`): `slug`, `name`, `sector`, `city`, `summary`, `services: string[]`, `logo?: string`, `cover: string`, `videos: VideoSource[]`, y los opcionales `challenge?`, `approach?`, `results?: Result[]`, `gallery?: string[]`, `testimonial?: Testimonial`, `social?: SocialLinks`.
- **Normalización** (`toAccountSummary`, `sanity.ts:157-170`):
  - Sin `name` → se descarta la cuenta.
  - `slug`: `doc.slug || slugify(doc.name)` (`slugify`, `:47-54`: minúsculas, reemplaza `áéíóúüñ`, todo lo que no sea `a-z0-9` pasa a `-`, sin guiones al principio ni al final).
  - `sector ?? ""`, `summary ?? ""`, `city: ""` (el resumen no trae ciudad), `videos: []`.
  - `services`: se quitan los `null` (referencias a un servicio borrado).
  - `logo ?? undefined`; `cover ?? "/media/cover-16-9.jpg"`.
- **`fetch`:** `next: { revalidate: 60 }` (`:260-264`). Sin `tags`.
- **Si falla:** devuelve `clientesRespaldo` (el arreglo `clients` de `src/data/clients.ts`) en cuatro casos: faltan variables (`:250-255`), respuesta no `ok` o excepción (`:271-274`), o la lista normalizada queda vacía (`:270`).
- **Quién la llama:** `src/components/Clients.tsx:20`, `src/components/LogoWall.tsx:64` (hoy no se pintan en ninguna ruta).

### 2.3 `getAllActiveSlugs(): Promise<string[]>`

- **Archivo y línea:** `src/lib/sanity.ts:278-300`.
- **Consulta** (`QUERY_SLUGS_ACTIVOS`, `sanity.ts:132`):

```groq
*[_type == "cuenta" && activa == true].slug.current
```

- **Tipo crudo:** `(string | null)[]`.
- **Tipo de salida:** `string[]`.
- **Normalización:** se quitan los valores vacíos (`:293`). **No hay `order`**: el orden es el que devuelva la API.
- **`fetch`:** `next: { revalidate: 60 }` (`:289`).
- **Si falla:** `clientesRespaldo.map((c) => c.slug)` si faltan variables (`:282-284`), si la respuesta falla (`:296-299`) o si la lista queda vacía (`:295`).
- **Quién la llama:** `generateStaticParams` de `src/app/clientes/[slug]/page.tsx:26` y `src/app/sitemap.ts:26`.

### 2.4 `getAccountBySlug(slug: string): Promise<Client | null>`

- **Archivo y línea:** `src/lib/sanity.ts:308-330`.
- **Consulta** (`QUERY_CUENTA_POR_SLUG`, `sanity.ts:134-155`). Parámetro `$slug` (`buildQueryUrl(..., { slug })`, `:316`). Fuente:

```ts
const QUERY_CUENTA_POR_SLUG = `*[_type == "cuenta" && activa == true && slug.current == $slug][0]{
  ${CAMPOS_CUENTA_RESUMEN},
  "city": ciudad,
  "challenge": reto,
  "approach": enfoque,
  "results": resultados[]{ "valor": valor, "etiqueta": etiqueta },
  "testimonial": testimonio{ "cita": cita, "autor": autor, "cargo": cargo },
  "social": redes,
  "cover": portada.asset->url + "?w=1600&auto=format",
  "contenidos": *[_type == "contenido" && references(^._id) && publicado == true] | order(orden asc){
    _id,
    "titulo": titulo,
    "tipoMedia": tipoMedia,
    "imagenUrl": imagen.asset->url + "?w=1200&auto=format",
    "tipoVideo": tipoVideo,
    "youtubeId": youtubeId,
    "videoUrl": archivoVideo.asset->url,
    "posterUrl": poster.asset->url + "?w=1200&auto=format",
    "formatoVideo": formatoVideo,
    "relacionAspecto": relacionAspecto
  }
}`;
```

Expandida:

```groq
*[_type == "cuenta" && activa == true && slug.current == $slug][0]{
  
  "slug": slug.current,
  "name": nombre,
  "summary": resumen,
  "sector": categoria,
  "logo": logo.asset->url + "?w=160&auto=format",
  "cover": portada.asset->url + "?w=1200&auto=format",
  "services": servicios[]->nombre
,
  "city": ciudad,
  "challenge": reto,
  "approach": enfoque,
  "results": resultados[]{ "valor": valor, "etiqueta": etiqueta },
  "testimonial": testimonio{ "cita": cita, "autor": autor, "cargo": cargo },
  "social": redes,
  "cover": portada.asset->url + "?w=1600&auto=format",
  "contenidos": *[_type == "contenido" && references(^._id) && publicado == true] | order(orden asc){
    _id,
    "titulo": titulo,
    "tipoMedia": tipoMedia,
    "imagenUrl": imagen.asset->url + "?w=1200&auto=format",
    "tipoVideo": tipoVideo,
    "youtubeId": youtubeId,
    "videoUrl": archivoVideo.asset->url,
    "posterUrl": poster.asset->url + "?w=1200&auto=format",
    "formatoVideo": formatoVideo,
    "relacionAspecto": relacionAspecto
  }
}
```

  Nota literal: la proyección define `"cover"` dos veces (con `?w=1200` dentro de `CAMPOS_CUENTA_RESUMEN` y con `?w=1600` más abajo). Vale la segunda.

- **Tipo crudo:** `SanityCuentaCompleta | null` (`sanity.ts:100-114`) = `SanityCuentaResumen` más `city`, `challenge`, `approach`, `results: { valor, etiqueta }[] | null`, `testimonial: { cita, autor, cargo } | null`, `social: { instagram?, facebook?, tiktok?, sitioWeb?, otros?: { etiqueta, url }[] } | null`, `contenidos: SanityContenido[] | null`.
  `SanityContenido` (`:87-98`): `_id`, `titulo`, `tipoMedia: "imagen" | "video" | null`, `imagenUrl`, `tipoVideo: "youtube" | "archivo" | null`, `youtubeId`, `videoUrl`, `posterUrl`, `formatoVideo`, `relacionAspecto: "16/9" | "9/16" | "1/1" | null`.
- **Tipo de salida:** `Client | null` (mismo tipo que 2.2, ahora con los campos de la página individual).
- **Normalización** (`toAccountFull`, `sanity.ts:186-238`, y `toContenidoVideo`, `:172-184`):
  - Sin `name` → `null` (y la página hace `notFound()`; **no** cae al respaldo local en este caso).
  - `videos`: contenidos con `tipoMedia === "video"`. Cada uno: `src` = `youtubeId` si `tipoVideo === "youtube"`, si no `videoUrl`; sin `src` se descarta. `id: c._id`, `title: titulo ?? ""`, `format: formatoVideo ?? ""`, `kind: "youtube" | "file"`, `poster: posterUrl ?? "/media/cover-16-9.jpg"`, `ratio: relacionAspecto ?? "16/9"`.
  - `gallery`: las `imagenUrl` de los contenidos con `tipoMedia === "imagen"`; `undefined` si no hay ninguna.
  - `results`: solo los que traen `valor` **y** `etiqueta` → `{ value, label }`; `undefined` si no queda ninguno.
  - `testimonial`: solo si vienen `cita`, `autor` **y** `cargo` → `{ quote, author, role }`.
  - `social`: copia de `redes`, pasando cada `null` a `undefined`. `otros` se pasa tal cual.
  - `city ?? ""`, `challenge ?? undefined`, `approach ?? undefined`, `cover ?? "/media/cover-16-9.jpg"`.
- **`fetch`:** `next: { revalidate: 60 }` (`:319`).
- **Si falla:** `clientesRespaldo.find((c) => c.slug === slug) ?? null` cuando faltan variables (`:312-314`), cuando `result` es `null` (cuenta inexistente o inactiva, `:323`) y ante error (`:326-329`).
- **Quién la llama:** `src/app/clientes/[slug]/page.tsx:34` y `:61`.

### 2.5 `getPaginaInicio()`

- **Archivo y línea:** `src/lib/sanity.ts:1081-1114`.
- **Firma de salida:** `Promise<{ secciones: SeccionData[]; hero: HeroContent; capacidades: Capacidad[]; seccionesContenido: SeccionContenido[] }>`.
- **Consulta** (`QUERY_PAGINA_INICIO`, `sanity.ts:647-710`; no tiene interpolaciones, así que fuente y expandida son el mismo texto). Los comentarios `//` forman parte de la cadena y viajan a Sanity:

```groq
{
  "pagina": *[_type == "paginaInicio"][0]{
    titulo,
    secciones[]{
      _type,
      _type == "seccionHacemos" => { titulo, subtitulo, tarjetas[]{ titulo, descripcion } },
      _type == "seccionSocio" => { nombre, descripcion, "foto": foto.asset->url },
      _type == "seccionPilares" => { titulo, listaHerramientas[]{ nombre, icono } },
      _type == "seccionCierre" => { titulo, textoBoton, enlace }
    },
    hero{
      titulo,
      marca,
      mensaje,
      ctaPrincipalTexto,
      ctaPrincipalEnlace,
      ctaSecundarioTexto,
      ctaSecundarioEnlace
    },
    capacidades[]{
      titulo,
      descripcion,
      icono,
      activa,
      enlace
    },
  },
  "bannersDoc": *[_type == "banners"][0]{
    seccionesContenido[]{
      "id": _key,
      // 2400 (no 1400 como cuando era una tarjeta): el banner ocupa el
      // ancho completo del viewport, asi que necesita bastante mas
      // resolucion para no verse blando en pantallas grandes/retina.
      "backgroundImage": backgroundImage.asset->url + "?w=2400&auto=format",
      "backgroundImageAlt": coalesce(backgroundImageAlt, ""),
      "hotspot": backgroundImage.hotspot{ x, y },
      "ancho": backgroundImage.asset->metadata.dimensions.width,
      "alto": backgroundImage.asset->metadata.dimensions.height,
      escena,
      lineas,
      ajusteFoto,
      "foto": fotoPrimerPlano{
        "url": asset->url + "?w=1600&auto=format",
        "ancho": asset->metadata.dimensions.width,
        "alto": asset->metadata.dimensions.height,
        "hotspot": hotspot{ x, y }
      },
      ctaTexto,
      ctaEnlace,
      ctaColor,
      ctaPosicionDesktop{ horizontal, vertical, desplazamientoX, desplazamientoY },
      ctaPosicionMobile{ horizontal, vertical, desplazamientoX, desplazamientoY }
    }
  },
  "heroDoc": *[_type == "hero"][0]{
    // 2400 (antes 1600): "Corrección Hero final" hace que la imagen pase de
    // ocupar ~45vw (columna derecha) a llenar todo el contenedor del Hero
    // (hasta 1320px de ancho real) -- 1600 se quedaba corto para pantallas
    // retina a ese tamaño mayor.
    "imagen": heroImage.asset->url + "?w=2400&auto=format",
    "imagenAlt": coalesce(heroImageAlt, ""),
    "hotspot": heroImage.hotspot{ x, y }
  }
}
```

- **Tipo crudo:** `{ pagina: PaginaInicioRaw | null; bannersDoc: BannersDocRaw; heroDoc: HeroDocRaw }` (`sanity.ts:1087-1091`).
  - `PaginaInicioRaw` (`:630-635`): `titulo`, `secciones: SeccionRaw[] | null`, `hero: HeroRaw`, `capacidades: CapacidadRaw[] | null`. (`titulo` se pide y no se usa.)
  - `SeccionRaw` (`:565-576`): `_type: string` y, opcionales, `titulo`, `subtitulo`, `tarjetas: { titulo, descripcion }[]`, `nombre`, `descripcion`, `foto`, `listaHerramientas: { nombre, icono }[]`, `textoBoton`, `enlace`.
  - `HeroRaw` (`:578-586`): `titulo`, `marca`, `mensaje`, `ctaPrincipalTexto`, `ctaPrincipalEnlace`, `ctaSecundarioTexto`, `ctaSecundarioEnlace` (todos `string | null`), o `null`.
  - `HeroDocRaw` (`:591-595`): `imagen: string | null`, `imagenAlt: string | null`, `hotspot: { x, y } | null`, o `null`.
  - `CapacidadRaw` (`:597-603`): `titulo`, `descripcion`, `icono`, `activa: boolean | null`, `enlace`.
  - `BannersDocRaw` (`:640`): `{ seccionesContenido: SeccionContenidoRaw[] | null } | null`.
  - `SeccionContenidoRaw` (`:612-628`): `id`, `backgroundImage`, `backgroundImageAlt`, `hotspot`, `ancho`, `alto`, `escena`, `lineas: (string | null)[] | null`, `foto: { url, ancho, alto, hotspot } | null`, `ajusteFoto`, `ctaTexto`, `ctaEnlace`, `ctaColor`, `ctaPosicionDesktop: PosicionCtaRaw`, `ctaPosicionMobile: PosicionCtaRaw`.
  - `PosicionCtaRaw` (`:605-610`): `horizontal`, `vertical`, `desplazamientoX`, `desplazamientoY`, o `null`.
- **Tipos de salida** (todos exportados desde `src/lib/sanity.ts` y usados por los componentes):
  - `SeccionData` (`:411-414`) = `SeccionHacemosData` (`_type: "seccionHacemos"`, `titulo`, `subtitulo`, `tarjetas: { titulo, descripcion }[]`) | `SeccionSocioData` (`_type: "seccionSocio"`, `nombre`, `descripcion`, `foto`) | `SeccionCierreData` (`_type: "seccionCierre"`, `titulo`, `textoBoton`, `enlace`).
  - `HeroContent` (`:426-440`): `titulo`, `marca`, `mensaje`, `imagen: string | null`, `imagenAlt`, `hotspot: { x, y } | null`, `ctaPrincipalTexto`, `ctaPrincipalEnlace`, `ctaSecundarioTexto`, `ctaSecundarioEnlace`.
  - `Capacidad` (`:448-453`): `titulo`, `descripcion`, `icono: IconoCapacidad` (`"social" | "ads" | "growth" | "rescue" | "academia"`, `:446`), `enlace: string | null`.
  - `SeccionContenido` (`:523-555`): `id`, `backgroundImage: string | null`, `backgroundImageAlt`, `hotspot`, `ancho: number | null`, `alto: number | null`, `cta: CtaBanner | null`, `escena: ClaveEscena | null`, `lineas: string[]`, `foto: FotoPrimerPlano | null`, `ajusteFoto: "cubrir" | "completa"`.
  - `CtaBanner` (`:503-513`): `texto`, `enlace`, `esExterno: boolean`, `color: ColorCta` (`"naranja" | "morado" | "blanco" | "oscuro"`), `desktop: PosicionCta`, `mobile: PosicionCta`.
  - `PosicionCta` (`:489-498`): `horizontal` (`"izquierda" | "centro-izquierda" | "centro" | "centro-derecha" | "derecha"`), `vertical` (`"arriba" | "centro-arriba" | "centro" | "centro-abajo" | "abajo"`), `desplazamientoX`, `desplazamientoY`.
  - `FotoPrimerPlano` (`:516-521`): `url`, `ancho`, `alto`, `hotspot`.
  - `ClaveEscena` (`src/remotion/home/tema.ts:29`): `"redes" | "pauta" | "crm" | "asesorias"`.
- **Normalización:**
  - **`secciones`** (`normalizarSeccion`, `:1023-1067`): `seccionHacemos` exige `titulo`, `subtitulo` y al menos una tarjeta con `titulo` y `descripcion`; `seccionSocio` exige `nombre`, `descripcion` y `foto`; `seccionCierre` exige `titulo`, `textoBoton` y `enlace`. `seccionPilares` y cualquier otro `_type` se descartan con `console.error`. Después (`:1101-1107`) se agregan **al final** las secciones de `SECCIONES_FALLBACK` cuyo `_type` no llegó: `[...validas, ...faltantes]`.
  - **`hero`** (`normalizarHero`, `:939-959`): `imagen = heroDoc?.imagen ?? null`; `imagenAlt ?? ""`; `hotspot` solo si hay imagen y hotspot. Si `hero` es `null` o **no trae `titulo`**, todo el texto y los botones salen de `HERO_FALLBACK` (la imagen se conserva). Si trae `titulo`, cada uno de los demás campos cae a `HERO_FALLBACK` solo si es `null`/`undefined` (`??`).
  - **`capacidades`** (`normalizarCapacidades`, `:964-979`): fuera las `activa === false`; se exige `titulo`, `descripcion` e `icono` dentro de los 5 válidos (`:919-925`); `enlace ?? null`. Si no queda ninguna → `CAPACIDADES_FALLBACK` completo.
  - **`seccionesContenido`** (`normalizarSeccionesContenido`, `:997-1018`): se conserva el item que tenga `backgroundImage` **o** una `escena` válida. `` id: s.id ?? `banner-${i}` ``; `ancho`/`alto` solo si son números mayores que 0; `lineas`: se recortan los espacios y se quitan las vacías; `foto` solo si hay `escena` y trae `url`, `ancho > 0` y `alto > 0` (`normalizarFoto`, `:988-991`); `ajusteFoto`: `"completa"` o, por defecto, `"cubrir"`. Si no queda ninguno → `SECCIONES_CONTENIDO_FALLBACK` (4 items, ids `banner-respaldo-1` a `banner-respaldo-4`).
  - **CTA del banner** (`normalizarCtaBanner`, `:900-917`): sin `ctaTexto` o sin `ctaEnlace` (ya recortados) → `null`. `esExterno = !enlace.startsWith("/")`. `color` fuera de los 4 válidos → `"naranja"`.
  - **Posición del CTA** (`normalizarPosicionCta`, `:883-896`): valores desconocidos → `horizontal: "centro"`, `vertical: "abajo"`. Desplazamientos (`desplazamientoValido`, `:878-881`): no numérico → `0`; se acota a `[-30, 30]`.
- **`fetch`:** el de `sanityQuery`: `next: { revalidate: 60 }`, sin `tags`.
- **Si falla:** `sanityQuery` devuelve `null` y la función entrega los cuatro respaldos (`SECCIONES_FALLBACK`, `HERO_FALLBACK`, `CAPACIDADES_FALLBACK`, `SECCIONES_CONTENIDO_FALLBACK`). Nunca lanza.
- **Quién la llama:** `src/app/page.tsx:37`, `src/app/render-escena/page.tsx:33`.

### 2.6 `getPaginaMarketingDigital(): Promise<{ secciones: SeccionMarketing[] }>`

- **Archivo y línea:** `src/lib/marketing-digital.ts:652-668`.
- **Fragmentos GROQ exportados** que reutilizan las otras páginas (`marketing-digital.ts:308`, `:312`, `:314`, `:318`):

```ts
export const TIKTOK_GROQ = `"videoUrl": video.asset->url, ajusteVideo, sonidoVideo, usuarioTikTok, descripcionVideo, meGusta, comentarios, compartidos`;
export const AJUSTE_LOGOS_GROQ = `ajusteLogos{ forma, tamano, tamanoMovil }`;
export const IMG = `"url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt`;
export const LOGO = `"logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url`;
```

- **Consulta** (`QUERY_MARKETING`, `marketing-digital.ts:320-351`). Fuente:

```ts
const QUERY_MARKETING = `{
  "pagina": *[_type == "marketingDigitalPage"][0]{
    sections[]{
      _type, _key, activo, subtitulo, titulo, descripcion, destacado, animar,
      cta{ texto, enlace },
      "imagen": imagen{ ${IMG} },
      "imagenMovil": imagenMovil{ ${IMG} },
      _type in ["teamBanner", "ctaBanner"] => { alineacion, overlay },
      _type == "teamBanner" => { "imagenDerecha": imagenDerecha{ ${IMG} } },
      _type == "methodBanner" => { mostrarPasos, pasos[]{ titulo, descripcion } },
      _type == "clientsBanner" => {
        "giros": categorias[]{
          _key, nombre, icono,
          "imagen": imagen{ ${IMG} },
          "empresas": empresas[]{
            _key,
            defined(_ref) => @->{ nombre, activa, ${LOGO} },
            !defined(_ref) => { nombre, ${LOGO} }
          }
        },
        rotacionAutomatica,
        ${AJUSTE_LOGOS_GROQ}
      },
      _type == "reviewsBanner" => { enlaceGoogle, cantidadMostrada }
    }
  },
  "resenas": *[_type == "resena" && activa != false] | order(orden asc, _createdAt desc){
    "id": _id, nombre, empresa, estrellas, comentario, fecha,
    "foto": foto.asset->url + "?w=160&h=160&fit=crop&auto=format",
    "enlace": enlaceOriginal
  }
}`;
```

Expandida:

```groq
{
  "pagina": *[_type == "marketingDigitalPage"][0]{
    sections[]{
      _type, _key, activo, subtitulo, titulo, descripcion, destacado, animar,
      cta{ texto, enlace },
      "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
      "imagenMovil": imagenMovil{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
      _type in ["teamBanner", "ctaBanner"] => { alineacion, overlay },
      _type == "teamBanner" => { "imagenDerecha": imagenDerecha{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt } },
      _type == "methodBanner" => { mostrarPasos, pasos[]{ titulo, descripcion } },
      _type == "clientsBanner" => {
        "giros": categorias[]{
          _key, nombre, icono,
          "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
          "empresas": empresas[]{
            _key,
            defined(_ref) => @->{ nombre, activa, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url },
            !defined(_ref) => { nombre, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url }
          }
        },
        rotacionAutomatica,
        ajusteLogos{ forma, tamano, tamanoMovil }
      },
      _type == "reviewsBanner" => { enlaceGoogle, cantidadMostrada }
    }
  },
  "resenas": *[_type == "resena" && activa != false] | order(orden asc, _createdAt desc){
    "id": _id, nombre, empresa, estrellas, comentario, fecha,
    "foto": foto.asset->url + "?w=160&h=160&fit=crop&auto=format",
    "enlace": enlaceOriginal
  }
}
```

- **Tipo crudo:** `RespuestaRaw` (`:422-436`): `pagina: { sections?: SeccionRaw[] | null } | null` y `resenas: { id?, nombre?, empresa?, estrellas?, comentario?, foto?, enlace?, fecha? }[] | null`.
  - `SeccionRaw` (`:389-420`, exportado): `_type`, `_key`, `activo`, `subtitulo`, `titulo`, `descripcion`, `destacado`, `animar`, `cta: { texto?, enlace? }`, `imagen`, `imagenMovil`, `imagenDerecha`, `portadaVideo` (los cuatro `ImgRaw`), `ajusteLogos: { forma?, tamano?, tamanoMovil? }`, `alineacion`, `overlay`, `mostrarPasos`, `pasos: { titulo?, descripcion? }[]`, `giros: GiroRaw[]`, `rotacionAutomatica`, `videoUrl`, `ajusteVideo`, `sonidoVideo`, `usuarioTikTok`, `descripcionVideo`, `meGusta`, `comentarios`, `compartidos`, `enlaceGoogle`, `cantidadMostrada`.
  - `ImgRaw` (`:360-363`, exportado): `{ url?, ancho?, alto?, hotspot?: { x, y } | null, alt? } | null | undefined`.
  - `GiroRaw` (`:379-385`, exportado): `{ _key?, nombre?, icono?, imagen?: ImgRaw, empresas?: EmpresaRaw[] | null } | null`.
  - `EmpresaRaw` (`:368-376`): `{ _key?, nombre?, activa?, logo?, ancho?, alto?, logoCircular? } | null`.
- **Tipo de salida:** `SeccionMarketing` (`:192-199`), unión discriminada por `tipo` (que es el `_type` de Sanity):
  - `Base` (`:146-156`, exportado como `BaseSeccion`): `key`, `imagen: ImagenSanity | null`, `imagenMovil: ImagenSanity | null`, `subtitulo`, `titulo`, `descripcion`, `destacado`, `cta: CtaSimple`, `animar: boolean`.
  - `SeccionEquipo` (`:158-171`): `Base` + `tipo: "teamBanner"`, `alineacion`, `overlay`, `imagenDerecha?`, `video?: VideoSeccion | null`, `portadaVideo?`, `tiktok?: PerfilTikTok`.
  - `SeccionQueEs` (`:172`): `Base` + `tipo: "aboutBanner"`.
  - `SeccionNavegacion` (`:173`): `Base` + `tipo: "navigationBanner"`.
  - `SeccionMetodo` (`:174`): `Base` + `tipo: "methodBanner"`, `pasos: PasoMetodo[]`, `mostrarPasos`.
  - `SeccionClientes` (`:175-182`): `Base` + `tipo: "clientsBanner"`, `giros: GiroNegocio[]`, `rotacionAutomatica`, `ajusteLogos: AjusteLogos`.
  - `SeccionResenas` (`:183-189`): `Base` + `tipo: "reviewsBanner"`, `enlaceGoogle`, `resenas: Resena[]`, `cantidadMostrada: number | null`.
  - `SeccionCierre` (`:190`): `Base` + `tipo: "ctaBanner"`, `alineacion`, `overlay`.
  - Tipos de apoyo: `ImagenSanity` (`:36-45`: `url`, `ancho`, `alto`, `hotspot`, `alt`), `CtaSimple` (`:47`: `{ texto, enlace } | null`), `Overlay` (`:48`), `Alineacion` (`:49`), `PasoMetodo` (`:50`), `IconoCategoria` (`:52-66`, 12 valores), `EmpresaGiro` (`:72-80`: `key`, `nombre`, `logo: { url, ancho, alto } | null`, `logoCircular: string | null`), `GiroNegocio` (`:84-91`: `key`, `nombre`, `icono`, `imagen`, `empresas`), `VideoSeccion` (`:98`: `url`, `ajuste`, `sonido`), `PerfilTikTok` (`:104-110`), `AjusteLogos` (`:129`: `forma`, `tamano`, `tamanoMovil`), `Resena` (`:132-142`: `id`, `nombre`, `foto`, `empresa`, `estrellas`, `comentario`, `enlace`, `fecha`).
- **Normalización** (funciones exportadas que reutilizan las otras tres páginas):
  - `t(v)` (`:442`): texto recortado; lo que no es `string` pasa a `""`. `bool(v, porDefecto)` (`:443-444`). `unoDe(v, validos, porDefecto)` (`:446-448`).
  - `imagen(raw, ancho, altPorDefecto)` (`:452-461`): sin `url`, `ancho` o `alto` → `null`. La URL de salida es `` `${raw.url}?w=${ancho}&auto=format` ``; `alt` recortado o el alt por defecto.
  - `camposBase(raw, altFoto)` (`:477-490`): `key = _key || _type`; `imagen` a 2400 y `imagenMovil` a 1200 (con `titulo` como alt si `altFoto`); `cta` solo si trae `texto` **y** `enlace` (`:464-468`); `animar` por defecto `true`.
  - `normalizarSeccion(raw, resenas)` (`:560-627`): `activo === false` → `null`. Por `_type`:
    - `teamBanner`: `alineacion` (`ALINEACIONES`, por defecto `"izquierda"`), `overlay` (`OVERLAYS`, por defecto `"medio"`), `imagenDerecha` a 1600, `video` (`normalizarVideo`, `:520-524`: sin `videoUrl` → `null`; `ajuste` por defecto `"rellenar"`; `sonido` por defecto `false`), `portadaVideo` a 900, `tiktok` (`normalizarTikTok`, `:533-543`: quita las `@` del principio y vuelve a poner una; contadores enteros `>= 0` o los de `TIKTOK_POR_DEFECTO`, `:114-120`). **En esta consulta no se piden ni el video ni `portadaVideo`**: en `/marketing-digital` siempre salen `video: null`, `portadaVideo: null` y `tiktok` por defecto.
    - `ctaBanner`: `alineacion` por defecto `"centro"`, `overlay` por defecto `"medio"`.
    - `aboutBanner`, `navigationBanner`: solo `camposBase(raw, false)`.
    - `methodBanner`: `mostrarPasos` por defecto `true`; `pasos` recortados, se descartan los que no tienen `titulo`.
    - `clientsBanner`: `giros = normalizarGiros(raw.giros)`; **`cta` siempre `null`**; `rotacionAutomatica` por defecto `true`; `ajusteLogos` (`normalizarAjusteLogos`, `:551-558`: `forma` `"original"` o, por defecto, `"circular"`; `tamano` redondeado y acotado a 72–180, por defecto 120; `tamanoMovil` acotado a 56–140, por defecto 92).
    - `reviewsBanner`: `cantidadMostrada` entero `> 0` o `null`; `enlaceGoogle` o `company.location.mapsUrl`; `resenas` recortadas a `cantidadMostrada`.
    - Otro `_type` → `null` (se ignora sin romper).
  - `normalizarGiros(raw)` (`:498-518`): fuera los giros sin `nombre`. `` key = _key || `giro-${i}` ``; `icono` solo si está en `ICONOS_CATEGORIA`, si no `null`; `imagen` a 1200 con el nombre como alt. Empresas: fuera las que no tienen `nombre` (referencia a una Cuenta borrada) y las de `activa === false`; `` key = _key || `${i}-${j}` ``; `logo` solo con `logo`, `ancho` y `alto` → `` `${logo}?w=360&fit=max&auto=format` ``; `logoCircular` → `` `${logoCircular}?w=320&auto=format` `` o `null`.
  - `normalizarResenas(raw)` (`:632-645`): se exige `nombre`, `comentario` y `estrellas` numérico. `id = id || nombre`; `estrellas` redondeado y acotado a 1–5; `foto`, `enlace` y `fecha` a `null` si vienen vacíos. `fecha` es un `string` libre en el Studio (`studio/schemaTypes/resena.ts:68-70`) y se pasa tal cual.
  - **Prioridad de reseñas** (`:657-658`): si `obtenerResenasGoogle()` devuelve al menos una, se usan esas; si no, las de Sanity. Nunca se mezclan.
- **`fetch`:** el de `sanityQuery` (`revalidate: 60`) y, en paralelo (`Promise.all`, `:653-656`), el de Google (`revalidate: 21600`).
- **Si falla o `sections[]` viene vacío** (`:660-663`): `SECCIONES_RESPALDO` (`:224-297`), inyectando las reseñas en la sección de reseñas (`conDatos`, `:647-650`). **Diferencia con las otras tres páginas:** si el documento tiene secciones pero todas están apagadas, esta página queda **vacía** (no cae al respaldo).

### 2.7 `getPaginaTrafico(): Promise<PaginaTrafico>`

- **Archivo y línea:** `src/lib/trafico.ts:291-305`.
- **Fragmento compartido de giros** (`GIRO_GROQ`, `src/lib/giros.ts:14-20`):

```ts
export const GIRO_GROQ = `_key, nombre, icono,
  "imagen": imagen{ ${IMG} },
  "empresas": empresas[]{
    _key,
    defined(_ref) => @->{ nombre, activa, ${LOGO} },
    !defined(_ref) => { nombre, ${LOGO} }
  }`;
```

- **Consulta** (`QUERY_TRAFICO`, `trafico.ts:183-207`, con `METRICAS`, `:178-181`). Fuente:

```ts
const METRICAS = `"metricas": metricas{
  campana, objetivo, resultado, adquisicion, inversion, cpr, ctr, cpa, alcance, visualizaciones, nota,
  "hitos": hitos[]{ dia, texto }
}`;

const QUERY_TRAFICO = `{
  "pagina": *[_type == "traficoAdsPage"][0]{
    sections[]{
      _type, _key, activo, subtitulo, titulo, descripcion, destacado, animar,
      cta{ texto, enlace },
      "imagen": imagen{ ${IMG} },
      "imagenMovil": imagenMovil{ ${IMG} },
      _type in ["teamBanner", "ctaBanner"] => { alineacion, overlay },
      _type == "methodBanner" => { mostrarPasos, pasos[]{ titulo, descripcion } },
      _type == "platformsBanner" => { plataformas[]{ _key, nombre, etiqueta, descripcion, icono } },
      _type == "metricsClientsBanner" => {
        "giros": categorias[]{ ${GIRO_GROQ}, ${METRICAS} },
        rotacionAutomatica,
        ${AJUSTE_LOGOS_GROQ}
      },
      _type == "reviewsBanner" => { enlaceGoogle, cantidadMostrada }
    }
  },
  "girosMarketing": *[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0].categorias[]{ ${GIRO_GROQ} },
  "resenas": *[_type == "resena" && activa != false] | order(orden asc, _createdAt desc){
    "id": _id, nombre, empresa, estrellas, comentario, fecha,
    "foto": foto.asset->url + "?w=160&h=160&fit=crop&auto=format",
    "enlace": enlaceOriginal
  }
}`;
```

Expandida:

```groq
{
  "pagina": *[_type == "traficoAdsPage"][0]{
    sections[]{
      _type, _key, activo, subtitulo, titulo, descripcion, destacado, animar,
      cta{ texto, enlace },
      "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
      "imagenMovil": imagenMovil{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
      _type in ["teamBanner", "ctaBanner"] => { alineacion, overlay },
      _type == "methodBanner" => { mostrarPasos, pasos[]{ titulo, descripcion } },
      _type == "platformsBanner" => { plataformas[]{ _key, nombre, etiqueta, descripcion, icono } },
      _type == "metricsClientsBanner" => {
        "giros": categorias[]{ _key, nombre, icono,
  "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
  "empresas": empresas[]{
    _key,
    defined(_ref) => @->{ nombre, activa, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url },
    !defined(_ref) => { nombre, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url }
  }, "metricas": metricas{
  campana, objetivo, resultado, adquisicion, inversion, cpr, ctr, cpa, alcance, visualizaciones, nota,
  "hitos": hitos[]{ dia, texto }
} },
        rotacionAutomatica,
        ajusteLogos{ forma, tamano, tamanoMovil }
      },
      _type == "reviewsBanner" => { enlaceGoogle, cantidadMostrada }
    }
  },
  "girosMarketing": *[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0].categorias[]{ _key, nombre, icono,
  "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
  "empresas": empresas[]{
    _key,
    defined(_ref) => @->{ nombre, activa, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url },
    !defined(_ref) => { nombre, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url }
  } },
  "resenas": *[_type == "resena" && activa != false] | order(orden asc, _createdAt desc){
    "id": _id, nombre, empresa, estrellas, comentario, fecha,
    "foto": foto.asset->url + "?w=160&h=160&fit=crop&auto=format",
    "enlace": enlaceOriginal
  }
}
```

- **Tipo crudo:** `RespuestaTrafico` (`trafico.ts:220-224`): `pagina: { sections?: SeccionTraficoRaw[] | null } | null`, `girosMarketing: GiroRaw[] | null`, `resenas`.
  - `SeccionTraficoRaw` (`:215-218`) = `SeccionRaw` + `plataformas?: PlataformaRaw[]` + `giros?: GiroMetricasRaw[]`.
  - `PlataformaRaw` (`:213`): `{ _key?, nombre?, etiqueta?, descripcion?, icono? } | null`.
  - `GiroMetricasRaw` (`:211`) = `GiroRaw` + `metricas?: MetricasRaw` (`src/lib/metricas-demo.ts:250-263`: `campana`, `objetivo`, `resultado`, `adquisicion`, `inversion`, `cpr`, `ctr`, `cpa`, `alcance`, `visualizaciones`, `hitos: { dia, texto }[]`, `nota`).
- **Tipo de salida:** `PaginaTrafico` (`:112`) = `{ secciones: SeccionTrafico[] }`. `SeccionTrafico` (`:99-108`) = `SeccionEquipo | SeccionQueEs | SeccionNavegacion | SeccionMetodo | SeccionPlataformas | SeccionEcosistema | SeccionClientesMetricas | SeccionResenas | SeccionCierre`.
  - `SeccionPlataformas` (`:83`): `BaseSeccion` + `tipo: "platformsBanner"`, `plataformas: Plataforma[]` (`:74-81`: `key`, `nombre`, `etiqueta`, `descripcion`, `icono: IconoPlataforma`; `ICONOS_PLATAFORMA`, `:61-71`, 9 valores).
  - `SeccionEcosistema` (`:84`): `BaseSeccion` + `tipo: "ecosystemBanner"`.
  - `SeccionClientesMetricas` (`:88-97`): `BaseSeccion` + `tipo: "metricsClientsBanner"`, `giros: GiroConMetricas[]` (`GiroNegocio` + `metricas: MetricasDemo`), `rotacionAutomatica`, `ajusteLogos`.
- **Normalización** (`normalizarSeccionTrafico`, `:254-289`): `activo === false` → `null`.
  - `platformsBanner`: `normalizarPlataformas` (`:230-240`): fuera las que no tienen `nombre`; `` key = _key || `plataforma-${i}` ``; `icono` desconocido → `"web"`.
  - `ecosystemBanner`: `camposBase(raw, true)`.
  - `metricsClientsBanner`: `giros = girosConMetricas(raw.giros)` y, **si no tiene giros propios, los de Marketing Digital** (`girosMarketing`); `cta: null`; `rotacionAutomatica` por defecto `true`.
  - Resto: `normalizarSeccion` de Marketing; se descarta `clientsBanner`.
  - `girosConMetricas` (`:246-252`): `normalizarGiros` + `metricas = normalizarMetricas(crudo.metricas, metricasParaGiro(nombre, icono))`. `normalizarMetricas` (`metricas-demo.ts:272-305`): cada número debe ser `> 0` o se usa el de la plantilla; si `alcance > visualizaciones` se usan los dos de la plantilla; `ctr` con tope 100; `hitos` con `dia` entre 2 y 29 y `texto`, ordenados, **máximo 4**; textos vacíos → plantilla.
- **`fetch`:** `sanityQuery` (60 s) + Google (21 600 s), en paralelo (`:292-295`).
- **Si falla o no queda ninguna sección válida** (`:304`): `respaldo(girosMarketing, resenas)` (`:133-172`), 9 secciones con los textos de `COPY_TRAFICO` (`src/lib/trafico-respaldo.ts`) y la imagen `IMAGEN_CIERRE_SOCIOS` (`/cierre/socios.webp`) en el cierre.

### 2.8 `getPaginaFeniax(): Promise<PaginaFeniax>`

- **Archivo y línea:** `src/lib/feniax.ts:263-277`.
- **Consulta** (`QUERY_FENIAX`, `feniax.ts:150-174`, con `CHAT`, `:148`). Fuente:

```ts
const CHAT = `negocio, estado, "avatar": avatar.asset->url, "mensajes": mensajes[]{ de, texto, "imagen": imagen.asset->url }, aviso{ titulo, texto }`;

const QUERY_FENIAX = `{
  "pagina": *[_type == "chatbotsCrmPage"][0]{
    sections[]{
      _type, _key, activo, subtitulo, titulo, descripcion, destacado, animar,
      cta{ texto, enlace },
      "imagen": imagen{ ${IMG} },
      "imagenMovil": imagenMovil{ ${IMG} },
      _type in ["teamBanner", "ctaBanner"] => { alineacion, overlay },
      _type == "teamBanner" => { ${TIKTOK_GROQ}, "portadaVideo": portadaVideo{ ${IMG} } },
      _type == "methodBanner" => { mostrarPasos, pasos[]{ titulo, descripcion } },
      _type == "chatClientsBanner" => {
        "giros": categorias[]{ ${GIRO_GROQ}, "chat": chat{ ${CHAT} } },
        rotacionAutomatica, temaChat,
        ${AJUSTE_LOGOS_GROQ}
      },
      _type == "reviewsBanner" => { enlaceGoogle, cantidadMostrada }
    }
  },
  "girosMarketing": *[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0].categorias[]{ ${GIRO_GROQ} },
  "resenas": *[_type == "resena" && activa != false] | order(orden asc, _createdAt desc){
    "id": _id, nombre, empresa, estrellas, comentario, fecha,
    "foto": foto.asset->url + "?w=160&h=160&fit=crop&auto=format",
    "enlace": enlaceOriginal
  }
}`;
```

Expandida:

```groq
{
  "pagina": *[_type == "chatbotsCrmPage"][0]{
    sections[]{
      _type, _key, activo, subtitulo, titulo, descripcion, destacado, animar,
      cta{ texto, enlace },
      "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
      "imagenMovil": imagenMovil{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
      _type in ["teamBanner", "ctaBanner"] => { alineacion, overlay },
      _type == "teamBanner" => { "videoUrl": video.asset->url, ajusteVideo, sonidoVideo, usuarioTikTok, descripcionVideo, meGusta, comentarios, compartidos, "portadaVideo": portadaVideo{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt } },
      _type == "methodBanner" => { mostrarPasos, pasos[]{ titulo, descripcion } },
      _type == "chatClientsBanner" => {
        "giros": categorias[]{ _key, nombre, icono,
  "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
  "empresas": empresas[]{
    _key,
    defined(_ref) => @->{ nombre, activa, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url },
    !defined(_ref) => { nombre, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url }
  }, "chat": chat{ negocio, estado, "avatar": avatar.asset->url, "mensajes": mensajes[]{ de, texto, "imagen": imagen.asset->url }, aviso{ titulo, texto } } },
        rotacionAutomatica, temaChat,
        ajusteLogos{ forma, tamano, tamanoMovil }
      },
      _type == "reviewsBanner" => { enlaceGoogle, cantidadMostrada }
    }
  },
  "girosMarketing": *[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0].categorias[]{ _key, nombre, icono,
  "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
  "empresas": empresas[]{
    _key,
    defined(_ref) => @->{ nombre, activa, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url },
    !defined(_ref) => { nombre, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url }
  } },
  "resenas": *[_type == "resena" && activa != false] | order(orden asc, _createdAt desc){
    "id": _id, nombre, empresa, estrellas, comentario, fecha,
    "foto": foto.asset->url + "?w=160&h=160&fit=crop&auto=format",
    "enlace": enlaceOriginal
  }
}
```

- **Tipo crudo:** `RespuestaFeniax` (`feniax.ts:190-194`): `pagina`, `girosMarketing`, `resenas`.
  - `SeccionFeniaxRaw` (`:188`) = `SeccionRaw` + `giros?: GiroChatRaw[]` + `temaChat?`.
  - `GiroChatRaw` (`:186`) = `GiroRaw` + `chat?: ChatRaw`. `ChatRaw` (`:178-184`): `negocio`, `estado`, `avatar`, `mensajes: { de?, texto?, imagen? }[]`, `aviso: { titulo?, texto? }`.
- **Tipo de salida:** `PaginaFeniax` (`:86`) = `{ secciones: SeccionFeniax[] }`. `SeccionFeniax` (`:75-82`) = `SeccionEquipo | SeccionQueEs | SeccionNavegacion | SeccionMetodo | SeccionClientesChat | SeccionResenas | SeccionCierre`.
  - `SeccionClientesChat` (`:63-73`): `BaseSeccion` + `tipo: "chatClientsBanner"`, `ajusteLogos`, `giros: GiroConChat[]` (`GiroNegocio` + `chat: ChatDemo`), `rotacionAutomatica`, `temaChat: "claro" | "oscuro"`.
  - `ChatDemo` (`src/lib/chat-demo.ts:37-47`): `negocio`, `estado`, `avatar: string | null`, `icono`, `mensajes: MensajeChat[]` (`de: "cliente" | "negocio"`, `texto`, `imagen: string | null`), `aviso: { titulo, texto } | null`.
- **Normalización** (`normalizarSeccionFeniax`, `:235-261`): `activo === false` → `null`.
  - `chatClientsBanner`: `giros = girosConChat(raw.giros)` y, **si no tiene giros propios, los de Marketing Digital**; `cta: null`; `temaChat`: `"oscuro"` o, por defecto, `"claro"`.
  - Resto: `normalizarSeccion` de Marketing; se descarta `clientsBanner`. El `teamBanner` de esta página sí pide el video (`TIKTOK_GROQ`) y `portadaVideo`.
  - `normalizarChat` (`:203-223`): `de` es `"negocio"` solo si llega exactamente ese valor, si no `"cliente"`; la imagen del mensaje recibe `?w=640&auto=format`; se quitan los mensajes sin texto ni imagen. **Con menos de 2 mensajes se usa la plantilla entera** del tipo de negocio (`plantillaParaGiro`, `chat-demo.ts:233-238`). `estado` por defecto `"en línea"`; `avatar` recibe `?w=120&h=120&fit=crop&auto=format`; `aviso` solo si trae `titulo`.
- **`fetch`:** `sanityQuery` (60 s) + Google (21 600 s), en paralelo (`:264-267`).
- **Si falla o no queda ninguna sección válida** (`:276`): `respaldo(girosMarketing, resenas)` (`:107-141`), 7 secciones con `COPY_FENIAX` (`src/lib/feniax-respaldo.ts`).
- **Derivado en el componente:** `PaginaFeniax.tsx:70-74` arma las conversaciones del celular de la portada con `{ clave: g.key, chat: g.chat }` de cada giro.

### 2.9 `getPaginaAsesorias(): Promise<{ secciones: SeccionAsesorias[] }>`

- **Archivo y línea:** `src/lib/asesorias.ts:377-401`.
- **Consulta** (`QUERY_ASESORIAS`, `asesorias.ts:223-261`, con `CELULAR`, `:221`). Fuente:

```ts
const CELULAR = `"url": video.asset->url, titulo, "portada": portada{ ${IMG} }`;

const QUERY_ASESORIAS = `{
  "pagina": *[_type == "asesoriasPage"][0]{
    sections[]{
      _type, _key, activo, subtitulo, titulo, descripcion, destacado, animar,
      cta{ texto, enlace },
      "imagen": imagen{ ${IMG} },
      "imagenMovil": imagenMovil{ ${IMG} },
      _type in ["teamBanner", "ctaBanner"] => { alineacion, overlay },
      _type == "methodBanner" => { mostrarPasos, pasos[]{ titulo, descripcion } },
      _type == "splitHeroBanner" => { "logo": logo{ ${IMG} } },
      _type == "clientsBanner" => {
        "giros": categorias[]{ ${GIRO_GROQ} },
        rotacionAutomatica,
        ${AJUSTE_LOGOS_GROQ}
      },
      _type == "celularesBanner" => {
        "izquierdo": celularIzquierdo{ ${CELULAR} },
        "central": celularCentral{ ${CELULAR} },
        "derecho": celularDerecho{ ${CELULAR} }
      },
      _type == "achievementsBanner" => {
        "logros": logros[]{ _key, titulo, texto, etiqueta, nombre, firma, "foto": foto{ ${IMG} } },
        pasoAutomatico,
        segundosPorLogro
      },
      _type == "reviewsBanner" => { enlaceGoogle, cantidadMostrada }
    }
  },
  "girosMarketing": *[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0].categorias[]{ ${GIRO_GROQ} },
  "clientesMarketing": *[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0]{
    subtitulo, titulo, descripcion, rotacionAutomatica,
    ${AJUSTE_LOGOS_GROQ}
  },
  "resenas": *[_type == "resena" && activa != false] | order(orden asc, _createdAt desc){
    "id": _id, nombre, empresa, estrellas, comentario, fecha,
    "foto": foto.asset->url + "?w=160&h=160&fit=crop&auto=format",
    "enlace": enlaceOriginal
  }
}`;
```

Expandida:

```groq
{
  "pagina": *[_type == "asesoriasPage"][0]{
    sections[]{
      _type, _key, activo, subtitulo, titulo, descripcion, destacado, animar,
      cta{ texto, enlace },
      "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
      "imagenMovil": imagenMovil{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
      _type in ["teamBanner", "ctaBanner"] => { alineacion, overlay },
      _type == "methodBanner" => { mostrarPasos, pasos[]{ titulo, descripcion } },
      _type == "splitHeroBanner" => { "logo": logo{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt } },
      _type == "clientsBanner" => {
        "giros": categorias[]{ _key, nombre, icono,
  "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
  "empresas": empresas[]{
    _key,
    defined(_ref) => @->{ nombre, activa, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url },
    !defined(_ref) => { nombre, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url }
  } },
        rotacionAutomatica,
        ajusteLogos{ forma, tamano, tamanoMovil }
      },
      _type == "celularesBanner" => {
        "izquierdo": celularIzquierdo{ "url": video.asset->url, titulo, "portada": portada{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt } },
        "central": celularCentral{ "url": video.asset->url, titulo, "portada": portada{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt } },
        "derecho": celularDerecho{ "url": video.asset->url, titulo, "portada": portada{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt } }
      },
      _type == "achievementsBanner" => {
        "logros": logros[]{ _key, titulo, texto, etiqueta, nombre, firma, "foto": foto{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt } },
        pasoAutomatico,
        segundosPorLogro
      },
      _type == "reviewsBanner" => { enlaceGoogle, cantidadMostrada }
    }
  },
  "girosMarketing": *[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0].categorias[]{ _key, nombre, icono,
  "imagen": imagen{ "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, "hotspot": hotspot{ x, y }, "alt": alt },
  "empresas": empresas[]{
    _key,
    defined(_ref) => @->{ nombre, activa, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url },
    !defined(_ref) => { nombre, "logo": logo.asset->url, "ancho": logo.asset->metadata.dimensions.width, "alto": logo.asset->metadata.dimensions.height, "logoCircular": logoCircular.asset->url }
  } },
  "clientesMarketing": *[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0]{
    subtitulo, titulo, descripcion, rotacionAutomatica,
    ajusteLogos{ forma, tamano, tamanoMovil }
  },
  "resenas": *[_type == "resena" && activa != false] | order(orden asc, _createdAt desc){
    "id": _id, nombre, empresa, estrellas, comentario, fecha,
    "foto": foto.asset->url + "?w=160&h=160&fit=crop&auto=format",
    "enlace": enlaceOriginal
  }
}
```

- **Tipo crudo:** `RespuestaAsesorias` (`asesorias.ts:287-292`): `pagina`, `girosMarketing`, `clientesMarketing: SeccionAsesoriasRaw | null`, `resenas`.
  - `SeccionAsesoriasRaw` (`:277-285`) = `SeccionRaw` + `logo?: ImgRaw`, `izquierdo?`, `central?`, `derecho?` (`CelularRaw`, `:275`: `{ url?, titulo?, portada?: ImgRaw } | null`), `logros?: LogroRaw[]` (`:265-273`: `_key`, `titulo`, `texto`, `etiqueta`, `nombre`, `firma`, `foto: ImgRaw`), `pasoAutomatico?`, `segundosPorLogro?`.
- **Tipo de salida:** `SeccionAsesorias` (`:110-119`) = `SeccionPortadaAsesorias | SeccionCelulares | SeccionQueEs | SeccionNavegacion | SeccionMetodo | SeccionClientes | SeccionLogros | SeccionResenas | SeccionCierre`.
  - `SeccionPortadaAsesorias` (`:88`): `BaseSeccion` + `tipo: "splitHeroBanner"`, `logo: ImagenSanity | null`.
  - `SeccionLogros` (`:90-95`): `BaseSeccion` + `tipo: "achievementsBanner"`, `logros: Logro[]` (`:78-86`: `key`, `titulo`, `texto`, `etiqueta`, `nombre`, `firma`, `foto`), `pasoAutomatico`, `segundosPorLogro`.
  - `SeccionCelulares` (`:103-108`): `BaseSeccion` + `tipo: "celularesBanner"`, `izquierdo`, `central`, `derecho` (`VideoCelular`, `:99`: `url: string | null`, `titulo`, `portada: ImagenSanity | null`).
  - `CasoExito` (`:66-74`) está exportado pero no lo produce esta función.
- **Normalización** (`normalizarSeccionAsesorias`, `:325-375`): `activo === false` → `null`.
  - `splitHeroBanner`: `logo` a 1400.
  - `clientsBanner`: `normalizarSeccion` de Marketing y, **si no tiene giros propios, los de Marketing Digital**.
  - `celularesBanner`: `cta: null`; cada celular (`celular`, `:301-304`): `url` o `null`, `titulo`, `portada` a 800. Un celular sin video se conserva.
  - `achievementsBanner`: `cta: null`; `logros` (`normalizarLogros`, `:306-318`): fuera los que no tienen `titulo`; `` key = _key || `logro-${i}` ``; `foto` a 1100 con alt `nombre: titulo`. `pasoAutomatico` por defecto `true`. `segundosPorLogro` (`segundos`, `:321-323`): número `>= 4` → redondeado con tope 30; si no, 6.
  - Resto: `normalizarSeccion` de Marketing; se descarta `teamBanner`.
  - `clientesMarketing` (`:385-394`) solo se usa dentro de `respaldo()`.
- **`fetch`:** `sanityQuery` (60 s) + Google (21 600 s), en paralelo (`:378-381`).
- **Si falla o no queda ninguna sección válida** (`:400`): `respaldo(girosMarketing, marketing)` (`:161-214`), 5 secciones con `COPY_ASESORIAS` y las imágenes locales de `IMAGENES_ASESORIAS` (rutas `/asesorias/<archivo>`).

### 2.10 `obtenerResenasGoogle(): Promise<Resena[] | null>` (no consulta Sanity)

Se documenta porque decide qué reseñas muestran las cuatro páginas de servicio.

- **Archivo y línea:** `src/lib/google-places.ts:64-92`.
- **Origen:** `https://maps.googleapis.com/maps/api/place/details/json?place_id=...&fields=reviews&language=es&key=...` (`:70`).
- **Variables:** `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`.
- **`fetch`:** `next: { revalidate: 60 * 60 * 6 }` (`:29`, `:71`).
- **Salida:** `Resena[]` con `` id: `google-${r.time ?? i}` ``, `empresa: ""`, `foto: profile_photo_url`, `enlace: author_url`, `fecha: relative_time_description`. Máximo 5 (límite de Google).
- **Si falla:** `null` (sin variables, HTTP no `ok`, `status !== "OK"`, sin reseñas válidas, o excepción).

---

## 3. Imágenes y archivos

### 3.1 Cómo se construye cada URL

**A. La consulta GROQ ya devuelve la URL con sus parámetros** (concatenación `asset->url + "?..."`):

| Campo de Sanity | Proyección | Dónde |
|---|---|---|
| `cuenta.logo` | `logo.asset->url + "?w=160&auto=format"` | `sanity.ts:123` |
| `cuenta.portada` (resumen) | `portada.asset->url + "?w=1200&auto=format"` | `sanity.ts:124` |
| `cuenta.portada` (página individual) | `portada.asset->url + "?w=1600&auto=format"` | `sanity.ts:142` |
| `contenido.imagen` | `imagen.asset->url + "?w=1200&auto=format"` | `sanity.ts:147` |
| `contenido.poster` | `poster.asset->url + "?w=1200&auto=format"` | `sanity.ts:151` |
| `contenido.archivoVideo` (archivo `video/mp4`) | `archivoVideo.asset->url` (sin parámetros) | `sanity.ts:150` |
| `paginaInicio.secciones[seccionSocio].foto` | `foto.asset->url` (sin parámetros) | `sanity.ts:653` |
| `banners.seccionesContenido[].backgroundImage` | `backgroundImage.asset->url + "?w=2400&auto=format"`, más `backgroundImage.hotspot{ x, y }` y `backgroundImage.asset->metadata.dimensions.width/height` | `sanity.ts:680-684` |
| `banners.seccionesContenido[].fotoPrimerPlano` | `asset->url + "?w=1600&auto=format"`, `asset->metadata.dimensions.width/height`, `hotspot{ x, y }` | `sanity.ts:688-693` |
| `hero.heroImage` | `heroImage.asset->url + "?w=2400&auto=format"`, `heroImage.hotspot{ x, y }`, `coalesce(heroImageAlt, "")` | `sanity.ts:706-708` |
| `resena.foto` | `foto.asset->url + "?w=160&h=160&fit=crop&auto=format"` | `marketing-digital.ts:348`, `trafico.ts:204`, `feniax.ts:171`, `asesorias.ts:258` |

**B. La consulta devuelve la URL limpia y el normalizador le agrega los parámetros:**

| Origen | Fragmento GROQ | Parámetros que agrega el código | Dónde |
|---|---|---|---|
| `imagen` de sección | `IMG` (`marketing-digital.ts:314`): `url`, `ancho`, `alto`, `hotspot{ x, y }`, `alt` | `?w=2400&auto=format` | `camposBase`, `marketing-digital.ts:481` |
| `imagenMovil` de sección | `IMG` | `?w=1200&auto=format` | `marketing-digital.ts:482` |
| `imagenDerecha` (`teamBanner`) | `IMG` | `?w=1600&auto=format` | `marketing-digital.ts:572` |
| `portadaVideo` (`teamBanner` de ChatBots/CRM) | `IMG` | `?w=900&auto=format` | `marketing-digital.ts:575` |
| `imagen` de un giro | `IMG` | `?w=1200&auto=format` | `marketing-digital.ts:505` |
| `logo` (`splitHeroBanner`) | `IMG` | `?w=1400&auto=format` | `asesorias.ts:335` |
| `portada` de un celular | `IMG` | `?w=800&auto=format` | `asesorias.ts:303` |
| `foto` de un logro | `IMG` | `?w=1100&auto=format` | `asesorias.ts:316` |
| `logo` de una empresa de giro | `LOGO` (`marketing-digital.ts:318`): `logo`, `ancho`, `alto` | `?w=360&fit=max&auto=format` | `marketing-digital.ts:513` |
| `logoCircular` de una empresa | `LOGO`: `logoCircular` | `?w=320&auto=format` | `marketing-digital.ts:515` |
| `chat.avatar` | `CHAT` (`feniax.ts:148`): `avatar.asset->url` | `?w=120&h=120&fit=crop&auto=format` | `feniax.ts:218` |
| `chat.mensajes[].imagen` | `CHAT`: `imagen.asset->url` | `?w=640&auto=format` | `feniax.ts:208` |
| `video` (`teamBanner` de ChatBots/CRM) | `TIKTOK_GROQ` (`marketing-digital.ts:308`): `"videoUrl": video.asset->url` | ninguno | `normalizarVideo`, `marketing-digital.ts:520-524` |
| `video` de un celular | `CELULAR` (`asesorias.ts:221`): `"url": video.asset->url` | ninguno (el componente agrega `#t=0.1` si no hay portada, `TresCelulares.tsx:72`) | `asesorias.ts:301-304` |

**C. En el render, `next/image` vuelve a escribir la URL** con el cargador (3.2).

**D. Los scripts arman la URL a partir del `_ref` del asset:** `` `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dim}.${ext}` `` (`scripts/logos-circulares.mts:65`) y, con recorte de la CDN, `?rect=x,y,ancho,alto&fm=png` (`scripts/ajustar-2026-10-16.mts:78`).

**Lo que NO se usa en la web:** `crop` (el recorte del Studio), `lqip`, `blurDataURL`, `placeholder="blur"`, `@sanity/image-url` y cualquier campo llamado `fileAsset`. Del `hotspot` solo se leen `x` e `y` (0–1), que los componentes convierten en `object-position` (por ejemplo `Hero.tsx:78-80`, `ContentBanner.tsx:183-185`, `BannerHibrido.tsx:61-63`). `metadata` solo se usa para `dimensions.width/height`.

### 3.2 `src/lib/cargador-imagenes.ts`

Es el `loaderFile` de `next/image` (`next.config.ts:11-12`). Firma: `cargadorImagenes({ src, width, quality })`.

1. Si `src` **no empieza con `https://cdn.sanity.io/`**, devuelve `src` sin tocar (`:24`). Eso incluye todo `/public`.
2. Si la URL ya traía `w` **y** `h`, recalcula `h` en proporción: `Math.round((width * altoPrevio) / anchoPrevio)` (`:28-30`).
3. `w = width` (pisa el `?w=` que venía de la consulta o del normalizador) (`:31`).
4. `q = quality ?? 75` (`:32`).
5. `auto = format` (`:33`).
6. `fit = max` solo si la URL no traía otro `fit` (`:34`).

**Anchos:** el cargador no fija ninguno; recibe los que genera Next para el `srcset`. `next.config.ts` no define `deviceSizes` ni `imageSizes`, así que rigen los valores por defecto de Next (en Next 15: `deviceSizes` 640, 750, 828, 1080, 1200, 1920, 2048, 3840 e `imageSizes` 16, 32, 48, 64, 96, 128, 256, 384; no se comprobó contra un build).

### 3.3 Dominios permitidos (`next.config.ts`)

- `images.loader: "custom"`, `images.loaderFile: "./src/lib/cargador-imagenes.ts"` (`next.config.ts:11-12`).
- `images.remotePatterns`: una sola entrada, `{ protocol: "https", hostname: "cdn.sanity.io" }` (`next.config.ts:15-20`).
- No hay `domains`, `formats`, `deviceSizes`, `imageSizes` ni `unoptimized` global.

### 3.4 Componentes que usan `next/image` con URLs de Sanity

| Componente | Línea | Qué imagen |
|---|---|---|
| `src/components/Hero.tsx` | `:91`, `:126` | `hero.heroImage` (dos copias: escritorio y teléfono) |
| `src/components/ContentBanner.tsx` | `:192` | `backgroundImage` del banner sin escena |
| `src/components/home/BannerHibrido.tsx` | `:69` | `fotoPrimerPlano` o la de fábrica; `unoptimized={foto.url.startsWith("/")}` (`:75`) |
| `src/components/marketing/BannerFoto.tsx` | `:69`, `:72` (`getImageProps`), `:189` (`<Image>`) | `imagen`, `imagenMovil`, `imagenDerecha`; `unoptimized` si la URL empieza con `/` |
| `src/components/marketing/FotoFondo.tsx` | `:19`, `:21` (`getImageProps`) | `imagen`, `imagenMovil` de fondo |
| `src/components/marketing/PiezaCompleta.tsx` | `:36`, `:55` (`getImageProps`) | pieza gráfica completa, con `width`/`height` reales |
| `src/app/clientes/[slug]/page.tsx` | `:191`, `:276` | `client.cover` y cada imagen de `client.gallery` |
| `src/components/VideoTile.tsx` | `:33` | `video.poster` |
| `src/components/ClientCard.tsx` | `:27` | `client.cover` (hoy sin ruta que lo pinte) |
| `src/components/SocioPortrait.tsx` | `:46` | foto de `seccionSocio` (hoy sin ruta que lo pinte) |

Solo con imágenes locales: `src/components/Wordmark.tsx:68`, `src/app/redes/page.tsx:55`.

**`<img>` y `<video>` normales con URLs de Sanity (no pasan por el cargador; se pide la URL exacta que armó la consulta o el normalizador):**

- `src/components/marketing/LogoRedondo.tsx:42` (`logoCircular`), `:50` (`logo.url`).
- `src/components/marketing/CarruselGiros.tsx:186`, `:243`, `:622`; `src/components/marketing/ClientesLogos.tsx:102` (fotos de giro y logos de empresas).
- `src/components/marketing/ResenasCarrusel.tsx:76` (`r.foto`: de Sanity o la foto de perfil de Google).
- `src/components/asesorias/AsesoriasPortada.tsx:115` (`logo.url`), `:164`, `:166` (`imagenMovil.url`, `imagen.url`).
- `src/components/asesorias/LogrosAsesorias.tsx:78`, `:141` (`foto.url`; la segunda es una precarga con `new Image()`).
- `src/components/asesorias/TresCelulares.tsx:69-73` (`<video src>` y `poster`).
- `src/components/marketing/VideoTikTok.tsx:291-294` (`<video src>` y `poster`).
- `src/components/VideoTile.tsx:63-66` (`<video src>` del archivo de `contenido`).
- `src/remotion/feniax/ChatWhatsApp.tsx:83`, `:237` (`<Img>` de Remotion: avatar e imagen del mensaje).
- `src/components/LogoWall.tsx:123` (`cuenta.logo`; hoy sin ruta que lo pinte).

### 3.5 Archivos de `public/` que funcionan como respaldo

| Archivo | Respaldo de | Referenciado en |
|---|---|---|
| `public/media/cover-16-9.jpg` | portada de cuenta y póster de video sin imagen; portada de todas las cuentas locales | `sanity.ts:167`, `:181`, `:229`; `src/data/clients.ts` |
| `public/media/cover-9-16.jpg` | pósters verticales de las cuentas locales | `src/data/clients.ts` |
| `public/media/socio-retrato.jpg` | foto de `seccionSocio` | `sanity.ts:744` |
| `public/home/banner-redes-foto.webp`, `banner-pauta-foto.webp`, `banner-crm-foto.webp`, `banner-asesorias-foto.webp` | foto de primer plano de cada banner híbrido (`fotoRespaldo`) | `src/remotion/home/tema.ts:67`, `:79`, `:91`, `:103` |
| `public/home/escenas/<escena>-<hash>.webm`, `-movil.webm`, `.webp` (12 archivos) | video grabado y primer cuadro de cada escena | `src/remotion/home/videos.json` |
| `public/cierre/socios.webp` | imagen del cierre en Tráfico, ChatBots/CRM y Asesorías | `src/lib/cierre-socios.ts:17` |
| `public/asesorias/rescatando-emprendedores.webp`, `emprendedores.webp`, `logro-construccion.webp`, `logro-salud.webp`, `logro-gastronomia.webp`, `logro-comercio.webp` | logo, portada y fotos de logros de Asesorías | `src/lib/asesorias-respaldo.ts:22-38` |
| `public/feniax/demo/*.jpg` (8 archivos) | fotos de las conversaciones de plantilla | `src/lib/chat-demo.ts:52` |

Otros archivos de `public/` no son respaldo de Sanity sino material fijo de componentes: `public/feniax/*.svg`, `flujo-feniax.jpg/.mp4`, `crm-crecimiento.jpg/.mp4`, `public/trafico/ecosistema.jpg/.mp4`, `public/marcas/*.png`, `public/home/mascota-dofi.webp` y `public/asesorias/rescatando-emprendedores-1400.webp` (los usa la escena de Asesorías, `src/remotion/home/EscenaAsesorias.tsx:29` y `:34`) y los `logo-dofi*`. `public/asesorias/caso-construccion.webp`, `caso-gastronomia.webp` y `caso-retail.webp` no están referenciados en `src/` ni en `scripts/`.

Los `.mp4` que nombra `src/data/clients.ts` (`/videos/dukare-spot.mp4`, etc.) **no existen** en `public/videos/` (solo hay un `LEEME.txt`).

---

## 4. Revalidación

### 4.1 Qué hace `POST /api/revalidate` (`src/app/api/revalidate/route.ts`)

- **Método:** solo `POST` (`:27`).
- **Secreto:** lo recibe por la URL, `?secret=...` (`:29`), y lo compara con `process.env.SANITY_REVALIDATE_SECRET` (`:28`). Si la variable no está definida o no coinciden: `401` con `{ revalidated: false, error: "Secreto invalido o no configurado" }` (`:31-36`).
- **Qué revalida:** una sola llamada, `revalidatePath("/", "layout")` (`:38`): invalida todo el árbol de rutas. **No usa tags** (`revalidateTag` no aparece en el proyecto) y **no lee el cuerpo** del pedido: no mira qué documento cambió ni verifica firma.
- **Respuesta:** `{ revalidated: true, now: Date.now() }` (`:40`).
- **Quién lo llama:** un webhook configurado en `manage.sanity.io` (fuera del repositorio), según el comentario de `:5-12`, al crear, editar o borrar `cuenta`, `contenido` y `servicio`. El comentario de `:14-20` deja como **pendiente** sumar `hero` y `paginaInicio`. Ningún archivo de `src/` ni de `scripts/` llama a este endpoint. `studio/README.md:31` documenta la misma URL.

### 4.2 Cómo se cachea hoy cada lectura

| Lectura | Opciones de `fetch` | Tags | Línea |
|---|---|---|---|
| `getActiveAccounts` | `next: { revalidate: 60 }` | ninguno | `sanity.ts:260-264` |
| `getAllActiveSlugs` | `next: { revalidate: 60 }` | ninguno | `sanity.ts:289` |
| `getAccountBySlug` | `next: { revalidate: 60 }` | ninguno | `sanity.ts:319` |
| `sanityQuery` (las 5 páginas) | `next: { revalidate: 60 }` | ninguno | `sanity.ts:375` |
| `obtenerResenasGoogle` | `next: { revalidate: 21600 }` | ninguno | `google-places.ts:71` |

Además, el host es `apicdn.sanity.io`, que tiene su propia caché del lado de Sanity.

No hay `unstable_cache`, `cache: "no-store"`, `cache: "force-cache"`, `revalidateTag` ni `export const revalidate` en ningún archivo de `src/`.

**Cloudflare:** `open-next.config.ts:10` usa `defineCloudflareConfig()` sin argumentos (no declara caché incremental, caché de tags ni cola de revalidación; el comentario de `:3-9` lo dice: «Si mas adelante se necesita cache incremental (ISR) o cola de revalidacion, se configuran aqui»). `wrangler.jsonc` solo enlaza `ASSETS` y `WORKER_SELF_REFERENCE`: **no hay R2, KV ni D1**. Ver sección 8, punto 11.

---

## 5. Variables de entorno

Todas las apariciones de `process.env.*` en `src/`, `scripts/` y `studio/`. Solo nombres.

| Variable | Dónde se lee | Build o ejecución | Pública o secreta |
|---|---|---|---|
| `SANITY_PROJECT_ID` | `src/lib/sanity.ts:247`, `:279`, `:309`, `:362`; todos los scripts de Sanity | Ejecución en el servidor (Worker). También durante el build, al prerenderizar y en `generateStaticParams`. Declarada en `wrangler.jsonc` → `vars` y `previews.vars` | No es secreta (identificador), pero es solo de servidor |
| `SANITY_DATASET` | `src/lib/sanity.ts:248`, `:280`, `:310`, `:363`; scripts | Igual que la anterior | No es secreta; solo de servidor |
| `SANITY_REVALIDATE_SECRET` | `src/app/api/revalidate/route.ts:28` | Ejecución | **Secreta** (Secret del Worker, no va en `wrangler.jsonc`) |
| `SANITY_WRITE_TOKEN` | Solo scripts (`scripts/*.mts`, `*.mjs`, `seed-sanity-accounts.ts`) | Local, en la máquina (`.env.local`) | **Secreta**. La web no la usa |
| `SANITY_AUTH_TOKEN` | `scripts/crear-esqueleto-paginas-servicio.mjs:25` (alternativa a la anterior) | Local | **Secreta**. No está en `.env.example` |
| `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET` | `studio/sanity.config.ts:16-17`, `studio/sanity.cli.ts:13-14` | Build del Studio (proyecto aparte) | Públicas (quedan en el bundle del Studio) |
| `GOOGLE_PLACES_API_KEY` | `src/lib/google-places.ts:65` | Ejecución | **Secreta** |
| `GOOGLE_PLACE_ID` | `src/lib/google-places.ts:66` | Ejecución | No es secreta; solo de servidor |
| `CONTACT_WEBHOOK_URL` | `src/lib/contact/delivery.ts:80`, `:92` | Ejecución | Tratar como secreta |
| `CONTACT_WEBHOOK_TOKEN` | `src/lib/contact/delivery.ts:110` | Ejecución | **Secreta** |
| `NEXT_PUBLIC_SITE_URL` | `src/config/site.ts:73` | Build (queda escrita en el bundle) | Pública |
| `NEXT_PUBLIC_COMPANY_WHATSAPP` | `src/config/company.ts:40` | Build | Pública |
| `NEXT_PUBLIC_COMPANY_PHONE` | `src/config/company.ts:45` | Build | Pública |
| `NEXT_PUBLIC_COMPANY_EMAIL` | `src/config/company.ts:97` | Build | Pública |
| `NEXT_PUBLIC_COMPANY_ADDRESS` | `src/config/company.ts:109` | Build | Pública |
| `NEXT_PUBLIC_COMPANY_MAPS_URL` | `src/config/company.ts:116` | Build | Pública. No está en `.env.example` |
| `NEXT_PUBLIC_FACEBOOK_URL` | `src/config/company.ts:60` | Build | Pública |
| `NEXT_PUBLIC_INSTAGRAM_URL` | `src/config/company.ts:61` | Build | Pública |
| `NEXT_PUBLIC_TIKTOK_URL` | `src/config/company.ts:62` | Build | Pública |
| `NEXT_PUBLIC_LINKEDIN_URL` | `src/config/company.ts:63` | Build | Pública |
| `NODE_ENV` | `src/app/render-escena/page.tsx:27` | Build y ejecución (la pone Next) | Pública |
| `GRABAR_ESCENAS` | `src/app/render-escena/page.tsx:27` | Ejecución, solo local para grabar | No es secreta |
| `GRABAR_BASE_URL` | `scripts/grabar-escenas.mjs:48` | Local | No es secreta |
| `WORKERS_CI`, `WORKERS_CI_BRANCH` | `scripts/cf-deploy.mjs:31-32` | Build en Cloudflare (las define Cloudflare) | No son secretas |

`src/config/company.ts:20` nombra `process.env.NEXT_PUBLIC_X` dentro de un comentario: no es una variable real.

Nombres que declara `.env.example`: `NEXT_PUBLIC_SITE_URL`, `CONTACT_WEBHOOK_URL`, `CONTACT_WEBHOOK_TOKEN`, `NEXT_PUBLIC_COMPANY_WHATSAPP`, `NEXT_PUBLIC_COMPANY_PHONE`, `NEXT_PUBLIC_COMPANY_EMAIL`, `NEXT_PUBLIC_COMPANY_ADDRESS`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_TIKTOK_URL`, `NEXT_PUBLIC_LINKEDIN_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_REVALIDATE_SECRET`, `SANITY_WRITE_TOKEN`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`.

---

## 6. Scripts que escriben en Sanity

Todos usan `@sanity/client` (`createClient({ projectId, dataset, token, apiVersion: "2024-01-01", useCdn: false })`). «Token» = necesitan `SANITY_WRITE_TOKEN` para escribir. Casi todos son de un solo uso, corren en seco sin `--aplicar` y guardan una copia previa en `audit/backup-*.json`.

| Script | Qué documento toca | Token |
|---|---|---|
| `scripts/seed-sanity-accounts.ts` | Crea o reemplaza (`createOrReplace`) un `cuenta` por cada cuenta de `src/data/clients.ts` (id `cuenta-<slug>`) y un `servicio` por cada servicio (id `servicio-<slug>`). No sube imágenes | Sí |
| `scripts/seed-content-sections.mjs` | `paginaInicio.seccionesContenido` (esquema viejo), sin imágenes | Sí |
| `scripts/migrar-banners-sanity.mjs` | `paginaInicio.seccionesContenido`: pasa cada item al esquema «un banner = una imagen» conservando `_key`, `asset`, `crop` y `hotspot` | Sí |
| `scripts/migrar-banners-a-documento.mjs` | Copia `paginaInicio.seccionesContenido` al documento `banners` (`createOrReplace`); con `--limpiar` borra el campo viejo | Sí |
| `scripts/sembrar-cta-banners.mjs` | `banners.seccionesContenido`: agrega `ctaTexto`, `ctaEnlace` y las posiciones a los 4 banners | Sí |
| `scripts/ajustar-2026-10-08.mts` | `banners` (escena, líneas y sube `fotoPrimerPlano` desde `public/home/`), `traficoAdsPage` (plataformas y cierre), `chatbotsCrmPage` (imagen del cierre); lee `marketingDigitalPage` | Sí |
| `scripts/ajustar-2026-10-15.mts` | `paginaInicio` (`hero.ctaSecundarioEnlace`), `traficoAdsPage` y `chatbotsCrmPage` (borra la descripción de Clientes) | Sí |
| `scripts/ajustar-2026-10-16.mts` | `marketingDigitalPage` (sube `imagenDerecha`, quita la foto de fondo), `banners` (hotspot del banner 4), `marketingDigitalPage` y `asesoriasPage` (campos del video estilo TikTok) | Sí |
| `scripts/ajustar-2026-10-20.mts` | `banners` (posición del botón de CRM), `traficoAdsPage` (plataformas), `asesoriasPage` (inserta `celularesBanner`), `marketingDigitalPage`, `asesoriasPage` y `chatbotsCrmPage` (campos del video) | Sí |
| `scripts/ajustar-2026-11-23-fotos-banners.mts` | `banners` y `drafts.banners`: sube 3 fotos y cambia `fotoPrimerPlano` de Redes, Pauta y ChatBots/CRM | Sí |
| `scripts/ajustar-ctas.mts` | `marketingDigitalPage`, `traficoAdsPage`, `chatbotsCrmPage`, `asesoriasPage`: texto y enlace de los botones | Sí |
| `scripts/ajustar-feniax.mts` | `chatbotsCrmPage`: texto de los botones y borra `chatPortada` | Sí |
| `scripts/ajustar-paginas.mts` | `traficoAdsPage` (plataformas), `chatbotsCrmPage` (texto de la portada) y las cuatro páginas (borra `autoplay` y `velocidadAutoplay` de reseñas) | Sí |
| `scripts/crear-esqueleto-paginas-servicio.mjs` | Crea con `createIfNotExists` `traficoAdsPage`, `chatbotsCrmPage` y `asesoriasPage` con secciones vacías y apagadas | Sí (`SANITY_AUTH_TOKEN` o `SANITY_WRITE_TOKEN`) |
| `scripts/sembrar-marketing-digital.mjs` | Crea `marketingDigitalPage` (`createIfNotExists`; `createOrReplace` con `--forzar`) | Sí |
| `scripts/migrar-marketing-a-secciones.mjs` | `marketingDigitalPage`: de campos fijos a `sections[]`; con `--limpiar` quita los campos viejos | Sí |
| `scripts/sembrar-trafico.mts` | Reemplaza `traficoAdsPage` (`createOrReplace`) con los textos de `trafico-respaldo.ts` y las métricas de plantilla | Sí |
| `scripts/sembrar-feniax.mts` | Reemplaza `chatbotsCrmPage` (`createOrReplace`); sube las fotos de `public/feniax/demo/` | Sí |
| `scripts/sembrar-asesorias.mts` | Reemplaza `asesoriasPage` (`createOrReplace`); sube las imágenes de `public/asesorias/` | Sí |
| `scripts/logos-circulares.mts` (usa `scripts/logo-circular.mts`) | Genera y sube la versión circular de cada logo; escribe `logoCircular` en las cuatro páginas y en los `cuenta` enlazados | Sí |
| `scripts/test-hero-sanity.mjs` | Documento `hero`: crea, reemplaza o borra `heroImage` con imágenes sintéticas | Sí |
| `scripts/test-content-sections-sanity.mjs` | `paginaInicio.seccionesContenido`: carga, edita y limpia contenido de prueba; borra los assets que subió | Sí |

No escriben en Sanity: `grabar-escenas.mjs` (lee el Home por `/render-escena` y escribe `public/home/escenas/` y `src/remotion/home/videos.json`), `cf-deploy.mjs`, `probar-series-trafico.mts`, `crop-socio.mjs`, `generate-placeholders.mjs`, `make-logo-on-light.mjs`, `mark-to-white.mjs`, `prepare-favicon.mjs`, `prepare-logo.mjs`, `preview-logo.mjs`, `to-transparent.mjs`.

---

## 7. Contenido que no viene de Sanity pero se parece

- **`src/data/clients.ts`**: 26 cuentas completas (`clients`) y `allServices`. Es el respaldo de Cuentas.
- **`src/config/company.ts`**: nombre, lema, teléfono, WhatsApp, correo, dirección, enlace de Maps, horarios, redes (`social`, `socialLinks`, `headerSocialLinks`) y `perfilesRedes` (los 4 perfiles de `/redes`).
- **`src/config/site.ts`**: URL pública y regla de indexación.
- **`src/lib/sanity.ts`**: `SECCIONES_FALLBACK`, `HERO_FALLBACK`, `CAPACIDADES_FALLBACK`, `SECCIONES_CONTENIDO_FALLBACK`.
- **`src/lib/marketing-digital.ts`**: `SECCIONES_RESPALDO` (los textos de `/marketing-digital`), `TIKTOK_POR_DEFECTO`, `AJUSTE_LOGOS_POR_DEFECTO`.
- **`src/lib/trafico-respaldo.ts`** (`COPY_TRAFICO`), **`src/lib/feniax-respaldo.ts`** (`COPY_FENIAX`, `WHATSAPP_FENIAX`), **`src/lib/asesorias-respaldo.ts`** (`COPY_ASESORIAS`, `IMAGENES_ASESORIAS`), **`src/lib/cierre-socios.ts`** (`IMAGEN_CIERRE_SOCIOS`).
- **`src/lib/chat-demo.ts`**: `PLANTILLAS` (11 conversaciones de WhatsApp por tipo de negocio).
- **`src/lib/metricas-demo.ts`**: `PLANTILLAS_METRICAS` (12 paneles de Meta Ads), `HITOS_BASE`, `NOTA_DEMO`, `ETIQUETA_OBJETIVO`.
- **`src/lib/giro-tipo.ts`**: las reglas `POR_NOMBRE` y `POR_ICONO` que deciden qué plantilla usa cada giro.
- **`src/lib/cta.ts`**: `TEXTO_CTA`, `SERVICIOS` del formulario, `RUTA_FORMULARIO`, el texto del mensaje de WhatsApp.
- **`src/remotion/home/tema.ts`**: `GEOMETRIA` (por escena: `lineasPorDefecto`, `fotoRespaldo`, fondos y posiciones).
- **`src/remotion/home/videos.json`**: el texto con el que se grabó cada escena y sus archivos.
- **Textos escritos en páginas y componentes:** `metadata` (título y descripción) de `layout.tsx` y de cada `page.tsx`; `/contactanos` (título, bajada y `PASOS`, `contactanos/page.tsx:16-20`); `/redes` (título y bajada); `/clientes/[slug]` («El reto», «Lo que hicimos», «Resultados», «Las piezas», «Tu marca puede ser la siguiente»); `ANCLA` de cada página de servicio; `PaginaEnConstruccion` en `/clientes` y `/el-socio`; `Nav` y `Footer`.

---

## 8. Acoplamientos y riesgos para la migración

Ordenados de más a menos delicado.

1. **Transformación de imágenes por URL.** Los parámetros `w`, `h`, `fit=crop`, `fit=max`, `q` y `auto=format` los resuelve la CDN de Sanity. Se agregan en tres capas: en GROQ (3.1 A), en los normalizadores (3.1 B) y en el cargador (3.2). R2 no transforma imágenes. Además el cargador **solo actúa** si la URL empieza con `https://cdn.sanity.io/` (`cargador-imagenes.ts:24`): con cualquier otro host devuelve la misma URL para todos los anchos del `srcset` y se sirve el archivo original. Hay recortes cuadrados que dependen de `fit=crop` (fotos de reseñas, `160x160`; avatar del chat, `120x120`). Los `<img>` normales (logos, giros, reseñas, logros) piden la URL tal cual, con su `?w=...`.

2. **`FOTOS_RETIRADAS` en `src/components/ContentBanner.tsx:126-130`.** Tres identificadores de asset de Sanity escritos a mano (`0c241a21778d9f184a4da28618af2374cfadbc41`, `ca26b0e956f056590179b6aeb0144cdd8fa86275`, `499bf6b37a83ffdf494743713d9e356283159a80`). La comparación es `foto.url.includes(id)` (`:152`): depende de que el identificador forme parte del **nombre del archivo en la URL** (formato de Sanity: `.../images/<projectId>/<dataset>/<id>-<ancho>x<alto>.<ext>`). Si al migrar esas tres fotos se copian a R2 con otro nombre, el filtro deja de funcionar y volverían a verse. **SIN CONFIRMAR:** si `scripts/ajustar-2026-11-23-fotos-banners.mts` ya se corrió con `--aplicar` (y si el borrador `drafts.banners` quedó igual); de eso depende que el documento `banners` todavía apunte a alguna de las tres.

3. **Caché, ISR y revalidación.** (a) Todo el cacheo actual cuelga de `fetch(..., { next: { revalidate } })`. Una lectura por binding de D1 no es un `fetch`: las páginas quedarían sin `revalidate` declarado (ninguna lo exporta). (b) Las páginas con datos se prerenderizan en el build y `generateStaticParams` lee los slugs en el build: en ese momento no hay bindings de D1/R2 como en el Worker. (c) `revalidatePath("/", "layout")` es la única vía de invalidación y depende de un webhook de Sanity que dejará de existir; el nombre de la variable es `SANITY_REVALIDATE_SECRET`. (d) **SIN CONFIRMAR:** con `defineCloudflareConfig()` sin caché incremental (`open-next.config.ts:10`) y sin R2/KV/D1 en `wrangler.jsonc`, no se pudo determinar leyendo el código si en producción el ISR de 60 s y `revalidatePath` persisten entre pedidos o si cada pedido vuelve a renderizar. El comentario de `route.ts:18-20` y `audit/HERO-FINAL-RESULTADOS.md:94` dicen que se verificó, pero **en el servidor local**.

4. **Referencias y uniones de GROQ que hay que reproducir a mano.**
   - `servicios[]->nombre` (`sanity.ts:125`): arreglo de referencias a `servicio`.
   - `empresas[]{ _key, defined(_ref) => @->{...}, !defined(_ref) => {...} }` (`giros.ts:16-20`, `marketing-digital.ts:334-338`): **arreglo mixto**; cada item es una referencia a un `cuenta` (se toman su `nombre`, `activa`, `logo` y `logoCircular`) o un objeto propio con `nombre` y logo.
   - `*[_type == "contenido" && references(^._id) && publicado == true] | order(orden asc)` (`sanity.ts:143`): unión inversa; el campo es `contenido.cuenta` (`studio/schemaTypes/contenido.ts:23-26`).
   - `asset->url` y `asset->metadata.dimensions.width/height`: cada imagen necesita **ancho y alto guardados**. `imagen()` (`marketing-digital.ts:453`), `normalizarFoto` (`sanity.ts:989`) y el logo de empresa (`marketing-digital.ts:512`) **descartan** la imagen si faltan.
   - **Dependencia entre documentos:** Tráfico, ChatBots/CRM y Asesorías leen `*[_type == "marketingDigitalPage"][0].sections[_type == "clientsBanner"][0].categorias[]` (`trafico.ts:201`, `feniax.ts:168`, `asesorias.ts:251`) y Asesorías además sus textos (`asesorias.ts:252-255`). Es **el primer** `clientsBanner` de Marketing Digital. El campo se llama `categorias` en Sanity y `giros` en la salida.

5. **`_key`, `_type` y orden de los arreglos.**
   - `_key` es el identificador estable de cada item: `id` de los banners (`sanity.ts:676`, usado como `key` de React en `page.tsx:46`), `key` de secciones, giros, empresas, plataformas y logros, y `clave` de las conversaciones del celular de FENIAX (`PaginaFeniax.tsx:72`). Los scripts apuntan a items con rutas como `seccionesContenido[_key=="..."]`. El almacenamiento nuevo necesita un id estable por item, no un índice.
   - `_type` es el discriminador de cada sección y sale tal cual como `tipo`. Valores que el código conoce: `teamBanner`, `aboutBanner`, `navigationBanner`, `methodBanner`, `clientsBanner`, `reviewsBanner`, `ctaBanner`, `platformsBanner`, `ecosystemBanner`, `metricsClientsBanner`, `chatClientsBanner`, `splitHeroBanner`, `celularesBanner`, `achievementsBanner`; y en el Home `seccionHacemos`, `seccionSocio`, `seccionCierre`, `seccionPilares`.
   - **El orden del arreglo es el orden de la página** (`sections[]`, `seccionesContenido[]`, `capacidades[]`, `categorias[]`, `empresas[]`, `pasos[]`, `plataformas[]`, `logros[]`, `mensajes[]`, `lineas[]`). El primer item de `sections[]` recibe el `<h1>`.
   - Órdenes explícitos: `cuenta` por `orden asc`; `contenido` por `orden asc`; `resena` por `orden asc, _createdAt desc` (usa la fecha de creación del documento). `QUERY_SLUGS_ACTIVOS` no ordena.

6. **Semántica de GROQ que el código da por hecha.**
   - `campo.asset->url + "?w=..."` con una imagen sin archivo da `null` (en GROQ, `null + texto` es `null`): por eso llegan `null` y no `"?w=160&auto=format"`. El código nuevo tiene que devolver `null` en ese caso.
   - Tres filtros distintos de «activo»: `activa == true` para `cuenta` (estricto, `sanity.ts:128`), `publicado == true` para `contenido` (`:143`), `activa != false` para `resena` (incluye las que no tienen el campo) y, en el código, `activo === false` para secciones y `activa !== false` para capacidades y empresas.
   - `coalesce(backgroundImageAlt, "")` y `coalesce(heroImageAlt, "")`.
   - Proyecciones condicionales `_type == "x" => { ... }` y `_type in [...] => { ... }`: los campos propios de un tipo solo llegan para ese tipo.
   - Sin token solo se leen documentos publicados; con panel propio hay que decidir si existe «borrador».

7. **`videos.json` y las escenas grabadas.** `EscenaBanner.tsx:104-111` reproduce el video solo si `lineas.join(" | ")` del banner es **idéntico** al de `src/remotion/home/videos.json`; cualquier diferencia (un espacio, una tilde, otro orden) hace que la escena se dibuje en vivo con Remotion, que es lento. La grabación (`scripts/grabar-escenas.mjs`) abre `/render-escena`, que lee el texto con `getPaginaInicio()`. Si la migración cambia `lineas` aunque sea en un carácter, hay que volver a grabar. Los nombres de archivo llevan un hash (`redes-24aa2187.webm`).

8. **Reglas basadas en la forma de la URL.**
   - `url.startsWith("/")` decide `unoptimized` en `BannerHibrido.tsx:75`, `BannerFoto.tsx:69`, `:72`, `:194` y `FotoFondo.tsx:19`, `:21`. Una URL de R2 servida como ruta relativa del mismo dominio se trataría como archivo local.
   - `foto.url === g.fotoRespaldo.url` (`BannerHibrido.tsx:96`) decide el encuadre del teléfono.
   - `!enlace.startsWith("/")` decide si un enlace es externo (`sanity.ts:912`, `BotonCta.tsx:92`).
   - `` <video src={`${url}#t=0.1`}> `` (`TresCelulares.tsx:72`); los videos se sirven directo desde la URL del archivo, así que R2 debe atender pedidos por rango.

9. **Los respaldos esconden los errores.** Ninguna función lanza: ante cualquier fallo la página se arma con contenido fijo y solo queda un `console.error`. Una capa de datos nueva que falle se vería como «el sitio volvió al texto de fábrica», no como un error. Dos comportamientos no uniformes: `/marketing-digital` queda **vacía** si todas sus secciones están apagadas (las otras tres caen al respaldo), y `getAccountBySlug` devuelve `null` (404) si el documento existe pero no tiene `nombre`.

10. **Nombres de módulos y tipos que importan los componentes.** Para no tocar componentes hay que conservar las rutas y los nombres exportados: de `@/lib/sanity` (`HeroContent`, `Capacidad`, `SeccionContenido`, `PosicionCta`, `PosicionHorizontalCta`, `PosicionVerticalCta`, `ColorCta`, `SeccionData` y derivados, `HERO_FALLBACK`, `CAPACIDADES_FALLBACK`), de `@/lib/marketing-digital` (`ImagenSanity`, `GiroNegocio`, `EmpresaGiro`, `IconoCategoria`, `Resena`, `SeccionMarketing` y sus variantes, además de `IMG`, `LOGO`, `TIKTOK_GROQ`, `AJUSTE_LOGOS_GROQ` y los normalizadores que importan `trafico.ts`, `feniax.ts`, `asesorias.ts` y `giros.ts`), de `@/lib/trafico`, `@/lib/feniax` y `@/lib/asesorias`.

11. **Variables durante el build.** `SANITY_PROJECT_ID` y `SANITY_DATASET` están en `wrangler.jsonc` como variables del Worker (ejecución). **SIN CONFIRMAR:** si también están definidas en el entorno de build de Cloudflare; si no lo están, el prerender del build sale con contenido de respaldo y se corrige con la primera revalidación. El comentario de `.env.example:90-92` («ESTADO ACTUAL: no estan definidas en el Worker») contradice a `wrangler.jsonc` y parece desactualizado.

12. **Datos que pasan sin filtrar.** `social` es el objeto `redes` completo (`sanity.ts:141`): puede traer `_type` y, en `otros[]`, `_key`. `resena.fecha` es texto libre. `social.otros[].url` se usa como `key` de React (`clientes/[slug]/page.tsx:172`).

13. **Slugs.** `slug.current` es la ruta de `/clientes/[slug]` y del sitemap. Si falta, se calcula con `slugify(nombre)` (`sanity.ts:160`, `:222`), pero la búsqueda por slug (`slug.current == $slug`) no encontraría ese documento.

14. **Dominio de imágenes.** `next.config.ts:15-20` solo permite `cdn.sanity.io`. **SIN CONFIRMAR:** si con `loader: "custom"` Next valida `remotePatterns`; conviene declarar el dominio nuevo de todos modos.

15. **Menores.**
    - `seccionPilares` se pide en la consulta y siempre se descarta (`sanity.ts:1056-1060`).
    - `paginaInicio.titulo` se pide y no se usa.
    - `scripts/` y `studio/` dependen de Sanity; `@sanity/client` está en `devDependencies`. `audit/backup-*.json` guarda copias de documentos anteriores a cada ajuste.
    - `public/asesorias/caso-construccion.webp`, `caso-gastronomia.webp` y `caso-retail.webp` no están referenciados en `src/` ni en `scripts/` (el tipo `CasoExito` de `asesorias.ts:66-74` tampoco se usa en la lectura).
    - `scripts/seed-sanity-accounts.ts` y el comentario de `src/app/sitemap.ts:8` hablan de 27 cuentas o URLs; `src/data/clients.ts` tiene 26 y los comentarios de `clientes/page.tsx:11` y `clientes/[slug]/page.tsx:50` dicen 26.
    - La tarea pedía revisar «el filtro por `_id`»: en la web **no existe** un filtro por `_id`. `_id` aparece solo en `references(^._id)` (`sanity.ts:143`), como `id` de cada video (`sanity.ts:144`, `:176`) y como `id` de cada reseña (`"id": _id`).
