/**
 * Escribe datos estructurados (JSON-LD) en la pagina. No se ve: es para
 * buscadores. Ver src/lib/datos-estructurados.ts.
 *
 * `<` se escapa para que ningun texto pueda cerrar la etiqueta <script>.
 */
export function DatosEstructurados({ datos }: { datos: object | object[] }) {
  const lista = Array.isArray(datos) ? datos : [datos];
  return (
    <>
      {lista.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
