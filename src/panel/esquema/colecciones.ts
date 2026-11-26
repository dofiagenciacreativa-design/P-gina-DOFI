import type { Doc } from "@/lib/contenido/tipos";
import type { Campo, DefinicionColeccion, Opcion, TipoColeccion, TipoElemento } from "./tipos";

/**
 * Las colecciones (listas de documentos) del panel, etapa 5
 * (docs/panel-propio/plan-etapa-5.md): Clientes (`cuenta`), Contenidos
 * (`contenido`), Servicios (`servicio`) y Reseñas (`resena`).
 *
 * Los campos escriben en la raíz de cada documento con los MISMOS nombres
 * que tienen hoy los datos de contenido/ (los del Studio de Sanity:
 * studio/schemaTypes/ e inventario-esquema.md §3.1.8–3.1.11 y §3.3). Ningún
 * nombre cambia. Cuando un campo existe en los datos pero la web no lo usa,
 * se declara igual (para no perderlo) y su ayuda lo dice.
 *
 * Las ayudas dicen lo que la web hace HOY con cada campo:
 * - Clientes: src/lib/sanity.ts (QUERY_CUENTA_POR_SLUG, toAccountFull) y
 *   src/components/clientes/FichaCliente.tsx (la página /clientes/<slug>);
 *   los giros que enlazan una cuenta, en src/lib/marketing-digital.ts.
 * - Reseñas: src/lib/marketing-digital.ts (normalizarResenas) y
 *   src/lib/google-places.ts (si Google respondiera, sus reseñas mandan).
 * - Servicios: solo su `nombre`, como etiqueta en la página de cada cliente.
 * - Contenidos: las fotos y los videos de la página de su cliente.
 */

// ── Ayudantes (los mismos de bloques.ts) ─────────────────────────────────────

const texto = (nombre: string, titulo: string, ayuda?: string, extra: Partial<Campo> = {}): Campo =>
  ({ clase: "texto", nombre, titulo, ayuda, ...extra }) as Campo;
const parrafo = (nombre: string, titulo: string, ayuda?: string, extra: Partial<Campo> = {}): Campo =>
  ({ clase: "textoLargo", nombre, titulo, ayuda, filas: 4, ...extra }) as Campo;
/** Una imagen sin texto alternativo propio: en estos documentos ninguna foto lo tiene (inventario §5.7). */
const foto = (nombre: string, titulo: string, ayuda?: string): Campo => ({ clase: "imagen", nombre, titulo, ayuda });
const enlace = (nombre: string, titulo: string, ayuda?: string, obligatorio?: boolean): Campo => ({
  clase: "enlace",
  nombre,
  titulo,
  ayuda,
  obligatorio,
});
const numero = (
  nombre: string,
  titulo: string,
  ayuda: string,
  extra: { min?: number; max?: number; paso?: number; obligatorio?: boolean } = {},
): Campo => ({ clase: "numero", nombre, titulo, ayuda, ...extra });
const interruptor = (nombre: string, titulo: string, porDefecto: boolean, ayuda?: string): Campo => ({
  clase: "booleano",
  nombre,
  titulo,
  porDefecto,
  ayuda,
});
const opcion = (
  nombre: string,
  titulo: string,
  opciones: Opcion[],
  ayuda?: string,
  forma: "lista" | "botones" = "lista",
  obligatorio?: boolean,
): Campo => ({ clase: "opcion", nombre, titulo, opciones, forma, ayuda, obligatorio });

/** El texto de un campo, sin espacios de sobra ("" si no es texto). */
const cadena = (v: unknown) => (typeof v === "string" ? v.trim() : "");
/** El _ref de una referencia ({ _type: "reference", _ref }), o "". */
const ref = (v: unknown) => (typeof v === "object" && v !== null ? cadena((v as { _ref?: unknown })._ref) : "");

// ── Orden de las listas ──────────────────────────────────────────────────────

const comparaTexto = (a: string, b: string) => a.localeCompare(b, "es", { sensitivity: "base", numeric: true });

