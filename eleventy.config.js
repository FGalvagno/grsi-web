/* Configuración de Eleventy: plantillas en /src, contenido en /contenido, sitio generado en /_site */
module.exports = function (eleventyConfig) {
  // Archivos que se copian tal cual al sitio publicado
  eleventyConfig.addPassthroughCopy({ "src/estilos.css": "estilos.css", "src/sitio.js": "sitio.js", "public": "/" });

  // Al editar el contenido con `npm run dev`, el sitio se vuelve a generar
  eleventyConfig.addWatchTarget("./contenido/");

  // JSON legible para mostrar en la página (Nunjucks lo escapa solo)
  eleventyConfig.addFilter("jsonLindo", (v) => JSON.stringify(v, null, 2));
  // JSON para poner dentro de una etiqueta <script>
  eleventyConfig.addFilter("jsonScript", (v) => JSON.stringify(v).replace(/</g, "\\u003c"));
  // Recorta un texto largo y agrega puntos suspensivos
  eleventyConfig.addFilter("recortar", (s, n) => {
    s = String(s || "");
    return s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, "") + "…";
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
  };
};
