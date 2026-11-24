# Tanda 2 de la revisión de diseño · 2026-11-23

Rama `ajustes-tanda-2`. Puntos 2, 5 y 7 de `audit/REVISION-DISENO-2026-11-23.md`, más un retoque de diseño de las tarjetas del inicio (permiso del propietario: «si algo se ve hecho por IA, cámbialo»). Nada se cambió en Sanity: todo está en el código.

## 2. Menú de arriba

**Esto revierte dos decisiones anteriores** (anotadas en `src/components/Nav.tsx`): el menú «sin botón de contacto» de la «Corrección del Header V2» y el logo centrado con las redes a la izquierda.

| | Antes | Ahora |
|---|---|---|
| Orden | Redes · logo al centro · enlaces | Logo · enlaces al centro · redes + botón |
| Botón de contacto | No había | «Contáctanos →» naranja, siempre visible (también en el teléfono, al lado del menú) |
| Destino del botón | — | El formulario (`/contactanos`), el mismo que el botón flotante de WhatsApp |
| Letra de los enlaces | 13 px | 14 px (15 px en pantallas grandes) |
| «Tráfico / Ads» | | **Pauta digital** |
| «ChatBots / CRM» | | **Chatbots y CRM** |
| Redes | Cajas blancas con borde | Íconos sueltos, más discretos (siguen siempre visibles) |

- «Pauta digital» lo eligió el propietario: tiene que decir anuncios pagados; «Publicidad» se confundía con marketing. Es la misma palabra del formulario y de la tarjeta del inicio. Las migas de pan de Google también dicen «Pauta digital».
- Las direcciones de las páginas no cambian (`/trafico-ads`, `/chatbots-crm`): Google y los enlaces viejos siguen funcionando.
- El botón dice «Contáctanos» y no «Cotizar por WhatsApp» (lo que proponía la revisión) porque lleva al formulario, no a un chat. El formulario abre WhatsApp al enviarlo.
- Con el logo al centro no cabían los enlaces más el botón ni a 1440 px; por eso el logo pasa a la izquierda.

## 5. Tarjetas del inicio

- En el Studio ninguna de las 5 tarjetas tenía enlace: eran texto suelto. Ahora, si no traen enlace desde el Studio, usan uno según su ícono:

| Tarjeta | Lleva a |
|---|---|
| Redes Sociales | Marketing Digital |
| Pauta en TikTok y Meta | Pauta digital |
| +3M$ Vendidos en Redes | Clientes de Marketing Digital |
| Rescatando Emprendedores | Asesorías |
| Academia | Ninguna: su página todavía no existe (no se inventa una) |

- Las que llevan a algún lado muestran una flecha pequeña arriba a la derecha que se enciende al pasar el mouse.
- **Diseño menos «plantilla»:** el ícono blanco dentro de un cuadrado morado con degradado (el recurso más repetido de las webs hechas con IA) pasa a ser un ícono suelto, de línea fina, en el naranja claro de la marca.

## 7. Textos de los botones: misma idea, distintas palabras

Pedido del propietario: «el texto puede ser distinto en cada uno, pero tiene que tener el mismo concepto» (mejorar las ventas, agendar una reunión). Reemplaza la regla del 2026-10-02 de que todos dijeran «Quiero mejorar mis ventas».

| Página | Botones (en orden) |
|---|---|
| Inicio (banners) | Quiero redes que vendan · Quiero vender con publicidad · Quiero automatizar mis ventas · Quiero agendar mi asesoría |
| Marketing Digital | Quiero mejorar mis ventas · Quiero agendar una reunión · Quiero que seamos socios |
| Pauta digital | Quiero más clientes · Quiero una campaña que venda · Quiero aumentar mis ventas |
| Chatbots y CRM | Quiero vender con IA · Quiero agendar una reunión · Quiero que mis ventas renazcan |
| Asesorías | Quiero agendar mi asesoría · Quiero rescatar mi negocio |
| Redes | Quiero trabajar con DOFI |
| Cada cliente (26) | Quiero que mi marca sea la siguiente |

- El botón grande de la portada del inicio sigue diciendo «Quiero Mejorar Mis Ventas».
- Los textos viven en `src/lib/cta.ts` (`VARIANTES_CTA`). Regla: si en el Studio el botón tiene el texto genérico, se usa la variante; si alguien escribe **otro** texto en el Studio, se respeta el del Studio.
- Todos siguen llevando al formulario, con el servicio ya marcado.

## Arreglo que quedaba pendiente de la tanda 1

- «Todos los clientes», en la página de cada cliente, llevaba a `/#clientes`, una sección que ya no existe en el inicio. Ahora lleva a los clientes de Marketing Digital.

## Comprobado (versión compilada en local, con el dominio real)

- `tsc` sin errores y `next build` correcto.
- Menú en 320, 360, 390, 1024, 1100, 1280, 1366, 1440 y 1920 px: nada se encima, nada se sale de la pantalla, cada enlace en una sola línea.
- Textos de los botones revisados página por página (tabla de arriba).
- Enlaces de las tarjetas del inicio revisados uno por uno.

## No hecho en esta tanda

- **Más botones a mitad de página** (la otra mitad del punto 7): no se agregaron botones nuevos; solo cambiaron los textos de los que ya había. Agregar botones después del método y de los clientes cambia el orden de las secciones del Studio y conviene decidirlo con la tanda 3.
- **Academia** sigue sin destino: falta decidir si se quita o a dónde lleva.