/** Por `orden` de menor a mayor; los que no tienen número van después (como en la web: groq-js los deja al final). */
function porOrden(a: Doc, b: Doc): number {
  const x = typeof a.orden === "number" && Number.isFinite(a.orden) ? a.orden : null;
  const y = typeof b.orden === "number" && Number.isFinite(b.orden) ? b.orden : null;
  if (x === null && y === null) return 0;
  if (x === null) return 1;
  if (y === null) return -1;
  return x - y;
}

/** Último desempate: el _id, para que la lista salga siempre igual. */
const porId = (a: Doc, b: Doc) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0);

// ── Clientes (`cuenta`) ──────────────────────────────────────────────────────

const RESULTADO: TipoElemento = {
  tipo: "resultado",
  titulo: "Resultado",
  resumen: (e) => [cadena(e.valor), cadena(e.etiqueta)].filter(Boolean).join(" — ") || "Resultado sin datos",
  campos: [
    texto("valor", "Número", "El número, tal cual. Ej.: «3x», «-40%», «88». Sin número, el resultado no se muestra.", { obligatorio: true }),
    texto("etiqueta", "Qué mide", "Ej.: «leads por semana». Sin esto, el resultado no se muestra.", { obligatorio: true }),
  ],
};

/** Un enlace de «Otros enlaces» (el objeto en línea `enlace` de redesSociales). */
const OTRO_ENLACE: TipoElemento = {
  tipo: "enlace",
  titulo: "Enlace",
  resumen: (e) => cadena(e.etiqueta) || cadena(e.url) || "Enlace sin nombre",
  campos: [
    texto("etiqueta", "Nombre del enlace", "Lo que se lee en el botón. Ej.: «Menú», «Tienda en línea».", { obligatorio: true }),
    enlace("url", "Dirección", "Completa, empezando con https://…", true),
  ],
};

const AYUDA_RED = "Dirección completa, empezando con https://… Con dirección, sale como ícono en la cabecera de su página.";

