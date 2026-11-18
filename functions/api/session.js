import { isAdmin } from "./_auth.js";
export async function onRequestGet({request,env}) {
  return isAdmin(request,env) ? Response.json({ok:true}) : Response.json({error:"No autorizado"},{status:401});
}