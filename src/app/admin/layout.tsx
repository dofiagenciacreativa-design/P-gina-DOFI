import type { Metadata } from "next";

/**
 * Panel propio de DOFI (docs/panel-propio/). Nada de /admin entra en los
 * buscadores: noindex aquí y Disallow en robots.ts.
 */
export const metadata: Metadata = {
  title: "Panel · DOFI",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return children;
}