const CUENTA: DefinicionColeccion = {
  tipo: "cuenta",
  titulo: "Clientes",
  singular: "cliente",
  icono: "clientes",
  ayuda:
    "Los clientes de DOFI. Cada cliente activo tiene su propia página en la web, /clientes/<dirección>, con su resumen, sus servicios, el reto, lo que hicimos, los resultados, el testimonio y sus fotos y videos (los que se cargan en «Contenidos»), y entra al mapa del sitio para Google. Un cliente también se puede enlazar a un giro en las secciones «Clientes» de las páginas de servicio: ahí se ven su nombre y su logo. Hoy ninguna sección de la web enlaza a las páginas de los clientes: se llega por Google o con el enlace directo.",
  grupos: [
    {
      titulo: "DATOS PRINCIPALES",
      campos: [
        texto("nombre", "Nombre", "El nombre del negocio. Es el título de su página y el nombre que se ve en los giros donde está enlazado.", {
          obligatorio: true,
        }),
        {
          clase: "slug",
          nombre: "slug",
          titulo: "Dirección de su página",
          desde: "nombre",
          obligatorio: true,
          ayuda:
            "La dirección de su página en la web: /clientes/<esto>. Se arma desde el nombre (solo minúsculas, números y guiones). No puede repetirse entre clientes. Si la cambias después, los enlaces viejos (los que ya se compartieron o están en Google) dejan de funcionar.",
        },
        texto("categoria", "Categoría", "El rubro, en pocas palabras. Ej.: «Restaurante», «Movilidad», «Alimentos». Va en una etiqueta arriba del nombre, en su página."),
        texto("ciudad", "Ciudad", "Va junto a la categoría, arriba del nombre. Ej.: Cuenca."),
        parrafo(
          "resumen",
          "Resumen",
          "Una frase de lo que se hizo para este cliente (unas 18 palabras). Va debajo del nombre en su página y es la descripción que muestra Google.",
          { obligatorio: true, max: 220, filas: 2 },
        ),
        {
          clase: "referencias",
          nombre: "servicios",
          titulo: "Servicios",
          a: "servicio",
          ayuda: "Lo que DOFI hace para este cliente. Se ven como etiquetas debajo del resumen, en su página. Los servicios se crean y se renombran en la pestaña «Servicios».",
        },
      ],
    },
    {
      titulo: "LOGO Y FOTO",
      campos: [
        foto(
          "logo",
          "Logo",
          "Se ve en las secciones «Clientes» de las páginas de servicio, en los giros donde este cliente está enlazado. PNG o SVG, idealmente con fondo transparente. Sin logo, se muestran sus iniciales. Su página no muestra el logo.",
        ),
        foto(
          "logoCircular",
          "Logo circular",
          "La versión REDONDA del logo (cuadrada, con lo de afuera del círculo transparente), la que se usa con «Logos redondos». Si cambias el logo, cambia o quita también esta: mientras falte, la web recorta el logo en círculo.",
        ),
        foto("portada", "Foto principal", "La foto grande de su página, debajo de la cabecera. Horizontal (16:9). Sin foto, esa parte de la página no aparece."),
      ],
    },
    {
      titulo: "PÁGINA DEL CLIENTE",
      nota: "Todo esto es opcional: lo que dejes vacío no aparece en su página.",
      campos: [
        parrafo("reto", "El reto", "Cómo estaba el negocio antes de llegar a DOFI. Corto: la web lo muestra como un solo párrafo, aunque dejes renglones en blanco."),
        parrafo("enfoque", "Lo que hicimos", "Qué se hizo. Corto: va al lado de «El reto», también como un solo párrafo."),
        {
          clase: "lista",
          nombre: "resultados",
          titulo: "Resultados",
          ayuda: "Datos duros, en este orden. Solo los que el cliente confirmó: nunca inventes un número.",
          vacia: "Todavía no hay resultados.",
          elemento: RESULTADO,
        },
      ],
    },
    {
      titulo: "TESTIMONIO",
      nota: "La web muestra el testimonio solo si tiene los tres datos: la cita, quién la dice y su cargo. Si falta uno, no aparece.",
      campos: [
        parrafo("testimonio.cita", "Cita", "Lo que dijo el cliente, con sus palabras. Va grande, al final de su página.", { filas: 3 }),
        texto("testimonio.autor", "Quién lo dice", "Nombre y apellido. Nunca solo el nombre: completa también el cargo."),
        texto("testimonio.cargo", "Cargo", "Cargo y empresa. Ej.: «Gerente General, Taitico»."),
      ],
    },
    {
      titulo: "REDES Y ENLACES",
      campos: [
        enlace("redes.instagram", "Instagram", AYUDA_RED),
        enlace("redes.facebook", "Facebook", AYUDA_RED),
        enlace("redes.tiktok", "TikTok", AYUDA_RED),
        enlace("redes.sitioWeb", "Sitio web", AYUDA_RED),
        {
          clase: "lista",
          nombre: "redes.otros",
          titulo: "Otros enlaces",
          ayuda: "Cualquier otro enlace (menú, tienda, reservas…). Cada uno sale como un botón con su nombre, junto a las redes.",
          vacia: "Sin otros enlaces.",
          elemento: OTRO_ENLACE,
        },
      ],
    },
    {
      titulo: "EN LA WEB",
      campos: [
        interruptor(
          "activa",
          "Activo",
          false,
          "Apágalo en vez de borrar el cliente: deja de aparecer en toda la web (su página, el mapa del sitio y los giros donde está enlazado), pero sus datos y sus contenidos se conservan aquí.",
        ),
        numero(
          "orden",
          "Orden",
          "Ordena esta lista: número más bajo, primero. En la web ordenaba el carrusel de clientes y el muro de logos, que hoy no se muestran.",
          { paso: 1 },
        ),
      ],
    },
  ],
  resumen: (d) => cadena(d.nombre) || cadena((d.slug as { current?: unknown } | undefined)?.current) || "Cliente sin nombre",
  detalle: (d) => cadena(d.categoria) || "Sin categoría",
  // La web solo muestra las cuentas con activa == true (un valor ausente cuenta como apagado).
  oculto: (d) => d.activa !== true,
  orden: (a, b) => porOrden(a, b) || comparaTexto(cadena(a.nombre), cadena(b.nombre)) || porId(a, b),
  nuevo: () => ({ activa: true, servicios: [] }),
  unicos: [{ campo: "slug.current", mensaje: "Ya hay un cliente con esa dirección. Cambia la dirección de uno de los dos: dos páginas no pueden tener la misma." }],
  prefijoId: "cuenta-",
};

