import { CIERRES, TEXTO_CTA, VARIANTES_CTA } from "@/lib/cta";
import { ICONOS_CATEGORIA, type IconoCategoria } from "@/lib/marketing-digital";
import { ICONOS_PLATAFORMA, type IconoPlataforma } from "@/lib/trafico";
import type { Campo, DefinicionBloque, Opcion, TipoElemento } from "./tipos";

/**
 * Los bloques de `sections[]` de las páginas de servicio, con los mismos
 * campos que tenían en Sanity (docs/panel-propio/inventario-esquema.md §3.4).
 * Ningún nombre de campo cambia: el panel escribe exactamente donde escribía
 * el Studio. Etapa 4a: los de Asesorías; 4b: los de Marketing Digital,
 * Tráfico / Ads y ChatBots / CRM. Ya no queda ningún tipo sin formulario.
 *
 * Las ayudas dicen lo que la web hace HOY con cada campo (src/lib/*.ts y
 * src/components/*): cuando un campo existe en los datos pero la web no lo
 * usa, se declara igual (para no perderlo) y su ayuda lo dice.
 */

/** Las páginas de servicio, con la clave que usa src/lib/cta.ts. */
export type PaginaServicio = "marketing" | "trafico" | "feniax" | "asesorias";

export const NOMBRE_PAGINA: Record<PaginaServicio, string> = {
  marketing: "Marketing Digital",
  trafico: "Tráfico / Ads",
  feniax: "ChatBots / CRM",
  asesorias: "Asesorías",
};

type Grupo = DefinicionBloque["grupos"][number];

// ── Ayudas de los botones y cierres (src/lib/cta.ts) ────────────────────────

function ayudaBoton(pagina: PaginaServicio, tipo: string, base?: string): string {
  const variante = VARIANTES_CTA[`${pagina}:${tipo}`];
  const regla = variante
    ? `Si el texto es «${TEXTO_CTA}», la web muestra «${variante}» en este lugar; si escribes otro, se respeta el tuyo.`
    : "";
  return [base, regla, "Sin texto o sin enlace, el botón no se muestra."].filter(Boolean).join(" ");
}

function ayudaTituloCierre(pagina: PaginaServicio, base: string): string {
  const cierre = CIERRES[`${pagina}:ctaBanner`];
  return cierre ? `${base} Si dice «${cierre.anterior}», la web muestra «${cierre.titulo}» (y su descripción).` : base;
}

// ── Campos comunes (camposBase, campoAlineacion, campoOverlay) ──────────────

const activo: Campo = {
  clase: "booleano",
  nombre: "activo",
  titulo: "Mostrar en la página",
  porDefecto: true,
  ayuda: "Apágalo para ocultar la sección sin borrarla.",
};
const animar: Campo = {
  clase: "booleano",
  nombre: "animar",
  titulo: "Animaciones",
  porDefecto: true,
  ayuda: "Entradas suaves al hacer scroll. Apágalas para que todo aparezca quieto.",
};

const texto = (nombre: string, titulo: string, ayuda?: string, extra: Partial<Campo> = {}): Campo =>
  ({ clase: "texto", nombre, titulo, ayuda, ...extra }) as Campo;
const parrafo = (nombre: string, titulo: string, ayuda?: string, extra: Partial<Campo> = {}): Campo =>
  ({ clase: "textoLargo", nombre, titulo, ayuda, filas: 4, ...extra }) as Campo;
const imagen = (nombre: string, titulo: string, ayuda?: string): Campo[] => [
  { clase: "imagen", nombre, titulo, ayuda },
  {
    clase: "texto",
    nombre: `${nombre}.alt`,
    titulo: "Descripción de la foto",
    ayuda: "Qué se ve en la foto, para quien no puede verla y para Google.",
  },
];
/** Una imagen sin texto alternativo propio (logos, foto del chat…). */
const foto = (nombre: string, titulo: string, ayuda?: string): Campo => ({ clase: "imagen", nombre, titulo, ayuda });
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
const opcion = (nombre: string, titulo: string, opciones: Opcion[], ayuda?: string, forma: "lista" | "botones" = "lista"): Campo => ({
  clase: "opcion",
  nombre,
  titulo,
  opciones,
  forma,
  ayuda,
});
/** El texto de un campo de un elemento, para su nombre en la lista. */
const cadena = (v: unknown) => (typeof v === "string" ? v.trim() : "");

const alineacion = (porDefecto: string): Campo => ({
  clase: "opcion",
  nombre: "alineacion",
  titulo: "Posición del contenido",
  forma: "botones",
  opciones: [
    { valor: "izquierda", titulo: "Izquierda" },
    { valor: "centro", titulo: "Centro" },
    { valor: "derecha", titulo: "Derecha" },
  ],
  ayuda: `En computadora (si no eliges, ${porDefecto}). En el celular el texto va siempre abajo.`,
});
const overlay: Campo = {
  clase: "opcion",
  nombre: "overlay",
  titulo: "Oscurecer la foto",
  forma: "botones",
  opciones: [
    { valor: "ninguno", titulo: "Nada" },
    { valor: "suave", titulo: "Suave" },
    { valor: "medio", titulo: "Medio" },
    { valor: "fuerte", titulo: "Fuerte" },
  ],
  ayuda: "Oscurece la foto del lado del texto para que se lea bien. Si la foto es clara, súbelo.",
};

const boton = (pagina: PaginaServicio, tipo: string, ayuda?: string) => ({
  titulo: "BOTÓN",
  campos: [
    texto("cta.texto", "Texto del botón", ayudaBoton(pagina, tipo, ayuda), { max: 40 }),
    { clase: "enlace", nombre: "cta.enlace", titulo: "A dónde lleva", ayuda: "Una página de esta web empezando con «/» (ej. /contactanos?servicio=asesorias) o una dirección completa https://…" } as Campo,
  ],
});

const diseno = (...extra: Campo[]) => ({ titulo: "DISEÑO", campos: [...extra, animar, activo] });

