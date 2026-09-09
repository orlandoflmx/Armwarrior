
const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto"),url=require("url");
const PORT=process.env.PORT||8080,ROOT=__dirname,DATA=path.join(ROOT,"data"),DB=path.join(DATA,"faa.json");
fs.mkdirSync(DATA,{recursive:true});
if(!fs.existsSync(DB))fs.writeFileSync(DB,JSON.stringify({
 events:[
  {id:"evt_showdown",name:"Showdown at OB's",date:"2026-09-19",location:"Florida",status:"open",entryFee:50,
   divisions:["Right Hand","Left Hand","Youth","Women"],description:"Florida Armwrestling Association event."}
 ],users:[],registrations:[],results:[],sessions:[]
},null,2));
const read=()=>JSON.parse(fs.readFileSync(DB,"utf8")), write=d=>fs.writeFileSync(DB,JSON.stringify(d,null,2));
const id=p=>p+"_"+crypto.randomBytes(8).toString("hex");
function pw(x,s=crypto.randomBytes(16).toString("hex")){return{salt:s,hash:crypto.scryptSync(x,s,64).toString("hex")}}
function okpw(x,u){const h=crypto.scryptSync(x,u.salt,64).toString("hex");return crypto.timingSafeEqual(Buffer.from(h,"hex"),Buffer.from(u.hash,"hex"))}
function send(r,c,d,t="application/json"){r.writeHead(c,{"Content-Type":t,"Cache-Control":"no-store"});r.end(t==="application/json"?JSON.stringify(d):d)}
function body(q){return new Promise((ok,no)=>{let s="";q.on("data",c=>{s+=c;if(s.length>2e6)q.destroy()});q.on("end",()=>{try{ok(s?JSON.parse(s):{})}catch(e){no(e)}})})}
function current(q,d){const m=(q.headers.authorization||"").match(/^Bearer (.+)$/),s=m&&d.sessions.find(x=>x.token===m[1]);return s&&d.users.find(x=>x.id===s.userId)}
function admin(q,d){const u=current(q,d);return u&&u.role==="admin"}
async function api(q,r,p){
 const d=read();
 try{
  if(q.method==="GET"&&p==="/api/health")return send(r,200,{ok:true,app:"FLORIDA ARMWRESTLING",version:"11"});
  if(q.method==="GET"&&p==="/api/events")return send(r,200,{events:d.events});
  if(q.method==="GET"&&p==="/api/registrations"){
   const u=current(q,d); if(!u)return send(r,401,{error:"Sign in first"});
   return send(r,200,{registrations:d.registrations.filter(x=>x.userId===u.id)});
  }
  if(q.method==="GET"&&p==="/api/admin/dashboard"){
   if(!admin(q,d))return send(r,403,{error:"Admin access required"});
   return send(r,200,{events:d.events,registrations:d.registrations,users:d.users.map(u=>({id:u.id,name:u.name,email:u.email,role:u.role})),results:d.results});
  }
  if(q.method==="POST"&&p==="/api/auth/register"){
   const b=await body(q); if(!b.name||!b.email||!b.password||b.password.length<8)return send(r,400,{error:"Name, email and an 8+ character password are required"});
   if(d.users.some(u=>u.email===b.email.trim().toLowerCase()))return send(r,409,{error:"Email already registered"});
   const u={id:id("usr"),name:b.name.trim(),email:b.email.trim().toLowerCase(),role:"athlete",...pw(b.password),createdAt:new Date().toISOString()};
   d.users.push(u);const t=id("sess");d.sessions.push({token:t,userId:u.id});write(d);
   return send(r,201,{token:t,user:{id:u.id,name:u.name,email:u.email,role:u.role}});
  }
  if(q.method==="POST"&&p==="/api/auth/login"){
   const b=await body(q),u=d.users.find(x=>x.email===String(b.email||"").toLowerCase());
   if(!u||!okpw(String(b.password||""),u))return send(r,401,{error:"Invalid email or password"});
   const t=id("sess");d.sessions.push({token:t,userId:u.id});write(d);
   return send(r,200,{token:t,user:{id:u.id,name:u.name,email:u.email,role:u.role}});
  }
  if(q.method==="POST"&&p==="/api/auth/logout"){
   const m=(q.headers.authorization||"").match(/^Bearer (.+)$/);d.sessions=d.sessions.filter(s=>!m||s.token!==m[1]);write(d);return send(r,200,{ok:true});
  }
  if(q.method==="POST"&&p==="/api/registrations"){
   const u=current(q,d);if(!u)return send(r,401,{error:"Sign in first"});
   const b=await body(q),e=d.events.find(x=>x.id===b.eventId);if(!e)return send(r,404,{error:"Event not found"});
   if(!b.division)return send(r,400,{error:"Select a division"});
   if(d.registrations.some(x=>x.userId===u.id&&x.eventId===e.id&&x.division===b.division&&x.status!=="cancelled"))
    return send(r,409,{error:"You are already registered for this division"});
   const reg={id:id("reg"),userId:u.id,eventId:e.id,division:b.division,status:"pending_payment",amount:e.entryFee,createdAt:new Date().toISOString()};
   d.registrations.push(reg);write(d);return send(r,201,{registration:reg});
  }
  if(q.method==="PATCH"&&p.startsWith("/api/admin/registrations/")){
   if(!admin(q,d))return send(r,403,{error:"Admin access required"});
   const rid=p.split("/").pop(),b=await body(q),reg=d.registrations.find(x=>x.id===rid);if(!reg)return send(r,404,{error:"Registration not found"});
   if(b.status)reg.status=b.status;write(d);return send(r,200,{registration:reg});
  }
  if(q.method==="POST"&&p==="/api/admin/events"){
   if(!admin(q,d))return send(r,403,{error:"Admin access required"});
   const b=await body(q);if(!b.name||!b.date)return send(r,400,{error:"Event name and date required"});
   const e={id:id("evt"),name:b.name,date:b.date,location:b.location||"Florida",status:b.status||"open",entryFee:Number(b.entryFee||0),divisions:Array.isArray(b.divisions)&&b.divisions.length?b.divisions:["Right Hand","Left Hand"],description:b.description||""};
   d.events.push(e);write(d);return send(r,201,{event:e});
  }
  if(q.method==="POST"&&p==="/api/admin/results"){
   if(!admin(q,d))return send(r,403,{error:"Admin access required"});
   const b=await body(q);if(!b.eventId||!b.division||!b.athlete)return send(r,400,{error:"Event, division and athlete required"});
   const result={id:id("res"),...b,createdAt:new Date().toISOString()};d.results.push(result);write(d);return send(r,201,{result});
  }
  return send(r,404,{error:"Not found"});
 }catch(e){console.error(e);return send(r,500,{error:"Server error"})}
}
http.createServer((q,r)=>{
 const p=url.parse(q.url).pathname;
 if(p.startsWith("/api/"))return api(q,r,p);
 const f=p==="/"?"index.html":p.replace(/^\/+/,""),full=path.normalize(path.join(ROOT,f));
 if(!full.startsWith(ROOT)||!fs.existsSync(full)||fs.statSync(full).isDirectory())return send(r,404,"Not found","text/plain");
 const types={".html":"text/html; charset=utf-8",".js":"application/javascript",".json":"application/json",".webmanifest":"application/manifest+json",".css":"text/css"};
 r.writeHead(200,{"Content-Type":types[path.extname(full)]||"application/octet-stream"});fs.createReadStream(full).pipe(r)
}).listen(PORT,()=>console.log("FAA V11 server on http://localhost:"+PORT));
