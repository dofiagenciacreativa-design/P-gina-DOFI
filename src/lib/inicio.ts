import { whatsappUrl } from "@/lib/whatsapp";
import { CLAVES_ESCENA, type ClaveEscena } from "@/remotion/home/tema";

/**
 * Pagina de inicio: tipos, respaldos y normalizadores, SIN fetch.
 *
 * Vivian en src/lib/sanity.ts junto a la consulta. Se separaron (2026-11-24)
 * para que el panel propio pueda armar la vista previa del Inicio en el
 * navegador con exactamente la misma logica que la web publicada: el panel
 * importa este archivo, nunca sanity.ts (ver docs/panel-propio/
 * cambios-2026-11-24.md §5). El codigo es el mismo de antes, sin cambios;
 * solo se exportan los tipos crudos.
 *
 * sanity.ts re-exporta todo lo de aqui, asi que los import de siempre
 * (from "@/lib/consultas") siguen funcionando.
 */

// --- Tipos de las secciones ya conectadas a un componente -----------------

export type SeccionHacemosData = {
  _type: "seccionHacemos";
  titulo: string;
  subtitulo: string;
  tarjetas: { titulo: string; descripcion: string }[];
};

export type SeccionSocioData = {
  _type: "seccionSocio";
  nombre: string;
  descripcion: string;
  foto: string;
};

export type SeccionCierreData = {
  _type: "seccionCierre";
  titulo: string;
  textoBoton: string;
  enlace: string;
};

/** Union de las secciones que page.tsx sabe pintar hoy. */
export type SeccionData =
  | SeccionHacemosData
  | SeccionSocioData
  | SeccionCierreData;

// --- Hero + Capacidades (Replanteo Navbar + Hero + Sanity) ----------------
//
// A diferencia de secciones[] (repetible, se busca por _type), Hero y
// Capacidades son piezas UNICAS de la home. El texto/CTA del Hero y las
// capacidades viven como campos propios de paginaInicio (hero{...},
// capacidades[]); la IMAGEN del Hero vive en su propio documento singleton
// `hero` desde "Implementación final del Hero + Sanity + Cards" (spec
// §5-9) — ver HeroDocRaw y normalizarHero() mas abajo. Mismo patron de
// respaldo en ambos casos.

export type HeroContent = {
  titulo: string;
  marca: string;
  mensaje: string;
  /** URL ya con ?w=.. — null si el Studio todavia no tiene imagen cargada. */
  imagen: string | null;
  imagenAlt: string;
  /** Coordenadas 0-1 del hotspot de Sanity, para object-position en el
   *  cliente (ver Hero.tsx). null si no hay imagen o no hay hotspot. */
  hotspot: { x: number; y: number } | null;
  ctaPrincipalTexto: string;
  ctaPrincipalEnlace: string;
  ctaSecundarioTexto: string;
  ctaSecundarioEnlace: string;
};

/** Las 4 claves validas del selector controlado de icono (spec §35-37 del
 *  sprint original; contenido reemplazado en "Corrección del Hero +
 *  actualización de tarjetas" §15-16). Sanity solo guarda el string,
 *  CapabilityBand.tsx lo mapea a Phosphor. */
export type IconoCapacidad = "social" | "ads" | "growth" | "rescue" | "academia";

export type Capacidad = {
  titulo: string;
  descripcion: string;
  icono: IconoCapacidad;
  enlace: string | null;
};

// --- Secciones de contenido (Sprint "Crear 4 secciones de contenido debajo
// del Hero") -----------------------------------------------------------
//
// Bloques texto+imagen debajo de las tarjetas del Hero. Mismo patron que
// Capacidad arriba: viven como campo propio de paginaInicio
// ("seccionesContenido[]", ver studio/schemaTypes/objects/seccionContenido.ts),
// el ORDEN del arreglo en Sanity es el 01/02/03/04 de la pagina, y el lado
// (texto/imagen) NUNCA se guarda en Sanity -- lo calcula el frontend segun
// Sprint "Banners full-width": cada item es UNA imagen a todo el ancho
// (ver ContentBanner.tsx). Ya no hay texto, columnas ni CTA en HTML.

/** Los 5 pasos horizontales y 3 verticales del selector de Sanity (ver
 *  studio/schemaTypes/objects/posicionCta.ts). El frontend los traduce a
 *  coordenadas CSS en ContentBanner.tsx. */
