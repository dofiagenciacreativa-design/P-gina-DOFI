import type { Doc } from "@/lib/contenido/tipos";
import { CAPACIDADES_FALLBACK } from "@/lib/inicio";
import { TEXTO_CTA, textoCta } from "@/lib/cta";
import { escribir, nuevaClave } from "@/panel/motor/rutas";
import type { Bloque, Campo, Opcion, SeccionPanel } from "./tipos";

/**
 * Secciones de la página de Inicio, en el orden en que aparecen en la web.
 * Los nombres de campo son los mismos del Studio de Sanity
 * (docs/panel-propio/inventario-esquema.md §3.1.1–3.1.3 y §3.3.4–3.3.6).
 * `max` es el largo recomendado: el contador avisa, no bloquea.
 */

const ICONOS_TARJETA: Opcion[] = [
  { valor: "social", titulo: "Redes sociales" },
  { valor: "ads", titulo: "Pauta / campañas" },
  { valor: "growth", titulo: "Resultados / ventas" },
  { valor: "rescue", titulo: "Acompañamiento" },
  { valor: "academia", titulo: "Academia" },
];

const COLORES_BOTON: Opcion[] = [
  { valor: "naranja", titulo: "Naranja DOFI" },
  { valor: "morado", titulo: "Morado DOFI" },
  { valor: "blanco", titulo: "Blanco" },
  { valor: "oscuro", titulo: "Oscuro" },
];

const HORIZONTAL: Opcion[] = [
  { valor: "izquierda", titulo: "Izquierda" },
  { valor: "centro-izquierda", titulo: "Centro-izquierda" },
  { valor: "centro", titulo: "Centro" },
  { valor: "centro-derecha", titulo: "Centro-derecha" },
  { valor: "derecha", titulo: "Derecha" },
];

const VERTICAL: Opcion[] = [
  { valor: "arriba", titulo: "Arriba" },
  { valor: "centro-arriba", titulo: "Centro-arriba" },
  { valor: "centro", titulo: "Centro" },
  { valor: "centro-abajo", titulo: "Centro-abajo" },
  { valor: "abajo", titulo: "Abajo" },
];

const NOMBRE_ESCENA: Record<string, string> = {
  redes: "Redes",
  pauta: "Pauta",
  crm: "CRM y Chatbots",
  asesorias: "Asesorías",
};

const AYUDA_ENLACE = "Una página de la web (empieza con /) o una dirección completa (https://…).";

function camposPosicion(prefijo: "ctaPosicionDesktop" | "ctaPosicionMobile"): Campo[] {
  return [
    { clase: "opcion", nombre: `${prefijo}.horizontal`, titulo: "Horizontal", opciones: HORIZONTAL },
    { clase: "opcion", nombre: `${prefijo}.vertical`, titulo: "Vertical", opciones: VERTICAL },
    {
      clase: "numero",
      nombre: `${prefijo}.desplazamientoX`,
      titulo: "Ajuste fino horizontal (%)",
      min: -30,
      max: 30,
      paso: 0.5,
      ayuda: "Negativo = más a la izquierda. Déjalo en 0 salvo para afinar.",
    },
    {
      clase: "numero",
      nombre: `${prefijo}.desplazamientoY`,
      titulo: "Ajuste fino vertical (%)",
      min: -30,
      max: 30,
      paso: 0.5,
      ayuda: "Negativo = más arriba.",
    },
  ];
}

