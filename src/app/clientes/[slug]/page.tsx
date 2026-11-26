import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccountBySlug, getAllActiveSlugs } from "@/lib/sanity";
import { company } from "@/config/company";
import { metadatosDePagina } from "@/config/seo";
import { FichaCliente } from "@/components/clientes/FichaCliente";

/** Genera una ruta estatica por cada cuenta activa en tiempo de build.
 *  Una cuenta creada despues sigue funcionando: dynamicParams (por defecto
 *  en Next) la renderiza on-demand la primera vez que alguien entra. */
export async function generateStaticParams() {
  const slugs = await getAllActiveSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const client = await getAccountBySlug(slug);
  if (!client) return { title: "Cliente no encontrado | DOFI" };

  // Titulo, descripcion y canonical con la misma regla que el resto del
  // sitio (src/config/seo.ts). La imagen para compartir es la general de
  // DOFI: client.cover es hoy la misma portada generica de relleno en las 26
  // cuentas (ver AUDITORIA-DOFI-V1, VIS-012). Cuando cada caso tenga su
  // material real, pasarlo en `imagen`.
  return metadatosDePagina({
    ruta: `/clientes/${client.slug}`,
    titulo: `${client.name}: cliente de DOFI | Marketing en Cuenca`,
    descripcion: client.summary || `${client.name}, cliente de DOFI Agencia Creativa, agencia de marketing digital en ${company.location.city}.`,
  });
}

export default async function ClientePage({ params }: Params) {
  const { slug } = await params;
  const client = await getAccountBySlug(slug);
  if (!client) notFound();

  return <FichaCliente client={client} />;
}
