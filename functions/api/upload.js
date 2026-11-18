import { isAdmin } from "./_auth.js";
export async function onRequestPost({request,env}) {
  if (!await isAdmin(request,env)) return Response.json({error:"No autorizado"},{status:401});
  if (!env.MONACO_IMAGES) return Response.json({error:"Falta vincular el bucket R2 MONACO_IMAGES."},{status:500});
  const form=await request.formData(); const file=form.get("file");
  if (!(file instanceof File)) return Response.json({error:"No se recibió una imagen."},{status:400});
  if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size>5*1024*1024) return Response.json({error:"Usá JPG, PNG o WEBP de hasta 5 MB."},{status:400});
  const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const key=crypto.randomUUID()+"."+ext;
  await env.MONACO_IMAGES.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"}});
  return Response.json({url:"/api/image/"+key});
}