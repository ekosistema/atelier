# DESIGN.md · Sistema de diseño del sitio (Atelier)

Directrices de diseño, UX, accesibilidad, SEO/GEO y rendimiento de **Atelier** (atelier.celerolab.com, el sitio educativo generado desde `sources/`). Es la referencia para cualquier cambio en `site/`: si una decisión no está aquí, se discute y se añade aquí.

> Los tokens viven en [`src/styles/tokens.css`](src/styles/tokens.css); la integración con Starlight y los patrones compartidos, en [`src/styles/custom.css`](src/styles/custom.css); la estructura de navegación, en [`src/data/catalog.mjs`](src/data/catalog.mjs).

---

## 1. Principios

1. **Aprender antes que navegar.** Cada pantalla responde a "¿qué hago ahora?". Siempre hay un siguiente paso evidente (la ruta, el tema o el buscador).
2. **El contenido manda.** El diseño enmarca los manuales, no compite con ellos: líneas de ~68 caracteres, código legible, ruido visual mínimo.
3. **La fuente de verdad es `sources/`.** El sitio nunca contiene contenido propio duplicado; solo lo presenta (`scripts/sync-content.mjs`). Lo editorial (categorías, rutas) está en `catalog.mjs`.
4. **Accesible por defecto.** WCAG 2.2 AA es el mínimo, no un extra. Nada se comunica solo con color, movimiento o hover.
5. **Rápido de verdad.** HTML estático, JavaScript solo donde aporta (progreso, filtro, buscador), cero dependencias de terceros en tiempo de ejecución.
6. **Citable.** Las páginas se entienden sin ejecutar JS: encabezados claros, datos estructurados y fechas visibles, para buscadores y asistentes de IA.

## 2. Arquitectura de información y navegación

El sitio tiene tres formas de entrar, y todas son visibles desde cualquier página:

| Modo | Para quién | Dónde |
|---|---|---|
| **Rutas** | "No sé por dónde empezar" | Cabecera (`Rutas`), menú lateral, portada |
| **Temas / índice** | "Sé qué herramienta busco" | Cabecera (`Manuales`), menú lateral, portada |
| **Búsqueda** | "Necesito un comando ya" | Cabecera (Ctrl K), botón grande en la portada |

### Menú lateral

Orden fijo, de lo general a lo particular:

1. **Índice de manuales** (enlace directo).
2. **Rutas de aprendizaje** (grupo abierto): "Todas las rutas" + 6 rutas con etiqueta corta (`short`).
3. **Manuales por tema** (grupo): 13 categorías **plegadas**, ordenadas de lo básico a lo especializado (Terminal → Git → Regex/datos → Python → Web → Contenedores → DevOps → Seguridad → IA → Agentes → Automatización → Multimedia → Legacy). La categoría del manual actual se despliega sola.

Reglas:
- Etiquetas **sin emoji** (ruido para lectores de pantalla y dispares entre sistemas). Los emojis se reservan para tarjetas.
- Etiquetas cortas (máx. ~28 caracteres). Para rutas se usa `short`.
- Dentro de una categoría, el orden es el de aprendizaje (lo básico primero), no el alfabético.
- **"Estado del software" no está en el menú**: es una página de consulta, no de aprendizaje. Se enlaza desde el pie de página.
- Un manual nuevo debe estar en **una** categoría (`catalog.mjs`); el sincronizador avisa si falta.

### Anterior / siguiente

El anterior/siguiente secuencial de Starlight **está desactivado**: recorría el menú y saltaba entre temas sin relación. En su lugar (`Pagination.astro`), cada manual muestra:

1. **Avance dentro de su ruta**: "Anterior/Siguiente en la ruta · paso N de M". La ruta activa es la de `?ruta=` (los enlaces de las rutas y de este mismo bloque la propagan), o la última visitada en la sesión, o la primera que contenga el manual.
2. **Marcar como completado** (progreso local, compartido con las rutas).
3. **Más del mismo tema** (hasta 4 manuales de su categoría).

Un manual sin ruta (p. ej. Legacy) solo muestra el bloque de tema. En el último paso de una ruta, el siguiente es "Elegir otra ruta".

### Migas de pan y pie

- Migas: `Inicio › Manuales › Tema` / `Inicio › Rutas de aprendizaje` (también como `BreadcrumbList`).
- Pie: rutas, índice, **Estado del software**, repositorio, informar de un error, licencia MIT y el crédito a CeleroLab (§9).

## 3. Tokens

Tres niveles: **primitivos** (valores crudos, no se usan en componentes) → **semánticos** (cambian con el tema) → **de sistema** (no cambian). Los componentes consumen solo semánticos y de sistema.

