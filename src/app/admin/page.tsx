import { sanityQuery } from "@/lib/sanity";
import type { Doc } from "@/lib/contenido/tipos";
import { referenciasDeActivos, type Activo } from "@/lib/contenido/archivos-activos";
import { Panel } from "@/panel/ui/Panel";

/**
 * /admin — el panel propio (docs/panel-propio/cambios-2026-11-25.md).
 *
 * Página ESTÁTICA: se arma una vez al construir, como el resto del sitio, y no
 * gasta CPU del Worker en cada visita. Al construir lee los documentos
 * COMPLETOS del Inicio y los activos (fotos) que usan, de la misma fuente que
 * la web (Sanity o los archivos del repositorio, según CONTENT_SOURCE), y se
 * los pasa al panel, que los edita en memoria.
 *
 * La sesión se comprueba al abrir la página (/api/admin/yo): sin contraseña
 * solo se ve la pantalla de entrada. El contenido que trae es el ya público.
 */
export default async function PaginaPanel() {
  const lista = (await sanityQuery<Doc[]>(`*[_id in ["hero", "paginaInicio", "banners"]]`)) ?? [];
  const documentos: Record<string, Doc> = {};
  for (const id of ["paginaInicio", "banners", "hero"]) {
    documentos[id] = lista.find((d) => d._id === id) ?? { _id: id, _type: id };
  }

  const ids = [...referenciasDeActivos(lista)].sort();
  const activos =
    ids.length > 0
      ? ((await sanityQuery<Activo[]>(`*[_id in ${JSON.stringify(ids)}]{ _id, url, metadata{ dimensions{ width, height } } }`)) ?? [])
      : [];

  // El commit con el que se construye esta página: al publicar, el panel avisa si
  // alguien cambió lo mismo después (lo define Cloudflare Workers Builds).
  const base = process.env.WORKERS_CI_COMMIT_SHA ?? null;

  return <Panel documentos={documentos} activos={activos} base={base} />;
}
