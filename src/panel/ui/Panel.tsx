"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowSquareOut,
  ArrowUp,
  ArrowsOut,
  CheckCircle,
  Copy,
  Eye,
  EyeSlash,
  MagnifyingGlass,
  Plus,
  SignOut,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import { armarPaginaInicio } from "@/lib/inicio";
import { referenciasDeActivos, resolverDeActivos, type Activo } from "@/lib/contenido/archivos-activos";
import { consultarSobre } from "@/lib/contenido/consulta-local";
import { ARCHIVO_DE_COLECCION, BORRAR, repetido } from "@/lib/contenido/colecciones";
import { ARCHIVO_DE_DOCUMENTO } from "@/lib/contenido/serializar";
import { QUERY_CUENTA_POR_SLUG, toAccountFull, type CuentaCompletaCruda } from "@/lib/consultas";
import { QUERY_MARKETING, armarPaginaMarketingDigital, type Resena, type RespuestaRaw } from "@/lib/marketing-digital";
import { QUERY_TRAFICO, armarPaginaTrafico, type RespuestaTrafico } from "@/lib/trafico";
import { QUERY_FENIAX, armarPaginaFeniax, type RespuestaFeniax } from "@/lib/feniax";
import { QUERY_ASESORIAS, armarPaginaAsesorias, type RespuestaAsesorias } from "@/lib/asesorias";
import { subirImagen, type FotoNueva } from "@/panel/archivos/subir-imagen";
import { subirVideo, type VideoNuevo } from "@/panel/archivos/subir-video";
import { proyectarPaginaInicio } from "@/lib/contenido/proyecciones/pagina-inicio";
import type { Doc } from "@/lib/contenido/tipos";
import { NOMBRE_PAGINA, TIPOS_DE_PAGINA, definicionBloque, tieneFormulario, type PaginaServicio } from "@/panel/esquema/bloques";
import { seccionesInicio } from "@/panel/esquema/inicio";
import { DOCUMENTO_DE_PAGINA, seccionesCrudas, seccionesDeServicio, type SeccionCruda } from "@/panel/esquema/servicio";
import { COLECCIONES, ORDEN_COLECCIONES } from "@/panel/esquema/colecciones";
import { documentoNuevo, documentosDe, estaBorrado, nombreDeDocumento, seccionesDeColeccion, usadoPor } from "@/panel/esquema/lista-documentos";
import type { Ruta, SeccionPanel, TipoColeccion } from "@/panel/esquema/tipos";
import type { Subidas } from "@/panel/motor/CampoPanel";
import { conClavesNuevas, escribir, leer, nuevaClave } from "@/panel/motor/rutas";
import { TarjetaSeccion } from "@/panel/motor/TarjetaSeccion";
import { Marco } from "@/panel/vista-previa/Marco";
import type { Dispositivo, ModoVista, VistaPrevia } from "@/panel/vista-previa/mensajes";
import { IconoSeccion } from "./iconos";
import { Entrar } from "./Entrar";
import { Versiones } from "./Versiones";

/**
 * El panel: cada página de la web con la vista previa al lado. Se entra con la
 * contraseña; lo que se cambia queda guardado en este navegador hasta que se
 * pulsa «Publicar cambios», que lo guarda en GitHub (y Cloudflare vuelve a
 * armar la web sola). docs/panel-propio/cambios-2026-11-25.md §4 y plan-etapa-3.md.
 */

const CLAVE_LOCAL = "dofi-panel:cambios:v1";
const CADA = 20_000; // cada cuánto se mira si la web ya está construida
const LENTO = 15 * 60_000;

type Publicacion =
  | { estado: "nada" }
  | { estado: "confirmar" }
  | { estado: "enviando" }
  | { estado: "publicando"; commit: string; pedidoEn: number }
  | { estado: "listo"; commit: string }
  | { estado: "lento"; commit: string }
  | { estado: "error"; mensaje: string };

type ClavePagina = "inicio" | PaginaServicio | TipoColeccion;
const esColeccion = (p: ClavePagina): p is TipoColeccion => p in COLECCIONES;

/** Las pestañas. `lista`: ya se edita en el panel; las demás llegan en etapas próximas. */
const PESTANAS: { clave: ClavePagina | null; titulo: string; lista: boolean; ruta: string; proxima?: string }[] = [
  { clave: "inicio", titulo: "Inicio", lista: true, ruta: "/" },
  { clave: "marketing", titulo: "Marketing Digital", lista: true, ruta: "/marketing-digital" },
  { clave: "trafico", titulo: "Tráfico / Ads", lista: true, ruta: "/trafico-ads" },
  { clave: "feniax", titulo: "ChatBots / CRM", lista: true, ruta: "/chatbots-crm" },
  { clave: "asesorias", titulo: "Asesorías", lista: true, ruta: "/asesorias" },
  // Las colecciones, en el orden del menú del Studio (inventario-esquema.md §2).
  ...ORDEN_COLECCIONES.map((c) => ({ clave: c, titulo: COLECCIONES[c].titulo, lista: true, ruta: c === "resena" ? "/marketing-digital#resenas" : "/clientes" })),
];

const SERVICIOS: PaginaServicio[] = ["marketing", "trafico", "feniax", "asesorias"];
const PAGINAS: ("inicio" | PaginaServicio)[] = ["inicio", ...SERVICIOS];

const DESCRIPCION: Partial<Record<ClavePagina, string>> = {
  inicio: "Portada, tarjetas y los cuatro banners de la página de Inicio.",
  marketing: "Las secciones de Marketing Digital, en el orden en que aparecen. Aquí se editan los giros y logos de clientes que usan también las otras páginas de servicio.",
  trafico: "Las secciones de Tráfico / Ads, en el orden en que aparecen: muévelas, ocúltalas o agrega otras.",
  feniax: "Las secciones de ChatBots / CRM, en el orden en que aparecen, con el video del celular de la portada y los chats de ejemplo.",
  asesorias: "Las secciones de Asesorías, en el orden en que aparecen: muévelas, ocúltalas, agrega otras y cambia los videos.",
};

/** Los documentos que se editan en el panel. */
const EDITABLES = ["paginaInicio", "banners", "hero", ...SERVICIOS.map((p) => DOCUMENTO_DE_PAGINA[p])];

/** La misma consulta y el mismo armado que usa la web para cada página de servicio (plan-etapa-4.md). */
const CONSULTA: Record<PaginaServicio, string> = {
  marketing: QUERY_MARKETING,
  trafico: QUERY_TRAFICO,
  feniax: QUERY_FENIAX,
  asesorias: QUERY_ASESORIAS,
};
function armarServicio(pagina: PaginaServicio, respuesta: unknown, resenas: Resena[] | null): VistaPrevia {
  const comun = { modo: "seccion" as const, vista: "" };
  switch (pagina) {
    case "marketing":
      return { ...comun, pagina, secciones: armarPaginaMarketingDigital(respuesta as RespuestaRaw | null, resenas).secciones };
    case "trafico":
      return { ...comun, pagina, secciones: armarPaginaTrafico(respuesta as RespuestaTrafico | null, resenas).secciones };
    case "feniax":
      return { ...comun, pagina, secciones: armarPaginaFeniax(respuesta as RespuestaFeniax | null, resenas).secciones };
    case "asesorias":
      return { ...comun, pagina, secciones: armarPaginaAsesorias(respuesta as RespuestaAsesorias | null, resenas).secciones };
  }
}