### Color (semánticos)

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--ds-bg` | `#0b0d14` | `#ffffff` | Fondo de página |
| `--ds-surface` | `#10131d` | `#ffffff` | Tarjetas, cabecera |
| `--ds-surface-raised` | `#171a27` | `#f0f1f8` | Chips, tablas, código en línea |
| `--ds-border` | `#232739` | `#dfe1ee` | Bordes y separadores |
| `--ds-text` | `#f4f5fb` | `#0f1222` | Texto principal |
| `--ds-text-muted` | `#b8bcd2` | `#3b405a` | Texto secundario |
| `--ds-text-subtle` | `#8a8fab` | `#5d627e` | Metadatos (≥ 5,5:1 sobre superficie) |
| `--ds-accent` / `-text` / `-wash` | `#7c6cff` / `#c7c0ff` / `#1c1a4b` | `#5b45f0` / `#3a28b8` / `#e6e3ff` | Acción, enlaces, fondos tenues |
| `--ds-focus` | `#a79cff` | `#5b45f0` | Anillo de foco |
| `--ds-level-*` | verde / ámbar / rosa claros | verde / ámbar / rosa oscuros | Niveles (siempre con texto) |

Color por ruta (`accent` en `catalog.mjs`): se usa para bordes, nodos y barras; **el texto coloreado con el acento se mezcla con `--ds-text`** (`color-mix`) para mantener 4,5:1 en ambos temas.

### Tipografía

- Texto: **Inter Variable**. Código: **JetBrains Mono Variable**. Autoalojadas (`@fontsource-variable`), `font-display: swap`; la fuente latina de Inter se **precarga**.
- Escala (Starlight): `--sl-text-xs … h1`. Títulos de sección 1,65 rem; h3 1,3 rem. Titular de portada `clamp(2.2rem, 5vw, 3.6rem)`, peso 800, interlineado 1,07, tracking −0,03 em.
- Medida de lectura: `--ds-measure: 68ch` en párrafos y listas del contenido.

### Espaciado, forma y movimiento

- Espaciado en base 4 px: `--ds-space-1…8` = 4, 8, 12, 16, 24, 32, 48, 72 px. Nada de valores sueltos.
- Radios: `sm .4rem`, `md .7rem`, `lg 1rem`, `pill 999px`. Tarjetas grandes `lg`; controles `md`.
- Movimiento: `--ds-ease: cubic-bezier(.2,.7,.2,1)`; `fast .15s` (hover), `base .25s`. Elevación solo en hover (`translateY(-2…-3px)` + sombra).
- Objetivos táctiles: `--ds-target-min: 1.75rem` (28 px, por encima del mínimo WCAG 2.2 de 24 px) y `--ds-target-touch: 2.75rem` (44 px) con `@media (pointer: coarse)`.

## 4. Componentes

Todos los componentes propios llevan `not-content` en su raíz (así Starlight no les aplica los márgenes del contenido Markdown, causa de los desalineados anteriores) y consumen solo tokens.

| Componente | Función | Notas de UX / a11y |
|---|---|---|
| `HomeHero` | Portada: propuesta, buscador, CTAs, cifras, crédito | El buscador abre el de Starlight (Ctrl K). Cifras en `<ul>` con rejilla alineada. Terminal decorativo `aria-hidden`, animación desactivable. |
| `RouteCards` | Tarjetas de rutas | Lista de enlaces; el acento nunca es el único portador de información. |
| `CategoryGrid` | Rejilla de temas | Enlaza a `/manuales/#tema`. |
| `FAQ` | Preguntas frecuentes | `details/summary` nativo (teclado y lector de pantalla gratis). Mismo texto que el `FAQPage`. |
| `ManualIndex` | Índice con filtro | `role="search"`, estado `role="status"`, botones `aria-pressed`, filtros reflejados en la URL (`?q=&nivel=`), saltos por tema. |
| `RouteTimeline` | Ruta con progreso | `ol`, casillas con nombre accesible, `progressbar` con `aria-valuetext`, completado = ✓ + tachado (no solo color). |
| `Pagination` | Continuar aprendiendo | Ver §2. |
| `PageTitle` | h1 + migas | Oculto en portada (lleva su h1). |
| `Footer`, `SocialIcons` | Pie y navegación de cabecera | |
| `CeleroLogo` | Logotipo oficial | Ver §9. |
| `Head` | JSON-LD, precarga de fuente, scroll accesible en código | Ver §6 y §7. |

### Estados

