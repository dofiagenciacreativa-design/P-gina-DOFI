import { PAGINAS, metadatosDePagina } from "@/config/seo";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PaginaEnConstruccion } from "@/components/PaginaEnConstruccion";

export const metadata = metadatosDePagina(PAGINAS.elSocio);

export default function ElSocioPage() {
  return (
    <>
      <Nav />
      <main>
        <PaginaEnConstruccion titulo="El Socio" />
      </main>
      <Footer />
    </>
  );
}
