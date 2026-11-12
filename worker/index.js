/*
 * Worker de Cloudflare: atiende el inicio de sesión del administrador (/api/auth y /api/callback)
 * y deja todo lo demás a los archivos del sitio generado en _site.
 * La lógica del inicio de sesión está en functions/api/, compartida con Cloudflare Pages.
 */
import { onRequestGet as auth } from "../functions/api/auth.js";
import { onRequestGet as callback } from "../functions/api/callback.js";

const RUTAS = { "/api/auth": auth, "/api/callback": callback };

export default {
  async fetch(request, env) {
    const ruta = new URL(request.url).pathname.replace(/\/$/, "");
    const atender = RUTAS[ruta];
    if (atender) {
      if (request.method !== "GET") return new Response("Método no permitido", { status: 405, headers: { Allow: "GET" } });
      return atender({ request, env });
    }
    return env.ASSETS.fetch(request);
  },
};
