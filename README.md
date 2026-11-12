# Sitio web del GRSI

Sitio del **Grupo de Robótica y Sistemas Integrados** (GRSI), Departamento de Electrónica, FCEFyN, Universidad Nacional de Córdoba.

Estado actual: **sitio modelo v3**, con contenidos de ejemplo (Persona 1, Línea 1, Proyecto 1…) que hay que reemplazar por los reales.

El sitio se genera con [Eleventy](https://www.11ty.dev/): el **contenido** está en archivos de texto en `contenido/` y las **plantillas** en `src/`. El contenido también se puede editar desde el navegador con Decap CMS, en `/admin/`.

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
| `src/admin/` | Administrador de contenido (Decap CMS). |
| `functions/api/` | Inicio de sesión del administrador con GitHub. |
| `worker/index.js`, `wrangler.jsonc` | Worker de Cloudflare que publica el sitio y expone el inicio de sesión. |
| `public/` | Archivos que se publican tal cual: `_headers` de Cloudflare e imágenes en `public/img/`. |
| `_site/` | Sitio generado. No se sube al repositorio. |

## Trabajar en la computadora

Hace falta [Node.js](https://nodejs.org/) 18 o superior.

```
npm install      # una sola vez
npm run dev      # sitio en http://localhost:8080, se actualiza al guardar
npm run build    # genera el sitio en _site/
```

## Publicar en Cloudflare

El sitio se publica como un **Worker con archivos estáticos**: `wrangler.jsonc` indica que los archivos salen de `_site/` y que `worker/index.js` atiende el inicio de sesión del administrador.

En el proyecto de Cloudflare (Workers & Pages → `grsi-web` → Settings → Build):

| Campo | Valor |
| --- | --- |
| Build command | vacío (el sitio se genera solo al desplegar) |
| Deploy command | `npx wrangler deploy` |
| Production branch | `main` |

Cada `git push` vuelve a generar y publicar el sitio. Las convocatorias vencidas y la tabla "en números" se calculan al generar, así que conviene regenerar cada tanto aunque no haya cambios.

El campo `name` de `wrangler.jsonc` tiene que coincidir con el nombre del Worker en Cloudflare.

## Contenido

Cada carpeta de `contenido/` es una colección. Cada archivo `.md` es un elemento: los datos van arriba, entre `---`, y el texto largo (si lo hay) abajo, en Markdown. **El nombre del archivo es el identificador** con el que otros elementos lo referencian y forma parte del enlace (`equipo/p1.md` → `#persona-p1`).

| Carpeta | Campos | Texto |
| --- | --- | --- |
| `equipo/` | `nombre`, `titulo`, `rol`, `categoria`, `lineas` (lista de líneas), `correo`, `orcid`, `foto` | Reseña |
| `lineas/` | `nombre`, `sigla`, `resumen`, `responsable` (persona), `palabras_clave` (lista), `revisado` (fecha) | Texto ampliado |
| `proyectos/` | `nombre`, `resumen`, `estado`, `tipo`, `inicio`, `fin` (años), `financiador`, `codigo`, `director` (persona), `integrantes` (personas), `lineas`, `socios` (lista), `imagen`, `imagen_alt` | Descripción ampliada |
| `publicaciones/` | `titulo`, `autores` (lista de nombres), `anio`, `tipo`, `medio`, `doi`, `lineas`, `proyecto` | — |
| `formados/` | `nombre`, `trabajo`, `nivel`, `anio`, `direccion` (persona), `hoy` | — |
| `temas/` | `titulo`, `descripcion`, `tipo`, `dirige` (persona), `linea`, `alta` (fecha), `estado` | — |
| `convocatorias/` | `titulo`, `tipo`, `descripcion`, `cierre` (fecha), `consultas` (persona) | — |
| `materias/` | `nombre`, `carrera`, `tipo`, `periodo`, `responsable` (persona) | — |
| `servicios/` | `nombre`, `descripcion`, `linea` | — |
| `capacitaciones/` | `nombre`, `descripcion`, `duracion`, `modalidad` | — |
| `equipamiento/` | `nombre`, `descripcion`, `proveedor`, `linea` | — |
| `casos/` | `nombre`, `socio`, `anio`, `descripcion`, `servicio` | — |
| `noticias/` | `titulo`, `fecha`, `tipo`, `resumen`, `imagen`, `imagen_alt` | — |
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
- Imágenes: se suben desde el administrador y quedan en `public/img/`. Sin foto, las personas muestran sus iniciales y los proyectos un recuadro. En los textos largos (reseña, texto de la línea, descripción del proyecto) también se pueden insertar imágenes desde el editor.
- Hitos y convenios se mezclan por año en la línea de tiempo de "El grupo".

## Editar con Decap CMS

El administrador está en `/admin/`. Cada cambio que se guarda ahí es un commit en `main`, y Cloudflare vuelve a publicar el sitio solo.

| Archivo | Para qué sirve |
| --- | --- |
| `src/admin/index.html` | Página que carga Decap. |
| `src/admin/config.yml` | Qué se puede editar: una colección por cada carpeta de `contenido/`. |
| `functions/api/auth.js`, `functions/api/callback.js` | Inicio de sesión con GitHub. El Worker las expone en `/api/auth` y `/api/callback`. |

### Configuración (una sola vez)

1. **Crear una OAuth App en GitHub**: Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: la dirección del sitio (`https://grsi-web.galvagnofacundo.workers.dev`).
   - Authorization callback URL: la misma dirección seguida de `/api/callback`.
   - Copiar el **Client ID** y generar un **Client secret**.
2. **Cargar las credenciales en Cloudflare**: Worker `grsi-web` → Settings → Variables and Secrets, las dos de tipo Secret:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
3. **Volver a desplegar** si Cloudflare no lo hace solo al guardar.
4. Entrar a `/admin/` e iniciar sesión con GitHub.

Puede editar quien tenga permiso de escritura en el repositorio (Settings → Collaborators). Si el sitio cambia de dominio, hay que actualizar las dos direcciones de la OAuth App.

### Probar el administrador en la computadora

Sin iniciar sesión y escribiendo directamente en los archivos locales:

```
npm run dev          # en una terminal
npx decap-server     # en otra
```

y abrir <http://localhost:8080/admin/>.

### Al agregar un campo o una colección

Hay que tocar tres lugares: el campo en `src/admin/config.yml`, su uso en la plantilla (`src/_includes/`) y, si es una colección nueva, su lectura en `src/_data/grsi.js`.

## Pendiente antes de publicarlo como sitio oficial

- Reemplazar los contenidos de ejemplo por los reales.
- Cambiar `url` en `contenido/sitio.yml` por la dirección definitiva.
- Quitar la banda "Sitio modelo v3" (`src/_includes/cabecera.njk`), la vista `src/_includes/vistas/modelo.njk` y las notas de diseño (`<p class="nota">`).
- Conectar el formulario de contacto a un servicio de envío (hoy es solo una maqueta).