Todo componente interactivo define: reposo, hover, **foco visible** (`outline: 3px solid var(--ds-focus)`, offset 2 px), activo, deshabilitado/oculto (`[hidden]`), y, si aplica, completado/seleccionado (`aria-pressed`, `is-done`). El foco nunca se elimina sin sustituto.

### Niveles

`básico` · `intermedio` · `avanzado` (los compuestos, como "básico-intermedio", se colorean por el primero). El chip siempre lleva el texto del nivel.

## 5. Accesibilidad (WCAG 2.2 AA)

Checklist obligatoria para cada cambio:

- [ ] Un único `h1` por página; jerarquía sin saltos.
- [ ] Todo operable con teclado, con orden de tabulación = orden visual; sin trampas.
- [ ] Contraste ≥ 4,5:1 (texto) y ≥ 3:1 (componentes) **en ambos temas**.
- [ ] Nada depende solo del color (niveles con texto, completado con ✓).
- [ ] Objetivos ≥ 24 px (≥ 44 px en táctil).
- [ ] `prefers-reduced-motion` respetado (animaciones y transiciones se anulan globalmente).
- [ ] `forced-colors` (alto contraste de Windows): el texto con degradado vuelve a color de sistema; los chips ganan borde.
- [ ] Cambios dinámicos anunciados con `role="status"` / `aria-live="polite"`.
- [ ] Bloques de código con scroll horizontal enfocables (`tabindex="0"`, `role="region"`, `aria-label`).
- [ ] Imágenes con `alt` (decorativas: `alt=""`/`aria-hidden`); `lang="es"` en `<html>`.

Verificación: axe-core (reglas `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`, `best-practice`) sin infracciones en portada, índice, ruta y manual. Recomendado en CI con `pa11y-ci` o Playwright + axe.

## 6. SEO

- **Metadatos**: `title` + `description` únicos por página (la descripción sale del primer párrafo del manual, ≤ 170 caracteres), `canonical`, Open Graph y Twitter Card con `og:image` 1200×630 (`public/og.png`, regenerable con `npm run og`). `lang="es"`.
- **Datos estructurados** (JSON-LD generado en el build, `Head.astro`): `Organization` (CeleroLab) y `WebSite` en todas; `TechArticle` + `BreadcrumbList` en cada manual (nivel, tiempo, requisitos, `dateModified` = mes de revisión); `Course` + `ItemList` en cada ruta; `FAQPage` en la portada; `CollectionPage` en índices.
- **Rastreo**: `sitemap-index.xml` (Starlight), `robots.txt` generado con la URL real, enlaces internos abundantes (migas, relacionados, rutas, pie).
- **URLs**: estables y legibles (`/manuales/<slug>/`, `/rutas/<id>/`). Los parámetros (`?ruta=`, `?q=`) no cambian el `canonical`.
- **Pendiente de producción**: fijar `SITE_URL` en el workflow (ya es `https://atelier.celerolab.com`), verificar el sitio en Search Console y enviar el sitemap.

## 7. GEO (optimización para motores generativos)

- **Entidad clara**: cada página declara quién es el publicador (CeleroLab) y la licencia (MIT). La portada y `llms.txt` abren con una definición de una frase.
- **Contenido extraíble**: HTML estático (nada depende de JS), encabezados descriptivos, listas y tablas, bloques de código etiquetados por lenguaje.
- **Preguntas y respuestas**: FAQ visible + `FAQPage`, con respuestas autocontenidas y verificables.
- **Frescura visible**: "Revisado: mes año" en cada manual y en el JSON-LD. No se cambia sin revisión real del contenido.
- **`/llms.txt`** (índice en Markdown, formato llmstxt.org) y **`/llms-full.txt`** (texto íntegro). Se anuncian con `<link rel="alternate">`; no se enlazan en el pie.
- **`robots.txt`**: permite explícitamente a los rastreadores de búsqueda y asistentes de IA (política editable en `src/pages/robots.txt.ts`; el contenido es MIT).
- **Citabilidad**: la atribución recomendada es "Atelier, de CeleroLab" con enlace a la URL de la página.

## 8. Rendimiento

Presupuestos (a medir con Lighthouse/CrUX tras el despliegue):

| Métrica | Objetivo |
|---|---|
| LCP | < 2,5 s |
| INP | < 200 ms |
| CLS | < 0,1 |
| JS propio por página | < 15 KB (comprimido) |

Cómo se cumple:
- HTML estático (SSG): sin renderizado en cliente; el JS propio se limita al progreso, el filtro del índice y el botón del buscador.
- Fuentes autoalojadas con subconjuntos por `unicode-range`; Inter latina precargada; sin CDN ni terceros.
- Búsqueda Pagefind: índice estático, cargado solo al abrir el buscador.
- Navegación: `prefetch` al pasar el ratón; `content-visibility: auto` en secciones largas de portada e índice.
- Imágenes: el logotipo es SVG con `width`/`height` explícitos (sin saltos de maquetación); no hay imágenes de contenido pesadas.
- Evitar: tipografías extra, librerías de animación, vídeos de fondo, scripts de analítica sin necesidad.

