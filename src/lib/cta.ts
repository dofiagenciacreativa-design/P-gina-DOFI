/**
 * Llamadas a la accion del sitio (pedido del 2026-10-02):
 *
 *  1. Todos los botones de conversion de las paginas (menos Inicio) dicen lo
 *     mismo: «Quiero mejorar mis ventas» (TEXTO_CTA). REEMPLAZADO el
 *     2026-11-23: misma idea, texto propio de cada lugar (VARIANTES_CTA).
 *  2. Los botones de los banners finales llevan al FORMULARIO (/contactanos),
 *     con el servicio de esa pagina ya marcado (enlaceFormulario).
 *  3. Al enviar el formulario se abre WhatsApp con un mensaje armado con lo que
 *     la persona escribio (mensajeFormulario).
 *  4. El boton flotante de WhatsApp lleva al formulario (desde el 2026-10-15
 *     ya no abre un chat): RUTA_FORMULARIO + #ID_FORMULARIO.
 *
 * Datos planos, sin dependencias de React ni de Next: los usan componentes de
 * servidor y de cliente, los respaldos de cada pagina y los scripts de
 * Sanity.
 */

export const TEXTO_CTA = "Quiero mejorar mis ventas";

/**
 * TEXTOS VARIADOS, MISMA IDEA (pedido del 2026-11-23, reemplaza el punto 1
 * de arriba): «el texto puede ser distinto en cada uno, pero tiene que tener
 * el mismo concepto» — mejorar las ventas, agendar una reunion. Ver el mismo
 * boton en cada seccion cansa y se vuelve invisible; un texto que responde
 * al titulo de su seccion se lee como la respuesta natural.
 *
 * Los textos de los botones se guardan en Sanity, seccion por seccion, y hoy
 * todos dicen «Quiero mejorar mis ventas». Regla: si el boton trae ese texto
 * generico, se usa la variante de su lugar; si en el Studio se escribio OTRO
 * texto, se respeta el del Studio. La clave es «pagina:tipo de seccion».
 */
export const VARIANTES_CTA: Record<string, string> = {
  // Inicio: los 4 banners (por escena)
  "inicio:redes": "Quiero redes que vendan",
  "inicio:pauta": "Quiero vender con publicidad",
  "inicio:crm": "Quiero automatizar mis ventas",
  "inicio:asesorias": "Quiero agendar mi asesoría",
  // Marketing Digital
  "marketing:teamBanner": "Quiero mejorar mis ventas",
  "marketing:methodBanner": "Quiero agendar una reunión",
  "marketing:ctaBanner": "Quiero vender más",
  // Pauta digital (Tráfico / Ads)
  "trafico:teamBanner": "Quiero más clientes",
  "trafico:methodBanner": "Quiero una campaña que venda",
  "trafico:ctaBanner": "Quiero aumentar mis ventas",
  // Chatbots y CRM (FENIAX)
  "feniax:teamBanner": "Quiero vender con IA",
  "feniax:methodBanner": "Quiero agendar una reunión",
  "feniax:ctaBanner": "Quiero que mis ventas renazcan",
  // Asesorías
  "asesorias:splitHeroBanner": "Quiero agendar mi asesoría",
  "asesorias:ctaBanner": "Quiero rescatar mi negocio",
  // Paginas sueltas
  cliente: "Quiero que mi marca sea la siguiente",
  redes: "Quiero trabajar con DOFI",
};

const ES_GENERICO = (texto: string) => texto.trim().toLowerCase() === TEXTO_CTA.toLowerCase();

/** El texto de un boton: la variante de su lugar si trae el texto generico. */
export function textoCta(texto: string, lugar: string): string {
  return ES_GENERICO(texto) ? (VARIANTES_CTA[lugar] ?? texto) : texto;
}

/**
 * TEXTOS DEL CIERRE (2026-11-23, con el rediseño del cierre). «¿Somos socios
 * o le pasas tu oportunidad a alguien más?» sonaba a presión; la idea se
 * mantiene (vender más, agendar una reunión) con palabras propias de cada
 * página. Chatbots y CRM y Asesorías ya seguían la idea «¿Listo…?» y no
 * cambian. Igual que con los botones: solo se reemplaza si en Sanity sigue
 * el texto anterior; si alguien escribe otro en el Studio, se respeta.
 */
