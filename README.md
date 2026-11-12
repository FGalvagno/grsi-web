# Sitio web del GRSI

Sitio del **Grupo de Robótica y Sistemas Integrados** (GRSI), Departamento de Electrónica, FCEFyN, Universidad Nacional de Córdoba.

Estado actual: **sitio modelo v3**, con contenidos de ejemplo (Persona 1, Línea 1, Proyecto 1…) que hay que reemplazar por los reales.

## Estructura

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Todo el sitio en un solo archivo: HTML, estilos y script. No necesita compilación. |
| `_headers` | Encabezados de seguridad que aplica Cloudflare Pages. |
| `.nojekyll` | Solo para GitHub Pages: publica los archivos tal cual. Cloudflare lo ignora. |
| `.gitignore` | Archivos que no se suben al repositorio. |

Secciones del menú: El grupo, Equipo, Investigación, Estudiantes, Empresas y Contacto. Todo el contenido está escrito en el HTML (se lee sin JavaScript); el script solo muestra una vista por vez según el `#ancla` y maneja el buscador y los filtros.

## Verlo en la computadora

Abrir `index.html` con doble clic, o servir la carpeta:

```
python -m http.server 8000
```

y entrar a <http://localhost:8000>.

## Publicarlo con Cloudflare Pages

El sitio es estático y no tiene paso de compilación.

1. Subir los cambios a la rama `main`.
2. En el panel de Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** y elegir el repositorio `FGalvagno/grsi-web`.
3. Configuración de compilación:
   - Framework preset: `None`
   - Build command: dejar vacío
   - Build output directory: `/`
   - Production branch: `main`
4. **Save and Deploy**.

El sitio queda en `https://<nombre-del-proyecto>.pages.dev` y se vuelve a publicar solo con cada `git push`. El dominio propio se agrega después en **Custom domains**.

Alternativa sin conectar Git, desde la terminal:

```
npx wrangler pages deploy . --project-name grsi-web
```

### GitHub Pages (opcional)

También funciona: **Settings → Pages → Deploy from a branch**, rama `main`, carpeta `/ (root)`.

## Pendiente antes de publicarlo como sitio oficial

- Reemplazar los contenidos de ejemplo por los reales.
- Cambiar `https://grsi.example/` por la dirección definitiva en los datos estructurados.
- Quitar la banda superior "Sitio modelo v3" y la vista "Qué cambió en esta versión".
- Conectar el formulario de contacto a un servicio de envío (hoy es solo una maqueta).