/** El grupo TEXTO de camposBase. `conDestacado: false` en los bloques que lo omiten en el Studio. */
const grupoTexto = (
  a: { subtitulo?: string; titulo?: string; descripcion?: string; destacado?: string },
  conDestacado = true,
): Grupo => ({
  titulo: "TEXTO",
  campos: [
    texto("subtitulo", "Subtítulo", a.subtitulo ?? "Opcional: etiqueta chica arriba del título."),
    texto("titulo", "Título", a.titulo, { obligatorio: true }),
    parrafo("descripcion", "Descripción", a.descripcion ?? "Deja una línea en blanco para separar párrafos."),
    ...(conDestacado ? [texto("destacado", "Texto destacado", a.destacado)] : []),
  ],
});

/** `imagen` + `imagenMovil` de camposBase. */
const grupoImagenes = (titulo: string, ayuda: string): Grupo => ({
  titulo,
  campos: [
    ...imagen("imagen", "Imagen", ayuda),
    foto("imagenMovil", "Imagen para celular (opcional)", "Una versión compuesta para teléfono. Sin ella, en el celular se usa la de arriba."),
  ],
});

/** Un video vertical en un celular (objeto `videoCelular`). */
const celular = (nombre: string, titulo: string) => ({
  titulo: titulo.toUpperCase(),
  campos: [
    {
      clase: "video",
      nombre: `${nombre}.video`,
      titulo: "Video",
      ayuda: "Vertical (9:16), MP4 liviano: idealmente menos de 15 MB. No se descarga hasta que la sección está por verse; se reproduce al tocarlo.",
    } as Campo,
    texto(`${nombre}.titulo`, "Título sobre el video", "Opcional. Corto, va en mayúsculas abajo del video. Ej.: «¿Cómo llegar?».", { max: 40 }),
    ...imagen(`${nombre}.portada`, "Portada (opcional)", "Lo que se ve antes de reproducir. Idealmente un cuadro del mismo video. Sin portada, se ve el primer cuadro."),
  ],
});

// ── Portada (teamBanner): lo que cambia según la página ─────────────────────

/** «Integración de la foto con el fondo» (studio/schemaTypes/objects/integracionFoto.ts, 2026-11-25). */
const integracionFoto: Campo[] = [
  opcion(
    "integracionFoto.tratamiento",
    "Integración con el fondo",
    [
      { valor: "luz", titulo: "Luz de escena (recomendado): borde fundido y contraluz morado y naranja" },
      { valor: "fundido", titulo: "Fundido: solo el borde se disuelve en el fondo" },
      { valor: "escenario", titulo: "Escenario: luz de escena y un aro de luz detrás" },
      { valor: "ninguno", titulo: "Ninguno: la imagen tal cual" },
    ],
    "Para que la imagen no se vea pegada encima del fondo. Si no eliges, «Luz de escena».",
  ),
  numero("integracionFoto.intensidad", "Intensidad de la integración", "De 0 a 100: cuánto se nota el fundido y la luz. Si no pones nada, 60.", { min: 0, max: 100, paso: 1 }),
];

/** El celular con video estilo TikTok (camposVideoTikTok): solo en ChatBots/CRM. */
const celularTikTok: Grupo = {
  titulo: "CELULAR CON VIDEO (HOY NO SE MUESTRA)",
  nota: "Desde el 2026-10-20 el celular de esta portada reproduce las conversaciones de WhatsApp de «Clientes» (se editan dentro de cada giro), no este video. Estos datos quedan guardados por si se vuelve a usar.",
  campos: [
    { clase: "video", nombre: "video", titulo: "Video", ayuda: "Vertical (9:16), como los de TikTok o Reels. MP4 liviano: idealmente menos de 15 MB." },
    opcion(
      "ajusteVideo",
      "Ajuste del video",
      [
        { valor: "rellenar", titulo: "Rellenar la pantalla" },
        { valor: "completo", titulo: "Video completo" },
      ],
      "«Rellenar» puede recortar los bordes; «Completo» lo muestra entero. Nunca se deforma. Si no eliges, rellenar.",
      "botones",
    ),
    ...imagen("portadaVideo", "Portada del video (opcional)", "Se ve mientras el video carga. Idealmente, un cuadro del mismo video."),
    interruptor("sonidoVideo", "Mostrar botón de sonido", false),
    texto("usuarioTikTok", "Usuario", "El usuario que firma la publicación. Vacío: @dofiagenciacreativa."),
    texto("descripcionVideo", "Descripción del video", "Opcional. Una frase corta debajo del usuario (se ven hasta dos líneas).", { max: 150 }),
    numero("meGusta", "Me gusta (al empezar)", "Los contadores son una simulación: arrancan en este número y suben mientras el video corre. Vacío: 8240.", { min: 0, paso: 1 }),
    numero("comentarios", "Comentarios (al empezar)", "Vacío: 312.", { min: 0, paso: 1 }),
    numero("compartidos", "Compartidos (al empezar)", "Vacío: 145.", { min: 0, paso: 1 }),
  ],
};

const AYUDA_PORTADA: Record<PaginaServicio, string> = {
  marketing:
    "Lo primero que se ve: a la izquierda el título, la frase y el botón, sobre el fondo morado de marca; a la derecha, la imagen del equipo (PNG con fondo transparente).",
  trafico:
    "Lo primero que se ve: el título, la frase y el botón a la izquierda y, a la derecha, la diana animada con las plataformas por las que llegan los clientes. Si subes una foto de fondo, la foto reemplaza a la diana.",
  feniax:
    "Lo primero que se ve: el título, la frase y el botón a la izquierda y, a la derecha, un celular con conversaciones de WhatsApp. Esas conversaciones se editan en «Clientes», dentro de cada giro.",
  asesorias: "La portada de la página: título, frase y botón.",
};

const SIN_USO_PORTADA = "Hoy esta portada no usa esta opción: su diseño es fijo. Se guarda por si cambia.";

// ── Listas: pasos, plataformas, giros, empresas, chat y métricas ────────────

const PASO: TipoElemento = {
  tipo: "pasoMetodo",
  titulo: "Paso",
  resumen: (e) => cadena(e.titulo) || "Paso sin título",
  campos: [
    texto("titulo", "Título", "Ej.: «Adentrarnos en tu marca». Un paso sin título no se muestra.", { obligatorio: true }),
    texto("descripcion", "Descripción", "Una línea. Ej.: «Investigación de experiencia y características de la marca»."),
  ],
};

