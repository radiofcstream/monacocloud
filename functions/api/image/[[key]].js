export async function onRequest({params,env}) {
  if (!env.MONACO_IMAGES) return new Response("Storage no configurado",{status:503});
  const key=params.key;
  if (!key || key.includes("..") || key.includes("/")) return new Response("No encontrado",{status:404});
  const obj=await env.MONACO_IMAGES.get(key);
  if (!obj) return new Response("No encontrado",{status:404});
  const headers=new Headers();
  obj.writeHttpMetadata(headers); headers.set("etag",obj.httpEtag);
  headers.set("Cache-Control","public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options","nosniff");
  return new Response(obj.body,{headers});
}