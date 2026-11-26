import { consultar } from "@/lib/consultas";
import type { Doc } from "@/lib/contenido/tipos";
import { obtenerResenasGoogle } from "@/lib/google-places";
import { Panel } from "@/panel/ui/Panel";

/**
 * /admin — el panel propio (docs/panel-propio/cambios-2026-11-25.md).
 *
 * Página ESTÁTICA: se arma una vez al construir, como el resto del sitio, y no
 * gasta CPU del Worker en cada visita. Al construir trae el CONJUNTO de
 * documentos que usan las páginas que se editan (Inicio y las 4 de servicio,
 * con las cuentas, reseñas y servicios que leen) y los activos (solo id,
 * dirección y medidas) de contenido/, como la web, más las reseñas de Google. Con eso
 * el panel arma la vista previa en el navegador con las mismas consultas que
 * la web (plan-etapa-4.md).
 *
 * La sesión se comprueba al abrir la página (/api/admin/yo): sin contraseña
 * solo se ve la pantalla de entrada. El contenido que trae es el ya público.
 */

const TIPOS = [
  "paginaInicio",
  "hero",
  "banners",
  "marketingDigitalPage",
  "traficoAdsPage",
  "chatbotsCrmPage",
  "asesoriasPage",
  "cuenta",
  "resena",
  "servicio",
  "contenido",
];

export default async function PaginaPanel() {
  const [documentos, activos, resenasGoogle] = await Promise.all([
    consultar<Doc[]>(`*[_type in ${JSON.stringify(TIPOS)} && !(_id in path("drafts.**"))]`),
    consultar<Doc[]>(
      `*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]{ _id, _type, url, extension, mimeType, originalFilename, metadata{ dimensions{ width, height } } }`
    ),
    obtenerResenasGoogle(),
  ]);

  // El commit con el que se construye esta página: al publicar, el panel avisa si
  // alguien cambió lo mismo después (lo define Cloudflare Workers Builds).
  const base = process.env.WORKERS_CI_COMMIT_SHA ?? null;

  return <Panel conjunto={[...(documentos ?? []), ...(activos ?? [])]} resenasGoogle={resenasGoogle} base={base} />;
}