const TITULO_ICONO_PLATAFORMA: Record<IconoPlataforma, string> = {
  meta: "Meta (Facebook + Instagram)",
  tiktok: "TikTok",
  google: "Google Ads",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  web: "Tráfico web (globo)",
};

const TITULO_ICONO_GIRO: Record<IconoCategoria, string> = {
  construccion: "Edificio — construcción",
  belleza: "Destello — belleza",
  servicios: "Apretón de manos — servicios",
  comercio: "Tienda — comercio",
  emprendedores: "Cohete — emprendedores",
  salud: "Pulso — salud",
  gastronomia: "Cubiertos — gastronomía",
  tecnologia: "Chip — tecnología",
  automotriz: "Auto — automotriz",
  inmobiliaria: "Casa — inmobiliaria",
  educacion: "Birrete — educación",
  turismo: "Avión — turismo",
};

const opcionesDe = <T extends string>(claves: readonly T[], titulos: Record<T, string>): Opcion[] =>
  claves.map((valor) => ({ valor, titulo: titulos[valor] }));

const PLATAFORMA: TipoElemento = {
  tipo: "plataforma",
  titulo: "Plataforma",
  resumen: (e) => cadena(e.nombre) || "Plataforma sin nombre",
  nuevo: () => ({ icono: "web" }),
  campos: [
    texto("nombre", "Nombre", "Ej.: «Meta Ads». Sin nombre, la tarjeta no se muestra.", { obligatorio: true }),
    texto("etiqueta", "Frase que la resume", "Va bajo el nombre. Ej.: «Facebook + Instagram»."),
    parrafo("descripcion", "Qué hacemos en ella"),
    opcion("icono", "Ícono", opcionesDe(ICONOS_PLATAFORMA, TITULO_ICONO_PLATAFORMA), "Si no eliges, el globo de tráfico web."),
  ],
};

/** Una empresa con su logo dentro de un giro (`empresaGiro`). Las Cuentas enlazadas (referencias) se ven en la lista, sin campos. */
const EMPRESA: TipoElemento = {
  tipo: "empresaGiro",
  titulo: "Empresa con logo propio",
  resumen: (e) => cadena(e.nombre) || "Empresa sin nombre",
  campos: [
    texto("nombre", "Nombre de la empresa", "Sin nombre, la empresa no se muestra.", { obligatorio: true }),
    foto("logo", "Logo", "PNG o SVG, idealmente con fondo transparente. Es el archivo original: no se recorta ni se deforma."),
    foto(
      "logoCircular",
      "Logo circular",
      "La versión REDONDA del logo (cuadrada, con lo de afuera del círculo transparente), la que se usa con «Logos redondos». Si cambias el logo, cambia o quita también esta: mientras falte, la web recorta el logo en círculo.",
    ),
  ],
};

/** Un giro de negocio (`categoriaIcono`, miembroGiro del Studio). `extras` va al final: el chat o las métricas. */
function giro(colores: "DOFI" | "FENIAX", extras: Campo[] = []): TipoElemento {
  return {
    tipo: "categoriaIcono",
    titulo: "Giro de negocio",
    resumen: (e) => {
      const n = Array.isArray(e.empresas) ? e.empresas.length : 0;
      return `${cadena(e.nombre) || "Giro sin nombre"} · ${n === 1 ? "1 empresa" : `${n} empresas`}`;
    },
    nuevo: () => ({ empresas: [] }),
    campos: [
      texto("nombre", "Nombre del giro", "Ej.: Construcción, Salud, Gastronomía. Sin nombre, el giro no se muestra.", { obligatorio: true }),
      opcion("icono", "Ícono (opcional)", opcionesDe(ICONOS_CATEGORIA, TITULO_ICONO_GIRO), "Se ve en el panel del giro. Sin ícono, el panel muestra solo el nombre."),
      ...imagen(
        "imagen",
        "Foto del giro (opcional)",
        `Llena el panel: a color cuando el giro está abierto y en gris cuando no. Sin foto, el panel usa los colores ${colores}.`,
      ),
      {
        clase: "lista",
        nombre: "empresas",
        titulo: "Empresas y logos de este giro",
        ayuda:
          "Sus logos aparecen al abrir el giro, en este orden. Las «Cuentas enlazadas» toman el nombre y el logo de su Cuenta (se cambian allá; una Cuenta apagada no aparece). Aquí se agregan empresas con su logo propio.",
        vacia: "Este giro todavía no tiene empresas.",
        elemento: EMPRESA,
      },
      ...extras,
    ],
  };
}

const MENSAJE: TipoElemento = {
  tipo: "mensajeChat",
  titulo: "Mensaje",
  resumen: (e) => `${e.de === "negocio" ? "Respuesta del negocio" : "Mensaje del cliente"}: ${cadena(e.texto) || "(solo foto)"}`,
  nuevo: () => ({ de: "cliente" }),
  campos: [
    {
      clase: "opcion",
      nombre: "de",
      titulo: "Quién escribe",
      forma: "botones",
      obligatorio: true,
      opciones: [
        { valor: "cliente", titulo: "Cliente (burbuja verde, derecha)" },
        { valor: "negocio", titulo: "Negocio / IA (burbuja blanca, izquierda)" },
      ],
    },
    parrafo("texto", "Texto", "Corto: el teléfono es angosto. Un mensaje sin texto ni foto no se muestra.", { filas: 2 }),
    foto("imagen", "Foto adjunta (opcional)", "Por ejemplo el plato, el auto o el departamento que envía la IA."),
  ],
};

/** La conversación de un giro (`chatDemo`). La web la reproduce en el celular de la portada de ChatBots/CRM. */
const CHAT: Campo[] = [
  texto("chat.negocio", "Chat · Nombre arriba del chat", "Ej.: «Tu restaurante», «Tu inmobiliaria». Es una demostración: no pongas la cuenta de un cliente real. Vacío: el nombre de ejemplo del giro."),
  texto("chat.estado", "Chat · Estado bajo el nombre", "Vacío: «en línea». Mientras la IA escribe, la web muestra «escribiendo…» sola."),
  foto("chat.avatar", "Chat · Foto de perfil (opcional)", "Cuadrada. Sin foto, un círculo con el ícono del giro."),
  {
    clase: "lista",
    nombre: "chat.mensajes",
    titulo: "Chat · Mensajes",
    ayuda: "En orden: alterna cliente y negocio (la IA). Con menos de dos mensajes, la web usa la conversación de ejemplo de este tipo de negocio.",
    vacia: "Sin mensajes propios: se usa la conversación de ejemplo del giro.",
    elemento: MENSAJE,
  },
  texto("chat.aviso.titulo", "Chat · Aviso final (título)", "La tarjeta del CRM que cierra la conversación. Ej.: «Reserva registrada». Sin título, no se muestra."),
  texto("chat.aviso.texto", "Chat · Aviso final (detalle)", "Ej.: «Andrea · 4 personas · Hoy 20:00»."),
];

