/**
 * /contenido-version.json — con qué commit se construyó esta versión de la web.
 * Estático: se arma una vez, al construir. El panel lo consulta después de
 * publicar para saber cuándo su cambio ya está en la web
 * (docs/panel-propio/plan-etapa-3.md). Cloudflare Workers Builds define
 * WORKERS_CI_COMMIT_SHA y WORKERS_CI_BRANCH durante la construcción.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json({
    commit: process.env.WORKERS_CI_COMMIT_SHA ?? null,
    rama: process.env.WORKERS_CI_BRANCH ?? null,
    construidoEn: new Date().toISOString(),
  });
}
