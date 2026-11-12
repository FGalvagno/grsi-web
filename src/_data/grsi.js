/*
 * Lee los archivos de la carpeta /contenido y arma todo lo que usan las plantillas:
 * las colecciones, sus relaciones (qué proyectos tiene cada persona, etc.),
 * los números del grupo, el índice del buscador y los datos estructurados (JSON-LD).
 *
 * El contenido se edita en /contenido (a mano o con un CMS como Decap).
 * Este archivo solo hace falta tocarlo si se agrega un tipo de contenido nuevo.
 */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const yaml = require("js-yaml");
const MarkdownIt = require("markdown-it");

const RAIZ = path.join(__dirname, "..", "..", "contenido");
const md = new MarkdownIt({ html: false, linkify: true });

/* ---------- utilidades ---------- */
const natural = (a, b) => a.localeCompare(b, "es", { numeric: true });
const iso = (v) => (!v ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
const dma = (v) => { const s = iso(v); return s ? s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4) : ""; };
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const lista = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const plural = (n, uno, muchos) => n + " " + (n === 1 ? uno : muchos);

function archivo(nombre) {
  const p = path.join(RAIZ, nombre);
  return fs.existsSync(p) ? yaml.load(fs.readFileSync(p, "utf8")) || {} : {};
}

/* Una carpeta de /contenido: un archivo .md por elemento. El nombre del archivo es su identificador. */
function carpeta(nombre) {
  const dir = path.join(RAIZ, nombre);
  if (!fs.existsSync(dir)) return [];
  const items = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort(natural).map((f) => {
    const m = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    const texto = m.content.trim();
    return { ...m.data, id: f.replace(/\.md$/, ""), texto, html: texto ? md.render(texto) : "" };
  });
  // Si algún elemento tiene "orden", va primero; el resto queda por nombre de archivo.
  return items.map((x, i) => [x, i]).sort((a, b) => (a[0].orden ?? 1e9) - (b[0].orden ?? 1e9) || a[1] - b[1]).map((x) => x[0]);
}

