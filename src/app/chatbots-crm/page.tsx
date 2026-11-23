import { PAGINAS, metadatosDePagina } from "@/config/seo";
import { DatosEstructurados } from "@/components/seo/DatosEstructurados";
import { SERVICIOS, datosDeServicio, migasDePan } from "@/lib/datos-estructurados";
import { PaginaFeniax } from "@/components/feniax/PaginaFeniax";

export const metadata = metadatosDePagina(PAGINAS.chatbotsCrm);

export default function ChatbotsCrmPage() {
  return (
    <>
      <DatosEstructurados
        datos={[datosDeServicio(SERVICIOS.chatbotsCrm), migasDePan([{ nombre: "ChatBots / CRM", ruta: PAGINAS.chatbotsCrm.ruta }])]}
      />
      <PaginaFeniax />
    </>
  );
}
