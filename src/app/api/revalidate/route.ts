import { NextResponse } from "next/server";

/**
 * Webhook de Sanity: se llama al publicar/editar/borrar una Cuenta, un
 * Contenido o un Servicio.
 *
 * DESDE EL 2026-11-24 las paginas se arman UNA vez, al construir la web, y
 * se entregan ya hechas (ver open-next.config.ts). Por eso este endpoint ya
 * no «invalida» nada: dispara una construccion nueva de la web en Cloudflare
 * (Deploy Hook de Workers Builds) y el cambio aparece en unos minutos.
 *
 * Configuracion (no va en el repositorio):
 *  - Webhook en manage.sanity.io -> proyecto -> API -> Webhooks, apuntando a
 *    esta URL con ?secret=<SANITY_REVALIDATE_SECRET>, en Create/Update/Delete.
 *  - Secretos del Worker pagina-dofi: SANITY_REVALIDATE_SECRET y
 *    CF_DEPLOY_HOOK_URL (la URL del Deploy Hook de la rama main, creado en
 *    Workers & Pages -> pagina-dofi -> Settings -> Builds -> Deploy Hooks).
 *    Quien tenga esa URL puede lanzar construcciones: tratarla como clave.
 *
 * Varias publicaciones seguidas lanzan varias construcciones; Cloudflare las
 * hace en fila y la ultima trae todos los cambios.
 */
export async function POST(request: Request) {
  const secretEsperado = process.env.SANITY_REVALIDATE_SECRET;
  const secretRecibido = new URL(request.url).searchParams.get("secret");

  if (!secretEsperado || secretRecibido !== secretEsperado) {
    return NextResponse.json(
      { publicando: false, error: "Secreto invalido o no configurado" },
      { status: 401 }
    );
  }

  const deployHook = process.env.CF_DEPLOY_HOOK_URL;
  if (!deployHook) {
    console.error(
      "[revalidate] Falta el secreto CF_DEPLOY_HOOK_URL: el cambio de Sanity se vera recien en la proxima publicacion."
    );
    return NextResponse.json(
      { publicando: false, error: "Falta CF_DEPLOY_HOOK_URL" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(deployHook, { method: "POST", cache: "no-store" });
    if (!res.ok) throw new Error(`Cloudflare respondio ${res.status}`);
  } catch (err) {
    console.error("[revalidate] No se pudo lanzar la construccion nueva:", err);
    return NextResponse.json(
      { publicando: false, error: "No se pudo lanzar la construccion" },
      { status: 502 }
    );
  }

  return NextResponse.json({ publicando: true, now: Date.now() });
}
