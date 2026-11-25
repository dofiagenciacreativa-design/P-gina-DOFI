import { Lienzo } from "@/panel/vista-previa/Lienzo";

/**
 * /admin/lienzo — la página que el panel carga dentro de su vista previa.
 * Estática y vacía hasta que el panel le manda qué dibujar (postMessage).
 */
export default function PaginaLienzo() {
  return <Lienzo />;
}