const CIERRES: Record<string, { anterior: string; titulo: string; descripcion?: string }> = {
  "marketing:ctaBanner": {
    anterior: "¿Somos socios o le pasas tu oportunidad a alguien más?",
    titulo: "¿Listo para vender de forma inteligente?",
    descripcion: "Estrategia, contenido y pauta con un solo equipo. Agenda una reunión y armamos tu plan.",
  },
  "trafico:ctaBanner": {
    anterior: "¿Listos para poner tu inversión en movimiento?",
    titulo: "¿Hacemos que tu publicidad venda?",
    descripcion: "Convierte tu presupuesto en mensajes, clientes y ventas que puedes medir.",
  },
};

const normalizar = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();

/** Aplica textoCta a todas las secciones de una pagina de servicio, y los
 *  textos nuevos del cierre (CIERRES). */
export function variarCtas<
  T extends { tipo: string; titulo?: string; descripcion?: string; cta?: { texto: string; enlace: string } | null },
>(secciones: T[], pagina: "marketing" | "trafico" | "feniax" | "asesorias"): T[] {
  return secciones.map((s) => {
    const lugar = `${pagina}:${s.tipo}`;
    let nueva = s.cta ? { ...s, cta: { ...s.cta, texto: textoCta(s.cta.texto, lugar) } } : s;
    const cierre = CIERRES[lugar];
    if (cierre && typeof s.titulo === "string" && normalizar(s.titulo) === normalizar(cierre.anterior)) {
      nueva = { ...nueva, titulo: cierre.titulo, ...(cierre.descripcion ? { descripcion: cierre.descripcion } : {}) };
    }
    return nueva;
  });
}

/** Los servicios que ofrece el formulario, en este orden. `clave` es lo que
 *  viaja en el enlace (?servicio=) y `nombre` lo que ve la persona y lo que
 *  se escribe en el mensaje de WhatsApp. */
export const SERVICIOS = [
  { clave: "marketing-360", nombre: "Marketing 360" },
  { clave: "pauta", nombre: "Pauta" },
  { clave: "crm", nombre: "CRM" },
  { clave: "asesorias", nombre: "Asesorías 1a1" },
] as const;

export type ClaveServicio = (typeof SERVICIOS)[number]["clave"];

export const RUTA_FORMULARIO = "/contactanos";

/** El id de la tarjeta del formulario en /contactanos: el destino del boton
 *  flotante (/contactanos#formulario). */
export const ID_FORMULARIO = "formulario";

/** Enlace al formulario; con `servicio`, ese servicio llega ya marcado. */
export function enlaceFormulario(servicio?: ClaveServicio): string {
  return servicio ? `${RUTA_FORMULARIO}?servicio=${servicio}` : RUTA_FORMULARIO;
}

/** Las claves validas que vienen en la URL (?servicio=pauta,crm), sin
 *  repetidas y en el orden del formulario. Lo desconocido se ignora. */
export function serviciosDeUrl(valor: string | string[] | undefined): ClaveServicio[] {
  const crudo = (Array.isArray(valor) ? valor.join(",") : (valor ?? "")).split(",").map((s) => s.trim().toLowerCase());
  return SERVICIOS.filter((s) => crudo.includes(s.clave)).map((s) => s.clave);
}

/** «Marketing 360», «Marketing 360 y Pauta», «Marketing 360, Pauta y CRM». */
export function listaEnEspanol(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/**
 * El mensaje de WhatsApp del formulario, con la redaccion pedida:
 *   Hola como estan mi nombre es <nombre> pertenezco a la empresa <negocio>
 *   de <ubicacion> y le escribo por el servicio de <servicios>
 * (la ubicacion, «Ciudad o país», se sumo el 2026-10-15).
 * La respuesta a «Cuéntame, ¿Qué está pasando con tu negocio?» (obligatoria
 * desde el 2026-10-20) va en una linea aparte, al final.
 */
export function mensajeFormulario({
  nombre,
  negocio,
  ubicacion,
  servicios,
  detalle,
}: {
  nombre: string;
  negocio: string;
  ubicacion: string;
  servicios: string[];
  detalle: string;
}): string {
  const base = `Hola como estan mi nombre es ${nombre.trim()} pertenezco a la empresa ${negocio.trim()} de ${ubicacion.trim()} y le escribo por el servicio de ${listaEnEspanol(servicios)}`;
  const extra = detalle.trim();
  return extra ? `${base}\n\nLo que está pasando con mi negocio: ${extra}` : base;
}