export type PosicionHorizontalCta =
  | "izquierda"
  | "centro-izquierda"
  | "centro"
  | "centro-derecha"
  | "derecha";

export type PosicionVerticalCta =
  | "arriba"
  | "centro-arriba"
  | "centro"
  | "centro-abajo"
  | "abajo";

/** Paleta del boton. Existe porque los 4 banners tienen fondos opuestos
 *  (naranja, blanco, azul casi negro y morado) y ningun relleno unico
 *  destaca sobre los cuatro: el naranja DOFI funciona en tres, pero sobre el
 *  banner naranja desaparece. */
export type ColorCta = "naranja" | "morado" | "blanco" | "oscuro";

export type PosicionCta = {
  horizontal: PosicionHorizontalCta;
  vertical: PosicionVerticalCta;
  /** Corrimiento fino sobre el ancla elegida, en % del banner. Los pasos del
   *  selector saltan de a mucho (33% -> 50%); esto permite los ajustes de
   *  "un poco mas abajo" sin agregar mas opciones al desplegable. 0 = el
   *  ancla tal cual. */
  desplazamientoX: number;
  desplazamientoY: number;
};

/** El boton que va ENCIMA del banner (Sprint "CTA sobre los banners"). No
 *  forma parte de la imagen: texto, enlace y posicion se editan en Sanity
 *  sin volver a exportar la pieza grafica. */
export type CtaBanner = {
  texto: string;
  enlace: string;
  /** true si `enlace` es una direccion completa (https://, mailto:, tel:) y
   *  por lo tanto tiene que abrirse en una pestaña nueva. Se resuelve aca y
   *  no en el componente para que la decision viva junto al dato. */
  esExterno: boolean;
  color: ColorCta;
  desktop: PosicionCta;
  mobile: PosicionCta;
};

/** La foto de primer plano de un banner hibrido (escena Remotion + foto). */
export type FotoPrimerPlano = {
  url: string;
  ancho: number;
  alto: number;
  hotspot: { x: number; y: number } | null;
};

export type SeccionContenido = {
  /** Clave estable del item dentro del arreglo de Sanity, usada como key de
   *  React (antes se usaba el titulo, que ya no existe). Se llama "id" y no
   *  "key" a proposito: "key" es una prop reservada de React y chocaba al
   *  hacer spread del objeto. */
  id: string;
  /** La pieza grafica completa del banner, a todo el ancho. URL ya con
   *  ?w=.. — null si el banner todavia no tiene imagen cargada. */
  backgroundImage: string | null;
  backgroundImageAlt: string;
  /** Coordenadas 0-1 del hotspot de Sanity, para object-position en el
   *  cliente (mismo mecanismo que el Hero). Clave aca: el banner recorta la
   *  imagen a lo ancho, y el hotspot decide que parte queda visible. */
  hotspot: { x: number; y: number } | null;
  /** Medidas reales del archivo (null sin imagen o si Sanity no las trae).
   *  En escritorio el banner ocupa la pantalla y muestra la pieza ENTERA con
   *  su proporcion exacta (ver ContentBanner.tsx). */
  ancho: number | null;
  alto: number | null;
  /** null cuando el banner no tiene texto o enlace cargados: en ese caso se
   *  pinta la imagen sola, sin boton (no un boton vacio). */
  cta: CtaBanner | null;
  /** BANNER HIBRIDO (pedido del 2026-10-08): la escena que se dibuja con
   *  Remotion (redes, pauta, crm, asesorias). null = el banner de siempre, una
   *  sola imagen. Con escena, la mitad es la escena y la otra mitad la foto
   *  de primer plano. */
  escena: ClaveEscena | null;
  /** El texto de la escena, linea por linea (vacio = el que trae de fabrica). */
  lineas: string[];
  /** La foto de primer plano, editable en el Studio (null = la de fabrica). */
  foto: FotoPrimerPlano | null;
  ajusteFoto: "cubrir" | "completa";
};

// --- Forma cruda que devuelve Sanity (antes de validar/limpiar) -----------

