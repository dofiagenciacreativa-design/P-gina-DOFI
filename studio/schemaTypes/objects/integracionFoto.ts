import { defineField, type ConditionalProperty } from "sanity";

/**
 * «Integración de la foto» (pedido del 2026-11-25): cómo se funde una foto
 * recortada con el fondo de la portada, para que no se vea pegada encima.
 * La web lo aplica en src/components/FotoIntegrada.tsx; sin este campo usa
 * «Luz de escena» al 60 %, que es lo que eligió el propietario.
 */
export function campoIntegracionFoto(opciones: { hidden?: ConditionalProperty } = {}) {
  return defineField({
    name: "integracionFoto",
    title: "Integración de la foto con el fondo",
    type: "object",
    hidden: opciones.hidden,
    options: { collapsible: true, collapsed: true },
    description: "Para que la foto no se vea pegada encima del fondo. Se aplica sola a cualquier foto nueva.",
    fields: [
      defineField({
        name: "tratamiento",
        title: "Tratamiento",
        type: "string",
        initialValue: "luz",
        options: {
          layout: "radio",
          list: [
            { title: "Luz de escena (recomendado): borde fundido, contraluz morado y naranja, color de noche", value: "luz" },
            { title: "Fundido: solo el borde se disuelve en el fondo", value: "fundido" },
            { title: "Escenario: luz de escena más un aro de luz detrás", value: "escenario" },
            { title: "Ninguno: la foto tal cual", value: "ninguno" },
          ],
        },
      }),
      defineField({
        name: "intensidad",
        title: "Intensidad (0 a 100)",
        type: "number",
        initialValue: 60,
        description: "Cuánto se nota: largo del fundido y fuerza de la luz. 60 es el punto de partida.",
        validation: (regla) => regla.min(0).max(100).integer(),
      }),
    ],
  });
}