// ── Reseñas (`resena`) ───────────────────────────────────────────────────────

const RESENA: DefinicionColeccion = {
  tipo: "resena",
  titulo: "Reseñas",
  singular: "reseña",
  femenino: true,
  icono: "resenas",
  ayuda:
    "Las reseñas de Google, cargadas a mano. Se muestran en la sección «Reseñas» de las páginas de servicio (Marketing Digital, Tráfico / Ads, ChatBots / CRM y Asesorías). Hoy la web no está conectada a Google, así que se ven estas; si algún día se conecta, se mostrarán las de Google y estas quedarán de respaldo. Solo reseñas reales, copiadas tal cual: una reseña inventada o retocada es publicidad engañosa y Google sanciona los perfiles que la usan.",
  grupos: [
    {
      titulo: "LA RESEÑA",
      nota: "La web muestra una reseña solo si tiene nombre, estrellas y comentario.",
      campos: [
        texto("nombre", "Nombre", "Tal como aparece en Google.", { obligatorio: true }),
        numero("estrellas", "Estrellas", "De 1 a 5, las mismas que puso en Google.", { min: 1, max: 5, paso: 1, obligatorio: true }),
        parrafo("comentario", "Comentario", "Copiado textual de Google, sin corregir ni recortar. En la tarjeta se ven unas 7 líneas; el resto queda en Google.", {
          obligatorio: true,
          filas: 5,
        }),
      ],
    },
    {
      titulo: "DETALLES (OPCIONALES)",
      campos: [
        texto("empresa", "Empresa", "Solo si la persona la menciona o es un cliente conocido. Va debajo del nombre."),
        foto("foto", "Foto", "Su foto de perfil de Google. Sin foto, la tarjeta muestra sus iniciales."),
        enlace(
          "enlaceOriginal",
          "Enlace a la reseña en Google",
          "Para que cualquiera compruebe que es real: la tarjeta muestra una flechita que lleva ahí. Dirección completa, https://…",
        ),
        texto("fecha", "Fecha", "Tal como la muestra Google, en texto: «hace 2 semanas», «agosto 2026». No se actualiza sola. Va debajo del nombre."),
      ],
    },
    {
      titulo: "EN LA WEB",
      campos: [
        interruptor("activa", "Mostrar en la web", true, "Apágala para ocultarla sin borrarla."),
        numero(
          "orden",
          "Orden",
          "Número más bajo, primero. Las que no tienen número van después, las más nuevas primero. Esta lista sigue el mismo orden que la web.",
          { paso: 1 },
        ),
      ],
    },
  ],
  resumen: (d) => cadena(d.nombre) || "Reseña sin nombre",
  detalle: (d) => {
    const n = typeof d.estrellas === "number" ? Math.min(5, Math.max(0, Math.round(d.estrellas))) : 0;
    const estrellas = n > 0 ? "★".repeat(n) : "Sin estrellas";
    const empresa = cadena(d.empresa);
    return empresa ? `${estrellas} · ${empresa}` : estrellas;
  },
  // La web muestra las reseñas con activa != false (un valor ausente cuenta como encendido).
  oculto: (d) => d.activa === false,
  // Como la web: order(orden asc, _createdAt desc) (src/lib/marketing-digital.ts).
  orden: (a, b) =>
    porOrden(a, b) ||
    comparaTexto(cadena(b._createdAt), cadena(a._createdAt)) ||
    comparaTexto(cadena(a.nombre), cadena(b.nombre)) ||
    porId(a, b),
  nuevo: () => ({ activa: true, estrellas: 5 }),
  prefijoId: "resena-",
};

