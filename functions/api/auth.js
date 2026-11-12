/*
 * Inicio de sesión de Decap CMS con GitHub, paso 1 de 2.
 * Decap abre esta dirección en una ventana; desde acá se manda a la persona a GitHub
 * para que autorice. Cloudflare Pages publica este archivo solo, en /api/auth.
 *
 * Necesita la variable GITHUB_CLIENT_ID en Cloudflare Pages.
 */
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) return new Response("Falta la variable GITHUB_CLIENT_ID en Cloudflare Pages.", { status: 500 });

  const url = new URL(request.url);
  const pedido = url.searchParams.get("scope");
  const scope = pedido === "public_repo" ? "public_repo" : "repo";
  const state = crypto.randomUUID();

  const destino = new URL("https://github.com/login/oauth/authorize");
  destino.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  destino.searchParams.set("redirect_uri", url.origin + "/api/callback");
  destino.searchParams.set("scope", scope);
  destino.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: destino.toString(),
      // Se guarda el "state" para comprobar en el paso 2 que la respuesta corresponde a este pedido
      "Set-Cookie": "decap_state=" + state + "; Path=/api; Max-Age=600; HttpOnly; Secure; SameSite=Lax",
    },
  });
}