// Forma laxa a proposito: cada item siempre trae _type, pero el resto de
// campos depende de cual sea y puede no venir (incluso puede ser un _type
// que este archivo todavia no conoce). Validar la forma exacta por tipo es
// responsabilidad de normalizarSeccion(), no de este tipo — un union
// discriminado con un miembro generico "cualquier otro _type" hace que
// TypeScript no pueda acotar los casos conocidos dentro del switch.
export type SeccionRaw = {
  _type: string;
  titulo?: string | null;
  subtitulo?: string | null;
  tarjetas?: { titulo: string | null; descripcion: string | null }[] | null;
  nombre?: string | null;
  descripcion?: string | null;
  foto?: string | null;
  listaHerramientas?: { nombre: string | null; icono: string | null }[] | null;
  textoBoton?: string | null;
  enlace?: string | null;
};

export type HeroRaw = {
  titulo: string | null;
  marca: string | null;
  mensaje: string | null;
  ctaPrincipalTexto: string | null;
  ctaPrincipalEnlace: string | null;
  ctaSecundarioTexto: string | null;
  ctaSecundarioEnlace: string | null;
} | null;

/** El documento singleton `hero` (ver studio/schemaTypes/hero.ts) — solo la
 *  fotografía, separada del texto/CTA de paginaInicio.hero desde
 *  "Implementación final del Hero + Sanity + Cards" (spec §5-9). */
export type HeroDocRaw = {
  imagen: string | null;
  imagenAlt: string | null;
  hotspot: { x: number; y: number } | null;
} | null;

export type CapacidadRaw = {
  titulo: string | null;
  descripcion: string | null;
  icono: string | null;
  activa: boolean | null;
  enlace: string | null;
};

export type PosicionCtaRaw = {
  horizontal: string | null;
  vertical: string | null;
  desplazamientoX: number | null;
  desplazamientoY: number | null;
} | null;

export type SeccionContenidoRaw = {
  id: string | null;
  backgroundImage: string | null;
  backgroundImageAlt: string | null;
  hotspot: { x: number; y: number } | null;
  ancho: number | null;
  alto: number | null;
  escena: string | null;
  lineas: (string | null)[] | null;
  foto: { url: string | null; ancho: number | null; alto: number | null; hotspot: { x: number; y: number } | null } | null;
  ajusteFoto: string | null;
  ctaTexto: string | null;
  ctaEnlace: string | null;
  ctaColor: string | null;
  ctaPosicionDesktop: PosicionCtaRaw;
  ctaPosicionMobile: PosicionCtaRaw;
};

export type PaginaInicioRaw = {
  titulo: string | null;
  secciones: SeccionRaw[] | null;
  hero: HeroRaw;
  capacidades: CapacidadRaw[] | null;
};

/** El documento singleton `banners` (ver studio/schemaTypes/banners.ts).
 *  Antes era un campo de paginaInicio; se separo para que el Studio pueda
 *  darle una entrada propia en el menu -- ver la nota de ese archivo. */
export type BannersDocRaw = { seccionesContenido: SeccionContenidoRaw[] | null } | null;


// Texto de siempre, por si el documento paginaInicio no existe todavia o
// falta alguna seccion puntual en el Studio. Mismo orden que tenia la
// pagina antes de esta migracion.
const SECCIONES_FALLBACK: SeccionData[] = [
  {
    _type: "seccionHacemos",
    titulo: "Lo que hacemos",
    subtitulo:
      "Tres frentes que se sostienen entre sí. La campaña atrae, el CRM ordena, la IA responde.",
    tarjetas: [
      {
        titulo: "Marketing Digital 360",
        descripcion:
          "Una sola idea sostenida en todos los formatos, del concepto a la pauta.",
      },
      {
        titulo: "CRM",
        descripcion:
          "Cada conversación queda registrada, asignada y medida. Nada se enfría en una bandeja.",
      },
      {
        titulo: "Inteligencia Artificial",
        descripcion:
          "Atención que no duerme: responde, califica y entrega el lead listo al vendedor.",
      },
    ],
  },
  {
    _type: "seccionSocio",
    nombre: "Daniel Vallejo",
    descripcion:
      "Daniel es quien se sienta con el dueño del negocio antes de que exista una sola pieza. Pregunta qué se vende, con qué margen y por qué el cliente vuelve. De ahí sale el brief, no de un formato.\n\nSu trabajo es que la creatividad y el sistema no vayan por separado. Que la campaña que se produce sea la que el CRM puede sostener, y que el equipo comercial reciba leads que efectivamente sabe atender.",
    foto: "/media/socio-retrato.jpg",
  },
  {
    _type: "seccionCierre",
    titulo: "Hablemos",
    textoBoton: "Escribir por WhatsApp",
    // El enlace sale de la configuracion corporativa, no escrito a mano.
    // Aqui vivia "wa.me/593999999999", un numero inventado, y como Sanity no
    // esta sirviendo contenido en produccion, ESTE respaldo era el que se
    // publicaba: el CTA de WhatsApp del sitio apuntaba a un numero que no
    // existe. Si algun dia se edita el enlace desde el Studio, ese valor
    // gana sobre este respaldo.
    enlace: whatsappUrl,
  },
];

