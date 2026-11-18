export async function onRequest({ request }) {
  const upstream = "http://88.150.230.110:29986/stream";
  const headers = new Headers({
    "User-Agent": "MONACO-FM-Cloudflare-Proxy/1.0",
    "Accept": request.headers.get("Accept") || "*/*"
  });
  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);
  try {
    const response = await fetch(upstream, {
      method: "GET",
      headers,
      redirect: "follow"
    });
    const out = new Headers();
    for (const key of ["content-type", "icy-metaint", "icy-name", "icy-description", "icy-br", "content-length", "content-range", "accept-ranges"]) {
      const value = response.headers.get(key);
      if (value) out.set(key, value);
    }
    out.set("Cache-Control", "no-store, no-cache, must-revalidate");
    out.set("Access-Control-Allow-Origin", "*");
    out.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, headers: out });
  } catch {
    return new Response("No se pudo conectar con la señal de MONACO FM.", {
      status: 502, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
}