function portada(): SeccionPanel {
  return {
    clave: "portada",
    titulo: "Portada",
    icono: "portada",
    apareceEn: "Inicio · arriba de todo",
    vista: "hero",
    ayuda:
      "Es lo primero que se ve al entrar: el título grande, la frase de venta y dos botones, sobre la foto principal. La última palabra del título se pinta con el degradado naranja.",
    bloques: [
      {
        titulo: "TEXTO",
        documento: "paginaInicio",
        ruta: ["hero"],
        campos: [
          { clase: "texto", nombre: "titulo", titulo: "Título", obligatorio: true, max: 40, ayuda: "Corto y fuerte. La última palabra va en naranja." },
          { clase: "texto", nombre: "marca", titulo: "Marca", max: 40, ayuda: "Si queda vacío, la web muestra «DOFI Agencia Creativa»." },
          { clase: "textoLargo", nombre: "mensaje", titulo: "Propuesta comercial", max: 110, filas: 2 },
        ],
      },
      {
        titulo: "BOTÓN PRINCIPAL",
        documento: "paginaInicio",
        ruta: ["hero"],
        campos: [
          { clase: "texto", nombre: "ctaPrincipalTexto", titulo: "Texto del botón", max: 32 },
          { clase: "enlace", nombre: "ctaPrincipalEnlace", titulo: "A dónde lleva", ayuda: AYUDA_ENLACE },
        ],
      },
      {
        titulo: "BOTÓN SECUNDARIO",
        documento: "paginaInicio",
        ruta: ["hero"],
        campos: [
          { clase: "texto", nombre: "ctaSecundarioTexto", titulo: "Texto del botón", max: 32 },
          { clase: "enlace", nombre: "ctaSecundarioEnlace", titulo: "A dónde lleva", ayuda: AYUDA_ENLACE },
        ],
      },
      {
        titulo: "FOTO PRINCIPAL",
        documento: "hero",
        ruta: [],
        campos: [
          { clase: "imagen", nombre: "heroImage", titulo: "Foto" },
          {
            clase: "texto",
            nombre: "heroImageAlt",
            titulo: "Descripción de la foto",
            obligatorio: true,
            max: 120,
            ayuda: "Qué se ve en la foto. La leen los buscadores y los lectores de pantalla.",
          },
        ],
      },
    ],
  };
}

function tarjetas(docs: Record<string, Doc>): SeccionPanel {
  const lista = (docs.paginaInicio?.capacidades as Record<string, unknown>[] | undefined) ?? [];
  const base: SeccionPanel = {
    clave: "tarjetas",
    titulo: "Tarjetas",
    icono: "tarjetas",
    apareceEn: "Inicio · la banda de tarjetas bajo la portada",
    vista: "hero",
    cuenta: lista.length || CAPACIDADES_FALLBACK.length,
    ayuda:
      "Las tarjetas que se apoyan en el borde de la portada. Cada una tiene un título, una frase corta y un icono. Con enlace, la tarjeta se puede pulsar. Si apagas «Mostrar en la página», se oculta sin borrarla.",
    bloques: lista.map((c, i): Bloque => ({
      titulo: `TARJETA ${i + 1}`,
      documento: "paginaInicio",
      ruta: ["capacidades", { _key: String(c._key) }],
      campos: [
        { clase: "texto", nombre: "titulo", titulo: "Título", obligatorio: true, max: 32 },
        { clase: "textoLargo", nombre: "descripcion", titulo: "Descripción", obligatorio: true, max: 90, filas: 2, ayuda: "Una frase, no un párrafo: la tarjeta es pequeña." },
        { clase: "opcion", nombre: "icono", titulo: "Icono", obligatorio: true, opciones: ICONOS_TARJETA, forma: "botones" },
        { clase: "booleano", nombre: "activa", titulo: "Mostrar en la página", porDefecto: true },
        { clase: "enlace", nombre: "enlace", titulo: "Enlace (opcional)", ayuda: "Vacío = tarjeta solo informativa. " + AYUDA_ENLACE },
      ],
    })),
  };

  if (lista.length > 0) return base;
  return {
    ...base,
    vacia: {
      texto:
        "Hoy la web muestra las 5 tarjetas «de fábrica», que no están guardadas en el contenido. Para cambiarlas, primero cópialas aquí; se ven igual hasta que las edites.",
      boton: "Copiar las 5 tarjetas para editarlas",
      aplicar: (d) => ({
        ...d,
        paginaInicio: escribir(
          d.paginaInicio,
          ["capacidades"],
          CAPACIDADES_FALLBACK.map((c) => ({
            _key: nuevaClave(),
            _type: "capacidad",
            titulo: c.titulo,
            descripcion: c.descripcion,
            icono: c.icono,
            activa: true,
            ...(c.enlace ? { enlace: c.enlace } : {}),
          }))
        ),
      }),
    },
  };
}