// --- Hero + Capacidades: fallback centralizado (spec §38/§70) -------------
//
// Mismo copy que ya estaba aprobado en el Hero (Sprint "Navbar + Hero
// reframe") y las mismas 4 capacidades del sprint de motion anterior. Un
// solo lugar de verdad: Hero.tsx y CapabilityBand.tsx nunca escriben estos
// strings, solo pintan lo que reciben.

export const HERO_FALLBACK: HeroContent = {
  titulo: "Un Mar de Ideas",
  marca: "DOFI Agencia Creativa",
  mensaje: "Convertimos atención en Ventas Inteligentes",
  imagen: null,
  imagenAlt: "",
  hotspot: null,
  // CTA actualizados en "Corrección Hero final" (spec §16-19). El principal
  // sigue yendo a /contactanos (ruta real, ya existia); el secundario pasa
  // de un ancla a #servicios a /clientes -- es la ruta real de portafolio/
  // casos que ya existe en el proyecto (se inspecciono src/app/ antes de
  // escribir esta ruta, no hay /casos ni /portfolio; no se inventa una
  // pagina nueva solo para este boton). Desde el 2026-10-15 el secundario
  // lleva a /redes: la pagina de enlaces a las redes de DOFI que se creo
  // para este boton (pedido explicito del propietario).
  ctaPrincipalTexto: "Quiero Mejorar mis Ventas",
  ctaPrincipalEnlace: "/contactanos",
  ctaSecundarioTexto: "Mira Nuestro Trabajo",
  ctaSecundarioEnlace: "/redes",
};

/** Contenido reemplazado en "Corrección del Hero + actualización de
 *  tarjetas" §13-14 — los 4 titulos y microdescripciones son los que pidio
 *  el propietario, textuales. */
export const CAPACIDADES_FALLBACK: Capacidad[] = [
  {
    titulo: "Redes Sociales",
    descripcion: "Contenido estratégico para conectar, crecer y vender.",
    icono: "social",
    enlace: null,
  },
  {
    titulo: "Pauta en TikTok y Meta",
    descripcion: "Campañas enfocadas en alcance, tráfico y conversión.",
    icono: "ads",
    enlace: null,
  },
  {
    titulo: "+3M$ Vendidos en Redes",
    descripcion: "Resultados reales impulsados por estrategia y ejecución.",
    icono: "growth",
    enlace: null,
  },
  {
    titulo: "Rescatando Emprendedores",
    descripcion: "Impulsamos negocios con dirección, visibilidad y ventas.",
    icono: "rescue",
    enlace: null,
  },
  // Pedido del 2026-10-20. Sin enlace: el sitio todavía no tiene una página
  // de Academia (no se inventa un destino). Cuando exista, se le pone su ruta
  // en el Studio y la tarjeta pasa a ser un enlace, como las demás.
  {
    titulo: "Academia",
    // 2026-10-23: el texto del 2026-10-22, más breve (pedido del propietario:
    // menos texto, conservando lo principal).
    descripcion: "Aprende Inteligencia Artificial y nuevas herramientas para tu negocio.",
    icono: "academia",
    enlace: null,
  },
];

/** Respaldo de los 4 banners: sin imagen, para que la home conserve su
 *  estructura (4 bloques) aunque Sanity no responda o el documento este
 *  vacio. Cada ContentBanner pinta su propia atmosfera en ese caso, igual
 *  que el Hero sin foto -- nunca un hueco roto. Tampoco lleva CTA: un boton
 *  flotando sobre un bloque sin imagen no comunica nada. */
