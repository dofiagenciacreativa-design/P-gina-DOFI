import { expect, test } from "vitest";
import cargador from "@/lib/cargador-imagenes";
import { anchosParaGenerar, direccionParaAncho, elegirVariante } from "@/lib/contenido/medios";

const SHA = "c948e9e530cb7c6a3b8c8d24f21f22ea66d2f13a";
const BANNER = `/media/${SHA}-2077x757.webp`;

test("solo se generan variantes más angostas que el original", () => {
  expect(anchosParaGenerar(2077)).toEqual([160, 320, 480, 640, 828, 1080, 1200, 1600, 1920]);
  expect(anchosParaGenerar(120)).toEqual([]);
});

test("elige la variante más angosta que alcance, o la imagen completa", () => {
  expect(elegirVariante([480, 828, 1200], 500)).toBe(828);
  expect(elegirVariante([480, 828, 1200], 480)).toBe(480);
  expect(elegirVariante([480, 828], 1600)).toBeNull();
  expect(elegirVariante([480, 828], null)).toBeNull();
  expect(direccionParaAncho(BANNER, 828)).toBe(`/media/${SHA}-2077x757/w828.webp`);
  expect(direccionParaAncho(BANNER, 500)).toBe(`/media/${SHA}-2077x757/w640.webp`);
  expect(direccionParaAncho(BANNER, 3840)).toBe(BANNER);
  expect(direccionParaAncho("/home/banner-redes-foto.webp", 828)).toBeNull();
});

test("el cargador de next/image entiende /media y deja igual lo demás", () => {
  expect(cargador({ src: `${BANNER}?w=2400&auto=format`, width: 1080 })).toBe(`/media/${SHA}-2077x757/w1080.webp`);
  expect(cargador({ src: "/home/banner-redes-foto.webp", width: 828 })).toBe("/home/banner-redes-foto.webp");
  // Cualquier otra dirección se usa tal cual (ya no hay imágenes de Sanity).
  expect(cargador({ src: "https://ejemplo.com/foto.png", width: 828 })).toBe("https://ejemplo.com/foto.png");
});
