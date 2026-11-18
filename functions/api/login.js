import { makeSession, cookieHeader } from "./_auth.js";
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return Response.json({error:"Falta configurar ADMIN_PASSWORD o SESSION_SECRET en Cloudflare."},{status:500});
  let body; try { body=await request.json(); } catch { return Response.json({error:"Solicitud inválida"},{status:400}); }
  if (typeof body.password !== "string" || body.password !== env.ADMIN_PASSWORD) return Response.json({error:"Contraseña incorrecta"},{status:401});
  const token=await makeSession(env);
  return Response.json({ok:true},{headers:{"Set-Cookie":cookieHeader(token),"Cache-Control":"no-store"}});
}