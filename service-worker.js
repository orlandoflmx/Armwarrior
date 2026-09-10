const CACHE='faa-v20';
const SHELL=['./','./manifest.webmanifest','./flyer-garage-grinder.jpg','./flyer-lucky-u.jpg','./flyer-state-championship.jpg'];

const FIX=`<script id="faa-signup-fix-v20">
(function(){
function fix(){
var b=document.getElementById('signupBtn');
if(!b||b.dataset.faaFix)return;
b.dataset.faaFix='1';
b.onclick=async function(){
var n=document.getElementById('authName'),
e=document.getElementById('authEmail'),
p=document.getElementById('authPass'),
s=document.getElementById('accountStatus'),
name=(n&&n.value||'').trim(),
email=(e&&e.value||'').trim(),
pass=p&&p.value||'';
if(!name){if(s)s.textContent='Enter your full name to create an account.';return}
if(!email){if(s)s.textContent='Enter an email address.';return}
if(pass.length<8){if(s)s.textContent='Password must be at least 8 characters.';return}
if(s)s.textContent='Creating FAA account...';
try{
var r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,email:email,password:pass})});
var d=await r.json();
if(!r.ok)throw Error(d.error||'Account creation failed');
localStorage.setItem('FAA_TOKEN',d.token);
localStorage.removeItem('FAA_V8');
localStorage.removeItem('FAA_V11_PENDING');
localStorage.removeItem('FAA_V15_PENDING');
location.reload();
}catch(x){if(s)s.textContent=x.message||'Account creation failed'}
}
}
fix();setTimeout(fix,500);setTimeout(fix,1500);
})();
</script>`;

self.addEventListener('install',e=>e.waitUntil(
caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',e=>e.waitUntil(
caches.keys().then(keys=>Promise.all(
keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
)).then(()=>self.clients.claim())
));

self.addEventListener('fetch',e=>{
if(e.request.mode==='navigate'){
e.respondWith(
fetch(e.request).then(async r=>{
if(!r.ok)return r;
let t=await r.clone().text();
if(!t.includes('faa-signup-fix-v20'))
t=t.replace('</body>',FIX+'</body>');
return new Response(t,{status:r.status,statusText:r.statusText,headers:r.headers});
}).catch(()=>caches.match('./index.html'))
);
return;
}
e.respondWith(
caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{
let c=x.clone();caches.open(CACHE).then(z=>z.put(e.request,c));return x;
}))
);
});