// ── Servicios (`servicio`) ───────────────────────────────────────────────────

const SERVICIO: DefinicionColeccion = {
  tipo: "servicio",
  titulo: "Servicios",
  singular: "servicio",
  icono: "tarjetas",
  ayuda:
    "Lo que DOFI hace para sus clientes (CRM, Pauta, Audiovisual…). Un servicio no tiene página propia: se marca en cada cliente (pestaña «Clientes», campo «Servicios») y se ve como una etiqueta en la página de ese cliente. Si le cambias el nombre aquí, cambia en todos los clientes que lo tienen marcado.",
  grupos: [
    {
      titulo: "SERVICIO",
      campos: [
        texto("nombre", "Nombre", "Corto: es la etiqueta que se ve en la página de cada cliente. Ej.: «CRM», «Pauta». No puede repetirse.", {
          obligatorio: true,
        }),
      ],
    },
    {
      titulo: "DE UNA VERSIÓN ANTERIOR (HOY NO SE USAN)",
      nota: "Antes los servicios tenían título, descripción e imagen. Un servicio viejo («Publicidad») todavía los guarda, pero la web solo lee el «Nombre» de arriba: sin nombre, el servicio no se muestra en ningún lado. Se guardan por si sirven.",
      campos: [
        texto("titulo", "Título", "Hoy no se muestra. Si quieres usar este servicio, escribe su nombre arriba."),
        parrafo("descripcion", "Descripción", "Hoy no se muestra.", { filas: 2 }),
        foto("imagen", "Imagen", "Hoy no se muestra."),
      ],
    },
  ],
  resumen: (d) => cadena(d.nombre) || cadena(d.titulo) || "Servicio sin nombre",
  detalle: (d) => (cadena(d.nombre) ? "" : "Sin «Nombre»: la web no lo muestra"),
  // La web solo lee `nombre` (servicios[]->nombre): sin él, el servicio no aparece.
  oculto: (d) => !cadena(d.nombre),
  orden: (a, b) => comparaTexto(cadena(a.nombre) || cadena(a.titulo), cadena(b.nombre) || cadena(b.titulo)) || porId(a, b),
  nuevo: () => ({}),
  unicos: [{ campo: "nombre", mensaje: "Ya hay un servicio con ese nombre." }],
  prefijoId: "servicio-",
};

// ── Contenidos (`contenido`) ─────────────────────────────────────────────────

const TITULO_TIPO_VIDEO: Record<string, string> = { youtube: "YouTube", archivo: "Archivo" };

