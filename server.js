const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),url=require('url');
const PORT=process.env.PORT||8080,ROOT=__dirname,DATA=path.join(ROOT,'data'),DB=path.join(DATA,'faa.json');
fs.mkdirSync(DATA,{recursive:true});

const COMMON={
 weightClasses:['154 lbs','176 lbs','198 lbs','220 lbs','242 lbs','243+ lbs'],
 categories:['Kids','Ladies','Amateur','Pro','Masters']
};
const SEEDED_EVENTS=[
 {id:'evt_garage_grinder_2',name:'Garage Grinder Classic 2',date:'2026-10-17',location:'Eclipse Tattoo, Davenport, FL',address:'2210 South Blvd W, Davenport, FL 33837',status:'open',entryFee:40,entryUnit:'per hand',startTime:'',doorsTime:'',divisions:COMMON.weightClasses, categories:COMMON.categories, weightClasses:COMMON.weightClasses, prizes:['1st Place','2nd Place','3rd Place'],description:'Classic arm wrestling tournament at Eclipse Tattoo.'},
 {id:'evt_lucky_u_motorcycle_pull',name:'Lucky U Cycles Motorcycle Pull',date:'2026-11-14',location:'Lucky U Cycles, Fort Myers, FL',address:'4607 Fowler St, Fort Myers, FL 33907',status:'open',entryFee:40,entryUnit:'per class',startTime:'12:00 PM',doorsTime:'',divisions:COMMON.weightClasses, categories:COMMON.categories, weightClasses:COMMON.weightClasses, prizes:['All winners receive a key','One winner takes home a motorcycle'],description:'Motorcycle Pull presented by Lucky U Cycles. Every class winner receives a key; one winner takes home a motorcycle.'},
 {id:'evt_florida_state_2026',name:'Florida State Championship',date:'2026-12-05',location:'Mudville Grill, Jacksonville, FL',address:'3105 Beach Blvd, Jacksonville, FL 32207',status:'open',entryFee:40,entryUnit:'per hand',startTime:'12:00 PM',doorsTime:'11:00 AM',divisions:COMMON.weightClasses, categories:COMMON.categories, weightClasses:COMMON.weightClasses, prizes:['1st Place','2nd Place','3rd Place'],description:'FAA sanctioned Florida State Championship. Trophies and bragging rights.'}
];

