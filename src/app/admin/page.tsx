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
 * Sin inicio de sesión todavía: solo muestra contenido que ya es público y no
 * puede guardar nada. Por eso no pasa a main antes de la etapa 3.
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

  return <Panel documentos={documentos} activos={activos} />;
}
