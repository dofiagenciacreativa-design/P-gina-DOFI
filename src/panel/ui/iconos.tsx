"use client";

import {
  ArrowRight,
  FilmStrip,
  ImageSquare,
  ListNumbers,
  SquaresFour,
  Star,
  TextAa,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import type { NombreIcono } from "@/panel/esquema/tipos";

const ICONOS: Record<NombreIcono, Icon> = {
  portada: ImageSquare,
  tarjetas: SquaresFour,
  banner: FilmStrip,
  texto: TextAa,
  metodo: ListNumbers,
  clientes: UsersThree,
  resenas: Star,
  cierre: ArrowRight,
};

export function IconoSeccion({ nombre, tamano = 16 }: { nombre: NombreIcono; tamano?: number }) {
  const Componente = ICONOS[nombre];
  return <Componente size={tamano} weight="bold" aria-hidden="true" />;
}