const CONTENIDO: DefinicionColeccion = {
  tipo: "contenido",
  titulo: "Contenidos",
  singular: "contenido",
  icono: "videos",
  ayuda:
    "Los trabajos hechos para cada cliente: fotos y videos. Cada contenido publicado aparece en la página de su cliente (/clientes/<dirección>): los videos en «Las piezas» y las imágenes en la galería de abajo. Si el cliente está apagado, sus contenidos tampoco se ven. Hoy todavía no hay ninguno cargado.",
  grupos: [
    {
      titulo: "DATOS PRINCIPALES",
      campos: [
        texto("titulo", "Título", "El nombre del trabajo. En los videos se ve debajo del video; en las imágenes no se muestra.", { obligatorio: true }),
        {
          clase: "referencia",
          nombre: "cuenta",
          titulo: "Cliente",
          a: "cuenta",
          obligatorio: true,
          ayuda: "De qué cliente es este trabajo: aparece en la página de ese cliente.",
        },
        opcion(
          "tipoMedia",
          "Tipo de contenido",
          [
            { valor: "imagen", titulo: "Imagen" },
            { valor: "video", titulo: "Video" },
          ],
          "Imagen: va a la galería. Video: va con los videos. Después llena solo el grupo que corresponde (abajo).",
          "botones",
          true,
        ),
      ],
    },
    {
      titulo: "SI ES IMAGEN",
      nota: "El panel muestra todos los campos, pero la web solo usa los del tipo elegido arriba. Si el contenido es una imagen, llena este grupo y deja vacío el de video.",
      campos: [foto("imagen", "Imagen", "Obligatoria si el tipo es «Imagen»: sin ella, el contenido no aparece. Se recorta en formato 4:3.")],
    },
    {
      titulo: "SI ES VIDEO",
      nota: "Solo cuentan si el tipo es «Video». Un video sin ID de YouTube ni archivo no aparece.",
      campos: [
        opcion(
          "tipoVideo",
          "De dónde sale el video",
          [
            { valor: "youtube", titulo: "YouTube" },
            { valor: "archivo", titulo: "Archivo subido" },
          ],
          "Si no eliges, la web usa el archivo subido.",
          "botones",
        ),
        texto(
          "youtubeId",
          "ID de YouTube",
          "Solo si sale de YouTube: el código que va después de «v=» en la dirección del video. Ej.: en youtube.com/watch?v=AbC123xYz es «AbC123xYz».",
        ),
        { clase: "video", nombre: "archivoVideo", titulo: "Archivo de video", ayuda: "Solo si es un archivo subido. MP4 liviano: idealmente menos de 15 MB." },
        foto("poster", "Portada del video", "Lo que se ve antes de reproducir. Sin portada, se ve una imagen genérica."),
        texto("formatoVideo", "Formato", "Etiqueta corta debajo del título. Ej.: «Spot 30s», «Vertical 9:16»."),
        opcion(
          "relacionAspecto",
          "Forma del video",
          [
            { valor: "16/9", titulo: "16:9 (horizontal)" },
            { valor: "9/16", titulo: "9:16 (vertical)" },
            { valor: "1/1", titulo: "1:1 (cuadrado)" },
          ],
          "La forma del recuadro del video. Si no eliges, horizontal (16:9).",
        ),
      ],
    },
    {
      titulo: "DATOS INTERNOS (HOY NO SE VEN EN LA WEB)",
      nota: "La página del cliente no muestra estos datos. Sirven para ordenarte y se guardan por si se usan más adelante.",
      campos: [
        parrafo("descripcion", "Descripción", undefined, { filas: 3 }),
        texto("categoria", "Categoría / tipo", "Libre. Ej.: «Campaña», «Reel», «Fotografía»."),
        { clase: "fecha", nombre: "fecha", titulo: "Fecha" },
      ],
    },
    {
      titulo: "EN LA WEB",
      campos: [
        interruptor("publicado", "Publicado", false, "Apagado, no aparece en la página del cliente aunque exista aquí."),
        numero("orden", "Orden", "Ordena los contenidos dentro de la página del cliente: número más bajo, primero.", { paso: 1 }),
      ],
    },
  ],
  resumen: (d) => cadena(d.titulo) || "Contenido sin título",
  detalle: (d) => {
    const tipo =
      d.tipoMedia === "video"
        ? ["Video", TITULO_TIPO_VIDEO[cadena(d.tipoVideo)]].filter(Boolean).join(" · ")
        : d.tipoMedia === "imagen"
          ? "Imagen"
          : "Sin tipo";
    return ref(d.cuenta) ? tipo : `${tipo} · Sin cliente`;
  },
  // La web solo muestra los contenidos con publicado == true de un cliente (un valor ausente cuenta como apagado).
  oculto: (d) => d.publicado !== true || !ref(d.cuenta),
  orden: (a, b) => comparaTexto(cadena(a.titulo), cadena(b.titulo)) || porId(a, b),
  nuevo: () => ({ tipoMedia: "imagen", relacionAspecto: "16/9", publicado: true }),
  prefijoId: "contenido-",
};

// ── Lo que se exporta ────────────────────────────────────────────────────────

export const COLECCIONES: Record<TipoColeccion, DefinicionColeccion> = {
  cuenta: CUENTA,
  resena: RESENA,
  servicio: SERVICIO,
  contenido: CONTENIDO,
};

/** El orden de las pestañas: el del menú del Studio (Cuentas, Contenidos, Servicios) y Reseñas al final. */
export const ORDEN_COLECCIONES: TipoColeccion[] = ["cuenta", "contenido", "servicio", "resena"];
