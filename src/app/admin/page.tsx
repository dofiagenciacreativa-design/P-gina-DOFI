import { sanityQuery } from "@/lib/sanity";
import type { Doc } from "@/lib/contenido/tipos";
import { Panel } from "@/panel/ui/Panel";

/**
 * /admin — etapa 1 del panel propio (docs/panel-propio/cambios-2026-11-24.md §7).
 *
 * Página ESTÁTICA: se arma una vez al construir, como el resto del sitio, y no
 * gasta CPU del Worker en cada visita. Al construir lee de Sanity los
 * documentos COMPLETOS del Inicio (la API pública solo devuelve lo publicado,
 * nunca borradores) y se los pasa al panel, que los edita en memoria.
 *
 * Sin inicio de sesión todavía: solo muestra contenido que ya es público y no
 * puede guardar nada. Por eso esta etapa no pasa a main sola (llega con la 2).
 */
export default async function PaginaPanel() {
  const lista = (await sanityQuery<Doc[]>(`*[_id in ["hero", "paginaInicio", "banners"]]`)) ?? [];
  const documentos: Record<string, Doc> = {};
  for (const id of ["paginaInicio", "banners", "hero"]) {
    documentos[id] = lista.find((d) => d._id === id) ?? { _id: id, _type: id };
  }

  return (
    <Panel
      documentos={documentos}
      sanity={{ projectId: process.env.SANITY_PROJECT_ID ?? "", dataset: process.env.SANITY_DATASET ?? "" }}
    />
  );
}
