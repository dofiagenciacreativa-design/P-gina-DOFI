# Revisión de diseño y conversión · 2026-11-23

Pedido: revisar toda la web (ubicación de secciones, carga, letras, menú, espacios) para que no se sienta larga ni «cansona» y atraiga más clientes.

Cómo se revisó: capturas completas de las 8 páginas publicadas en computadora (1440×900) y teléfono (390×844), medidas de altura de cada sección, tamaños de letra, botones y menú, y una prueba de cómo quedaría con otros espacios. Nada se cambió todavía.

## En una frase

La marca se ve fuerte y coherente, y en el teléfono la primera pantalla de cada página funciona bien. El problema principal es de **ritmo**: en computadora cada sección ocupa una pantalla entera aunque tenga 30 palabras, y las páginas de servicios llegan a 8–10 pantallas. A eso se suman un menú sin botón de contacto, un inicio sin pruebas (clientes, reseñas) y textos con muchas metáforas que dicen poco de lo que el cliente gana.

## Medidas

| Página | Largo en computadora | Largo en teléfono | Botones «Quiero mejorar mis ventas» |
|---|---|---|---|
| Inicio | 4,0 pantallas | 6,4 | 9 (uno por banner) |
| Marketing Digital | 7,7 | 8,6 | 3 |
| Tráfico / Ads | **9,7** | **12,5** | 3 |
| ChatBots / CRM | 7,7 | 10,4 | 3 |
| Asesorías | 5,7 | 6,5 | 2 |
| Contáctanos | 1,7 | 3,2 | formulario |

- En computadora **todas** las secciones miden exactamente una pantalla (900 px en una ventana de 900), tengan 20 o 375 palabras. Ejemplos: «¿Qué es DOFI?» (41 palabras) y «¿Cómo navegamos contigo?» (31 palabras) ocupan una pantalla cada una.
- Además hay un «imán» en el scroll que encuadra cada sección al soltar la rueda: ayuda con secciones de pantalla completa, pero frena al que quiere bajar rápido.
- Esto viene de un pedido del 2026-10-07: «cada sección cuadre el 100% de la pantalla» (está anotado en `src/app/globals.css`).

## Prueba: secciones del tamaño de su contenido

Manteniendo la portada a pantalla completa y dejando el resto con márgenes generosos pero fijos (imagen en `borradores/espacios-antes-despues-marketing.jpg`):

| Página | Hoy | Propuesta | Más corta |
|---|---|---|---|
| Marketing Digital | 7,7 | 5,8 | 24 % |
| Tráfico / Ads | 9,7 | 7,8 | 19 % |
| ChatBots / CRM | 7,7 | 6,4 | 17 % |
| Asesorías | 5,7 | 4,7 | 17 % |

Sin quitar ni una palabra. Si además se juntan las secciones de metáforas (punto 6), bajan más.

## Lo que funciona bien (no tocar)

- Identidad fuerte y coherente: morado y naranja de DOFI, tipografía Sora, mismo lenguaje en todas las páginas.
- En el teléfono, la primera pantalla de cada página tiene un título claro y el botón naranja a la vista.
- Botón flotante de WhatsApp en todas las páginas.
- Formulario de contacto corto (abre WhatsApp con el mensaje listo).
- Reseñas reales de Google y logos de clientes en las páginas de servicios.
- Pie de página completo: teléfono, correo, dirección, horario y mapa.
- Velocidad: arreglada hoy (banners como video, capa de grano liviana).

## Recomendaciones, por impacto

| # | Qué | Por qué atrae más clientes | Quién decide | Esfuerzo |
|---|---|---|---|---|
| 1 | **Secciones del tamaño de su contenido** en computadora (la portada sigue a pantalla completa) y quitar el «imán» del scroll | Páginas 17–24 % más cortas, menos sensación de vacío; el visitante llega antes a las pruebas y al botón | Propietario (revierte el pedido del 7-oct) | Bajo |
| 2 | **Menú de arriba con botón de contacto** naranja siempre visible («Cotizar por WhatsApp») y nombres más claros: «Tráfico / Ads» → «Publicidad», «ChatBots / CRM» → «Chatbots con IA». Letra del menú de 13 a 15 px | Hoy el menú no tiene forma directa de contactar; el botón fijo es el elemento que más contactos genera en webs de servicios | Propietario (nombres) | Bajo |
| 3 | **Páginas de cada cliente (26):** el texto «Tu marca puede ser la siguiente» casi no se lee (claro sobre claro) y arriba sale una imagen de relleno enorme | Están en Google desde hoy; hoy se ven rotas. Arreglar el contraste y ocultar la imagen de relleno hasta tener fotos reales | Técnico | Bajo |
| 4 | **Inicio con pruebas y cierre:** debajo de los banners, logos de clientes, 3 reseñas de Google y un cierre con botón de contacto (secciones que ya existen en las páginas de servicios) | El inicio es la página que más llega desde Google y hoy no muestra ni clientes ni reseñas. Nota: se quitaron del inicio por un pedido anterior | Propietario | Medio |
| 5 | **Tarjeta «Academia»** del inicio no lleva a ninguna parte | Un clic que no va a ningún lado resta confianza. Quitarla, o enlazarla cuando exista | Propietario | Bajo |
| 6 | **Textos más concretos:** «¿Qué es DOFI?» habla de delfines «seres de alta vibración»; «¿Cómo navegamos contigo?» y «Construimos el mapa antes de zarpar» son metáforas con poco contenido. Juntarlas en una sección por página que diga qué hace DOFI, para quién y qué resultado da | Un dueño de negocio decide por beneficios claros; las metáforas suman pantallas sin dar razones | Propietario (texto en Sanity); puedo proponer los textos | Medio |
| 7 | **Más botones a mitad de página** y con el texto de cada servicio («Quiero mi campaña», «Quiero mi chatbot», «Agendar mi asesoría»), después del método y después de los clientes | Hoy hay 3 botones en 8–10 pantallas; quien se convence a mitad de página tiene que buscar | Propietario (textos) | Bajo |
| 8 | **Letra mínima de 16 px** en textos de tarjetas (hoy muchas en 14–15 px, gris claro sobre fondo oscuro) | Se lee mejor, sobre todo para dueños de negocio de más edad | Técnico | Bajo |
| 9 | **Nota de Google arriba de las reseñas** («5,0 ★ en Google · N reseñas»), con el dato real de Google | Prueba social inmediata, sin leer cada reseña | Técnico | Bajo |

## Orden sugerido

1. **Primera tanda (técnica, sin tocar textos):** 1 + 3 + 8. Se ve en una vista previa antes de publicar.
2. **Segunda tanda:** 2 + 5 + 7 (necesita tu visto bueno en nombres y textos de botones).
3. **Tercera tanda:** 4 + 6 + 9 (contenido del inicio y textos nuevos; te propongo los textos y tú eliges).
