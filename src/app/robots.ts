import type { MetadataRoute } from "next";
import { site, absoluteUrl } from "@/config/site";

/**
 * /robots.txt
 *
 * Antes no existia: la peticion caia en el robots.txt por defecto de
 * Cloudflare (el de "content signals"), que no declara sitemap ni sabe nada
 * de este proyecto.
 *
 * El comportamiento depende del entorno, no de una constante fija:
 *
 *   STAGING (*.workers.dev, local, sin NEXT_PUBLIC_SITE_URL)
 *     -> Disallow: / . Nada de esto debe entrar en un indice.
 *
 *   PRODUCCION (NEXT_PUBLIC_SITE_URL con dominio propio)
 *     -> Allow: / , se bloquea solo /api/, y se declara el sitemap.
 *
 * No se agregan reglas para crawlers de IA todavia: eso corresponde al
 * sprint de SEO/GEO, con la decision de negocio tomada.
 */
export default function robots(): MetadataRoute.Robots {
  if (!site.isIndexable) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/render-escena"],
      },
      // BUSCADORES CON IA (GEO, 2026-11-23): bienvenidos, con nombre propio.
      // La regla de arriba ya los deja pasar; declararlos uno por uno deja
      // claro que es a proposito y evita que una regla futura los bloquee
      // sin querer. Son los que leen la web para responder en ChatGPT,
      // Claude, Perplexity, Gemini y Apple Intelligence.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}