const HITO: TipoElemento = {
  tipo: "hito",
  titulo: "Optimización",
  resumen: (e) => {
    const que = cadena(e.texto) || "Optimización";
    return typeof e.dia === "number" ? `Día ${e.dia} · ${que}` : que;
  },
  campos: [
    numero("dia", "Día de la campaña", "Entre el 2 y el 29.", { min: 2, max: 29, paso: 1, obligatorio: true }),
    texto("texto", "Qué se hizo", "Corto: cabe una línea. Ej.: «Nueva creatividad».", { max: 28, obligatorio: true }),
  ],
};

/** Las métricas de ejemplo de un giro (`metricasDemo`). Hoy la web no las muestra (TraficoClientes.tsx dibuja los logos). */
const METRICAS: Campo[] = [
  texto(
    "metricas.campana",
    "Métricas · Nombre de la campaña",
    "Hoy las métricas no se ven en la web: se guardan por si vuelve el panel de Meta Ads. Ej.: «Reservas por WhatsApp». Lo que dejes vacío se completa con la campaña de ejemplo del giro.",
  ),
  opcion(
    "metricas.objetivo",
    "Métricas · Objetivo de la campaña",
    [
      { valor: "mensajes", titulo: "Mensajes" },
      { valor: "clientes_potenciales", titulo: "Clientes potenciales" },
      { valor: "ventas", titulo: "Ventas" },
      { valor: "trafico", titulo: "Tráfico" },
      { valor: "reconocimiento", titulo: "Reconocimiento" },
    ],
    "Va bajo el nombre: «Meta Ads · Objetivo: Mensajes».",
  ),
  texto("metricas.resultado", "Métricas · Qué cuenta como resultado", "En plural y corto. Ej.: «Conversaciones». El CPR es el costo de cada uno."),
  texto("metricas.adquisicion", "Métricas · Qué es una adquisición", "En plural y corto. Ej.: «Reservas», «Citas». El CPA es el costo de cada una."),
  numero("metricas.inversion", "Métricas · Inversión total (USD, 30 días)", "En dólares. Ej.: 450.", { min: 0.01, paso: 0.01 }),
  numero("metricas.cpr", "Métricas · CPR: costo por resultado (USD)", "Ej.: 0.85. Los resultados salen de inversión ÷ CPR.", { min: 0.01, paso: 0.01 }),
  numero("metricas.ctr", "Métricas · CTR: porcentaje de clics", "Clics sobre visualizaciones, en %. Ej.: 2.8.", { min: 0.01, max: 100, paso: 0.01 }),
  numero(
    "metricas.cpa",
    "Métricas · CPA: costo por adquisición (USD)",
    "Ej.: 3.40. Las adquisiciones (inversión ÷ CPA) deben ser menos que los resultados: el panel no lo revisa.",
    { min: 0.01, paso: 0.01 },
  ),
  numero(
    "metricas.alcance",
    "Métricas · Alcance: personas únicas",
    "Personas distintas que vieron el anuncio. Ej.: 48200. No puede ser mayor que las visualizaciones: el panel no lo revisa, compruébalo tú.",
    { min: 1, paso: 1 },
  ),
  numero(
    "metricas.visualizaciones",
    "Métricas · Visualizaciones",
    "Veces que se mostró el anuncio. Ej.: 126500. Igual o mayor que el alcance; la frecuencia se calcula sola.",
    { min: 1, paso: 1 },
  ),
  {
    clase: "lista",
    nombre: "metricas.hitos",
    titulo: "Métricas · Optimizaciones marcadas en el gráfico",
    ayuda: "Hasta 4. Vacío: «Día 7 · Nueva creatividad», «Día 14 · Audiencia ajustada» y «Día 21 · Presupuesto escalado».",
    max: 4,
    vacia: "Sin optimizaciones propias: se usan las de ejemplo.",
    elemento: HITO,
  },
  texto(
    "metricas.nota",
    "Métricas · Aviso al pie del panel",
    "Vacío: «Cifras de ejemplo con fines ilustrativos: no corresponden a un cliente real.» Cámbialo solo si cargas resultados reales.",
  ),
];

// ── Clientes: lo común a las tres secciones de giros ────────────────────────

const TITULO_CLIENTES = "Se muestra en una sola línea en computadora.";

/** Tráfico, ChatBots/CRM y Asesorías: giros propios si los hay; si no, los de Marketing Digital (src/lib/trafico.ts, feniax.ts, asesorias.ts). */
const REGLA_GIROS =
  "Si esta lista tiene giros, la web usa estos, con sus propios logos (cambiar los de Marketing Digital no los cambia aquí). Si la dejas vacía, usa los giros de Marketing Digital › Clientes.";

const listaGiros = (elemento: TipoElemento, vacia: string): Campo => ({
  clase: "lista",
  nombre: "categorias",
  titulo: "Giros de negocio",
  vacia,
  elemento,
});

const pasarSolo = (ayuda: string) => interruptor("rotacionAutomatica", "Pasar solo al siguiente giro", true, ayuda);

