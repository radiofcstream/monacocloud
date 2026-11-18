const enc = new TextEncoder();
function b64url(bytes) {
  let s = ""; for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}
export async function makeSession(env) {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now()+8*60*60*1000 })));
  return payload+"."+await sign(payload, env.SESSION_SECRET);
}
export async function isAdmin(request, env) {
  if (!env.SESSION_SECRET) return false;
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("monaco_session="))?.slice(15);
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || signature !== await sign(payload, env.SESSION_SECRET)) return false;
  try {
    const data = JSON.parse(atob(payload.replace(/-/g,"+").replace(/_/g,"/")));
    return data.exp > Date.now();
  } catch { return false; }
}
export function cookieHeader(token) {
  return `monaco_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`;
}