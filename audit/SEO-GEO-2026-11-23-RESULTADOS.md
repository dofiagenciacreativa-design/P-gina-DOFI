# SEO y GEO · 2026-11-23

Rama `seo-geo`. Pedido: que DOFI aparezca primero como agencia de marketing en Cuenca, en Google y en los buscadores con inteligencia artificial (ChatGPT, Perplexity, Gemini).

## Qué se encontró en la web publicada

| Problema | Gravedad | Efecto |
|---|---|---|
| Todas las páginas declaraban como dirección oficial (canonical) la del inicio | **Crítica** | Le decían a Google «soy copia del inicio»: las páginas de servicios no se indexan |
| El mapa del sitio no tenía las páginas de servicios, contacto ni redes | Alta | Google solo conocía el inicio y los clientes |
| Ningún título ni descripción decía «agencia de marketing»; ninguno nombraba Cuenca | Alta | Justo lo que escribe la gente que busca una agencia en la ciudad |
| Sin datos estructurados (ficha del negocio para máquinas) | Alta | Google y los buscadores con IA no tienen datos fiables de quién es DOFI, dónde está y qué hace |
| Sin imagen para compartir | Media | Al pegar el enlace en WhatsApp o Facebook no salía imagen |
| Sin `llms.txt` | Media | Nada pensado para los buscadores con IA |
| `/clientes` y `/el-socio` («en construcción») se podían indexar | Baja | Páginas casi vacías que restan calidad al sitio |

Contexto: un buscador web no encontró a DOFI ni por su nombre. La competencia local que aparece (Wave Studio, BigBang, Barter Rubio, NeoIngenieria, Tinkuy) también está poco optimizada: hay espacio para ganar.

## Qué se cambió (nada visible en la página)

1. **Títulos y descripciones nuevos** en todas las páginas, con «agencia de marketing», el servicio y la ciudad, dentro de los límites de Google (60 y 160 caracteres). Fuente única: `src/config/seo.ts`.

| Página | Título nuevo |
|---|---|
| Inicio | Agencia de Marketing Digital en Cuenca \| DOFI |
| Marketing Digital | Marketing Digital y Redes Sociales en Cuenca \| DOFI |
| Tráfico / Ads | Publicidad en Meta Ads, TikTok y Google Ads en Cuenca |
| ChatBots / CRM | Chatbots con IA y CRM para WhatsApp \| FENIAX by DOFI |
| Asesorías | Asesorías de Negocio 1 a 1 en Cuenca \| DOFI |
| Contáctanos | Contacto \| DOFI Agencia de Marketing en Cuenca |
| Redes | Nuestro trabajo en redes \| DOFI Agencia de Marketing |
| Cada cliente | «Nombre»: cliente de DOFI \| Marketing en Cuenca |

2. **Cada página con su propia dirección oficial** (canonical).
3. **Datos estructurados** (`src/lib/datos-estructurados.ts`):
   - en todas las páginas, la ficha del negocio (tipo *ProfessionalService*): nombre, dirección, coordenadas de la ficha de Google Maps, teléfono, correo, horario, redes, servicios y a Daniel Vallejo como miembro; y la ficha del sitio;
   - en cada página de servicio, el servicio y las «migas de pan» (Inicio › Servicio), que Google muestra en el resultado.
   - No se declara nada que la web no diga: ni precios, ni calificaciones, ni cifras.
4. **Mapa del sitio completo:** inicio, 4 servicios, contacto, redes y 26 clientes.
5. **Reglas para buscadores (`robots.txt`):** los buscadores con IA nombrados uno por uno y con permiso explícito.
6. **`/llms.txt`:** resumen de DOFI para buscadores con IA (qué hace, dónde está, servicios, clientes, contacto), sacado del texto de la web.
7. **Imagen para compartir** de 1200×630 (`public/og/dofi-agencia-marketing-cuenca.jpg`), con la marca, la tipografía y los colores de DOFI.
8. `/clientes` y `/el-socio` marcadas para no indexar mientras estén en construcción. Idioma de la página: `es-EC`.

## Comprobado

- `tsc` sin errores y `next build` correcto, con el dominio real.
- En la versión compilada: las 10 rutas devuelven su título, descripción, canonical, imagen y datos estructurados; los JSON-LD son válidos; el texto visible del inicio no cambió.
- `robots.txt`, `sitemap.xml`, `llms.txt` y la imagen responden bien.

## Lo que no se puede hacer desde el código (lo hace el propietario)

1. **Google Search Console:** verificar el dominio y enviar `https://dofiagenciacreativa.com/sitemap.xml`. Es la forma de pedirle a Google que vuelva a leer el sitio ya corregido, y de ver por qué búsquedas aparece DOFI.
2. **Ficha de Google Business («Dofi Agencia Creativa»):** es lo que más pesa en búsquedas locales como «agencia de marketing en Cuenca» (el mapa con 3 resultados). Completar categoría principal «Agencia de marketing», servicios, horario, fotos, enlace a la web, y publicar novedades.
3. **Reseñas en Google:** pedirlas a los clientes con regularidad y responderlas todas.
4. **Texto visible del inicio:** hoy el título grande es «Ventas Inteligentes» y no dice qué es DOFI ni dónde. Agregar una línea visible con «agencia de marketing digital en Cuenca» ayudaría. Se edita en Sanity (Página de inicio → Hero) y es decisión del propietario.
5. **Contenido nuevo (para más adelante):** páginas de preguntas frecuentes por servicio y casos de clientes con resultados reales.