const LOGOS: Grupo = {
  titulo: "LOGOS (COLUMNA DERECHA)",
  nota: "La columna derecha muestra los logos del giro abierto. Aquí eliges su forma y su tamaño; los logos se cargan dentro de cada giro, en «Empresas y logos».",
  campos: [
    opcion(
      "ajusteLogos.forma",
      "Forma",
      [
        { valor: "circular", titulo: "Logos redondos (recomendado)" },
        { valor: "original", titulo: "Forma original de cada logo" },
      ],
      "«Logos redondos»: cada logo en su versión circular (si una empresa no la tiene, la web recorta su logo en círculo). «Forma original»: cada logo como es, cuadrado o alargado. Si no eliges, redondos.",
      "botones",
    ),
    numero("ajusteLogos.tamano", "Tamaño en computadora (px)", "Diámetro de cada logo (o su alto, en «Forma original»). Entre 72 y 180; si no pones nada, 120.", {
      min: 72,
      max: 180,
      paso: 1,
    }),
    numero("ajusteLogos.tamanoMovil", "Tamaño en celular (px)", "Diámetro de cada logo en el celular (o su alto). Entre 56 y 140; si no pones nada, 92.", {
      min: 56,
      max: 140,
      paso: 1,
    }),
  ],
};

// ── Los bloques ──────────────────────────────────────────────────────────────

type Fabrica = (pagina: PaginaServicio) => DefinicionBloque;