const SECCIONES_CONTENIDO_FALLBACK: SeccionContenido[] = [1, 2, 3, 4].map((n) => ({
  id: `banner-respaldo-${n}`,
  backgroundImage: null,
  backgroundImageAlt: "",
  hotspot: null,
  ancho: null,
  alto: null,
  cta: null,
  escena: null,
  lineas: [],
  foto: null,
  ajusteFoto: "cubrir",
}));

const POSICIONES_H = new Set<PosicionHorizontalCta>([
  "izquierda",
  "centro-izquierda",
  "centro",
  "centro-derecha",
  "derecha",
]);
const POSICIONES_V = new Set<PosicionVerticalCta>([
  "arriba",
  "centro-arriba",
  "centro",
  "centro-abajo",
  "abajo",
]);

const COLORES_CTA = new Set<ColorCta>(["naranja", "morado", "blanco", "oscuro"]);

/** Si el Studio todavia no tiene posicion elegida (o llega un valor que este
 *  codigo no conoce), el boton cae abajo y al centro: la ubicacion mas
 *  predecible y la que menos suele tapar en una pieza apaisada. */
const POSICION_CTA_POR_DEFECTO: PosicionCta = {
  horizontal: "centro",
  vertical: "abajo",
  desplazamientoX: 0,
  desplazamientoY: 0,
};

/** Acota el ajuste fino al mismo rango que valida el Studio. Un numero
 *  absurdo (o un texto colado en el campo) mandaria el boton fuera del
 *  banner, donde el overflow-hidden lo cortaria sin dejar rastro. */
function desplazamientoValido(valor: number | null | undefined): number {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return 0;
  return Math.max(-30, Math.min(30, valor));
}

function normalizarPosicionCta(raw: PosicionCtaRaw): PosicionCta {
  const horizontal = raw?.horizontal as PosicionHorizontalCta | undefined;
  const vertical = raw?.vertical as PosicionVerticalCta | undefined;
  return {
    horizontal:
      horizontal && POSICIONES_H.has(horizontal)
        ? horizontal
        : POSICION_CTA_POR_DEFECTO.horizontal,
    vertical:
      vertical && POSICIONES_V.has(vertical) ? vertical : POSICION_CTA_POR_DEFECTO.vertical,
    desplazamientoX: desplazamientoValido(raw?.desplazamientoX),
    desplazamientoY: desplazamientoValido(raw?.desplazamientoY),
  };
}

/** Un CTA sin texto o sin enlace no es un CTA a medias: es ningun CTA. Se
 *  devuelve null y el banner se pinta como imagen sola. */
function normalizarCtaBanner(raw: SeccionContenidoRaw): CtaBanner | null {
  const texto = raw.ctaTexto?.trim();
  const enlace = raw.ctaEnlace?.trim();
  if (!texto || !enlace) return null;

  const color = raw.ctaColor as ColorCta | null;

  return {
    texto,
    enlace,
    // Una ruta interna empieza con "/". Todo lo demas (https://, mailto:,
    // tel:) sale del sitio y se abre en pestaña nueva -- ver §14 del pedido.
    esExterno: !enlace.startsWith("/"),
    color: color && COLORES_CTA.has(color) ? color : "naranja",
    desktop: normalizarPosicionCta(raw.ctaPosicionDesktop),
    mobile: normalizarPosicionCta(raw.ctaPosicionMobile),
  };
}

const ICONOS_VALIDOS = new Set<IconoCapacidad>([
  "social",
  "ads",
  "growth",
  "rescue",
  "academia",
]);

/** `hero` (texto/CTA, de paginaInicio) y `heroDoc` (imagen, del documento
 *  singleton `hero` — ver studio/schemaTypes/hero.ts) llegan de DOS
 *  documentos independientes; esta funcion los combina en un solo
 *  HeroContent para el frontend, que nunca necesita saber que son fuentes
 *  separadas.
 *
 *  `hero` puede venir null (paginaInicio sin ese campo todavia). Si falta
 *  el titulo (el campo del que depende visualmente el diseño, spec §55),
 *  se usa el respaldo completo de texto/CTA — nunca un Hero a medio
 *  llenar. La imagen es independiente de esa decision: `heroDoc` puede
 *  faltar (documento `hero` no creado todavia) o venir sin asset cargado
 *  (imagen queda null) sin que eso afecte al texto en absoluto. */