const seccionesDe = (p: ClavePagina, d: Record<string, Doc>, o: Record<string, Doc>): SeccionPanel[] =>
  p === "inicio" ? seccionesInicio(d) : esColeccion(p) ? seccionesDeColeccion(p, d, o) : seccionesDeServicio(p, d);
const nombrePagina = (p: ClavePagina) => (p === "inicio" ? "Inicio" : esColeccion(p) ? COLECCIONES[p].titulo : NOMBRE_PAGINA[p]);

/** Esconde, solo en esta página, el grano y el botón de WhatsApp que el layout del sitio pone en todas. */
const SIN_ADORNOS_DEL_SITIO = `body:has(.panel-dofi) > .grain-layer, body:has(.panel-dofi) > a[aria-label="Ir al formulario de contacto"] { display: none !important; }`;

const mismo = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Las zonas de los documentos que toca una sección: si alguna difiere del original, la sección cambió. */
function zonas(s: SeccionPanel, original: Record<string, Doc>): { documento: string; ruta: Ruta }[] {
  const vistas = new Set<string>();
  const salida: { documento: string; ruta: Ruta }[] = [];
  for (const b of s.bloques) {
    // Un elemento de lista que no existía en el original (p. ej. tarjetas copiadas de fábrica):
    // la zona es la lista entera.
    const corte = b.ruta.findIndex((seg, i) => typeof seg === "object" && leer(original[b.documento], b.ruta.slice(0, i + 1)) === undefined);
    const ruta = corte >= 0 ? b.ruta.slice(0, corte) : b.ruta;
    const id = `${b.documento}:${JSON.stringify(ruta)}`;
    if (!vistas.has(id)) {
      vistas.add(id);
      salida.push({ documento: b.documento, ruta });
    }
  }
  return salida;
}

