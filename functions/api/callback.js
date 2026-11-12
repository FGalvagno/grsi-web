/*
 * Inicio de sesión de Decap CMS con GitHub, paso 2 de 2.
 * GitHub vuelve a esta dirección con un código; acá se cambia por un token de acceso
 * y se lo pasa a la ventana de Decap que inició el pedido.
 *
 * Necesita las variables GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en Cloudflare Pages.
 */
function pagina(estado, contenido) {
  // Decap espera este intercambio: la ventana avisa "authorizing:github", el administrador
  // responde, y recién entonces se le manda el resultado. Solo se habla con este mismo sitio.
  const mensaje = "authorization:github:" + estado + ":" + JSON.stringify(contenido);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Iniciando sesión…</title></head><body>
<p>${estado === "success" ? "Sesión iniciada. Ya podés cerrar esta ventana." : "No se pudo iniciar sesión. Cerrá esta ventana y probá de nuevo."}</p>
<script>
(function () {
  var mensaje = ${JSON.stringify(mensaje).replace(/</g, "\\u003c")};
  if (!window.opener) return;
  window.addEventListener("message", function (e) {
    if (e.origin !== window.location.origin) return;
    window.opener.postMessage(mensaje, e.origin);
  }, false);
  window.opener.postMessage("authorizing:github", window.location.origin);
})();
</script></body></html>`;
  return new Response(html, {
    status: estado === "success" ? 200 : 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": "decap_state=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    },
  });
}

export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return pagina("error", { error: "Faltan las variables GITHUB_CLIENT_ID o GITHUB_CLIENT_SECRET en Cloudflare Pages." });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)decap_state=([^;]+)/);

  if (!code) return pagina("error", { error: url.searchParams.get("error_description") || "GitHub no devolvió un código." });
  if (!state || !cookie || cookie[1] !== state) return pagina("error", { error: "El pedido de inicio de sesión no coincide o venció." });

  const respuesta = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "grsi-web-decap" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: url.origin + "/api/callback",
    }),
  });
  const datos = await respuesta.json().catch(() => ({}));

  if (!datos.access_token) return pagina("error", { error: datos.error_description || datos.error || "GitHub rechazó el pedido." });
  return pagina("success", { token: datos.access_token, provider: "github" });
}