function normalizarHero(raw: HeroRaw, heroDoc: HeroDocRaw): HeroContent {
  const imagen = heroDoc?.imagen ?? null;
  const imagenAlt = heroDoc?.imagenAlt ?? "";
  const hotspot = imagen && heroDoc?.hotspot ? heroDoc.hotspot : null;

  if (!raw || !raw.titulo) {
    return { ...HERO_FALLBACK, imagen, imagenAlt, hotspot };
  }
  return {
    titulo: raw.titulo,
    marca: raw.marca ?? HERO_FALLBACK.marca,
    mensaje: raw.mensaje ?? HERO_FALLBACK.mensaje,
    imagen,
    imagenAlt,
    hotspot,
    ctaPrincipalTexto: raw.ctaPrincipalTexto ?? HERO_FALLBACK.ctaPrincipalTexto,
    ctaPrincipalEnlace: raw.ctaPrincipalEnlace ?? HERO_FALLBACK.ctaPrincipalEnlace,
    ctaSecundarioTexto: raw.ctaSecundarioTexto ?? HERO_FALLBACK.ctaSecundarioTexto,
    ctaSecundarioEnlace: raw.ctaSecundarioEnlace ?? HERO_FALLBACK.ctaSecundarioEnlace,
  };
}

/** Descarta items sin titulo/descripcion/icono valido o marcados inactivos
 *  (spec §32 "activar/desactivar"). Si no queda ninguna capacidad valida,
 *  usa el respaldo completo — la banda nunca se muestra vacia. */
function normalizarCapacidades(raw: CapacidadRaw[] | null): Capacidad[] {
  const validas = (raw ?? [])
    .filter((c) => c.activa !== false)
    .filter(
      (c): c is CapacidadRaw & { titulo: string; descripcion: string; icono: IconoCapacidad } =>
        Boolean(c.titulo) && Boolean(c.descripcion) && ICONOS_VALIDOS.has(c.icono as IconoCapacidad)
    )
    .map((c) => ({
      titulo: c.titulo,
      descripcion: c.descripcion,
      icono: c.icono,
      enlace: c.enlace ?? null,
    }));

  return validas.length > 0 ? validas : CAPACIDADES_FALLBACK;
}

/** La escena de un banner hibrido, si es una de las que existen. */
function normalizarEscena(v: string | null | undefined): ClaveEscena | null {
  return v && (CLAVES_ESCENA as readonly string[]).includes(v) ? (v as ClaveEscena) : null;
}

/** La foto de primer plano: con URL y medidas validas, o null (se usa la de
 *  fabrica de esa escena). */
function normalizarFoto(raw: SeccionContenidoRaw["foto"]): FotoPrimerPlano | null {
  if (!raw?.url || !(raw.ancho && raw.ancho > 0) || !(raw.alto && raw.alto > 0)) return null;
  return { url: raw.url, ancho: raw.ancho, alto: raw.alto, hotspot: raw.hotspot ?? null };
}

/** Un banner es su imagen (el de siempre) o una escena Remotion con su foto
 *  (hibrido): un item sin ninguna de las dos no tiene nada que mostrar y se
 *  descarta. Si no queda ninguno valido, se usan los 4 de respaldo — la home
 *  nunca pierde su estructura de 4 bloques. */
function normalizarSeccionesContenido(raw: SeccionContenidoRaw[] | null): SeccionContenido[] {
  const validos = (raw ?? [])
    .filter((s) => Boolean(s.backgroundImage) || normalizarEscena(s.escena) !== null)
    .map((s, i): SeccionContenido => {
      const escena = normalizarEscena(s.escena);
      return {
        id: s.id ?? `banner-${i}`,
        backgroundImage: s.backgroundImage ?? null,
        backgroundImageAlt: s.backgroundImageAlt ?? "",
        hotspot: s.hotspot ?? null,
        ancho: typeof s.ancho === "number" && s.ancho > 0 ? s.ancho : null,
        alto: typeof s.alto === "number" && s.alto > 0 ? s.alto : null,
        cta: normalizarCtaBanner(s),
        escena,
        lineas: (s.lineas ?? []).map((l) => (typeof l === "string" ? l.trim() : "")).filter(Boolean),
        foto: escena ? normalizarFoto(s.foto) : null,
        ajusteFoto: s.ajusteFoto === "completa" ? "completa" : "cubrir",
      };
    });

  return validos.length > 0 ? validos : SECCIONES_CONTENIDO_FALLBACK;
}