const BLOQUES: Record<string, Fabrica> = {
  splitHeroBanner: (pagina) => ({
    tipo: "splitHeroBanner",
    titulo: "Portada",
    icono: "portada",
    ayuda: "Lo primero que se ve: el título, el logo debajo, una frase y el botón a la izquierda; la imagen a la derecha.",
    grupos: [
      {
        titulo: "TEXTO",
        campos: [
          texto("subtitulo", "Subtítulo", "Opcional: etiqueta chica arriba del título."),
          texto("titulo", "Título", "Ej.: Asesorías 1 a 1.", { obligatorio: true }),
          parrafo("descripcion", "Descripción", "La frase que va debajo del logo."),
          texto("destacado", "Texto destacado", "Opcional: una frase corta en naranja debajo de la descripción."),
        ],
      },
      {
        titulo: "IMÁGENES",
        campos: [
          ...imagen("logo", "Logo (debajo del título)", "Ej.: el logo de «Rescatando Emprendedores». PNG o WebP con fondo transparente; se muestra completo."),
          ...imagen("imagen", "Imagen", "La imagen de la derecha (el grupo de emprendedores). Se muestra completa; ideal PNG o WebP con fondo transparente."),
          { clase: "imagen", nombre: "imagenMovil", titulo: "Imagen para celular (opcional)", ayuda: "Otra versión para teléfono. Sin ella, en el celular se usa la de arriba." },
          ...integracionFoto,
        ],
      },
      boton(pagina, "splitHeroBanner", "El botón de la portada."),
      diseno(),
    ],
  }),

  aboutBanner: (pagina) => ({
    tipo: "aboutBanner",
    titulo: "Introducción",
    icono: "texto",
    ayuda: "Un bloque de texto que presenta el servicio. Si subes una pieza gráfica terminada, se muestra completa en lugar del diseño con texto.",
    grupos: [
      {
        titulo: "TEXTO",
        campos: [
          texto("subtitulo", "Subtítulo", "Opcional: etiqueta chica arriba del título."),
          texto("titulo", "Título", undefined, { obligatorio: true }),
          parrafo("descripcion", "Descripción", "Deja una línea en blanco para separar párrafos."),
          texto("destacado", "Texto destacado", "Frase de cierre en morado. Ej.: Navegar en un Mar de Oportunidades."),
        ],
      },
      {
        titulo: "PIEZA GRÁFICA (OPCIONAL)",
        campos: [
          ...imagen("imagen", "Imagen", "Si subes una pieza terminada, se muestra completa (sin recortes) en lugar del diseño con texto."),
          { clase: "imagen", nombre: "imagenMovil", titulo: "Imagen para celular (opcional)", ayuda: "Una versión compuesta para teléfono." },
        ],
      },
      boton(pagina, "aboutBanner"),
      diseno(),
    ],
  }),

  achievementsBanner: () => ({
    tipo: "achievementsBanner",
    titulo: "Logros",
    icono: "logros",
    ayuda: "Un mazo de tarjetas y, al lado, la foto de la historia que está al frente. Cada clic pasa a la siguiente y cambia la foto.",
    grupos: [
      {
        titulo: "TEXTO",
        campos: [
          texto("subtitulo", "Subtítulo", "Etiqueta chica arriba del título. Ej.: «Logros de nuestros emprendedores»."),
          texto("titulo", "Título", "Ej.: «Historias que nos enorgullecen». La última palabra se resalta con el color de marca.", { obligatorio: true }),
          parrafo("descripcion", "Descripción", "Opcional: una frase debajo del título."),
        ],
      },
      {
        titulo: "LOGROS",
        nota: "Cada logro es una tarjeta con su foto. El orden de la lista es el orden en la web.",
        campos: [
          {
            clase: "lista",
            nombre: "logros",
            titulo: "Logros",
            vacia: "Todavía no hay logros.",
            elemento: {
              tipo: "logro",
              titulo: "Logro",
              resumen: (e) => (typeof e.titulo === "string" && e.titulo) || "Logro sin frase",
              campos: [
                ...imagen("foto", "Foto", "Grande, a la izquierda, mientras la tarjeta está al frente. Vertical (4:5)."),
                texto("titulo", "Frase del logro", "La frase grande de la tarjeta. Ej.: «Duplicó sus clientes».", { obligatorio: true, max: 60 }),
                parrafo("texto", "Remate", "Completa la frase. Ej.: «en tres meses, con una ruta comercial clara».", { max: 160, filas: 2 }),
                texto("etiqueta", "Etiqueta", "Rubro o servicio; va en la tarjeta y sobre la foto. Si coincide con un giro de Clientes, lleva su ícono.", { max: 40 }),
                texto("nombre", "Nombre (sobre la foto)", "Opcional: la persona o el negocio, arriba a la izquierda de la foto.", { max: 40 }),
                texto("firma", "Firma (al pie de la tarjeta)", "Opcional. Ej.: «María, dueña de Panadería La Esquina».", { max: 70 }),
              ],
            },
          },
          { clase: "booleano", nombre: "pasoAutomatico", titulo: "Pasar solo a la siguiente tarjeta", porDefecto: true, ayuda: "Avanza solo mientras la sección está en pantalla; se pausa con el cursor encima." },
          { clase: "numero", nombre: "segundosPorLogro", titulo: "Segundos por tarjeta", min: 4, max: 30, ayuda: "Cuánto queda cada tarjeta al frente (de 4 a 30; si no pones nada, 6)." },
        ],
      },
      diseno(),
    ],
    nuevo: () => ({ titulo: "Historias que nos enorgullecen", logros: [], pasoAutomatico: true, segundosPorLogro: 6 }),
  }),

  celularesBanner: () => ({
    tipo: "celularesBanner",
    titulo: "Videos en celulares",
    icono: "videos",
    ayuda: "Tres celulares con video, el del centro más grande. Cada uno tiene su propio video: cámbialo con «Cambiar video».",
    grupos: [
      {
        titulo: "TEXTO",
        campos: [
          texto("subtitulo", "Subtítulo", "Opcional: etiqueta chica arriba del título."),
          texto("titulo", "Título", undefined, { obligatorio: true }),
          parrafo("descripcion", "Descripción", "Opcional: una frase debajo del título."),
        ],
      },
      celular("celularIzquierdo", "Celular izquierdo"),
      celular("celularCentral", "Celular central (el principal, más grande)"),
      celular("celularDerecho", "Celular derecho"),
      diseno(),
    ],
  }),

  ctaBanner: (pagina) => ({
    tipo: "ctaBanner",
    titulo: "Cierre",
    icono: "cierre",
    ayuda:
      "La última sección: la marca de DOFI hecha de luz, una pregunta de cierre y el botón principal (se muestra grande). Desde el 23 de noviembre el cierre tiene su propio diseño y ya no usa foto de fondo.",
    grupos: [
      {
        titulo: "TEXTO",
        campos: [
          texto("subtitulo", "Subtítulo", "Opcional: etiqueta chica arriba del título."),
          texto("titulo", "Título", ayudaTituloCierre(pagina, "La pregunta de cierre."), { obligatorio: true }),
          parrafo("descripcion", "Descripción", "Deja una línea en blanco para separar párrafos."),
          texto("destacado", "Texto destacado"),
        ],
      },
      boton(pagina, "ctaBanner", "El botón principal de la sección."),
      {
        titulo: "DEL DISEÑO ANTERIOR (HOY NO SE VEN)",
        nota: "El cierre nuevo no usa foto de fondo, ni posición, ni oscurecido. Se guardan por si algún día se vuelve al diseño anterior.",
        campos: [
          ...imagen("imagen", "Foto de fondo", "Hoy no se muestra."),
          { clase: "imagen", nombre: "imagenMovil", titulo: "Foto para celular", ayuda: "Hoy no se muestra." },
          alineacion("centro"),
          overlay,
        ],
      },
      diseno(),
    ],
    nuevo: () => ({ alineacion: "centro", overlay: "medio" }),
  }),

  /**
   * Portada de Marketing Digital, Tráfico / Ads y ChatBots / CRM (el «Equipo DOFI» del Studio).
   * Marketing: sin foto de fondo, con la imagen de la derecha y su integración.
   * ChatBots/CRM: además, el celular con video estilo TikTok (guardado, hoy sin usar).
   */
  teamBanner: (pagina) => {
    const marketing = pagina === "marketing";
    const imagenes: Grupo = marketing
      ? {
          titulo: "IMAGEN DE LA DERECHA",
          nota: "En Marketing Digital el fondo es el morado de marca (no se cambia); lo que se cambia es la imagen de la derecha.",
          campos: [
            foto(
              "imagenDerecha",
              "Imagen de la derecha (PNG con transparencia)",
              "Por ejemplo, el equipo con los delfines. PNG con fondo transparente, recortado justo al contenido y de al menos 1600 px de ancho. En el celular va arriba del texto, centrada.",
            ),
            texto("imagenDerecha.alt", "Descripción de la imagen", "Opcional: qué muestra, en una frase. El título ya dice de qué trata la portada."),
            ...integracionFoto,
          ],
        }
      : grupoImagenes(
          "FOTO DE FONDO (OPCIONAL)",
          pagina === "trafico"
            ? "Si subes una foto, pasa al fondo con un velo y reemplaza a la diana animada de la derecha. Sin foto: el fondo de marca con la diana."
            : "Si subes una foto, pasa al fondo con un velo de marca; el celular con las conversaciones sigue a la derecha. Sin foto: el fondo de FENIAX.",
        );
    return {
      tipo: "teamBanner",
      titulo: "Portada",
      icono: "portada",
      ayuda: AYUDA_PORTADA[pagina],
      grupos: [
        grupoTexto({
          subtitulo: "Etiqueta chica arriba del título. Ej.: «Cuenca - Ecuador».",
          titulo: "La pregunta principal. Breve: pensada para dos líneas.",
          descripcion: pagina === "trafico" ? "Una o dos frases cortas; deja una línea en blanco para separar párrafos." : "Una frase corta.",
          destacado: "El eslogan, en naranja. Ej.: «Un Mar de Ideas».",
        }),
        imagenes,
        ...(pagina === "feniax" ? [celularTikTok] : []),
        boton(pagina, "teamBanner", "El botón de la portada."),
        diseno(
          marketing ? alineacion("izquierda") : { ...alineacion("izquierda"), ayuda: SIN_USO_PORTADA },
          {
            ...overlay,
            ayuda: marketing ? "Hoy no cambia nada: esta portada no lleva foto de fondo (la imagen va a la derecha). Se guarda por si cambia." : SIN_USO_PORTADA,
          },
        ),
      ],
      nuevo: () => ({ alineacion: "izquierda", overlay: "medio" }),
    };
  },

  navigationBanner: (pagina) => {
    const feniax = pagina === "feniax";
    return {
      tipo: "navigationBanner",
      titulo: "Bloque editorial",
      icono: "texto",
      ayuda: feniax
        ? "Un bloque de texto sobre fondo oscuro con el video «Así trabaja FENIAX» a la derecha. Si subes una imagen, la imagen reemplaza al video."
        : "Un bloque de texto sobre fondo morado, con una brújula dibujada. Si subes una pieza gráfica terminada, se muestra completa en lugar de ese diseño.",
      grupos: [
        grupoTexto({
          titulo: feniax ? "Las dos últimas palabras van con el degradado de FENIAX." : "La última palabra se destaca en naranja.",
          descripcion: feniax
            ? "Uno o dos párrafos breves, separados por una línea en blanco."
            : "Uno o dos párrafos breves, separados por una línea en blanco. Con dos, van en dos columnas.",
          destacado: "Opcional: una frase corta debajo de los párrafos.",
        }),
        feniax
          ? grupoImagenes("IMAGEN (OPCIONAL)", "Si la subes, reemplaza al video de la derecha: se muestra completa, sin recortes.")
          : grupoImagenes("PIEZA GRÁFICA (OPCIONAL)", "Si subes una pieza terminada, se muestra completa (sin recortes) en lugar del diseño con brújula."),
        boton(pagina, "navigationBanner"),
        diseno(),
      ],
    };
  },

  methodBanner: (pagina) => ({
    tipo: "methodBanner",
    titulo: "Método en pasos",
    icono: "metodo",
    ayuda: "Un recorrido de pasos numerados que se dibuja al entrar y termina en un destino (el texto destacado). El botón va debajo.",
    grupos: [
      grupoTexto({
        descripcion: "Opcional: una frase debajo del título.",
        destacado: "El destino del recorrido: la última parada, destacada. Ej.: «Ventas Inteligentes Garantizadas».",
      }),
      {
        titulo: "PASOS",
        nota: "En orden: cada paso lleva un ícono según su lugar en la lista.",
        campos: [
          { clase: "lista", nombre: "pasos", titulo: "Pasos", vacia: "Todavía no hay pasos.", elemento: PASO },
          interruptor("mostrarPasos", "Mostrar el recorrido", true, "Apágalo si la pieza gráfica ya trae los pasos dibujados: así no se leen dos veces."),
        ],
      },
      grupoImagenes("PIEZA GRÁFICA (OPCIONAL)", "Opcional: una pieza gráfica del método. Se muestra completa, arriba del recorrido."),
      boton(pagina, "methodBanner", "Va debajo del método."),
      diseno(),
    ],
    nuevo: () => ({ mostrarPasos: true, pasos: [] }),
  }),

  /** Clientes de Marketing Digital y Asesorías. Los de Marketing Digital son el respaldo de las otras tres páginas. */
  clientsBanner: (pagina) => ({
    tipo: "clientsBanner",
    titulo: "Clientes",
    icono: "clientes",
    ayuda: "Un carrusel de giros de negocio (construcción, salud…) y, al lado, los logos de las empresas del giro abierto.",
    grupos: [
      grupoTexto({ titulo: TITULO_CLIENTES, descripcion: "Opcional: una frase debajo del título." }, false),
      {
        titulo: "GIROS",
        nota:
          pagina === "marketing"
            ? "Cada giro es un panel del carrusel, en el orden de la lista; dentro de cada giro van sus empresas y logos. Sin giros, la sección se ve vacía: nunca se inventan. Ojo: estos giros también se muestran en Tráfico, ChatBots/CRM y Asesorías cuando su sección de Clientes no tiene giros propios (si aquí hay dos secciones de Clientes, cuenta la primera)."
            : `Cada giro es un panel del carrusel, en el orden de la lista; dentro de cada giro van sus empresas y logos. ${REGLA_GIROS}`,
        campos: [
          listaGiros(giro("DOFI"), pagina === "marketing" ? "Todavía no hay giros." : "Sin giros propios: se muestran los de Marketing Digital."),
          interruptor(
            "rotacionAutomatica",
            "Rotación automática",
            true,
            "El carrusel avanza solo mientras nadie lo toca. Se detiene cuando el visitante elige un giro y después de dos vueltas.",
          ),
        ],
      },
      LOGOS,
      diseno(),
    ],
    nuevo: () => ({ titulo: "Clientes y casos de éxito", categorias: [], rotacionAutomatica: true }),
  }),

  /** Clientes de ChatBots/CRM: los chats de cada giro se ven en el celular de la portada (PaginaFeniax.tsx), no aquí. */
  chatClientsBanner: () => ({
    tipo: "chatClientsBanner",
    titulo: "Clientes",
    icono: "clientes",
    ayuda:
      "Un carrusel de giros de negocio y, al lado, los logos de las empresas del giro abierto. Cada giro guarda además una conversación de WhatsApp: esas son las que se reproducen en el celular de la Portada de esta página. Si ocultas esta sección, el celular muestra una conversación genérica.",
    grupos: [
      grupoTexto({ titulo: TITULO_CLIENTES, descripcion: "Opcional: una frase debajo del título. Ej.: «Elige un giro y mira cómo responde la IA»." }, false),
      {
        titulo: "GIROS Y CONVERSACIONES",
        nota: `Cada giro es un panel del carrusel, con sus empresas y logos, y su conversación para el celular de la Portada (los campos «Chat · …» dentro del giro). ${REGLA_GIROS} Un giro sin conversación propia usa una de ejemplo según su nombre o su ícono.`,
        campos: [
          listaGiros(giro("FENIAX", CHAT), "Sin giros propios: se muestran los de Marketing Digital, con conversaciones de ejemplo."),
          pasarSolo(
            "El carrusel avanza solo mientras nadie lo toca y se detiene cuando el visitante elige un giro. También hace que el celular de la Portada pase a la conversación del giro siguiente (apagado: repite la primera).",
          ),
          opcion(
            "temaChat",
            "Apariencia de WhatsApp (hoy no se usa)",
            [
              { valor: "claro", titulo: "Claro" },
              { valor: "oscuro", titulo: "Oscuro" },
            ],
            "Hoy no cambia nada: el celular de la Portada usa siempre el tema oscuro.",
            "botones",
          ),
        ],
      },
      LOGOS,
      diseno(),
    ],
    nuevo: () => ({ titulo: "Clientes y casos de éxito", categorias: [], rotacionAutomatica: true, temaChat: "claro" }),
  }),

  /** Clientes de Tráfico / Ads: las métricas de cada giro se guardan pero la web no las muestra (TraficoClientes.tsx). */
  metricsClientsBanner: () => ({
    tipo: "metricsClientsBanner",
    titulo: "Clientes",
    icono: "clientes",
    ayuda:
      "Un carrusel de giros de negocio y, al lado, los logos de las empresas del giro abierto. Cada giro guarda además métricas de ejemplo de Meta Ads, que hoy no se muestran en la web.",
    grupos: [
      grupoTexto({ titulo: TITULO_CLIENTES, descripcion: "Opcional: una frase debajo del título. Ej.: «Elige un giro y mira cómo medimos una campaña»." }, false),
      {
        titulo: "GIROS",
        nota: `Cada giro es un panel del carrusel, con sus empresas y logos. ${REGLA_GIROS} Las métricas de cada giro (los campos «Métricas · …») hoy no se ven en la web: la sección muestra los logos. Quedan guardadas por si vuelve el panel de Meta Ads.`,
        campos: [
          listaGiros(giro("DOFI", METRICAS), "Sin giros propios: se muestran los de Marketing Digital."),
          pasarSolo("El carrusel avanza solo mientras nadie lo toca. Se detiene cuando el visitante elige un giro."),
        ],
      },
      LOGOS,
      diseno(),
    ],
    nuevo: () => ({ titulo: "Clientes y casos de éxito", categorias: [], rotacionAutomatica: true }),
  }),

  reviewsBanner: () => ({
    tipo: "reviewsBanner",
    titulo: "Reseñas",
    icono: "resenas",
    ayuda:
      "Una franja de reseñas que se desliza sola. Si Google está conectado, se muestran las reseñas reales de Google; si no, las que se cargan a mano en «Reseñas». Aquí no se escriben reseñas: solo los textos de la sección.",
    grupos: [
      grupoTexto({
        subtitulo: "Etiqueta chica junto al ícono de Google. Vacío: dice «Google».",
        descripcion: "Opcional. Deja una línea en blanco para separar párrafos.",
        destacado: "Hoy esta sección no lo muestra.",
      }),
      {
        titulo: "GOOGLE",
        campos: [
          { clase: "enlace", nombre: "enlaceGoogle", titulo: "Enlace al perfil de Google", ayuda: "Dónde están todas las reseñas (https://…). Vacío: la ficha de Google Maps de DOFI." },
          numero("cantidadMostrada", "Cantidad de reseñas a mostrar", "Máximo de tarjetas en la franja, de 1 a 50. Vacío: se muestran todas las disponibles.", {
            min: 1,
            max: 50,
            paso: 1,
          }),
        ],
      },
      diseno(),
    ],
    nuevo: () => ({ titulo: "Reseñas en Google" }),
  }),

  platformsBanner: () => ({
    tipo: "platformsBanner",
    titulo: "Plataformas",
    icono: "tarjetas",
    ayuda: "Una tarjeta por cada plataforma donde hacemos publicidad (Meta, TikTok, Google…), con su ícono, una frase que la resume y lo que hacemos en ella.",
    grupos: [
      grupoTexto(
        {
          subtitulo: "Etiqueta chica arriba del título. Ej.: «¿Dónde traficamos?».",
          titulo: "Ej.: «El tráfico no tiene un solo destino.»",
          descripcion: "Una frase debajo del título.",
        },
        false,
      ),
      {
        titulo: "PLATAFORMAS",
        nota: "Una tarjeta por plataforma, en el orden de la lista. En computadora se ven hasta 4 por fila.",
        campos: [{ clase: "lista", nombre: "plataformas", titulo: "Plataformas", vacia: "Todavía no hay plataformas.", elemento: PLATAFORMA }],
      },
      diseno(),
    ],
    nuevo: () => ({ subtitulo: "¿Dónde traficamos?", plataformas: [] }),
  }),

  ecosystemBanner: (pagina) => ({
    tipo: "ecosystemBanner",
    titulo: "Ecosistema",
    icono: "texto",
    ayuda:
      "Fondo morado oscuro con el texto a la izquierda y, a la derecha, la animación del recorrido de un cliente: descubre la marca en Instagram, la busca en Google, visita la web y escribe por WhatsApp. Si subes una imagen, reemplaza a la animación.",
    grupos: [
      grupoTexto({
        subtitulo: "Etiqueta chica arriba del título. Ej.: «Ecosistema».",
        titulo: "La última palabra se destaca en naranja.",
        destacado: "Opcional: la frase que cierra el texto, más grande.",
      }),
      grupoImagenes("IMAGEN (OPCIONAL)", "Si la subes, reemplaza a la animación del recorrido: se muestra completa, sin recortes."),
      boton(pagina, "ecosystemBanner"),
      diseno(),
    ],
    nuevo: () => ({ subtitulo: "Ecosistema" }),
  }),
};

