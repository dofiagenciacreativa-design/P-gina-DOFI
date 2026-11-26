/**
 * Ajustes del panel que vienen del Worker (docs/panel-propio/plan-etapa-3.md).
 * OpenNext copia las variables y secretos del Worker a process.env.
 *
 *  - PANEL_CLAVE         secreto: la contraseña del panel (16+ caracteres)
 *  - GITHUB_TOKEN_PANEL  secreto: token de GitHub de un solo repositorio, Contents: Read and write
 *  - PANEL_RAMA_DESTINO  variable (wrangler.jsonc): dónde publica el panel.
 *                        «main» en producción; una rama de pruebas en las vistas previas.
 *                        Si falta, el panel NO publica (nunca cae a main por descuido).
 */

export const REPOSITORIO = { dueno: "dofiagenciacreativa-design", nombre: "P-gina-DOFI" } as const;

export const claveDelPanel = () => process.env.PANEL_CLAVE || undefined;
export const tokenDeGithub = () => process.env.GITHUB_TOKEN_PANEL || undefined;
export const ramaDestino = () => process.env.PANEL_RAMA_DESTINO || null;

/** Qué falta configurar, en palabras para el propietario. */
export function ajustesFaltantes(): string[] {
  const faltan: string[] = [];
  if (!claveDelPanel()) faltan.push("la contraseña del panel (secreto PANEL_CLAVE)");
  else if ((claveDelPanel() ?? "").length < 16) faltan.push("una contraseña de 16 caracteres o más (PANEL_CLAVE es muy corta)");
  if (!tokenDeGithub()) faltan.push("la llave de GitHub (secreto GITHUB_TOKEN_PANEL)");
  if (!ramaDestino()) faltan.push("la rama donde publicar (variable PANEL_RAMA_DESTINO)");
  return faltan;
}

/** La dirección de la web que se construye con la rama destino. */
export function sitioDeRama(rama: string): string | null {
  if (rama === "main") return null; // es este mismo sitio: el navegador lee su propio /contenido-version.json
  return `https://${rama.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-pagina-dofi.dofiagenciacreativa.workers.dev`;
}
