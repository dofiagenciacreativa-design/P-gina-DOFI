import { PAGINAS, metadatosDePagina } from "@/config/seo";
import { DatosEstructurados } from "@/components/seo/DatosEstructurados";
import { SERVICIOS, datosDeServicio, migasDePan } from "@/lib/datos-estructurados";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SeccionesMarketing } from "@/components/marketing/SeccionesMarketing";
import { getPaginaMarketingDigital } from "@/lib/marketing-digital";

export const metadata = metadatosDePagina(PAGINAS.marketingDigital);

/**
 * Marketing Digital: la página ES su lista de secciones (ver
 * src/components/marketing/SeccionesMarketing.tsx: encabezados y anclas).
 */
export default async function MarketingDigitalPage() {
  const { secciones } = await getPaginaMarketingDigital();

  return (
    <>
      <DatosEstructurados
        datos={[
          datosDeServicio(SERVICIOS.marketingDigital),
          migasDePan([{ nombre: "Marketing Digital", ruta: PAGINAS.marketingDigital.ruta }]),
        ]}
      />
      <Nav />
      <main>
        <SeccionesMarketing secciones={secciones} />
      </main>
      <Footer />
    </>
  );
}
