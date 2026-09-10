const CACHE='faa-v21';
const SHELL=['./','./index.html','./manifest.webmanifest','./flyer-garage-grinder.jpg','./flyer-lucky-u.jpg','./flyer-state-championship.jpg'];

const FIX=`<script id="faa-direct-registration-v21">
(function(){
function start(){
var reg=document.getElementById('register');
if(!reg||reg.dataset.directReg)return;
reg.dataset.directReg='1';

var card=reg.querySelector('.card.form');
if(!card)return;

card.innerHTML=`
<h2>EVENT REGISTRATION</h2>
<div class="small">Register directly for an official 2026 FAA event. No member account required.</div>

<label>FULL NAME *</label>
<input id="pubName" placeholder="John Smith">

<label>EMAIL ADDRESS *</label>
<input id="pubEmail" type="email" placeholder="john@example.com">

<label>PHONE *</label>
<input id="pubPhone" placeholder="(904) 555-1234">

<label>CITY / HOMETOWN</label>
<input id="pubCity" placeholder="Jacksonville">

<label>EVENT *</label>
<select id="pubEvent"></select>

<label>CATEGORY *</label>
<select id="pubCategory">
<option value="">Select category</option>
<option>Amateur</option>
<option>Pro</option>
<option>Masters</option>
<option>Ladies</option>
<option>Kids</option>
</select>

<div id="pubWeightWrap">
<label>WEIGHT CLASS *</label>
<select id="pubWeight">
<option value="">Select weight class</option>
<option>154 lbs</option>
<option>176 lbs</option>
<option>198 lbs</option>
<option>220 lbs</option>
<option>242 lbs</option>
<option>243+ lbs</option>
</select>
</div>

<label>ARM *</label>
<select id="pubArm">
<option value="right">Right Arm</option>
<option value="left">Left Arm</option>
<option value="both">Both Arms</option>
</select>

<div id="pubMsg"></div>
<button class="cta" id="pubSubmit">REGISTER FOR EVENT →</button>
`;

var events=[];

function showMsg(x){
var m=document.getElementById('pubMsg');
if(m)m.innerHTML='<div class="notice">'+x+'</div>';
}

function loadEvents(){
fetch('/api/events').then(function(r){return r.json()}).then(function(d){
events=d.events||[];
var s=document.getElementById('pubEvent');
if(s)s.innerHTML='<option value="">Select event</option>'+events.map(function(e){
return '<option value="'+e.id+'">'+e.date+' — '+e.name+'</option>';
}).join('');
}).catch(function(){showMsg('Unable to load events. Please try again.');});
}

var cat=document.getElementById('pubCategory');
if(cat)cat.onchange=function(){
var w=document.getElementById('pubWeightWrap');
if(w)w.style.display=(this.value==='Amateur'||this.value==='Pro')?'block':'none';
};

var btn=document.getElementById('pubSubmit');
if(btn)btn.onclick=async function(){
var name=(document.getElementById('pubName').value||'').trim();
var email=(document.getElementById('pubEmail').value||'').trim();
var phone=(document.getElementById('pubPhone').value||'').trim();
var city=(document.getElementById('pubCity').value||'').trim();
var eventId=document.getElementById('pubEvent').value;
var category=document.getElementById('pubCategory').value;
var weight=document.getElementById('pubWeight').value;
var arm=document.getElementById('pubArm').value;

if(!name||!email||!phone||!eventId||!category){
showMsg('Please complete all required fields.');
return;
}

if((category==='Amateur'||category==='Pro')&&!weight){
showMsg('Amateur and Pro require a weight class.');
return;
}

showMsg('Submitting registration...');

var payload={
name:name,
email:email,
phone:phone,
city:city,
eventId:eventId,
category:category,
right:(arm==='right'||arm==='both')?weight:'',
left:(arm==='left'||arm==='both')?weight:''
};

try{
var r=await fetch('/api/public-registrations',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify(payload)
});
var d=await r.json();
if(!r.ok)throw Error(d.error||'Registration failed');

var e=events.find(function(x){return x.id===eventId});
var arms=arm==='both'?'Right Arm and Left Arm':arm==='left'?'Left Arm':'Right Arm';

card.innerHTML=`
<h2>REGISTRATION COMPLETE</h2>
<div class="notice">
<strong>${name}</strong><br><br>
You are registered for:<br>
<strong>${e?e.name:'the selected FAA event'}</strong><br><br>
Category: <strong>${category}</strong><br>
Arm: <strong>${arms}</strong>
${(category==='Amateur'||category==='Pro')?'<br>Weight Class: <strong>'+weight+'</strong>':''}
<br><br>
Your registration has been saved. Payment will be connected at the final launch stage.
</div>
<button class="cta" onclick="location.hash='events'">BACK TO EVENTS →</button>
`;
}catch(x){
showMsg(x.message||'Registration failed. Please try again.');
}
};

loadEvents();
}

function watch(){
start();
setTimeout(start,500);
setTimeout(start,1500);
setTimeout(start,3000);
}

watch();

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
if(!t.includes('faa-direct-registration-v21'))
t=t.replace('</body>',FIX+'</body>');
return new Response(t,{
status:r.status,
statusText:r.statusText,
headers:r.headers
});
}).catch(()=>caches.match('./index.html'))
);
return;
}

e.respondWith(
caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{
let c=x.clone();
caches.open(CACHE).then(z=>z.put(e.request,c));
return x;
}))
);
});
