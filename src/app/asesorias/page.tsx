import { PAGINAS, metadatosDePagina } from "@/config/seo";
import { DatosEstructurados } from "@/components/seo/DatosEstructurados";
import { SERVICIOS, datosDeServicio, migasDePan } from "@/lib/datos-estructurados";
import { PaginaAsesorias } from "@/components/asesorias/PaginaAsesorias";

export const metadata = metadatosDePagina(PAGINAS.asesorias);

export default function AsesoriasPage() {
  return (
    <>
      <DatosEstructurados
        datos={[datosDeServicio(SERVICIOS.asesorias), migasDePan([{ nombre: "Asesorías", ruta: PAGINAS.asesorias.ruta }])]}
      />
      <PaginaAsesorias />
    </>
  );
}
