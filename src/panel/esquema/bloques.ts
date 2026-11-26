import { CIERRES, TEXTO_CTA, VARIANTES_CTA } from "@/lib/cta";
import type { Campo, DefinicionBloque, NombreIcono } from "./tipos";

/**
 * Los bloques de `sections[]` de las páginas de servicio, con los mismos
 * campos que tenían en Sanity (docs/panel-propio/inventario-esquema.md §3.4).
 * Ningún nombre de campo cambia: el panel escribe exactamente donde escribía
 * el Studio. Etapa 4a: los de Asesorías; 4b: los demás.
 */

/** Las páginas de servicio, con la clave que usa src/lib/cta.ts. */
export type PaginaServicio = "marketing" | "trafico" | "feniax" | "asesorias";

export const NOMBRE_PAGINA: Record<PaginaServicio, string> = {
  marketing: "Marketing Digital",
  trafico: "Tráfico / Ads",
  feniax: "ChatBots / CRM",
  asesorias: "Asesorías",
};

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
    ayuda: "La última sección: una foto de fondo, una pregunta de cierre y el botón principal (se muestra grande).",
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
      {
        titulo: "FOTO DE FONDO",
        campos: [
          ...imagen("imagen", "Imagen", "Sin foto, usa el fondo de marca."),
          { clase: "imagen", nombre: "imagenMovil", titulo: "Imagen para celular (opcional)", ayuda: "Una versión compuesta para teléfono. Sin ella, en el celular se usa la de arriba." },
        ],
      },
      boton(pagina, "ctaBanner", "El botón principal de la sección."),
      diseno(alineacion("centro"), overlay),
    ],
    nuevo: () => ({ alineacion: "centro", overlay: "medio" }),
  }),
};

/** Los tipos de sección que admite cada página, en el orden del Studio (inventario-esquema.md §4). */
export const TIPOS_DE_PAGINA: Record<PaginaServicio, string[]> = {
  marketing: ["teamBanner", "aboutBanner", "navigationBanner", "methodBanner", "clientsBanner", "reviewsBanner", "ctaBanner"],
  trafico: ["teamBanner", "aboutBanner", "navigationBanner", "methodBanner", "platformsBanner", "ecosystemBanner", "metricsClientsBanner", "reviewsBanner", "ctaBanner"],
  feniax: ["teamBanner", "aboutBanner", "navigationBanner", "methodBanner", "chatClientsBanner", "reviewsBanner", "ctaBanner"],
  asesorias: ["splitHeroBanner", "aboutBanner", "navigationBanner", "methodBanner", "clientsBanner", "achievementsBanner", "celularesBanner", "reviewsBanner", "ctaBanner"],
};

const SIN_FORMULARIO: Record<string, { titulo: string; icono: NombreIcono }> = {
  teamBanner: { titulo: "Portada (equipo)", icono: "portada" },
  navigationBanner: { titulo: "Cómo navegamos", icono: "texto" },
  methodBanner: { titulo: "Método", icono: "metodo" },
  clientsBanner: { titulo: "Clientes", icono: "clientes" },
  reviewsBanner: { titulo: "Reseñas", icono: "resenas" },
  platformsBanner: { titulo: "Plataformas", icono: "tarjetas" },
  ecosystemBanner: { titulo: "Ecosistema", icono: "texto" },
  metricsClientsBanner: { titulo: "Clientes con métricas", icono: "clientes" },
  chatClientsBanner: { titulo: "Clientes con chat", icono: "clientes" },
};

/** La definición de un tipo de bloque en una página. Los que todavía no tienen formulario se ven, pero no se editan. */
export function definicionBloque(tipo: string, pagina: PaginaServicio): DefinicionBloque {
  const fabrica = BLOQUES[tipo];
  if (fabrica) return fabrica(pagina);
  const conocido = SIN_FORMULARIO[tipo];
  return {
    tipo,
    titulo: conocido?.titulo ?? tipo,
    icono: conocido?.icono ?? "texto",
    ayuda: "Esta sección se ve en la vista previa tal como está en la web.",
    aviso: "Esta sección todavía no se edita desde el panel (llega en la próxima parte de la etapa 4). Por ahora se puede mover, ocultar o quitar.",
    grupos: [{ titulo: "DISEÑO", campos: [activo] }],
  };
}

/** ¿Se puede agregar este tipo desde el panel? (solo los que ya tienen formulario) */
export const tieneFormulario = (tipo: string) => tipo in BLOQUES;