export function Panel({
  conjunto,
  resenasGoogle,
  base,
}: {
  /** Los documentos que leen las páginas que se editan, y los activos (id, dirección y medidas). */
  conjunto: Doc[];
  resenasGoogle: Resena[] | null;
  /** El commit con el que se construyó esta página (null fuera de Cloudflare). */
  base: string | null;
}) {
  const documentos = useMemo(
    () =>
      Object.fromEntries([
        ...EDITABLES.map((id) => [id, conjunto.find((d) => d._id === id) ?? { _id: id, _type: id }]),
        ...conjunto.filter((d) => d._type in COLECCIONES).map((d) => [d._id, d]),
      ]) as Record<string, Doc>,
    [conjunto]
  );
  const activos = useMemo(
    () => conjunto.filter((d) => d._type === "sanity.imageAsset" || d._type === "sanity.fileAsset") as unknown as Activo[],
    [conjunto]
  );
  const [original, setOriginal] = useState(documentos);
  const [sesion, setSesion] = useState<"cargando" | "no" | "si">("cargando");
  /** rama: adónde se publica; sitio: dónde se ve esa rama (null = este mismo sitio). */
  const [ajustes, setAjustes] = useState<{ rama: string | null; sitio: string | null; faltan: string[]; llave: string | null }>({
    rama: null,
    sitio: null,
    faltan: [],
    llave: null,
  });
  /** Sin rama destino (PANEL_RAMA_DESTINO): se edita y se ve, pero no se publica. */
  const soloMirar = sesion === "si" && !ajustes.rama;
  const [publicacion, setPublicacion] = useState<Publicacion>({ estado: "nada" });
  const [recuperado, setRecuperado] = useState(false);
  const restaurado = useRef(false);
  /** Fotos subidas desde el panel que todavía no se publicaron. */
  const [fotosNuevas, setFotosNuevas] = useState<FotoNueva[]>([]);
  /** Fotos ya publicadas en esta sesión: se siguen viendo en la vista previa hasta recargar. */
  const [fotosPublicadas, setFotosPublicadas] = useState<FotoNueva[]>([]);
  /** Videos subidos a R2 desde el panel que todavía no se publicaron (y los ya publicados en esta sesión). */
  const [videosNuevos, setVideosNuevos] = useState<VideoNuevo[]>([]);
  const [videosPublicados, setVideosPublicados] = useState<VideoNuevo[]>([]);
  const [docs, setDocs] = useState(documentos);
  const [pagina, setPagina] = useState<ClavePagina>("inicio");
  const [claves, setClaves] = useState<Partial<Record<ClavePagina, string>>>({ inicio: "portada" });
  const setClave = (k: string) => setClaves((c) => ({ ...c, [pagina]: k }));
  const [dispositivo, setDispositivo] = useState<Dispositivo>("computadora");
  const [modo, setModo] = useState<ModoVista>("seccion");
  const [ampliada, setAmpliada] = useState(false);
  const [brindis, setBrindis] = useState<string | null>(null);
  const [verVersiones, setVerVersiones] = useState(false);

  /** Los activos nuevos de esta sesión, con la dirección con la que se ven ya (la foto en data:, el video en /videos/). */
  const activosNuevos = useMemo(
    () => [
      ...[...fotosPublicadas, ...fotosNuevas].map((f) => ({ ...f.activo, url: f.vistaPrevia })),
      ...[...videosPublicados, ...videosNuevos].map((v) => v.activo),
    ],
    [fotosNuevas, fotosPublicadas, videosNuevos, videosPublicados]
  );
  const resolver = useMemo(() => resolverDeActivos([...activos, ...activosNuevos]), [activos, activosNuevos]);
  const secciones = useMemo(() => seccionesDe(pagina, docs, original), [pagina, docs, original]);
  const seccion: SeccionPanel | undefined = secciones.find((s) => s.clave === claves[pagina]) ?? secciones[0];
  const docServicio = pagina === "inicio" || esColeccion(pagina) ? null : DOCUMENTO_DE_PAGINA[pagina];
  const coleccion = esColeccion(pagina) ? pagina : null;
  const [busqueda, setBusqueda] = useState("");
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return coleccion && q ? secciones.filter((s) => `${s.titulo} ${s.apareceEn}`.toLowerCase().includes(q)) : secciones;
  }, [coleccion, busqueda, secciones]);

  /** Lo cambiado en todas las páginas: "pagina:clave" por sección, y "pagina:orden" si cambió el orden de las secciones. */
  const cambiadas = useMemo(() => {
    const salida = new Set<string>();
    for (const p of PAGINAS) {
      for (const s of seccionesDe(p, docs, original)) {
        if (zonas(s, original).some((z) => !mismo(leer(docs[z.documento], z.ruta), leer(original[z.documento], z.ruta)))) salida.add(`${p}:${s.clave}`);
      }
      if (p !== "inicio") {
        const id = DOCUMENTO_DE_PAGINA[p];
        const ahora = seccionesCrudas(docs[id]).map((s) => s._key).join();
        const antes = seccionesCrudas(original[id]).map((s) => s._key).join();
        if (ahora !== antes) salida.add(`${p}:orden`);
      }
    }
    // Colecciones: cada documento nuevo, cambiado o marcado para borrar.
    for (const c of ORDEN_COLECCIONES) {
      const ids = new Set([...documentosDe(c, docs), ...documentosDe(c, original)].map((d) => d._id));
      for (const id of ids) if (!mismo(docs[id], original[id])) salida.add(`${c}:${id}`);
    }
    return salida;
  }, [docs, original]);

  /** Direcciones de clientes o nombres de servicios repetidos: no se puede publicar así. */
  const repetidos = useMemo(
    () =>
      ORDEN_COLECCIONES.map((c) => repetido(documentosDe(c, docs).filter((d) => !estaBorrado(d)), c)).filter((x): x is string => x !== null),
    [docs]
  );

  /** Lo que se va a publicar, en palabras («Asesorías · Videos en celulares»). */
  const resumenCambios = useMemo(
    () =>
      [...cambiadas].map((k) => {
        const [p, c] = k.split(":") as [ClavePagina, string];
        if (c === "orden") return `${nombrePagina(p)} · orden de las secciones`;
        if (esColeccion(p)) {
          const d = docs[c] ?? original[c];
          const actual = estaBorrado(d) ? original[c] : d;
          const extra = !original[c] ? " (nuevo)" : estaBorrado(d) ? " (se borra)" : "";
          return `${nombrePagina(p)} · ${actual ? COLECCIONES[p].resumen(actual) : c}${extra}`;
        }
        const s = seccionesDe(p, docs, original).find((x) => x.clave === c);
        return `${nombrePagina(p)} · ${s?.titulo ?? "sección"}`;
      }),
    [cambiadas, docs, original]
  );

  const datos = useMemo(
    () =>
      armarPaginaInicio(
        proyectarPaginaInicio({ paginaInicio: docs.paginaInicio ?? null, banners: docs.banners ?? null, hero: docs.hero ?? null }, resolver)
      ),
    [docs, resolver]
  );
  // Páginas de servicio: la misma consulta GROQ y el mismo armado que la web, en el navegador, sobre el borrador.
  // Clientes: su página /clientes/<slug>. Reseñas: la sección de reseñas de Marketing Digital.
  const [datosServicio, setDatosServicio] = useState<(VistaPrevia & { para: string }) | null>(null);
  const vistaSeccion = seccion?.vista ?? "";
  const para = esColeccion(pagina) ? `${pagina}:${vistaSeccion}` : pagina;
  /** Servicios y contenidos no tienen una pieza propia en la web: se dice dónde se ven. */
  const sinVista =
    pagina === "servicio"
      ? "Los servicios no tienen una página propia: se marcan en cada cliente («Servicios»). Elige un cliente para ver su página."
      : pagina === "contenido"
        ? "Hoy la web no muestra los contenidos en ninguna página. Se guardan para usarlos más adelante."
        : null;
  useEffect(() => {
    if (pagina === "inicio" || sinVista) return;
    let vivo = true;
    const t = setTimeout(async () => {
      try {
        const conjuntoVivo = [
          ...conjunto.filter((d) => !(d._id in docs)),
          ...Object.values(docs).filter((d) => !estaBorrado(d)),
          ...(activosNuevos as unknown as Doc[]),
        ];
        let nueva: VistaPrevia;
        if (pagina === "cuenta") {
          const doc = docs[vistaSeccion];
          const slug = (doc?.slug as { current?: string } | undefined)?.current;
          const cruda = slug ? await consultarSobre<CuentaCompletaCruda | null>(conjuntoVivo, QUERY_CUENTA_POR_SLUG, { slug }) : null;
          nueva = {
            pagina: "cliente",
            cliente: cruda ? toAccountFull(cruda) : null,
            aviso: !doc
              ? "Elige un cliente de la lista."
              : estaBorrado(doc)
                ? "Este cliente se borra al publicar."
                : !slug
                  ? "Este cliente todavía no tiene dirección («Crear desde el nombre»)."
                  : doc.activa !== true
                    ? "Este cliente está apagado («Activa» en no): no tiene página en la web."
                    : undefined,
            modo: "completa",
            vista: "",
          };
        } else {
          const servicio: PaginaServicio = pagina === "resena" ? "marketing" : (pagina as PaginaServicio);
          nueva = armarServicio(servicio, await consultarSobre(conjuntoVivo, CONSULTA[servicio]), resenasGoogle);
          if (pagina === "resena" && nueva.pagina === "marketing") {
            nueva = { ...nueva, vista: nueva.secciones.find((s) => s.tipo === "reviewsBanner")?.key ?? "" };
          }
        }
        if (vivo) setDatosServicio({ ...nueva, para });
      } catch (e) {
        console.error("[panel] No se pudo armar la vista previa:", e);
      }
    }, 120);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [pagina, para, sinVista, vistaSeccion, docs, conjunto, activosNuevos, resenasGoogle]);

  const vista: VistaPrevia | null = useMemo(() => {
    if (pagina === "inicio") return { pagina: "inicio", datos, modo, vista: vistaSeccion };
    if (!datosServicio || datosServicio.para !== para) return null;
    const { para: _p, ...v } = datosServicio;
    void _p;
    return esColeccion(pagina) ? { ...v, modo: pagina === "cuenta" ? "completa" : modo } : { ...v, modo, vista: vistaSeccion };
  }, [pagina, para, datos, datosServicio, modo, vistaSeccion]);

  const avisar = useCallback((texto: string) => setBrindis(texto), []);
  useEffect(() => {
    if (!brindis) return;
    const t = setTimeout(() => setBrindis(null), 4500);
    return () => clearTimeout(t);
  }, [brindis]);

  useEffect(() => {
    if (!ampliada) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAmpliada(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [ampliada]);

  // ¿Hay sesión? (la página es estática: la sesión se consulta al abrirla)
  const consultarSesion = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/yo", { cache: "no-store" });
      const j = (await r.json()) as { sesion: boolean; rama: string | null; sitio?: string | null; faltan: string[]; llave?: string | null };
      setAjustes({ rama: j.rama, sitio: j.sitio ?? null, faltan: j.faltan ?? [], llave: j.llave ?? null });
      setSesion(j.sesion ? "si" : "no");
    } catch {
      setSesion("no");
    }
  }, []);
  useEffect(() => {
    void consultarSesion();
  }, [consultarSesion]);

  // Los cambios sin publicar viven en este navegador: recargar no los pierde.
  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE_LOCAL) ?? "null") as {
        docs?: Record<string, Doc>;
        fotos?: FotoNueva[];
        videos?: VideoNuevo[];
      } | null;
      if (guardado?.docs && Object.keys(guardado.docs).length) {
        setDocs((d) => ({ ...d, ...guardado.docs }));
        setFotosNuevas(guardado.fotos ?? []);
        setVideosNuevos(guardado.videos ?? []);
        setRecuperado(true);
      }
    } catch {
      // almacenamiento no disponible: se sigue sin recuperar nada
    }
    restaurado.current = true;
  }, []);
  useEffect(() => {
    if (!restaurado.current) return;
    const t = setTimeout(() => {
      try {
        const cambiados = Object.fromEntries(Object.entries(docs).filter(([id, d]) => !mismo(d, original[id])));
        if (Object.keys(cambiados).length) {
          const usadas = referenciasDeActivos(cambiados);
          const fotos = fotosNuevas.filter((f) => usadas.has(f.activo._id));
          const videos = videosNuevos.filter((v) => usadas.has(v.activo._id));
          localStorage.setItem(CLAVE_LOCAL, JSON.stringify({ base, docs: cambiados, fotos, videos, guardadoEn: Date.now() }));
        }
        else localStorage.removeItem(CLAVE_LOCAL);
      } catch {
        // sin almacenamiento: los cambios viven solo en esta pestaña
      }
    }, 400);
    return () => clearTimeout(t);
  }, [docs, original, base, fotosNuevas, videosNuevos]);

  // Después de publicar: mirar cada 20 s si la web ya se construyó con el cambio.
  // El navegador lee el /contenido-version.json del sitio destino (este mismo,
  // o el de pruebas en una vista previa) y, si la web cambió de versión, le
  // pregunta a GitHub (por el panel) si esa versión ya incluye lo publicado.
  useEffect(() => {
    if (publicacion.estado !== "publicando") return;
    const { commit, pedidoEn } = publicacion;
    const sitio = ajustes.sitio ?? "";
    let vivo = true;
    let yaRevisado: string | null = null; // la última versión que GitHub dijo que todavía no lo incluye
    const mirar = async () => {
      try {
        const v = (await fetch(`${sitio}/contenido-version.json?t=${Date.now()}`, { cache: "no-store" }).then((r) => r.json())) as {
          commit?: string | null;
        };
        const construido = v.commit ?? null;
        if (construido === commit) return vivo && setPublicacion({ estado: "listo", commit });
        if (construido && construido !== base && construido !== yaRevisado) {
          const r = (await fetch(`/api/admin/incluye?publicado=${commit}&construido=${construido}`, { cache: "no-store" }).then((x) =>
            x.json()
          )) as { incluido?: boolean };
          if (r.incluido) return vivo && setPublicacion({ estado: "listo", commit });
          yaRevisado = construido;
        }
      } catch {
        // sin conexión por un momento: se vuelve a mirar en la próxima vuelta
      }
      if (vivo && Date.now() - pedidoEn > LENTO) setPublicacion({ estado: "lento", commit });
    };
    const id = setInterval(mirar, CADA);
    void mirar();
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [publicacion, ajustes.sitio, base]);

  const cambiar = (documento: string, ruta: Ruta, valor: unknown) =>
    setDocs((d) => ({ ...d, [documento]: escribir(d[documento], ruta, valor) }));

  /** Publica: un commit con los documentos cambiados; Cloudflare arma la web sola. */
  async function publicar() {
    setPublicacion({ estado: "enviando" });
    const documentos = Object.values(docs).filter((d) => !mismo(d, original[d._id]));
    const resumen = resumenCambios;
    const usadas = referenciasDeActivos(documentos);
    const fotosUsadas = fotosNuevas.filter((f) => usadas.has(f.activo._id));
    const videosUsados = videosNuevos.filter((v) => usadas.has(v.activo._id));
    try {
      const r = await fetch("/api/admin/publicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base,
          documentos,
          resumen,
          // Solo las fotos nuevas que de verdad usan los documentos que se publican.
          medios: fotosUsadas.flatMap((f) => f.medios),
          activosNuevos: [...fotosUsadas.map((f) => f.activo), ...videosUsados.map((v) => v.activo)],
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { commit?: string; error?: string };
      if (!r.ok || !j.commit) {
        if (r.status === 401) setSesion("no");
        setPublicacion({ estado: "error", mensaje: j.error ?? "No se pudo publicar. Tus cambios siguen guardados en este navegador." });
        return;
      }
      // Lo borrado ya no existe: sale del panel.
      const vigentes = Object.fromEntries(Object.entries(docs).filter(([, d]) => !estaBorrado(d)));
      setDocs(vigentes);
      setOriginal(vigentes);
      setFotosPublicadas((p) => [...p, ...fotosUsadas]);
      setFotosNuevas([]);
      setVideosPublicados((p) => [...p, ...videosUsados]);
      setVideosNuevos([]);
      setRecuperado(false);
      try {
        localStorage.removeItem(CLAVE_LOCAL);
      } catch {
        // nada que limpiar
      }
      setPublicacion({ estado: "publicando", commit: j.commit, pedidoEn: Date.now() });
    } catch {
      setPublicacion({ estado: "error", mensaje: "No hay conexión. Tus cambios siguen guardados en este navegador; vuelve a intentar." });
    }
  }

  async function salir() {
    await fetch("/api/admin/salir", { method: "POST" }).catch(() => null);
    setSesion("no");
  }

  function descartarTodo() {
    setDocs(original);
    setFotosNuevas([]);
    setVideosNuevos([]);
    setRecuperado(false);
  }

  /** «Cambiar foto» y «Cambiar video»: suben el archivo y devuelven el valor nuevo del campo; se publica con lo demás. */
  const subidas: Subidas = useMemo(
    () => ({
      foto: async (archivo, avance) => {
        const foto = await subirImagen(archivo, avance);
        setFotosNuevas((f) => [...f.filter((x) => x.activo._id !== foto.activo._id), foto]);
        return { _type: "image", asset: { _ref: foto.activo._id, _type: "reference" } };
      },
      video: soloMirar
        ? undefined
        : async (archivo, avance) => {
            const video = await subirVideo(archivo, avance);
            setVideosNuevos((v) => [...v.filter((x) => x.activo._id !== video.activo._id), video]);
            return { _type: "file", asset: { _ref: video.activo._id, _type: "reference" } };
          },
      motivoSinVideo: soloMirar ? "Este sitio no tiene configurado dónde publicar: los videos no se pueden cambiar aquí." : undefined,
      catalogo: (tipo) =>
        documentosDe(tipo, docs)
          .filter((d) => !estaBorrado(d))
          .map((d) => ({ id: d._id, titulo: COLECCIONES[tipo].resumen(d) })),
    }),
    [soloMirar, docs]
  );

  /** Colecciones: crear, duplicar, borrar (si nadie lo usa) y recuperar. */
  const crearDocumento = () => {
    if (!coleccion) return;
    const nuevo = documentoNuevo(coleccion, nuevaClave());
    setDocs((d) => ({ ...d, [nuevo._id]: nuevo }));
    setBusqueda("");
    setClave(nuevo._id);
  };
  const duplicarDocumento = (id: string) => {
    if (!coleccion || !docs[id]) return;
    const { _createdAt: _c, _updatedAt: _u, _rev: _r, ...resto } = conClavesNuevas(docs[id]) as Doc;
    void _c;
    void _u;
    void _r;
    const copia = { ...resto, _id: documentoNuevo(coleccion, nuevaClave())._id, _type: coleccion } as Doc;
    // Lo que no se puede repetir queda vacío para que se elija de nuevo.
    for (const u of COLECCIONES[coleccion].unicos ?? []) {
      const [raiz] = u.campo.split(".");
      delete (copia as Record<string, unknown>)[raiz];
    }
    setDocs((d) => ({ ...d, [copia._id]: copia }));
    setClave(copia._id);
  };
  const borrarDocumento = (id: string) => {
    if (!coleccion) return;
    const def = COLECCIONES[coleccion];
    const usan = usadoPor(id, Object.values(docs));
    if (usan.length) {
      window.alert(`No se puede borrar: lo usa ${usan.slice(0, 4).map(nombreDeDocumento).join(", ")}${usan.length > 4 ? ` y ${usan.length - 4} más` : ""}. Primero quítalo de ahí.`);
      return;
    }
    if (!window.confirm(`¿Borrar ${def.femenino ? "esta" : "este"} ${def.singular} «${def.resumen(docs[id])}»? Se quita de la web al publicar (antes de publicar, «Deshacer cambios» lo recupera).`)) return;
    setDocs((d) => {
      if (!original[id]) {
        const { [id]: _x, ...resto } = d;
        void _x;
        return resto;
      }
      return { ...d, [id]: { _id: id, _type: coleccion, [BORRAR]: true } as Doc };
    });
  };

  /** Cambia la lista de secciones de la página de servicio abierta. */
  const operar = (fn: (lista: SeccionCruda[]) => SeccionCruda[]) => {
    if (!docServicio) return;
    setDocs((d) => ({ ...d, [docServicio]: { ...d[docServicio], sections: fn(seccionesCrudas(d[docServicio])) } }));
  };
  const moverSeccion = (k: string, paso: number) =>
    operar((lista) => {
      const i = lista.findIndex((s) => s._key === k);
      const j = i + paso;
      if (i < 0 || j < 0 || j >= lista.length) return lista;
      const copia = lista.slice();
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  const duplicarSeccion = (k: string) => {
    const copia = conClavesNuevas(seccionesCrudas(docServicio ? docs[docServicio] : undefined).find((s) => s._key === k)) as SeccionCruda | undefined;
    if (!copia) return;
    operar((lista) => {
      const i = lista.findIndex((s) => s._key === k);
      return [...lista.slice(0, i + 1), copia, ...lista.slice(i + 1)];
    });
    setClave(copia._key);
  };
  const alternarSeccion = (k: string) => operar((lista) => lista.map((s) => (s._key === k ? { ...s, activo: s.activo === false } : s)));
  const quitarSeccion = (s: SeccionPanel) => {
    if (!window.confirm(`¿Quitar la sección «${s.titulo}» de la página? (Si solo quieres esconderla, usa «Ocultar». Se puede recuperar con «Deshacer cambios» antes de publicar.)`)) return;
    operar((lista) => lista.filter((x) => x._key !== s.clave));
  };
  const agregarSeccion = (tipo: string) => {
    if (pagina === "inicio" || esColeccion(pagina)) return;
    const def = definicionBloque(tipo, pagina);
    const nueva: SeccionCruda = { _key: nuevaClave(), _type: tipo, activo: true, animar: true, titulo: def.titulo, ...(def.nuevo?.() ?? {}) };
    const i = secciones.findIndex((s) => s.clave === seccion?.clave);
    operar((lista) => (i < 0 ? [...lista, nueva] : [...lista.slice(0, i + 1), nueva, ...lista.slice(i + 1)]));
    setClave(nueva._key);
  };

  /** El archivo de contenido/ de la sección elegida (el de su primer documento). */
  const docDeSeccion = seccion?.bloques[0]?.documento ?? (coleccion ? seccion?.clave : undefined);
  const archivoDeSeccion = docDeSeccion
    ? (ARCHIVO_DE_DOCUMENTO[docDeSeccion] ?? ARCHIVO_DE_COLECCION[(docs[docDeSeccion] ?? original[docDeSeccion])?._type ?? ""])
    : undefined;

  /** Pone en el formulario lo de esta sección tal como estaba en esa versión del archivo. */
  const traerVersion = (contenido: unknown, fecha: string): string | null => {
    if (!seccion || !docDeSeccion) return "No hay nada elegido.";
    if (coleccion) {
      const viejo = Array.isArray(contenido) ? (contenido as Doc[]).find((d) => d._id === seccion.clave) : undefined;
      if (!viejo) return "En esa versión este documento todavía no existía.";
      setDocs((d) => ({ ...d, [seccion.clave]: viejo }));
    } else if (docServicio) {
      const vieja = seccionesCrudas(contenido as Doc).find((s) => s._key === seccion.clave);
      if (!vieja) return "En esa versión esta sección todavía no existía.";
      operar((lista) => lista.map((s) => (s._key === seccion.clave ? vieja : s)));
    } else {
      const viejo = contenido as Doc;
      setDocs((d) => {
        let nuevo = d;
        for (const z of zonas(seccion, original)) {
          if (z.documento !== docDeSeccion) continue;
          nuevo = { ...nuevo, [z.documento]: escribir(nuevo[z.documento], z.ruta, leer(viejo, z.ruta)) };
        }
        return nuevo;
      });
    }
    avisar(`Se trajo la versión del ${fecha}. Revísala en la vista previa y publícala si sirve («Deshacer cambios» la quita).`);
    return null;
  };

  const deshacer = () => {
    if (!seccion) return;
    if (coleccion) {
      const id = seccion.clave;
      setDocs((d) => {
        if (original[id]) return { ...d, [id]: original[id] };
        const { [id]: _x, ...resto } = d;
        void _x;
        return resto;
      });
      return;
    }
    if (docServicio) {
      // Una sección de servicio vuelve a como estaba; si es nueva, se quita.
      const antes = seccionesCrudas(original[docServicio]).find((s) => s._key === seccion.clave);
      operar((lista) => (antes ? lista.map((s) => (s._key === seccion.clave ? antes : s)) : lista.filter((s) => s._key !== seccion.clave)));
      return;
    }
    setDocs((d) => {
      let nuevo = d;
      for (const z of zonas(seccion, original)) {
        nuevo = { ...nuevo, [z.documento]: escribir(nuevo[z.documento], z.ruta, leer(original[z.documento], z.ruta)) };
      }
      return nuevo;
    });
  };

  const cambiada = seccion ? cambiadas.has(`${pagina}:${seccion.clave}`) : false;
  const n = cambiadas.size;
  const pestana = PESTANAS.find((p) => p.clave === pagina) ?? PESTANAS[0];

  const conmutadores = (
    <div className="flex flex-wrap gap-2">
      <div className="inline-flex rounded-[10px] bg-brand/10 p-[3px]" role="group" aria-label="Tamaño de pantalla">
        {(["computadora", "celular"] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={dispositivo === d}
            onClick={() => setDispositivo(d)}
            className="rounded-lg px-3 py-1 text-[0.82rem] text-ink-muted aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-ink aria-pressed:shadow-sm"
          >
            {d === "computadora" ? "Computadora" : "Celular"}
          </button>
        ))}
      </div>
      <div className="inline-flex rounded-[10px] bg-brand/10 p-[3px]" role="group" aria-label="Qué mostrar">
        {(["seccion", "completa"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={modo === m}
            onClick={() => setModo(m)}
            className="rounded-lg px-3 py-1 text-[0.82rem] text-ink-muted aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-ink aria-pressed:shadow-sm"
          >
            {m === "seccion" ? "Esta sección" : "Página completa"}
          </button>
        ))}
      </div>
    </div>
  );

  const estado = cambiada ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0E3] px-2.5 py-1 font-display text-[0.68rem] font-bold tracking-[0.1em] text-[#8A3F08]">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      CAMBIOS SIN GUARDAR
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E2F3EA] px-2.5 py-1 font-display text-[0.68rem] font-bold tracking-[0.1em] text-[#1F6B47]">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      PUBLICADO
    </span>
  );

  if (sesion !== "si") {
    if (sesion === "cargando") {
      return <div className="panel-dofi grid min-h-screen place-items-center bg-abyss font-sans text-foam/70">Abriendo el panel…</div>;
    }
    return <Entrar faltan={ajustes.faltan} alEntrar={() => void consultarSesion()} />;
  }

  return (
    <div className="panel-dofi min-h-screen bg-canvas font-sans text-ink">
      <style>{SIN_ADORNOS_DEL_SITIO}</style>

      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-abyss px-4 py-2.5 text-foam sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-dofi-compact-160.webp" alt="DOFI" width={160} height={130} className="h-9 w-auto" />
        <span className="font-display text-[0.95rem] font-semibold text-foam/80">Panel</span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-2 text-[0.85rem] text-foam/85" aria-live="polite">
          <span className={`h-2 w-2 rounded-full ${n ? "bg-accent" : "bg-[#5FD39A]"}`} />
          {n ? `${n} ${n === 1 ? "sección cambiada" : "secciones cambiadas"} sin publicar` : "Igual a la web publicada"}
        </span>
        <button
          type="button"
          onClick={() => setPublicacion({ estado: "confirmar" })}
          disabled={soloMirar || n === 0 || repetidos.length > 0 || publicacion.estado === "enviando" || publicacion.estado === "confirmar"}
          title={soloMirar ? "Este sitio no tiene configurado dónde publicar (PANEL_RAMA_DESTINO)" : undefined}
          className="rounded-[10px] bg-accent px-3.5 py-2 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-accent-lift disabled:bg-white/10 disabled:text-foam/55"
        >
          {n ? `Publicar cambios (${n})` : "Publicar cambios"}
        </button>
        <button
          type="button"
          onClick={salir}
          className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-[0.85rem] text-foam/70 hover:bg-white/10 hover:text-foam"
          title="Cerrar la sesión en este navegador"
        >
          <SignOut size={16} weight="bold" aria-hidden="true" /> Salir
        </button>
      </header>

      {publicacion.estado === "confirmar" ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-brand/15 bg-brand/[0.07] px-4 py-3 text-[0.9rem] sm:px-6">
          <span>
            Va a salir a la web: <strong>{resumenCambios.join(", ")}</strong>.
            {ajustes.rama && ajustes.rama !== "main" ? ` (Vista previa de prueba: se publica en la rama «${ajustes.rama}», no en la web real.)` : ""}
          </span>
          <span className="ml-auto flex gap-2">
            <button type="button" onClick={() => setPublicacion({ estado: "nada" })} className="rounded-[10px] border border-canvas-border bg-white px-3 py-1.5 text-sm">
              Cancelar
            </button>
            <button type="button" onClick={publicar} className="rounded-[10px] bg-accent px-3 py-1.5 text-sm font-semibold text-ink hover:bg-accent-lift">
              Publicar ahora
            </button>
          </span>
        </div>
      ) : publicacion.estado === "enviando" ? (
        <p className="border-b border-brand/15 bg-brand/[0.07] px-4 py-2.5 text-[0.9rem] text-brand sm:px-6">Guardando el cambio en GitHub…</p>
      ) : publicacion.estado === "publicando" ? (
        <p className="flex items-center gap-2 border-b border-[#F4C9A5] bg-[#FFF0E3] px-4 py-2.5 text-[0.9rem] text-[#8A3F08] sm:px-6" aria-live="polite">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" aria-hidden="true" />
          <span>
            <strong>Publicando…</strong> Estará en la web en unos minutos (pedido a las{" "}
            {new Date(publicacion.pedidoEn).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}). Puedes seguir trabajando.
          </span>
        </p>
      ) : publicacion.estado === "listo" ? (
        <p className="flex items-center gap-2 border-b border-[#BFE3CF] bg-[#E2F3EA] px-4 py-2.5 text-[0.9rem] text-[#1F6B47] sm:px-6" aria-live="polite">
          <CheckCircle size={18} weight="fill" aria-hidden="true" />
          <span>
            <strong>Ya está en la web.</strong>{" "}
            {ajustes.sitio ? (
              <a className="underline" href={`${ajustes.sitio}/`} target="_blank" rel="noopener">
                Ver la vista previa de prueba
              </a>
            ) : (
              <a className="underline" href="/" target="_blank" rel="noopener">
                Ver la página
              </a>
            )}
          </span>
          <button type="button" onClick={() => setPublicacion({ estado: "nada" })} className="ml-auto text-sm underline">
            Cerrar
          </button>
        </p>
      ) : publicacion.estado === "lento" ? (
        <p className="flex items-center gap-2 border-b border-[#F4C9A5] bg-[#FFF0E3] px-4 py-2.5 text-[0.9rem] text-[#8A3F08] sm:px-6" aria-live="polite">
          <Warning size={18} weight="bold" aria-hidden="true" />
          <span>
            <strong>Está tardando más de lo normal.</strong> El cambio quedó guardado en GitHub; si en unos minutos no aparece, avísale a Claude Desktop para revisar la construcción en Cloudflare. La web sigue mostrando la versión anterior, sin errores.
          </span>
        </p>
      ) : publicacion.estado === "error" ? (
        <p className="flex items-center gap-2 border-b border-[#F4C9A5] bg-[#FFF0E3] px-4 py-2.5 text-[0.9rem] text-[#8A3F08] sm:px-6" role="alert">
          <Warning size={18} weight="bold" aria-hidden="true" />
          <span>{publicacion.mensaje}</span>
          <button type="button" onClick={() => setPublicacion({ estado: "nada" })} className="ml-auto text-sm underline">
            Cerrar
          </button>
        </p>
      ) : recuperado ? (
        <p className="flex flex-wrap items-center gap-2 border-b border-brand/15 bg-brand/[0.07] px-4 py-2 text-[0.85rem] text-brand sm:px-6">
          <span>Recuperé los cambios que dejaste sin publicar en este navegador.</span>
          <button type="button" onClick={descartarTodo} className="underline">
            Descartarlos todos
          </button>
        </p>
      ) : soloMirar ? (
        <p className="border-b border-brand/15 bg-brand/[0.07] px-4 py-2 text-[0.85rem] text-brand sm:px-6">
          <strong>Solo para mirar.</strong> Este sitio no tiene configurado dónde publicar: puedes probar cambios y ver cómo quedan, pero «Publicar cambios» está apagado y lo que escribas aquí no sale a la web.
        </p>
      ) : ajustes.rama && ajustes.rama !== "main" ? (
        <p className="border-b border-brand/15 bg-brand/[0.07] px-4 py-2 text-[0.85rem] text-brand sm:px-6">
          <strong>Vista previa de prueba:</strong> al publicar, el cambio va a la rama «{ajustes.rama}» y a su propia vista previa, no a la web real.
        </p>
      ) : null}

      {ajustes.llave ? (
        <p className="flex items-center gap-2 border-b border-[#F4C9A5] bg-[#FFF0E3] px-4 py-2.5 text-[0.9rem] text-[#8A3F08] sm:px-6" role="alert">
          <Warning size={18} weight="bold" aria-hidden="true" />
          <span>
            <strong>No se va a poder publicar todavía.</strong> {ajustes.llave}
          </span>
        </p>
      ) : null}

      {repetidos.length ? (
        <p className="flex items-center gap-2 border-b border-[#F4C9A5] bg-[#FFF0E3] px-4 py-2.5 text-[0.9rem] text-[#8A3F08] sm:px-6" role="alert">
          <Warning size={18} weight="bold" aria-hidden="true" />
          <span>
            <strong>Así no se puede publicar.</strong> {repetidos.join(" ")}
          </span>
        </p>
      ) : null}

      <nav className="flex items-end gap-1 overflow-x-auto border-b border-canvas-border px-4 pt-2 sm:px-6" aria-label="Páginas de la web">
        {PESTANAS.map((p) =>
          p.clave === pagina ? (
            <span key={p.titulo} aria-current="page" className="whitespace-nowrap border-b-[3px] border-brand px-3 py-2 text-[0.9rem] font-semibold text-brand">
              {p.titulo}
            </span>
          ) : (
            <button
              key={p.titulo}
              type="button"
              onClick={() => (p.lista && p.clave ? setPagina(p.clave) : avisar(`«${p.titulo}» llega en ${p.proxima ?? "una etapa próxima"}.`))}
              className={`whitespace-nowrap border-b-[3px] border-transparent px-3 py-2 text-[0.9rem] hover:text-ink ${p.lista ? "text-ink-muted" : "text-ink-subtle/70"}`}
              title={p.lista ? undefined : "Próximamente"}
            >
              {p.titulo}
              {[...cambiadas].some((k) => k.startsWith(`${p.clave}:`)) ? <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" /> : null}
            </button>
          )
        )}
        <a href={pestana.ruta} target="_blank" rel="noopener" className="ml-auto inline-flex items-center gap-1 whitespace-nowrap px-1 py-2 text-[0.88rem] font-medium text-brand hover:underline">
          Ver la página <ArrowSquareOut size={15} weight="bold" aria-hidden="true" />
        </a>
      </nav>

      <div className="flex flex-col gap-1.5 px-4 pb-4 pt-5 sm:px-6">
        <h1 className="font-display text-[clamp(1.35rem,1rem+1.2vw,1.9rem)] font-extrabold uppercase tracking-[0.01em]">Contenido · {pestana.titulo}</h1>
        <p className="max-w-4xl text-[0.93rem] text-ink-muted">
          {DESCRIPCION[pagina] ?? (esColeccion(pagina) ? COLECCIONES[pagina].ayuda : "")} Escribe en los campos y mira el cambio en la vista previa. Lo que cambies queda guardado en este navegador hasta que pulses «Publicar cambios»; entonces sale a la web en unos 5 a 7 minutos.
        </p>
      </div>

      <div className="grid gap-5 px-4 pb-10 sm:px-6 md:grid-cols-2 xl:grid-cols-[210px_minmax(380px,0.85fr)_minmax(0,1.15fr)]">
        <aside className="min-w-0 md:col-span-2 xl:col-span-1">
          <h2 className="mb-2 font-display text-[0.72rem] font-bold tracking-[0.12em] text-ink-subtle">
            {coleccion ? `${COLECCIONES[coleccion].titulo.toUpperCase()} (${secciones.length})` : "EN ESTA PÁGINA"}
          </h2>
          {coleccion ? (
            <div className="mb-2 flex flex-col gap-1.5">
              <label className="flex items-center gap-2 rounded-[10px] border border-canvas-border bg-white px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-brand">
                <MagnifyingGlass size={15} weight="bold" className="shrink-0 text-ink-subtle" aria-hidden="true" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar…"
                  aria-label={`Buscar en ${COLECCIONES[coleccion].titulo}`}
                  className="min-w-0 flex-1 bg-transparent text-[0.88rem] outline-none"
                />
              </label>
              <button
                type="button"
                onClick={crearDocumento}
                className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-brand px-3 py-1.5 text-[0.85rem] font-semibold text-brand hover:bg-brand hover:text-white"
              >
                <Plus size={14} weight="bold" aria-hidden="true" /> {COLECCIONES[coleccion].femenino ? "Nueva" : "Nuevo"} {COLECCIONES[coleccion].singular}
              </button>
            </div>
          ) : null}
          <ul className={`flex gap-1 overflow-x-auto pb-1 xl:flex-col ${coleccion ? "xl:max-h-[60vh] xl:overflow-y-auto" : "xl:overflow-visible"}`}>
            {coleccion && visibles.length === 0 ? <li className="px-2.5 py-2 text-sm text-ink-subtle">{busqueda ? "Nada coincide con la búsqueda." : "Todavía no hay ninguno."}</li> : null}
            {visibles.map((s) => (
              <li key={s.clave} className="shrink-0">
                <button
                  type="button"
                  aria-current={s.clave === seccion?.clave ? "true" : undefined}
                  onClick={() => setClave(s.clave)}
                  className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-[10px] px-2.5 py-2 text-left text-[0.9rem] text-ink hover:bg-brand/[0.06] aria-[current=true]:bg-white aria-[current=true]:font-semibold aria-[current=true]:shadow-[0_0_0_1px_rgba(75,42,147,0.16)]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <IconoSeccion nombre={s.icono} tamano={15} />
                  </span>
                  <span className={`min-w-0 truncate ${s.oculta ? "text-ink-subtle line-through decoration-ink-subtle/40" : ""}`}>{s.titulo}</span>
                  {s.oculta ? <EyeSlash size={14} weight="bold" className="shrink-0 text-ink-subtle" aria-label="Oculta" /> : null}
                  {cambiadas.has(`${pagina}:${s.clave}`) ? (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent" title="Con cambios sin guardar" />
                  ) : s.cuenta ? (
                    <span className="ml-auto rounded-full bg-brand/10 px-2 text-[0.75rem] tabular-nums text-ink-muted">{s.cuenta}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          {coleccion && seccion ? (
            <div className="mt-2 flex flex-wrap items-center gap-1 rounded-xl border border-canvas-border bg-white p-1.5" aria-label="Acciones del elegido">
              <button
                type="button"
                onClick={() => duplicarDocumento(seccion.clave)}
                disabled={estaBorrado(docs[seccion.clave])}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.78rem] text-ink-muted hover:bg-brand/10 hover:text-brand disabled:opacity-30"
              >
                <Copy size={14} weight="bold" aria-hidden="true" /> Duplicar
              </button>
              {estaBorrado(docs[seccion.clave]) ? (
                <button
                  type="button"
                  onClick={deshacer}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.78rem] text-ink-muted hover:bg-brand/10 hover:text-brand"
                >
                  <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" /> Recuperar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => borrarDocumento(seccion.clave)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.78rem] text-ink-muted hover:bg-brand/10 hover:text-brand"
                >
                  <Trash size={14} weight="bold" aria-hidden="true" /> Borrar
                </button>
              )}
            </div>
          ) : null}
          {docServicio && seccion ? (
            <div className="mt-2 flex flex-wrap items-center gap-1 rounded-xl border border-canvas-border bg-white p-1.5" aria-label="Mover u ocultar la sección elegida">
              {[
                { titulo: "Subir", Icono: ArrowUp, hacer: () => moverSeccion(seccion.clave, -1), apagado: secciones[0]?.clave === seccion.clave },
                { titulo: "Bajar", Icono: ArrowDown, hacer: () => moverSeccion(seccion.clave, 1), apagado: secciones[secciones.length - 1]?.clave === seccion.clave },
                { titulo: "Duplicar", Icono: Copy, hacer: () => duplicarSeccion(seccion.clave), apagado: false },
                { titulo: seccion.oculta ? "Mostrar" : "Ocultar", Icono: seccion.oculta ? Eye : EyeSlash, hacer: () => alternarSeccion(seccion.clave), apagado: false },
                { titulo: "Quitar", Icono: Trash, hacer: () => quitarSeccion(seccion), apagado: false },
              ].map(({ titulo, Icono, hacer, apagado }) => (
                <button
                  key={titulo}
                  type="button"
                  onClick={hacer}
                  disabled={apagado}
                  title={`${titulo} «${seccion.titulo}»`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.78rem] text-ink-muted hover:bg-brand/10 hover:text-brand disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Icono size={14} weight="bold" aria-hidden="true" /> {titulo}
                </button>
              ))}
            </div>
          ) : null}
          {docServicio ? (
            <label className="mt-2 flex flex-col gap-1 text-[0.8rem] text-ink-subtle">
              <span>Agregar una sección (debajo de la elegida)</span>
              <select
                value=""
                onChange={(e) => e.target.value && agregarSeccion(e.target.value)}
                className="rounded-[10px] border border-canvas-border bg-white px-2.5 py-2 text-[0.88rem] text-ink"
              >
                <option value="">+ Elegir el tipo…</option>
                {TIPOS_DE_PAGINA[pagina as PaginaServicio].filter(tieneFormulario).map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {definicionBloque(tipo, pagina as PaginaServicio).titulo}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </aside>

        {seccion ? (
          <TarjetaSeccion
            key={`${pagina}:${seccion.clave}`}
            seccion={seccion}
            docs={docs}
            cambiada={cambiada}
            resolver={resolver}
            alCambiar={cambiar}
            alCopiarDeFabrica={() => seccion.vacia && setDocs((d) => seccion.vacia!.aplicar(d))}
            alDeshacer={deshacer}
            subidas={subidas}
            alVersiones={archivoDeSeccion && original[docDeSeccion ?? ""] ? () => setVerVersiones(true) : undefined}
          />
        ) : (
          <p className="rounded-[20px] border border-dashed border-canvas-border bg-white p-6 text-sm text-ink-muted">
            {coleccion ? `No hay ${COLECCIONES[coleccion].titulo.toLowerCase()} todavía. Crea uno con «+ Nuevo».` : "Esta página no tiene secciones. Agrega una con «Agregar una sección»."}
          </p>
        )}

        <section className="flex min-w-0 flex-col gap-3 md:sticky md:top-3 md:self-start" aria-label="Vista previa">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {estado}
            <button
              type="button"
              onClick={() => setAmpliada(true)}
              className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[0.82rem] font-medium text-brand hover:bg-brand/[0.06]"
            >
              <ArrowsOut size={15} weight="bold" aria-hidden="true" /> Ampliar
            </button>
          </div>
          {conmutadores}
          {ampliada ? (
            <div className="h-40 rounded-lg border border-dashed border-canvas-border" />
          ) : sinVista ? (
            <div className="grid h-60 place-items-center rounded-lg border border-dashed border-canvas-border px-6 text-center text-sm text-ink-muted">{sinVista}</div>
          ) : vista ? (
            <Marco vista={vista} dispositivo={dispositivo} />
          ) : (
            <div className="grid h-60 place-items-center rounded-lg border border-dashed border-canvas-border text-sm text-ink-subtle">Armando la vista previa…</div>
          )}
          <p className="text-[0.78rem] text-ink-subtle">
            {modo === "seccion"
              ? "Dibujada con las mismas piezas de la web, en tu navegador, mientras escribes."
              : "La página entera, llevada hasta esta sección. Desplázate dentro de la vista previa para ver el resto."}
          </p>
        </section>
      </div>

      {ampliada ? (
        <div className="fixed inset-0 z-[80] flex flex-col gap-3 bg-abyss/95 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Vista previa ampliada">
          <div className="flex flex-wrap items-center gap-3 text-foam">
            <span className="font-display text-sm font-semibold">{seccion?.titulo}</span>
            <div className="rounded-xl bg-white p-1">{conmutadores}</div>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => setAmpliada(false)}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-white/10 px-3 py-1.5 text-sm font-semibold text-foam hover:bg-white/20"
            >
              <X size={15} weight="bold" aria-hidden="true" /> Cerrar (Esc)
            </button>
          </div>
          <div className="min-h-0 flex-1">
            {vista ? <Marco vista={vista} dispositivo={dispositivo} ajustarAlto /> : null}
          </div>
        </div>
      ) : null}

      {verVersiones && seccion && archivoDeSeccion ? (
        <Versiones
          key={`${pagina}:${seccion.clave}`}
          archivo={archivoDeSeccion}
          titulo={`${nombrePagina(pagina)} · ${seccion.titulo}`}
          alTraer={traerVersion}
          alCerrar={() => setVerVersiones(false)}
        />
      ) : null}

      {brindis ? (
        <div
          role="status"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[90] w-[min(92vw,560px)] -translate-x-1/2 rounded-xl bg-abyss px-4 py-3 text-center text-[0.88rem] text-foam shadow-lg"
        >
          {brindis}
        </div>
      ) : null}
    </div>
  );
}