/** Valida un item crudo del arreglo y lo deja listo para pintar, o
 *  descarta lo que venga incompleto o de un tipo que todavia no tiene
 *  componente asignado (ver nota de seccionPilares mas arriba). */
function normalizarSeccion(raw: SeccionRaw): SeccionData | null {
  switch (raw._type) {
    case "seccionHacemos": {
      const tarjetas = (raw.tarjetas ?? []).filter(
        (t): t is { titulo: string; descripcion: string } =>
          Boolean(t.titulo && t.descripcion)
      );
      if (!raw.titulo || !raw.subtitulo || tarjetas.length === 0) return null;
      return {
        _type: "seccionHacemos",
        titulo: raw.titulo,
        subtitulo: raw.subtitulo,
        tarjetas,
      };
    }
    case "seccionSocio": {
      if (!raw.nombre || !raw.descripcion || !raw.foto) return null;
      return {
        _type: "seccionSocio",
        nombre: raw.nombre,
        descripcion: raw.descripcion,
        foto: raw.foto,
      };
    }
    case "seccionCierre": {
      if (!raw.titulo || !raw.textoBoton || !raw.enlace) return null;
      return {
        _type: "seccionCierre",
        titulo: raw.titulo,
        textoBoton: raw.textoBoton,
        enlace: raw.enlace,
      };
    }
    case "seccionPilares":
      console.error(
        '[sanity] seccionPilares llego del CMS pero todavia no tiene componente asignado (le faltan campos que Tools.tsx necesita). Se ignora sin romper la pagina; Tools.tsx sigue con su contenido fijo.'
      );
      return null;
    default:
      console.error(
        `[sanity] La seccion "${raw._type}" no tiene componente asignado en page.tsx, se ignora.`
      );
      return null;
  }
}

/** La forma cruda que devuelve QUERY_PAGINA_INICIO (src/lib/sanity.ts), o la
 *  proyeccion equivalente del panel (src/lib/contenido/proyecciones/
 *  pagina-inicio.ts). */
export type RespuestaCrudaInicio = {
  pagina: PaginaInicioRaw | null;
  bannersDoc: BannersDocRaw;
  heroDoc: HeroDocRaw;
};

export type PaginaInicio = {
  secciones: SeccionData[];
  hero: HeroContent;
  capacidades: Capacidad[];
  seccionesContenido: SeccionContenido[];
};

/**
 * Arma TODO el contenido de paginaInicio a partir de la respuesta cruda:
 * secciones[] (Hacemos/Socio/Cierre, orden fijo en page.tsx — ver comentario
 * ahi), mas hero{} y capacidades[] (Replanteo Navbar + Hero + Sanity).
 *
 * Si no hay respuesta o el documento no existe, todo cae a su respaldo
 * (SECCIONES_FALLBACK / HERO_FALLBACK / CAPACIDADES_FALLBACK). Si responde
 * pero falta una seccion puntual, respeta el orden real de lo que si vino
 * bien formado y agrega al final el respaldo de lo que falte — ninguna
 * seccion desaparece de la pagina mientras se termina de cargar contenido
 * en el Studio.
 */
export function armarPaginaInicio(respuesta: RespuestaCrudaInicio | null): PaginaInicio {
  const pagina = respuesta?.pagina ?? null;

  const crudo = pagina?.secciones ?? [];
  const validas = crudo
    .map(normalizarSeccion)
    .filter((s): s is SeccionData => s !== null);

  const tiposPresentes = new Set(validas.map((s) => s._type));
  const faltantes = SECCIONES_FALLBACK.filter(
    (s) => !tiposPresentes.has(s._type)
  );

  return {
    secciones: [...validas, ...faltantes],
    hero: normalizarHero(pagina?.hero ?? null, respuesta?.heroDoc ?? null),
    capacidades: normalizarCapacidades(pagina?.capacidades ?? null),
    seccionesContenido: normalizarSeccionesContenido(
      respuesta?.bannersDoc?.seccionesContenido ?? null
    ),
  };
}
