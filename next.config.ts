import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Se deja el formato por defecto de Next (WebP): soporte universal y
  // optimizacion mas barata en Vercel que AVIF.
  images: {
    // Sin el optimizador de Next: en Cloudflare devolvia el archivo original
    // (la foto del hero bajaba como PNG de 6,2 MB). Las fotos del contenido
    // ya tienen sus variantes WebP (/media/…); las de /public se sirven tal
    // cual. Ver src/lib/cargador-imagenes.ts.
    loader: "custom",
    loaderFile: "./src/lib/cargador-imagenes.ts",
  },
};

export default nextConfig;
