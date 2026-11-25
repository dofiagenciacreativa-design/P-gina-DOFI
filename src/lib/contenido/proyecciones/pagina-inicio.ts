import type {
  BannersDocRaw,
  CapacidadRaw,
  HeroDocRaw,
  HeroRaw,
  PaginaInicioRaw,
  PosicionCtaRaw,
  RespuestaCrudaInicio,
  SeccionContenidoRaw,
  SeccionRaw,
} from "@/lib/inicio";
import type { Doc, ResolverArchivo } from "../tipos";

/**
 * Proyección de la página de Inicio: recibe los documentos completos
 * (`paginaInicio`, `banners`, `hero`) y devuelve EXACTAMENTE la misma forma
 * cruda que devuelve hoy QUERY_PAGINA_INICIO (src/lib/sanity.ts), para que
 * armarPaginaInicio() y los componentes no noten la diferencia.
 *
 * Traducción de GROQ (docs/panel-propio/plan.md tarea 2.4):
 *  - campo ausente → null (GROQ nunca devuelve undefined);
 *  - `asset->url + "?w=…"` con URL null → null;
 *  - `hotspot{ x, y }` copia solo x e y;
 *  - `coalesce(a, "")` → a ?? "".
 * La prueba pruebas/contenido/proyeccion-inicio.test.ts lo compara contra la
 * respuesta real de Sanity.
 */

export type DocsInicio = { paginaInicio: Doc | null; banners: Doc | null; hero: Doc | null };

type Obj = Record<string, unknown>;
const esObjeto = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);
/** Un valor tal como lo devuelve GROQ: lo que no existe es null. */
const v = <T = unknown>(x: unknown): T => (x === undefined ? null : x) as T;
/** `lista[]{...}`: null si no es una lista. */
const lista = <T>(x: unknown, f: (e: Obj) => T): T[] | null =>
  Array.isArray(x) ? x.map((e) => f(esObjeto(e) ? e : {})) : null;
/** `objeto{...}`: null si no es un objeto. */
const objeto = <T>(x: unknown, f: (o: Obj) => T): T | null => (esObjeto(x) ? f(x) : null);
const puntoFocal = (imagen: unknown) =>
  objeto((imagen as Obj | null)?.hotspot, (h) => ({ x: v<number>(h.x), y: v<number>(h.y) }));

/** Toma el primer documento de cada tipo, como `*[_type == "X"][0]`, sin borradores. */
export function documentosInicio(docs: Doc[]): DocsInicio {
  const primero = (tipo: string) => docs.find((d) => d._type === tipo && !d._id.startsWith("drafts.")) ?? null;
  return { paginaInicio: primero("paginaInicio"), banners: primero("banners"), hero: primero("hero") };
}

export function proyectarPaginaInicio(d: DocsInicio, resolver: ResolverArchivo): RespuestaCrudaInicio {
  const url = (imagen: unknown, consulta: string) => {
    const info = resolver(imagen);
    return info ? info.url + consulta : null;
  };
  const medidas = (imagen: unknown) => resolver(imagen);

  const seccion = (s: Obj): SeccionRaw => {
    const base: SeccionRaw = { _type: v<string>(s._type) };
    switch (s._type) {
      case "seccionHacemos":
        return {
          ...base,
          titulo: v(s.titulo),
          subtitulo: v(s.subtitulo),
          tarjetas: lista(s.tarjetas, (t) => ({ titulo: v(t.titulo), descripcion: v(t.descripcion) })),
        };
      case "seccionSocio":
        return { ...base, nombre: v(s.nombre), descripcion: v(s.descripcion), foto: resolver(s.foto)?.url ?? null };
      case "seccionPilares":
        return {
          ...base,
          titulo: v(s.titulo),
          listaHerramientas: lista(s.listaHerramientas, (h) => ({ nombre: v(h.nombre), icono: v(h.icono) })),
        };
      case "seccionCierre":
        return { ...base, titulo: v(s.titulo), textoBoton: v(s.textoBoton), enlace: v(s.enlace) };
      default:
        return base;
    }
  };

  const posicion = (p: unknown): PosicionCtaRaw =>
    objeto(p, (o) => ({
      horizontal: v(o.horizontal),
      vertical: v(o.vertical),
      desplazamientoX: v(o.desplazamientoX),
      desplazamientoY: v(o.desplazamientoY),
    }));

  const banner = (s: Obj): SeccionContenidoRaw => ({
    id: v(s._key),
    backgroundImage: url(s.backgroundImage, "?w=2400&auto=format"),
    backgroundImageAlt: (s.backgroundImageAlt as string | undefined) ?? "",
    hotspot: puntoFocal(s.backgroundImage),
    ancho: medidas(s.backgroundImage)?.ancho ?? null,
    alto: medidas(s.backgroundImage)?.alto ?? null,
    escena: v(s.escena),
    lineas: v(s.lineas),
    ajusteFoto: v(s.ajusteFoto),
    foto: objeto(s.fotoPrimerPlano, (f) => ({
      url: url(f, "?w=1600&auto=format"),
      ancho: medidas(f)?.ancho ?? null,
      alto: medidas(f)?.alto ?? null,
      hotspot: puntoFocal(f),
    })),
    ctaTexto: v(s.ctaTexto),
    ctaEnlace: v(s.ctaEnlace),
    ctaColor: v(s.ctaColor),
    ctaPosicionDesktop: posicion(s.ctaPosicionDesktop),
    ctaPosicionMobile: posicion(s.ctaPosicionMobile),
  });

  const p = d.paginaInicio;
  const pagina: PaginaInicioRaw | null = p
    ? {
        titulo: v(p.titulo),
        secciones: lista(p.secciones, seccion),
        hero: objeto(p.hero, (h): NonNullable<HeroRaw> => ({
          titulo: v(h.titulo),
          marca: v(h.marca),
          mensaje: v(h.mensaje),
          ctaPrincipalTexto: v(h.ctaPrincipalTexto),
          ctaPrincipalEnlace: v(h.ctaPrincipalEnlace),
          ctaSecundarioTexto: v(h.ctaSecundarioTexto),
          ctaSecundarioEnlace: v(h.ctaSecundarioEnlace),
        })),
        capacidades: lista(p.capacidades, (c): CapacidadRaw => ({
          titulo: v(c.titulo),
          descripcion: v(c.descripcion),
          icono: v(c.icono),
          activa: v(c.activa),
          enlace: v(c.enlace),
        })),
      }
    : null;

  const bannersDoc: BannersDocRaw = d.banners
    ? { seccionesContenido: lista(d.banners.seccionesContenido, banner) }
    : null;

  const h = d.hero;
  const heroDoc: HeroDocRaw = h
    ? {
        imagen: url(h.heroImage, "?w=2400&auto=format"),
        imagenAlt: (h.heroImageAlt as string | undefined) ?? "",
        hotspot: puntoFocal(h.heroImage),
      }
    : null;

  return { pagina, bannersDoc, heroDoc };
}
