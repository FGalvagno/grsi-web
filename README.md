# Sitio web del GRSI

Sitio del **Grupo de Robótica y Sistemas Integrados** (GRSI), Departamento de Electrónica, FCEFyN, Universidad Nacional de Córdoba.

Estado actual: **sitio modelo v3**, con contenidos de ejemplo (Persona 1, Línea 1, Proyecto 1…) que hay que reemplazar por los reales.

El sitio se genera con [Eleventy](https://www.11ty.dev/): el **contenido** está en archivos de texto en `contenido/` y las **plantillas** en `src/`. Está preparado para sumarle un CMS basado en Git como Decap, que solo tiene que editar los archivos de `contenido/`.

## Estructura

| Carpeta o archivo | Para qué sirve |
| --- | --- |
| `contenido/` | Todo lo que se edita: un archivo por persona, línea, proyecto, noticia, etc. |
| `contenido/sitio.yml` | Datos generales: nombre, correo, teléfono, dirección, textos para buscadores. |
| `contenido/paginas/` | Textos fijos de cada sección (títulos, misión, pasos, preguntas frecuentes). |
| `src/index.njk` | Plantilla principal. Incluye las vistas de `src/_includes/vistas/`. |
| `src/_includes/` | Vistas, cabecera, pie y piezas repetidas (`macros.njk`). |
| `src/_data/grsi.js` | Lee `contenido/` y arma relaciones, números, buscador y datos estructurados. |
| `src/estilos.css`, `src/sitio.js` | Estilos y comportamiento (menú, buscador, filtros). |
| `public/` | Archivos que se publican tal cual: `_headers` de Cloudflare e imágenes en `public/img/`. |
| `_site/` | Sitio generado. No se sube al repositorio. |

## Trabajar en la computadora

Hace falta [Node.js](https://nodejs.org/) 18 o superior.

```
npm install      # una sola vez
npm run dev      # sitio en http://localhost:8080, se actualiza al guardar
npm run build    # genera el sitio en _site/
```

## Publicar en Cloudflare Pages

En **Workers & Pages → Create → Pages → Connect to Git**, elegir `FGalvagno/grsi-web` y configurar:

| Campo | Valor |
| --- | --- |
| Framework preset | `None` (o `Eleventy`) |
| Build command | `npm run build` |
| Build output directory | `_site` |
| Production branch | `main` |

Cada `git push` vuelve a generar y publicar el sitio. Las convocatorias vencidas y la tabla "en números" se calculan al generar, así que conviene regenerar cada tanto aunque no haya cambios.

## Contenido

Cada carpeta de `contenido/` es una colección. Cada archivo `.md` es un elemento: los datos van arriba, entre `---`, y el texto largo (si lo hay) abajo, en Markdown. **El nombre del archivo es el identificador** con el que otros elementos lo referencian y forma parte del enlace (`equipo/p1.md` → `#persona-p1`).

| Carpeta | Campos | Texto |
| --- | --- | --- |
| `equipo/` | `nombre`, `titulo`, `rol`, `categoria`, `lineas` (lista de líneas), `correo`, `orcid` | Reseña |
| `lineas/` | `nombre`, `sigla`, `resumen`, `responsable` (persona), `palabras_clave` (lista), `revisado` (fecha) | Texto ampliado |
| `proyectos/` | `nombre`, `resumen`, `estado`, `tipo`, `inicio`, `fin` (años), `financiador`, `codigo`, `director` (persona), `integrantes` (personas), `lineas`, `socios` (lista) | Descripción ampliada |
| `publicaciones/` | `titulo`, `autores` (lista de nombres), `anio`, `tipo`, `medio`, `doi`, `lineas`, `proyecto` | — |
| `formados/` | `nombre`, `trabajo`, `nivel`, `anio`, `direccion` (persona), `hoy` | — |
| `temas/` | `titulo`, `descripcion`, `tipo`, `dirige` (persona), `linea`, `alta` (fecha), `estado` | — |
| `convocatorias/` | `titulo`, `tipo`, `descripcion`, `cierre` (fecha), `consultas` (persona) | — |
| `materias/` | `nombre`, `carrera`, `tipo`, `periodo`, `responsable` (persona) | — |
| `servicios/` | `nombre`, `descripcion`, `linea` | — |
| `capacitaciones/` | `nombre`, `descripcion`, `duracion`, `modalidad` | — |
| `equipamiento/` | `nombre`, `descripcion`, `proveedor`, `linea` | — |
| `casos/` | `nombre`, `socio`, `anio`, `descripcion`, `servicio` | — |
| `noticias/` | `titulo`, `fecha`, `tipo`, `resumen` | — |
| `hitos/` | `titulo`, `anio`, `descripcion` | — |
| `convenios/` | `nombre`, `socio`, `anio`, `tipo`, `pais` | — |

Valores con opciones fijas:

- `equipo.categoria`: `Dirección`, `Investigadores`, `Becarios y tesistas de posgrado`, `Estudiantes y ayudantes`.
- `proyectos.estado`: `En curso`, `Finalizado`.
- `publicaciones.tipo`: `Artículo en revista`, `Trabajo en congreso`, `Capítulo de libro`, `Informe técnico`, `Libro`, `Tesis`.
- `temas.tipo`: `Proyecto Integrador`, `Práctica Supervisada`, `Maestría`, `Doctorado`.
- `temas.estado`: `Disponible`, `En curso`.

Reglas que aplica el sitio solo:

- Los campos que apuntan a otro elemento llevan el nombre de su archivo sin `.md` (por ejemplo `responsable: "p1"`).
- En `publicaciones`, los autores se escriben por nombre; los que coinciden con un integrante quedan enlazados a su ficha.
- Orden: noticias por fecha (más nueva primero), publicaciones y formados por año, convocatorias por cierre. El resto, por nombre de archivo; para forzar un orden se puede agregar un campo numérico `orden`.
- Las convocatorias con fecha de cierre pasada no se publican.
- Las fechas van como `AAAA-MM-DD`.
- Hitos y convenios se mezclan por año en la línea de tiempo de "El grupo".

## Para agregar Decap CMS

El proyecto ya tiene lo que Decap necesita: contenido en archivos con datos al inicio, una carpeta por colección y un paso de compilación. Falta:

1. `src/admin/index.html` y `src/admin/config.yml`, y copiarlos al sitio agregando `"src/admin": "admin"` en `addPassthroughCopy` de `eleventy.config.js`.
2. En `config.yml`, una colección de tipo carpeta por cada fila de la tabla de arriba (`folder: contenido/equipo`, `extension: md`, `format: frontmatter`, `slug: "{{slug}}"`), y colecciones de tipo archivo para `contenido/sitio.yml` y `contenido/paginas/*.yml`.
3. Para los campos que apuntan a otro elemento, el widget `relation` con `value_field: "{{slug}}"`.
4. Para imágenes: `media_folder: public/img` y `public_folder: /img`.
5. El inicio de sesión con GitHub: una OAuth App y dos funciones en `functions/api/` (Cloudflare Pages las publica solas), más las variables `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` en Cloudflare.

## Pendiente antes de publicarlo como sitio oficial

- Reemplazar los contenidos de ejemplo por los reales.
- Cambiar `url` en `contenido/sitio.yml` por la dirección definitiva.
- Quitar la banda "Sitio modelo v3" (`src/_includes/cabecera.njk`), la vista `src/_includes/vistas/modelo.njk` y las notas de diseño (`<p class="nota">`).
- Conectar el formulario de contacto a un servicio de envío (hoy es solo una maqueta).
- Fotos de personas y proyectos: hoy se muestran iniciales y un recuadro.