function freshDb(){return{events:SEEDED_EVENTS,users:[],registrations:[],results:[],sessions:[],athleteProfiles:[],champions:[]}}
if(!fs.existsSync(DB))fs.writeFileSync(DB,JSON.stringify(freshDb(),null,2));
const read=()=>JSON.parse(fs.readFileSync(DB,'utf8'));
const write=d=>fs.writeFileSync(DB,JSON.stringify(d,null,2));
function migrate(d){
 d.events=Array.isArray(d.events)?d.events:[];d.users=Array.isArray(d.users)?d.users:[];d.registrations=Array.isArray(d.registrations)?d.registrations:[];d.results=Array.isArray(d.results)?d.results:[];d.sessions=Array.isArray(d.sessions)?d.sessions:[];d.athleteProfiles=Array.isArray(d.athleteProfiles)?d.athleteProfiles:[];d.champions=Array.isArray(d.champions)?d.champions:[];
 for(const seed of SEEDED_EVENTS){
  const old=d.events.find(e=>e.id===seed.id);
  if(!old)d.events.push(seed);
  else Object.assign(old,seed);
 }
 // Replace the old demo event with the real current 2026 schedule if it is still present and unused.
 const demoIds=new Set(['evt_showdown']);
 d.events=d.events.filter(e=>!demoIds.has(e.id)||d.registrations.some(r=>r.eventId===e.id));
 if(process.env.ADMIN_EMAIL){const ae=process.env.ADMIN_EMAIL.trim().toLowerCase();for(const u of d.users){if(u.email===ae)u.role='admin'}}
 return d;
}
function id(p){return p+'_'+crypto.randomBytes(8).toString('hex')}
function pw(x,s=crypto.randomBytes(16).toString('hex')){return{salt:s,hash:crypto.scryptSync(x,s,64).toString('hex')}}
function okpw(x,u){try{const h=crypto.scryptSync(x,u.salt,64).toString('hex');return crypto.timingSafeEqual(Buffer.from(h,'hex'),Buffer.from(u.hash,'hex'))}catch{return false}}
function send(r,c,d,t='application/json'){r.writeHead(c,{'Content-Type':t,'Cache-Control':'no-store'});r.end(t==='application/json'?JSON.stringify(d):d)}
function body(q){return new Promise((ok,no)=>{let s='';q.on('data',c=>{s+=c;if(s.length>2e6)q.destroy()});q.on('end',()=>{try{ok(s?JSON.parse(s):{})}catch(e){no(e)}})})}
function sessionSecret(){return process.env.SESSION_SECRET||process.env.ADMIN_EMAIL||'faa-session-secret'}
function signToken(user){
 const payload=Buffer.from(JSON.stringify({id:user.id,email:user.email,role:user.role,iat:Date.now()})).toString('base64url');
 const sig=crypto.createHmac('sha256',sessionSecret()).update(payload).digest('base64url');
 return payload+'.'+sig;
}
function verifySignedToken(token){
 try{
  const [payload,sig]=String(token||'').split('.');
  if(!payload||!sig)return null;
  const expected=crypto.createHmac('sha256',sessionSecret()).update(payload).digest('base64url');
  if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
  const u=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
  if(!u.id||!u.email||!u.role)return null;
  return u;
 }catch{return null}
}
function current(q,d){
 const m=(q.headers.authorization||'').match(/^Bearer\s+(.+)$/i),token=m&&m[1];
 if(!token)return null;
 const s=d.sessions.find(x=>x.token===token);
 if(s){const u=d.users.find(x=>x.id===s.userId);if(u)return u}
 const v=verifySignedToken(token);if(!v)return null;
 return d.users.find(x=>x.id===v.id&&x.email===v.email)||null;
}
function admin(q,d){const u=current(q,d);return u&&u.role==='admin'}
function publicEvent(e,d){return{...e,competitorCount:d.registrations.filter(r=>r.eventId===e.id&&r.status!=='cancelled').length}}
async function api(q,r,p){
 let d=read();const before=JSON.stringify(d);d=migrate(d);if(JSON.stringify(d)!==before)write(d);
 try{
  if(q.method==='GET'&&p==='/api/health')return send(r,200,{ok:true,app:'FLORIDA ARMWRESTLING',version:'16'});
  if(q.method==='GET'&&p==='/api/events')return send(r,200,{events:d.events.sort((a,b)=>a.date.localeCompare(b.date)).map(e=>publicEvent(e,d))});
  if(q.method==='GET'&&p.startsWith('/api/events/')){const eid=p.split('/')[3],e=d.events.find(x=>x.id===eid);if(!e)return send(r,404,{error:'Event not found'});return send(r,200,{event:publicEvent(e,d),registrations:d.registrations.filter(x=>x.eventId===eid&&x.status!=='cancelled').map(x=>({id:x.id,userId:x.userId,division:x.division,status:x.status}))})}
  if(q.method==='GET'&&p==='/api/me'){const u=current(q,d);if(!u)return send(r,401,{error:'Sign in first'});return send(r,200,{user:{id:u.id,name:u.name,email:u.email,role:u.role}})}
  if(q.method==='GET'&&p==='/api/registrations'){const u=current(q,d);if(!u)return send(r,401,{error:'Sign in first'});return send(r,200,{registrations:d.registrations.filter(x=>x.userId===u.id)})}
  if(q.method==='GET'&&p==='/api/admin/dashboard'){
   if(!admin(q,d))return send(r,403,{error:'Admin access required'});
   return send(r,200,{events:d.events.sort((a,b)=>a.date.localeCompare(b.date)),registrations:d.registrations,users:d.users.map(u=>({id:u.id,name:u.name,email:u.email,role:u.role})),results:d.results,athleteProfiles:d.athleteProfiles,champions:d.champions});
  }
  if(q.method==='POST'&&p==='/api/auth/register'){
   const b=await body(q),email=String(b.email||'').trim().toLowerCase();if(!b.name||!email||!b.password||b.password.length<8)return send(r,400,{error:'Name, email and an 8+ character password are required'});
   if(d.users.some(u=>u.email===email))return send(r,409,{error:'Email already registered'});
   const role=process.env.ADMIN_EMAIL&&email===process.env.ADMIN_EMAIL.trim().toLowerCase()?'admin':'athlete';
   const u={id:id('usr'),name:b.name.trim(),email,role,...pw(b.password),createdAt:new Date().toISOString()};
   d.users.push(u);const t=signToken(u);d.sessions.push({token:t,userId:u.id});write(d);return send(r,201,{token:t,user:{id:u.id,name:u.name,email:u.email,role:u.role}})
  }
  if(q.method==='POST'&&p==='/api/auth/login'){
   const b=await body(q),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||''),adminEmail=String(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
   let u=d.users.find(x=>x.email===email);
   // If the Render database was reset/created fresh, bootstrap the configured admin account
   // from the password supplied on the first admin login. The password is still stored hashed.
   if(!u && adminEmail && email===adminEmail){
    if(!password||password.length<8)return send(r,400,{error:'Admin password must be at least 8 characters.'});
    u={id:id('usr'),name:'Florida Armwrestling Admin',email,role:'admin',...pw(password),createdAt:new Date().toISOString()};
    d.users.push(u);
   } else {
    if(!u||!okpw(password,u))return send(r,401,{error:'Invalid email or password'});
    if(adminEmail&&email===adminEmail)u.role='admin';
   }
   const t=signToken(u);d.sessions.push({token:t,userId:u.id});write(d);return send(r,200,{token:t,user:{id:u.id,name:u.name,email:u.email,role:u.role}})
  }
  if(q.method==='POST'&&p==='/api/auth/logout'){const m=(q.headers.authorization||'').match(/^Bearer (.+)$/);d.sessions=d.sessions.filter(s=>!m||s.token!==m[1]);write(d);return send(r,200,{ok:true})}
  if(q.method==='GET'&&p==='/api/public/champions')return send(r,200,{champions:d.champions,weights:COMMON.weightClasses});
  if(q.method==='GET'&&p==='/api/public/results')return send(r,200,{results:d.results});
  if(q.method==='POST'&&p==='/api/admin/champions'){
   if(!admin(q,d))return send(r,403,{error:'Admin access required'});
   const b=await body(q),weight=String(b.weight||''),side=String(b.side||'').toLowerCase(),name=String(b.name||'').trim(),photo=String(b.photo||'');
   if(!COMMON.weightClasses.includes(weight)||!['right','left'].includes(side))return send(r,400,{error:'Valid weight class and hand are required'});
   if(!name)return send(r,400,{error:'Champion name is required'});
   if(photo && (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(photo)||photo.length>1500000))return send(r,400,{error:'Please upload a JPG, PNG or WebP image under 1 MB.'});
   let c=d.champions.find(x=>x.weight===weight&&x.side===side);if(!c){c={id:id('champ'),weight,side};d.champions.push(c)}
   c.name=name;if(photo)c.photo=photo;c.updatedAt=new Date().toISOString();write(d);return send(r,200,{champion:c});
  }
  if(q.method==='DELETE'&&p.startsWith('/api/admin/champions/')){
   if(!admin(q,d))return send(r,403,{error:'Admin access required'});const cid=p.split('/').pop();d.champions=d.champions.filter(x=>x.id!==cid);write(d);return send(r,200,{ok:true});
  }
  if(q.method==='POST'&&p==='/api/public-registrations'){
   const b=await body(q),name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase(),phone=String(b.phone||'').trim(),city=String(b.city||'').trim(),category=String(b.category||'').trim(),e=d.events.find(x=>x.id===b.eventId);
   if(!name||!email||!e)return send(r,400,{error:'Name, email and event are required'});
   if(e.status!=='open')return send(r,400,{error:'Registration is closed for this event'});
   if(!e.categories.includes(category))return send(r,400,{error:'Select Amateur, Pro, Masters, Ladies or Kids'});
   const arms=[['right',b.right],['left',b.left]].filter(x=>x[1]);
   if(!arms.length)return send(r,400,{error:'Select at least one arm'});
   if((category==='Amateur'||category==='Pro')&&arms.some(x=>!e.weightClasses.includes(x[1])))return send(r,400,{error:'Amateur and Pro require a valid weight class'});
   const regs=arms.map(x=>({id:id('reg'),userId:null,eventId:e.id,arm:x[0],division:(category==='Amateur'||category==='Pro')?x[1]:category,category,athleteName:name,athleteEmail:email,phone,city,status:'pending_payment',amount:e.entryFee,createdAt:new Date().toISOString()}));
   d.registrations.push(...regs);write(d);return send(r,201,{registrations:regs});
  }
  if(q.method==='POST'&&p==='/api/registrations'){
   const u=current(q,d);if(!u)return send(r,401,{error:'Sign in first'});const b=await body(q),e=d.events.find(x=>x.id===b.eventId);if(!e)return send(r,404,{error:'Event not found'});if(e.status!=='open')return send(r,400,{error:'Registration is closed for this event'});if(!b.division)return send(r,400,{error:'Select a division'});
   if(d.registrations.some(x=>x.userId===u.id&&x.eventId===e.id&&x.division===b.division&&x.status!=='cancelled'))return send(r,409,{error:'You are already registered for this division'});
   const reg={id:id('reg'),userId:u.id,eventId:e.id,division:b.division,status:'pending_payment',amount:e.entryFee,createdAt:new Date().toISOString()};d.registrations.push(reg);write(d);return send(r,201,{registration:reg})
  }
  if(q.method==='PATCH'&&p.startsWith('/api/admin/registrations/')){
   if(!admin(q,d))return send(r,403,{error:'Admin access required'});const rid=p.split('/').pop(),b=await body(q),reg=d.registrations.find(x=>x.id===rid);if(!reg)return send(r,404,{error:'Registration not found'});if(b.status)reg.status=b.status;write(d);return send(r,200,{registration:reg})
  }
  if(q.method==='POST'&&p==='/api/admin/events'){
   if(!admin(q,d))return send(r,403,{error:'Admin access required'});const b=await body(q);if(!b.name||!b.date)return send(r,400,{error:'Event name and date required'});
   const e={id:id('evt'),name:b.name,date:b.date,location:b.location||'Florida',address:b.address||'',status:b.status||'open',entryFee:Number(b.entryFee||0),entryUnit:b.entryUnit||'per class',startTime:b.startTime||'',doorsTime:b.doorsTime||'',divisions:Array.isArray(b.divisions)&&b.divisions.length?b.divisions:['154 lbs','176 lbs','198 lbs','220 lbs','242 lbs','243+ lbs'],categories:Array.isArray(b.categories)&&b.categories.length?b.categories:COMMON.categories,weightClasses:Array.isArray(b.weightClasses)&&b.weightClasses.length?b.weightClasses:COMMON.weightClasses,prizes:Array.isArray(b.prizes)?b.prizes:[],description:b.description||''};
   d.events.push(e);write(d);return send(r,201,{event:e})
  }
  if(q.method==='PATCH'&&p.startsWith('/api/admin/events/')){
   if(!admin(q,d))return send(r,403,{error:'Admin access required'});const eid=p.split('/').pop(),e=d.events.find(x=>x.id===eid);if(!e)return send(r,404,{error:'Event not found'});const b=await body(q);for(const k of ['name','date','location','address','status','entryUnit','startTime','doorsTime','description'])if(b[k]!==undefined)e[k]=b[k];if(b.entryFee!==undefined)e.entryFee=Number(b.entryFee);for(const k of ['divisions','categories','weightClasses','prizes'])if(Array.isArray(b[k]))e[k]=b[k];write(d);return send(r,200,{event:e})
  }
  if(q.method==='POST'&&p==='/api/admin/results'){
   if(!admin(q,d))return send(r,403,{error:'Admin access required'});const b=await body(q);if(!b.eventId||!b.division||!b.athlete)return send(r,400,{error:'Event, division and athlete required'});const result={id:id('res'),eventId:b.eventId,division:b.division,athlete:b.athlete,place:Number(b.place||0),createdAt:new Date().toISOString()};d.results.push(result);write(d);return send(r,201,{result})
  }
  if(q.method==='GET'&&p.startsWith('/api/public/')){
   const bits=p.split('/');const eid=bits[3],type=bits[4];if(type==='roster')return send(r,200,{registrations:d.registrations.filter(x=>x.eventId===eid&&x.status!=='cancelled')});if(type==='results')return send(r,200,{results:d.results.filter(x=>x.eventId===eid)});
  }
  return send(r,404,{error:'Not found'});
 }catch(e){console.error(e);return send(r,500,{error:'Server error'})}
}
http.createServer((q,r)=>{
 const p=url.parse(q.url).pathname;
 if(p.startsWith('/api/'))return api(q,r,p);
 const f=p==='/'?'index.html':p.replace(/^\/+/,''),full=path.normalize(path.join(ROOT,f));
 if(!full.startsWith(ROOT)||!fs.existsSync(full)||fs.statSync(full).isDirectory())return send(r,404,'Not found','text/plain');
 const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.css':'text/css','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
 r.writeHead(200,{'Content-Type':types[path.extname(full).toLowerCase()]||'application/octet-stream'});fs.createReadStream(full).pipe(r)
}).listen(PORT,'0.0.0.0',()=>console.log('FAA V15 server on port '+PORT));
