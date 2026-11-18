import { isAdmin } from "./_auth.js";
const NEWS="news", SCHEDULE="schedule";
async function read(env,key){try{return await env.MONACO_NEWS.get(key,"json")||[]}catch{return []}}
async function save(env,key,value){await env.MONACO_NEWS.put(key,JSON.stringify(value))}
export async function onRequestGet({env}) {
  if(!env.MONACO_NEWS)return Response.json({error:"Falta vincular el KV MONACO_NEWS."},{status:500});
  const [news,schedule]=await Promise.all([read(env,NEWS),read(env,SCHEDULE)]);
  news.sort((a,b)=>(b.created||0)-(a.created||0)); schedule.sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  return Response.json({news,schedule},{headers:{"Cache-Control":"no-store"}});
}
export async function onRequestPost({request,env}) {return mutate(request,env,"POST")}
export async function onRequestPut({request,env}) {return mutate(request,env,"PUT")}
export async function onRequestDelete({request,env}) {return mutate(request,env,"DELETE")}
async function mutate(request,env,method){
  if(!await isAdmin(request,env))return Response.json({error:"No autorizado. Iniciá sesión nuevamente."},{status:401});
  if(!env.MONACO_NEWS)return Response.json({error:"Falta vincular el KV MONACO_NEWS."},{status:500});
  let body;try{body=await request.json()}catch{return Response.json({error:"Datos inválidos"},{status:400})}
  const key=body.type==="news"?NEWS:body.type==="schedule"?SCHEDULE:null;
  if(!key)return Response.json({error:"Tipo inválido"},{status:400});
  const list=await read(env,key);
  if(method==="DELETE"){
    const next=list.filter(x=>x.id!==body.id);await save(env,key,next);return Response.json({ok:true});
  }
  if(key===NEWS){
    if(typeof body.title!=="string"||!body.title.trim()||typeof body.description!=="string"||!body.description.trim())return Response.json({error:"Completá título y descripción."},{status:400});
    const item={id:body.id||crypto.randomUUID(),title:body.title.trim().slice(0,120),description:body.description.trim().slice(0,1200),image:typeof body.image==="string"?body.image:"",created:Date.now(),date:new Date().toLocaleDateString("es-AR")};
    if(method==="PUT"){const i=list.findIndex(x=>x.id===body.id);if(i<0)return Response.json({error:"Noticia no encontrada"},{status:404});item.created=list[i].created;list[i]=item}else list.unshift(item);
  }else{
    if(typeof body.time!=="string"||!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time)||typeof body.title!=="string"||!body.title.trim())return Response.json({error:"Completá hora y título del programa."},{status:400});
    const item={id:body.id||crypto.randomUUID(),time:body.time,title:body.title.trim().slice(0,100)};
    if(method==="PUT"){const i=list.findIndex(x=>x.id===body.id);if(i<0)return Response.json({error:"Programa no encontrado"},{status:404});list[i]=item}else list.push(item);
  }
  await save(env,key,list);return Response.json({ok:true});
}