/** Los tipos de sección que admite cada página, en el orden del Studio (inventario-esquema.md §4). */
export const TIPOS_DE_PAGINA: Record<PaginaServicio, string[]> = {
  marketing: ["teamBanner", "aboutBanner", "navigationBanner", "methodBanner", "clientsBanner", "reviewsBanner", "ctaBanner"],
  trafico: ["teamBanner", "aboutBanner", "navigationBanner", "methodBanner", "platformsBanner", "ecosystemBanner", "metricsClientsBanner", "reviewsBanner", "ctaBanner"],
  feniax: ["teamBanner", "aboutBanner", "navigationBanner", "methodBanner", "chatClientsBanner", "reviewsBanner", "ctaBanner"],
  asesorias: ["splitHeroBanner", "aboutBanner", "navigationBanner", "methodBanner", "clientsBanner", "achievementsBanner", "celularesBanner", "reviewsBanner", "ctaBanner"],
};

/** ¿Se puede agregar este tipo desde el panel? (todos los conocidos tienen formulario) */
export const tieneFormulario = (tipo: string) => Object.prototype.hasOwnProperty.call(BLOQUES, tipo);

/** La definición de un tipo de bloque en una página. Un tipo desconocido se ve, se mueve y se quita, pero no se edita. */
export function definicionBloque(tipo: string, pagina: PaginaServicio): DefinicionBloque {
  if (tieneFormulario(tipo)) return BLOQUES[tipo](pagina);
  return {
    tipo,
    titulo: `Sección «${tipo}»`,
    icono: "texto",
    ayuda: "Un tipo de sección que el panel no conoce. La web tampoco sabe mostrarlo, así que no aparece en la página.",
    aviso: "Esta sección no tiene formulario en el panel. Se puede mover, ocultar o quitar, pero no editar.",
    grupos: [{ titulo: "DISEÑO", campos: [activo] }],
  };
}