module.exports = function () {
  const hoy = iso(new Date(Date.now() - new Date().getTimezoneOffset() * 60000));
  const anioActual = +hoy.slice(0, 4);

  const sitio = archivo("sitio.yml");
  const paginas = {};
  for (const p of ["investigacion", "equipo", "estudiantes", "empresas", "grupo", "noticias", "contacto"]) paginas[p] = archivo("paginas/" + p + ".yml");

  const U = String(sitio.url || "/").replace(/\/?$/, "/");
  const ORG = { "@id": U + "#grsi" };

  const lineas = carpeta("lineas");
  const personas = carpeta("equipo");
  const proyectos = carpeta("proyectos");
  let publicaciones = carpeta("publicaciones");
  const formados = carpeta("formados").sort((a, b) => b.anio - a.anio);
  const temas = carpeta("temas");
  const materias = carpeta("materias");
  const servicios = carpeta("servicios");
  const capacitaciones = carpeta("capacitaciones");
  const equipamiento = carpeta("equipamiento");
  const casos = carpeta("casos");
  const noticias = carpeta("noticias").sort((a, b) => iso(b.fecha).localeCompare(iso(a.fecha)));
  const convocatoriasTodas = carpeta("convocatorias").sort((a, b) => iso(a.cierre).localeCompare(iso(b.cierre)));
  const hitos = carpeta("hitos");
  const convenios = carpeta("convenios");

  if (!process.env.GRSI_ORDEN_ARCHIVO) publicaciones = publicaciones.map((x, i) => [x, i]).sort((a, b) => b[0].anio - a[0].anio || a[1] - b[1]).map((x) => x[0]);

  const porId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
  const L = porId(lineas), P = porId(personas), PR = porId(proyectos), S = porId(servicios);
  const refs = (ids, mapa) => lista(ids).map((id) => mapa[id]).filter(Boolean);

  /* ---------- personas ---------- */
  const CATEGORIAS = ["Dirección", "Investigadores", "Becarios y tesistas de posgrado", "Estudiantes y ayudantes"];
  for (const p of personas) {
    p.slug = slug(p.nombre);
    p.nombreCompleto = (p.titulo ? p.titulo + " " : "") + p.nombre;
    const pal = p.nombre.trim().split(/\s+/);
    p.iniciales = (pal[0][0] + (pal.length > 1 ? pal[pal.length - 1][0] : "")).toUpperCase();
    p.lineas = refs(p.lineas, L);
    p.ruta = "/equipo/" + p.slug + "/";
  }
  const porNombre = {};
  for (const p of personas) { porNombre[norm(p.nombre)] = p; porNombre[norm(p.nombreCompleto)] = p; }

  /* ---------- líneas ---------- */
  for (const l of lineas) {
    l.slug = slug(l.nombre);
    l.ruta = "/investigacion/" + l.slug + "/";
    l.responsable = P[l.responsable];
    l.palabras_clave = lista(l.palabras_clave);
    l.revisado = iso(l.revisado);
    l.revisadoTxt = dma(l.revisado);
    l.personas = personas.filter((p) => p.lineas.includes(l)).sort((a, b) => a.lineas.indexOf(l) - b.lineas.indexOf(l));
  }

  /* ---------- proyectos ---------- */
  for (const pr of proyectos) {
    pr.slug = slug(pr.nombre);
    pr.director = P[pr.director];
    pr.integrantes = refs(pr.integrantes, P);
    pr.lineas = refs(pr.lineas, L);
    pr.socios = lista(pr.socios);
    pr.enCurso = norm(pr.estado || "") === "en curso";
    pr.periodo = pr.inicio + "–" + pr.fin;
  }

  /* ---------- publicaciones ---------- */
  const BIB = { "Artículo en revista": "article", "Trabajo en congreso": "inproceedings", "Capítulo de libro": "incollection", "Informe técnico": "techreport", "Libro": "book", "Tesis": "phdthesis" };
  const LD = { "Artículo en revista": "ScholarlyArticle", "Trabajo en congreso": "ScholarlyArticle", "Capítulo de libro": "Chapter", "Informe técnico": "Report", "Libro": "Book", "Tesis": "Thesis" };
  for (const b of publicaciones) {
    b.autores = lista(b.autores).map((n) => ({ nombre: String(n), persona: porNombre[norm(n)] || null }));
    b.lineas = refs(b.lineas, L);
    b.proyecto = PR[b.proyecto] || null;
    b.autoresTxt = b.autores.map((a) => a.nombre).join(", ");
    b.txt = norm([b.titulo, b.medio, b.doi, ...b.autores.map((a) => a.nombre)].filter(Boolean).join(" "));
    b.lineasIds = b.lineas.map((l) => l.id).join(" ");
    b.bibtex = "@" + (BIB[b.tipo] || "misc") + "{grsi_" + b.id.replace(/[^A-Za-z0-9]+/g, "_") + ",\n  title = {" + b.titulo + "},\n  author = {" + b.autores.map((a) => a.nombre).join(" and ") + "},\n  year = {" + b.anio + "}," + (b.medio ? "\n  note = {" + b.medio + "}," : "") + (b.doi ? "\n  doi = {" + b.doi + "}" : "") + "\n}";
  }

  /* ---------- el resto ---------- */
  for (const f of formados) f.direccion = P[f.direccion];
  for (const t of temas) { t.dirige = P[t.dirige]; t.linea = L[t.linea]; t.alta = iso(t.alta); t.altaTxt = dma(t.alta); t.disponible = norm(t.estado || "") === "disponible"; }
  for (const m of materias) m.responsable = P[m.responsable];
  for (const s of servicios) s.linea = L[s.linea];
  for (const e of equipamiento) e.linea = L[e.linea];
  for (const c of casos) c.servicio = S[c.servicio];
  for (const n of noticias) { n.fecha = iso(n.fecha); n.fechaTxt = dma(n.fecha); }
  for (const c of convocatoriasTodas) { c.cierre = iso(c.cierre); c.cierreTxt = dma(c.cierre); c.consultas = P[c.consultas]; }
  const convocatorias = convocatoriasTodas.filter((c) => c.cierre >= hoy);

  /* ---------- relaciones inversas ---------- */
  for (const p of personas) {
    p.proyectos = proyectos.filter((x) => x.integrantes.includes(p) || x.director === p);
    p.publicaciones = publicaciones.filter((x) => x.autores.some((a) => a.persona === p));
    p.temas = temas.filter((x) => x.dirige === p);
    p.formados = formados.filter((x) => x.direccion === p);
    p.materias = materias.filter((x) => x.responsable === p);
  }
  for (const l of lineas) {
    l.proyectos = proyectos.filter((x) => x.lineas.includes(l));
    l.publicaciones = publicaciones.filter((x) => x.lineas.includes(l));
    l.temas = temas.filter((x) => x.linea === l);
    l.servicios = servicios.filter((x) => x.linea === l);
    l.pie = [l.responsable && l.responsable.nombre, plural(l.proyectos.length, "proyecto", "proyectos"), plural(l.publicaciones.length, "publicación", "publicaciones")].filter(Boolean).join(" · ");
  }
  for (const pr of proyectos) pr.publicaciones = publicaciones.filter((x) => x.proyecto === pr);

  const equipo = CATEGORIAS.map((c) => ({ nombre: c, personas: personas.filter((p) => p.categoria === c) })).filter((g) => g.personas.length);
  const otras = personas.filter((p) => !CATEGORIAS.includes(p.categoria));
  if (otras.length) equipo.push({ nombre: "Otros integrantes", personas: otras });
  const direccion = personas.filter((p) => p.categoria === "Dirección");
  const dirigenPosgrado = personas.filter((p) => p.categoria === "Dirección" || p.categoria === "Investigadores");

  /* ---------- historia: hitos y convenios en una sola línea de tiempo ---------- */
  const historia = [
    ...hitos.map((h) => ({ anio: h.anio, titulo: h.titulo, texto: h.descripcion, k: 0 })),
    ...convenios.map((c) => ({ anio: c.anio, titulo: c.nombre + " con " + c.socio, texto: ["Convenio", c.tipo, c.pais].filter(Boolean).join(" · "), k: 1 })),
  ].map((x, i) => [x, i]).sort((a, b) => a[0].anio - b[0].anio || a[0].k - b[0].k || a[1] - b[1]).map((x) => x[0]);

  /* ---------- números ---------- */
  const numeros = {
    lineas: lineas.length,
    proyectosEnCurso: proyectos.filter((p) => p.enCurso).length,
    proyectosFinalizados: proyectos.filter((p) => !p.enCurso).length,
    integrantes: personas.length,
    publicaciones: publicaciones.length,
    formados: formados.length,
    anios: anioActual - (sitio.desde || anioActual),
    temasDisponibles: temas.filter((t) => t.disponible).length,
    porAnio: [0, 1, 2, 3, 4].map((d) => anioActual - d).map((a) => ({
      anio: a,
      publicaciones: publicaciones.filter((x) => +x.anio === a).length,
      tesis: formados.filter((x) => +x.anio === a).length,
      proyectos: proyectos.filter((x) => +x.inicio <= a && a <= +x.fin).length,
    })),
  };
  const filtros = {
    anios: [...new Set(publicaciones.map((b) => +b.anio))].sort((a, b) => b - a),
    tipos: [...new Set(publicaciones.map((b) => b.tipo))],
    temaTipos: [...new Set(temas.map((t) => t.tipo))],
  };

  /* ---------- contacto ---------- */
  const contacto = paginas.contacto;
  contacto.destinatarios = lista(contacto.destinatarios).map((d) => {
    const persona = P[d.persona] || null;
    return { ...d, persona, correo: d.correo || (persona && persona.correo) || sitio.correo };
  });

  /* ---------- datos estructurados (schema.org) ---------- */
  const direccionPostal = { "@type": "PostalAddress", streetAddress: sitio.calle, addressLocality: sitio.localidad, postalCode: sitio.codigo_postal, addressCountry: sitio.pais_codigo };
  const idPersona = (p) => ({ "@id": U + "equipo/" + p.slug + "/#persona" });
  const ldOrg = {
    "@type": "ResearchOrganization", ...ORG, name: sitio.nombre, alternateName: sitio.sigla, url: U,
    foundingDate: String(sitio.desde), email: sitio.correo, description: sitio.descripcion,
    parentOrganization: { "@type": "CollegeOrUniversity", name: sitio.facultad + " (" + sitio.facultad_sigla + ")", parentOrganization: { "@type": "CollegeOrUniversity", name: sitio.universidad, url: sitio.universidad_url } },
    address: direccionPostal, sameAs: [sitio.ficha_oficial], knowsAbout: lineas.map((l) => l.nombre),
  };
  const ldPersona = (p) => ({
    "@type": "Person", ...idPersona(p), name: p.nombre, ...(p.titulo ? { honorificPrefix: p.titulo } : {}), jobTitle: p.rol,
    ...(p.correo ? { email: p.correo } : {}), url: U + "equipo/" + p.slug + "/", ...(p.orcid ? { sameAs: ["https://orcid.org/" + p.orcid] } : {}),
    affiliation: ORG, knowsAbout: p.lineas.map((l) => l.nombre),
  });
  const ldProyecto = (x) => ({
    "@type": "ResearchProject", "@id": U + "investigacion/proyectos/" + x.slug + "/#proyecto", name: x.nombre, description: x.resumen,
    foundingDate: String(x.inicio), dissolutionDate: String(x.fin), ...(x.financiador ? { funder: { "@type": "Organization", name: x.financiador } } : {}),
    parentOrganization: ORG, member: x.integrantes.map(idPersona),
  });
  const ldPub = (b) => ({
    "@type": LD[b.tipo] || "CreativeWork", name: b.titulo, author: b.autores.map((a) => (a.persona ? idPersona(a.persona) : { "@type": "Person", name: a.nombre })),
    datePublished: String(b.anio), ...(b.medio ? { isPartOf: { "@type": b.tipo === "Artículo en revista" ? "Periodical" : "CreativeWork", name: b.medio } } : {}),
    ...(b.doi ? { sameAs: "https://doi.org/" + b.doi } : {}),
  });
  const ldFaq = (qs) => ({ "@type": "FAQPage", mainEntity: lista(qs).map((q) => ({ "@type": "Question", name: q.pregunta, acceptedAnswer: { "@type": "Answer", text: q.respuesta } })) });
  const CTX = { "@context": "https://schema.org" };

  for (const p of personas) p.jsonld = { ...CTX, ...ldPersona(p) };
  for (const l of lineas) l.jsonld = {
    ...CTX, "@type": "WebPage", name: l.nombre, url: U + "investigacion/" + l.slug + "/", description: l.resumen, dateModified: l.revisado,
    keywords: l.palabras_clave.join(", "), ...(l.responsable ? { author: idPersona(l.responsable) } : {}), isPartOf: ORG,
  };
  const jsonld = {
    sitio: { ...CTX, "@graph": [ldOrg, ...personas.map(ldPersona), ...proyectos.map(ldProyecto), ...publicaciones.map(ldPub)] },
    inicio: { ...CTX, "@graph": [{ "@type": "WebSite", name: sitio.sigla, url: U, inLanguage: "es-AR", publisher: ORG }, ldOrg] },
    investigacion: { ...CTX, "@type": "CollectionPage", name: "Investigación", url: U + "investigacion/", isPartOf: ORG, hasPart: [...proyectos.map(ldProyecto), ...publicaciones.map(ldPub)] },
    equipo: { ...CTX, "@type": "CollectionPage", name: "Equipo", url: U + "equipo/", about: ORG, hasPart: personas.map((p) => ({ ...idPersona(p), name: p.nombre, jobTitle: p.rol })) },
    estudiantes: { ...CTX, "@graph": [
      ...convocatorias.map((c) => ({ "@type": "JobPosting", title: c.titulo + " · " + c.tipo, description: c.descripcion, validThrough: c.cierre, hiringOrganization: ORG, jobLocation: { "@type": "Place", address: sitio.localidad + ", " + sitio.pais } })),
      ldFaq(paginas.estudiantes.preguntas)] },
    empresas: { ...CTX, "@graph": [
      { "@type": "OfferCatalog", name: "Servicios del " + sitio.sigla, url: U + "empresas/", itemListElement: servicios.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.nombre, description: s.descripcion, provider: ORG } })) },
      ldFaq(paginas.empresas.preguntas)] },
    grupo: { ...CTX, ...ldOrg },
    contacto: { ...CTX, "@type": "ContactPage", url: U + "contacto/", mainEntity: { ...ORG, contactPoint: contacto.destinatarios.map((d) => ({ "@type": "ContactPoint", contactType: d.publico, email: d.correo })), address: direccionPostal } },
  };

  /* ---------- índice del buscador ---------- */
  const indice = [];
  const add = (t, s, h, extra) => indice.push({ t, s, h, k: norm(t + " " + s + " " + (extra || "")) });
  add("Investigación", "Sección", "#investigacion", "lineas proyectos publicaciones");
  add("Proyectos", "Sección", "#proyectos", "");
  add("Publicaciones", "Sección", "#publicaciones", "articulos papers");
  add("Equipo", "Sección", "#equipo", "personas integrantes");
  add("Estudiantes", "Sección", "#estudiantes", "sumate formacion becas");
  add("Empresas y organismos", "Sección", "#empresas", "vinculacion servicios transferencia");
  add("El grupo", "Sección", "#grupo", "quienes somos institucional");
  add("Noticias", "Sección", "#noticias", "novedades");
  add("Contacto", "Sección", "#contacto", "correo telefono direccion como llegar");
  lineas.forEach((l) => add(l.nombre, "Línea de investigación" + (l.responsable ? " · " + l.responsable.nombre : ""), "#linea-" + l.id, l.palabras_clave.join(" ")));
  personas.forEach((p) => add(p.nombreCompleto, "Equipo · " + p.rol, "#persona-" + p.id, (p.categoria || "") + " " + (p.correo || "")));
  proyectos.forEach((x) => add(x.nombre, [x.tipo, String(x.estado || "").toLowerCase(), x.financiador].filter(Boolean).join(" · "), "#proyecto-" + x.id, x.codigo));
  publicaciones.forEach((b) => add(b.titulo, ["Publicación", b.tipo, b.anio, b.autoresTxt].join(" · "), "#publicaciones", [b.medio, b.doi].filter(Boolean).join(" ")));
  formados.forEach((f) => add(f.nombre, ["Se formó en el grupo", f.nivel, f.anio, f.trabajo].join(" · "), "#formados", (f.hoy || "") + " tesis ex integrante"));
  temas.forEach((t) => add(t.titulo, "Tema para " + t.tipo + " · " + String(t.estado || "").toLowerCase() + (t.dirige ? " · dirige " + t.dirige.nombre : ""), "#temas", "pi ps trabajo final tesis"));
  convocatorias.forEach((c) => add(c.titulo, "Convocatoria abierta · " + c.tipo + " · cierra el " + c.cierreTxt, "#convocatorias", "beca pasantia"));
  materias.forEach((m) => add(m.nombre, ["Materia", m.carrera, m.responsable && m.responsable.nombre].filter(Boolean).join(" · "), "#materias", "catedra docencia"));
  servicios.forEach((s) => add(s.nombre, "Servicio para empresas y organismos", "#servicios", "asesoramiento desarrollo ensayo"));
  capacitaciones.forEach((c) => add(c.nombre, "Capacitación para la industria · " + c.duracion, "#capacitaciones", "curso seminario"));
  equipamiento.forEach((e) => add(e.nombre, "Equipamiento del laboratorio" + (e.proveedor ? " · " + e.proveedor : ""), "#laboratorio", "infraestructura"));
  casos.forEach((c) => add(c.nombre, ["Caso realizado", c.socio, c.anio].filter(Boolean).join(" · "), "#casos", ""));
  noticias.forEach((n) => add(n.titulo, ["Noticia", n.tipo, n.fechaTxt].join(" · "), "#noticias", ""));
  lista(paginas.estudiantes.preguntas).forEach((q) => add(q.pregunta, "Pregunta frecuente de estudiantes", "#postular", ""));
  lista(paginas.empresas.preguntas).forEach((q) => add(q.pregunta, "Pregunta frecuente de empresas", "#contratar", ""));
  add("Visitas y charlas para colegios", "El grupo", "#colegios", "escuela secundario docentes divulgacion");
  add("Misión, visión y objetivos", "El grupo", "#mision", "");
  add("Cómo contratar al grupo", "Empresas", "#contratar", "convenio stan presupuesto");
  add("Patrocinio", "Empresas", "#patrocinio", "sponsor auspicio");
  add("Posgrado", "Estudiantes", "#posgrado", "maestria doctorado director beca");
  add("Cómo sumarte", "Estudiantes", "#postular", "postular");
  add("Historia del grupo", "El grupo", "#historia", sitio.desde + " hitos");
  add("El " + sitio.sigla + " en números", "El grupo", "#numeros", "indicadores produccion por ano evaluacion");
  add("Convenios y socios", "El grupo", "#historia", "");
  add("Ficha del grupo", "El grupo", "#ficha", "que es el " + norm(sitio.sigla) + " datos");

  const actualizado = noticias.length ? noticias[0].fecha : hoy;

  return {
    sitio, paginas, contacto, lineas, personas, equipo, direccion, dirigenPosgrado, proyectos, publicaciones, formados, temas,
    convocatorias, materias, servicios, capacitaciones, equipamiento, casos, noticias, historia, numeros, filtros, jsonld, indice,
    hoy, hoyTxt: dma(hoy), actualizado, actualizadoTxt: dma(actualizado),
  };
};
