const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
export async function onRequestPost({request,env}){
  const origin=request.headers.get("Origin");
  if(origin){try{const u=new URL(origin);if(!["mrsclima.com.br","www.mrsclima.com.br","mrs-clima-web.pages.dev"].includes(u.hostname)&&!u.hostname.endsWith(".mrs-clima-web.pages.dev"))return reply({error:"Origem não autorizada."},403)}catch{return reply({error:"Origem inválida."},403)}}
  if(Number(request.headers.get("content-length")||0)>12000)return reply({error:"Dados muito grandes."},413);
  let data;try{data=await request.json()}catch{return reply({error:"JSON inválido."},400)}
  if(!data||typeof data!=="object"||Array.isArray(data))return reply({error:"Dados inválidos."},400);
  const fields=["nome","empresa","cargo","telefone","email","cidade","segmento","servico_interesse","mensagem","origem","pagina"];
  const lead={};for(const key of fields)lead[key]=String(data[key]??"").trim().slice(0,key==="mensagem"?2000:240);
  if(!lead.nome||!lead.empresa||!lead.telefone||!lead.email||!lead.cidade||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))return reply({error:"Preencha os campos obrigatórios corretamente."},400);
  if(!env.MRS_WEBHOOK_URL||!env.MRS_WEBHOOK_USER||!env.MRS_WEBHOOK_PASSWORD)return reply({error:"Integração temporariamente indisponível."},503);
  const auth=btoa(env.MRS_WEBHOOK_USER+":"+env.MRS_WEBHOOK_PASSWORD);
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
  try{const upstream=await fetch(env.MRS_WEBHOOK_URL,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Basic "+auth},body:JSON.stringify({...lead,data_envio:new Date().toISOString()}),signal:controller.signal});
  if(!upstream.ok)return reply({error:"Falha ao registrar solicitação."},502);
  return reply({ok:true});
  }catch{return reply({error:"Serviço temporariamente indisponível."},502)}finally{clearTimeout(timeout)}
}
export function onRequestGet(){return reply({error:"Método não permitido."},405)}