function banners(docs: Record<string, Doc>): SeccionPanel[] {
  const lista = (docs.banners?.seccionesContenido as Record<string, unknown>[] | undefined) ?? [];
  return lista.map((b, i): SeccionPanel => {
    const clave = String(b._key);
    const ruta = ["seccionesContenido", { _key: clave }];
    const escena = typeof b.escena === "string" ? b.escena : "";
    const hibrido = Boolean(escena) && escena !== "imagen";
    const nombre = NOMBRE_ESCENA[escena] ?? "Imagen";

    const bloques: Bloque[] = [];
    if (hibrido) {
      bloques.push({
        titulo: "TEXTO DE LA ESCENA",
        documento: "banners",
        ruta,
        campos: [
          {
            clase: "lineas",
            nombre: "lineas",
            titulo: "Texto de la escena",
            maxLineas: 4,
            maxPorLinea: 22,
            ayuda: "Un renglón por cada línea del título (hasta 4). Vacío: el texto de fábrica.",
          },
        ],
      });
    }
    bloques.push(
      {
        titulo: "BOTÓN",
        documento: "banners",
        ruta,
        nota: "Si el texto o el enlace quedan vacíos, el banner se muestra sin botón.",
        campos: [
          {
            clase: "texto",
            nombre: "ctaTexto",
            titulo: "Texto del botón",
            max: 32,
            ayuda:
              textoCta(TEXTO_CTA, `inicio:${escena}`) !== TEXTO_CTA
                ? `Cuanto más corto, mejor. Si dejas «${TEXTO_CTA}», la web muestra en este banner «${textoCta(TEXTO_CTA, `inicio:${escena}`)}»; cualquier otro texto se muestra tal cual.`
                : "Cuanto más corto, mejor.",
          },
          { clase: "enlace", nombre: "ctaEnlace", titulo: "A dónde lleva", ayuda: AYUDA_ENLACE },
          { clase: "opcion", nombre: "ctaColor", titulo: "Color", opciones: COLORES_BOTON, forma: "botones", ayuda: "El que no se pierda con el fondo del banner." },
        ],
      },
      { titulo: "POSICIÓN DEL BOTÓN EN COMPUTADORA", documento: "banners", ruta, campos: camposPosicion("ctaPosicionDesktop") },
      { titulo: "POSICIÓN DEL BOTÓN EN CELULAR", documento: "banners", ruta, campos: camposPosicion("ctaPosicionMobile") },
      {
        titulo: "IMAGEN",
        documento: "banners",
        ruta,
        campos: [
          hibrido
            ? { clase: "imagen", nombre: "fotoPrimerPlano", titulo: "Foto de primer plano" }
            : { clase: "imagen", nombre: "backgroundImage", titulo: "Imagen del banner" },
          {
            clase: "texto",
            nombre: "backgroundImageAlt",
            titulo: "Descripción del banner",
            obligatorio: true,
            max: 120,
            ayuda: "Qué dice y qué muestra el banner. Es lo único que leen los buscadores.",
          },
        ],
      }
    );

    return {
      clave: `banner-${clave}`,
      titulo: `Banner ${i + 1} · ${nombre}`,
      icono: "banner",
      apareceEn: `Inicio · banner ${i + 1} de ${lista.length}, bajo las tarjetas`,
      vista: `banner:${clave}`,
      ayuda: hibrido
        ? "Una franja a todo el ancho: de un lado una escena animada con su título, del otro una foto, y un botón encima. El botón se puede mover para que no tape nada."
        : "Una imagen a todo el ancho con un botón encima. El botón se puede mover para que no tape nada.",
      aviso: hibrido
        ? "Este banner se ve como un video grabado. Si cambias el texto de la escena, se dibuja animado en vivo (se ve igual, pero carga un poco más lento) hasta que se vuelva a grabar el video."
        : undefined,
      bloques,
    };
  });
}

export function seccionesInicio(docs: Record<string, Doc>): SeccionPanel[] {
  return [portada(), tarjetas(docs), ...banners(docs)];
}