## 9. Marca y créditos

### Identidad de Atelier

- **Nombre**: *Atelier* (taller): el sitio es un taller donde se aprende haciendo. Dominio: `atelier.celerolab.com`. El nombre, el subtítulo SEO ("Manuales y rutas para desarrolladores") y el dominio se definen **solo** en [`src/data/site.mjs`](src/data/site.mjs). En texto corrido se escribe "Atelier" (capitalizado); el logotipo va en mayúsculas.
- **Carácter**: serio, sólido y técnico. Transmite construcción y desarrollo: oficio y rigor, sin florituras.
- **Icono**: un **engranaje** de 8 dientes (construir, desarrollar, hacer que las cosas funcionen) con una **A** en su interior formada por dos trazos en forma de **caret `^`** de terminal y un **cursor** suelto como travesaño. Relleno con degradado índigo → cian (el de la interfaz).
- **Logotipo**: «ATELIER» en **Barlow Bold**, mayúsculas con tracking amplio (+0,15 em), de aire industrial, a la altura visual del icono. Las letras están **convertidas a trazados SVG**, así que no depende de ninguna fuente instalada.
- **Ficheros**: `src/assets/atelier-logo-on-dark.svg` y `atelier-logo-on-light.svg` (icono + logotipo; los usa la cabecera según el tema) y `public/favicon.svg` (solo el engranaje, 72×72). **No se editan a mano**: se generan con `npm run logo` (`scripts/make-logo.mjs`, donde están los parámetros de diseño); después `npm run og` actualiza la imagen social.
- **Uso**: respetar un margen libre de media altura del icono alrededor; altura mínima del conjunto 24 px (icono solo: 16 px). No girar, deformar, cambiar el degradado ni poner el logotipo claro sobre fondo claro (usar la variante del tema).

### Créditos

- **Autoría**: la colección la crea y mantiene **CeleroLab** (<https://celerolab.com>). Aparece con su **logotipo oficial** en la portada ("Una colección de …") y en el pie, y como `publisher` en los datos estructurados.
- **Logotipo**: se usa tal cual, sin deformar. Dos ficheros en `public/brand/`: `celerolab-logo-on-dark.svg` (el oficial, para fondos oscuros) y `celerolab-logo-on-light.svg` (el mismo con el texto en tinta oscura `#0f1222` para fondos claros). `CeleroLogo.astro` elige según el tema. Altura mínima 18 px.
- **Mención en texto**: CeleroLab se muestra **solo con el nombre** (nunca nombre y dominio a la vez), siempre como enlace a celerolab.com **con UTM** (`celeroUrl()` en `src/data/lib.ts`: `utm_source=atelier&utm_medium=referral&utm_campaign=campana_general&utm_content=<emplazamiento>`).
- **Licencia**: MIT, indicada en el pie y en el JSON-LD.

## 10. Contenido y tono

- Español de España neutro, tuteo, frases cortas. Se explica el porqué antes del comando.
- Cada manual abre con su nivel, requisitos y fecha de revisión (chips) y señala el estado vigente de la herramienta y su alternativa moderna.
- Los textos de enlace describen el destino ("Siguiente en la ruta: Nginx"), nunca "pulsa aquí" ni nombres de fichero (el sincronizador sustituye `manual_x.md` por el título).
- No se inventan cifras ni "los más populares": solo datos que se puedan comprobar.

## 11. Cómo cambiar el sistema

| Quiero… | Edito… |
|---|---|
| Añadir un manual | `sources/manual_<tema>.md` + categoría (y ruta si procede) en `src/data/catalog.mjs`. El README sigue las reglas de `CLAUDE.md`. |
| Cambiar una ruta o el orden del menú | `src/data/catalog.mjs` |
| Cambiar colores, espaciado, radios | `src/styles/tokens.css` (nunca valores sueltos en componentes) |
| Cambiar la imagen para compartir | `npm run og` (regenera `public/og.png`) |
| Cambiar la política de rastreo de IA | `src/pages/robots.txt.ts` |
| Añadir una pregunta frecuente | `src/data/faq.ts` (alimenta HTML y `FAQPage`) |

Antes de dar un cambio por bueno: `npm run build` sin avisos nuevos, axe sin infracciones (§5) y revisión visual en oscuro, claro y móvil (375 px).
