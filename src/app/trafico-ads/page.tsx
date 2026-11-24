import { PAGINAS, metadatosDePagina } from "@/config/seo";
import { DatosEstructurados } from "@/components/seo/DatosEstructurados";
import { SERVICIOS, datosDeServicio, migasDePan } from "@/lib/datos-estructurados";
import { PaginaTrafico } from "@/components/trafico/PaginaTrafico";

export const metadata = metadatosDePagina(PAGINAS.traficoAds);

export default function TraficoAdsPage() {
  return (
    <>
      <DatosEstructurados
        datos={[datosDeServicio(SERVICIOS.traficoAds), migasDePan([{ nombre: "Pauta digital", ruta: PAGINAS.traficoAds.ruta }])]}
      />
      <PaginaTrafico />
    </>
  );
}
