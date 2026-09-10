
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));}


// Public site: member sign-in removed. Admin APIs remain available to the protected admin experience.
(function(){
  window.FAA_PUBLIC_ONLY=true;
})();


// V14 official 2026 event catalog. Payment remains intentionally deferred.
(function(){
 const EVENT_KEY='FAA_SELECTED_EVENT_V14';
 let events=[],selectedId=localStorage.getItem(EVENT_KEY)||'';
 const api14=async(p,o={})=>{o.headers=Object.assign({'Content-Type':'application/json'},o.headers||{});const t=localStorage.getItem('FAA_TOKEN');if(t)o.headers.Authorization='Bearer '+t;const r=await fetch(p,o);let d={};try{d=await r.json()}catch(e){}if(!r.ok)throw Error(d.error||'Request failed');return d};
 const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const fmtDate=x=>{const d=new Date(x+'T12:00:00');return d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})};
 const flyer=e=>e.id==='evt_garage_grinder_2'?'flyer-garage-grinder.jpg':e.id==='evt_lucky_u_motorcycle_pull'?'flyer-lucky-u.jpg':'flyer-state-championship.jpg';
 const eventById=id=>events.find(e=>e.id===id)||events[0];
 function selectEvent(id){selectedId=id;localStorage.setItem(EVENT_KEY,id);renderEventDetail(eventById(id));}
 function renderEventDetail(e){if(!e)return;const d=e.divisions||e.weightClasses||[];document.getElementById('eventDetails').innerHTML=`<button class="cta outline" data-go="events">← EVENTS</button><div class="hero card"><img src="${flyer(e)}" class="full-art"><div class="body"><span class="pill open">${esc(e.status==='open'?'REGISTRATION OPEN':'REGISTRATION CLOSED')}</span><h1>${esc(e.name)}</h1><div class="small"><b>${fmtDate(e.date)}</b><br>${esc(e.location)}<br>${esc(e.address)}</div><div class="record" style="margin-top:10px"><div class="stat"><strong>$${Number(e.entryFee).toFixed(0)}</strong><span>${esc(e.entryUnit||'ENTRY')}</span></div><div class="stat"><strong>${e.startTime?esc(e.startTime):'TBA'}</strong><span>START</span></div></div><button class="cta" data-register-event="${esc(e.id)}">REGISTER FOR THIS EVENT →</button></div></div><div class="card form"><h3>EVENT INFORMATION</h3><div class="small">${esc(e.description)}</div><h3>WEIGHT CLASSES</h3><div class="small">${d.map(esc).join(' • ')}</div><h3>CATEGORIES</h3><div class="small">${(e.categories||[]).map(esc).join(' • ')}</div>${e.doorsTime?`<h3>SCHEDULE</h3><div class="small">Doors: ${esc(e.doorsTime)}<br>Pulls: ${esc(e.startTime)}</div>`:''}<h3>PRIZES</h3><div class="small">${(e.prizes||[]).map(esc).join('<br>')}</div></div>`;document.querySelectorAll('[data-register-event]').forEach(b=>b.onclick=()=>{eventSelect.value=b.dataset.registerEvent;populateClasses();go('register')});}
 function renderCatalog(){const box=document.getElementById('eventCatalog');box.innerHTML=events.map(e=>`<div class="event"><img src="${flyer(e)}"><div class="body"><span class="pill ${e.status==='open'?'open':''}">${e.status==='open'?'REGISTRATION OPEN':'CLOSED'}</span><h3>${esc(e.name)}</h3><div class="small"><b>${fmtDate(e.date)}</b><br>${esc(e.location)}<br>$${Number(e.entryFee).toFixed(0)} ${esc(e.entryUnit||'entry')}</div><button class="cta outline" data-event-view="${esc(e.id)}">VIEW DETAILS</button></div></div>`).join('')||'<div class="notice">No events scheduled.</div>';document.querySelectorAll('[data-event-view]').forEach(b=>b.onclick=()=>{selectEvent(b.dataset.eventView);go('event')});}
 function renderSchedule(){document.getElementById('scheduleList').innerHTML=events.map(e=>`<div class="list"><div class="grow"><b>${esc(e.name)}</b><div class="small">${fmtDate(e.date)} • ${esc(e.location)}</div></div><b>${new Date(e.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase()}</b></div>`).join('')||'<div class="notice">No events scheduled.</div>';}
 function populateClasses(){const e=eventById(eventSelect.value||selectedId);if(!e)return;selectedId=e.id;localStorage.setItem(EVENT_KEY,e.id);const opts=(e.weightClasses||e.divisions||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');right.innerHTML='<option value="">Select class</option>'+opts;left.innerHTML='<option value="">Select class</option>'+opts;}
 function renderEventSelect(){eventSelect.innerHTML='<option value="">Select an event</option>'+events.map(e=>`<option value="${esc(e.id)}">${esc(e.name)} — ${fmtDate(e.date)}</option>`).join('');if(eventById(selectedId)){eventSelect.value=selectedId}else if(events[0]){eventSelect.value=events[0].id;selectedId=events[0].id;localStorage.setItem(EVENT_KEY,selectedId)}populateClasses();}
 function renderHome(){const e=events[0];if(!e)return;document.getElementById('nextEventHero').innerHTML=`<img src="${flyer(e)}" class="full-art"><div class="body"><div class="red">NEXT EVENT</div><h1>${esc(e.name)}</h1><div class="small"><b>${fmtDate(e.date)}</b><br>${esc(e.location)}<br>$${Number(e.entryFee).toFixed(0)} ${esc(e.entryUnit||'entry')}</div><button class="cta" data-home-event="${esc(e.id)}">VIEW EVENT →</button></div>`;document.querySelectorAll('[data-home-event]').forEach(b=>b.onclick=()=>{selectEvent(b.dataset.homeEvent);go('event')});}
 async function loadEvents(){try{const d=await api14('/api/events');events=(d.events||[]).filter(e=>e.date>='2026-09-09').sort((a,b)=>a.date.localeCompare(b.date));renderHome();renderCatalog();renderSchedule();renderEventSelect();if(selectedId)renderEventDetail(eventById(selectedId));}catch(e){const n=document.getElementById('nextEventHero');if(n)n.innerHTML='<div class="body"><div class="notice">Unable to load the FAA schedule. Please refresh.</div></div>';}}
 eventSelect.addEventListener('change',()=>{selectedId=eventSelect.value;localStorage.setItem(EVENT_KEY,selectedId);populateClasses()});
 // Direct public registration: no member account required.
 const next=document.getElementById('next'); if(next)next.onclick=async()=>{const n=name.value.trim(),em=email.value.trim(),ph=phone.value.trim(),ct=city.value.trim(),eid=eventSelect.value,cat=document.getElementById('category')?.value||'',w=document.getElementById('weight')?.value||'',a=document.getElementById('arm')?.value||'right';if(!n||!em||!ph||!eid||!cat){msg.innerHTML='<div class="notice">Please complete all required fields.</div>';return}if((cat==='Amateur'||cat==='Pro')&&!w){msg.innerHTML='<div class="notice">Amateur and Pro require a weight class.</div>';return}const division=cat+' — '+((cat==='Amateur'||cat==='Pro')?w:'Open Class');const payload={name:n,email:em,phone:ph,city:ct,eventId:eid,category:cat,right:(a==='right'||a==='both')?division:'',left:(a==='left'||a==='both')?division:''};try{msg.innerHTML='<div class="notice">Submitting registration...</div>';const r=await fetch('/api/public-registrations',{method:'POST',cache:'no-store',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw Error(d.error||'Registration failed');const e=eventById(eid);msg.innerHTML='<div class="notice"><strong>Registration complete.</strong><br><br>'+esc(n)+' is registered for <strong>'+esc(e?.name||'the selected FAA event')+'</strong>.<br>Category: <strong>'+esc(cat)+'</strong><br>Arm: <strong>'+esc(a==='both'?'Right and Left Arms':a==='left'?'Left Arm':'Right Arm')+'</strong>'+(cat==='Amateur'||cat==='Pro'?'<br>Weight Class: <strong>'+esc(w)+'</strong>':'')+'<br><br>Your registration has been saved. Payment will be connected at the final launch stage.</div>';next.textContent='REGISTRATION SAVED ✓';next.disabled=true}catch(e){msg.innerHTML='<div class="notice">'+esc(e.message)+'</div>'}};
 loadEvents();
})();


(()=>{
 const $=id=>document.getElementById(id),WEIGHTS=['154 lbs','176 lbs','198 lbs','220 lbs','242 lbs','243+ lbs'];
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 let CH=[];
 async function get(path){const r=await fetch(path),d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d}
 function championGrid(title,items,groupClass){return `<section class="champion-group ${groupClass||''}"><h2 class="champion-group-title">${esc(title)}</h2><div class="champions-grid">${items.flatMap(item=>['left','right'].map(side=>{const c=CH.find(x=>x.weight===item&&x.side===side),hand=side==='right'?'RIGHT HAND':'LEFT HAND';const label=groupClass==='pro'?'PRO CHAMPION':groupClass==='ladies'?'LADIES CHAMPION':'MASTERS CHAMPION';return `<article class="champion-card"><div class="champion-weight">${esc(item)}</div><div class="champion-arm">${hand} ${label}</div><div class="champion-photo">${c?.photo?`<img src="${c.photo}" alt="${esc(c.name||item+' '+hand+' '+label)}">`:'<span>OFFICIAL<br>CHAMPION<br>PHOTO</span>'}</div><div class="champion-name">${c?.name?esc(c.name):'Champion TBD'}</div></article>`})).join('')}</div></section>`}
 function renderChampions(){const b=$('championBoard');if(!b)return;b.innerHTML=championGrid('PRO CHAMPIONS',WEIGHTS,'pro')+championGrid('LADIES CHAMPIONS',['Ladies'],'ladies')+championGrid('MASTERS CHAMPIONS',['Masters'],'masters')}

 async function loadIntegrated(){try{const c=await get('/api/public/champions');CH=c.champions||[];renderChampions()}catch(e){if($('championBoard'))$('championBoard').innerHTML='<div class="notice">Champions are temporarily unavailable.</div>'}}
 const oldGo=window.go;window.go=function(id){oldGo(id);if(id==='champions')loadIntegrated()};document.addEventListener('DOMContentLoaded',loadIntegrated);setTimeout(loadIntegrated,250);
})();


(()=>{const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));async function loadPhotos(){try{const d=await fetch('/api/public/champions').then(r=>r.json()),a=(d.champions||[]).filter(x=>x.photo);if($('photos'))$('photos').innerHTML='<h1>PHOTOS</h1><div class="small" style="margin-bottom:12px">Official champion photos uploaded by Florida Armwrestling.</div><div class="launch-photo-grid">'+(a.length?a.map(x=>{const group=['154 lbs','176 lbs','198 lbs','220 lbs','242 lbs','243+ lbs'].includes(x.weight)?'Pro Champion':x.weight==='Ladies'?'Ladies Champion':'Masters Champion';return `<div><img src="${x.photo}" alt="${esc(x.name||'Champion')}"><span>${esc(x.name||'Champion')} • ${esc(x.weight)} • ${x.side==='right'?'Right Hand':'Left Hand'} • ${group}</span></div>`}).join(''):'<div class="notice">Official champion photos will appear here.</div>')+'</div>'}catch{}}const old=window.go;window.go=function(id){old(id);if(id==='photos')loadPhotos()};document.addEventListener('DOMContentLoaded',loadPhotos)})();


(()=>{const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));async function loadResults(){try{const d=await fetch('/api/public/results').then(r=>r.json()),rs=d.results||[];if($('results'))$('results').innerHTML='<h1>RESULTS</h1>'+(rs.length?rs.slice().sort((a,b)=>(a.place||99)-(b.place||99)).map(r=>`<div class="card list"><div class="avatar">${Number(r.place)||''}</div><div class="grow"><b>${esc(r.athlete)}</b><div class="small">${esc(r.division)}</div></div><b>${Number(r.place)||''}${Number(r.place)===1?'ST':Number(r.place)===2?'ND':Number(r.place)===3?'RD':'TH'}</b></div>`).join(''):'<div class="notice">Official results will appear here after events are completed and results are published.</div>')}catch{}}const old=window.go;window.go=function(id){old(id);if(id==='results')loadResults()};document.addEventListener('DOMContentLoaded',loadResults)})();

// FAA launch polish: current 2026 schedule, flyer cards, clean empty states, and safer registration flow.
(()=>{
  const EVENTS=[
    {id:'evt_garage_grinder_2',name:'Garage Grinder Classic 2',date:'2026-10-17',location:'Eclipse Tattoo, Davenport, FL',address:'2210 South Blvd W, Davenport, FL 33837',fee:40,unit:'per hand',start:'',doors:'',flyer:'flyer-garage-grinder.jpg',desc:'Classic arm wrestling tournament at Eclipse Tattoo.',prizes:['1st Place','2nd Place','3rd Place']},
    {id:'evt_lucky_u_motorcycle_pull',name:'Lucky U Cycles Motorcycle Pull',date:'2026-11-14',location:'Lucky U Cycles, Fort Myers, FL',address:'4607 Fowler St, Fort Myers, FL 33907',fee:40,unit:'per class',start:'12:00 PM',doors:'',flyer:'flyer-lucky-u.jpg',desc:'Every class winner gets a key. One winner takes home a motorcycle.',prizes:['All winners get a key','One winner takes home a motorcycle']},
    {id:'evt_florida_state_2026',name:'Florida State Championship',date:'2026-12-05',location:'Mudville Grill, Jacksonville, FL',address:'3105 Beach Blvd, Jacksonville, FL 32207',fee:40,unit:'per hand',start:'12:00 PM',doors:'11:00 AM',flyer:'flyer-state-championship.jpg',desc:'FAA sanctioned Florida State Championship. Trophies and bragging rights.',prizes:['1st Place','2nd Place','3rd Place']}
  ];
  const WEIGHTS=['154 lbs','176 lbs','198 lbs','220 lbs','242 lbs','243+ lbs'];
  const CATS=['Kids','Ladies','Amateur','Pro','Masters'];
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const fmtShort=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
  function eventById(id){const list=window.__FAA_REG_EVENTS||EVENTS;return list.find(e=>e.id===id)||list[0]}
  function card(e){return `<article class="launch-event"><img src="${e.flyer}" alt="${esc(e.name)} flyer"><div class="launch-event-body"><div class="launch-date">${fmtDate(e.date)}</div><h2>${esc(e.name)}</h2><div class="launch-meta">📍 ${esc(e.location)}</div><div class="launch-meta">💵 $${e.fee} ${e.unit}</div>${e.start?`<div class="launch-meta">⏱ Starts ${esc(e.start)}</div>`:''}<div class="launch-pills">${WEIGHTS.map(x=>`<span>${x}</span>`).join('')}</div><button class="cta" data-launch-event="${e.id}">VIEW EVENT →</button></div></article>`}
  function detail(e){return `<div class="launch-detail"><img src="${e.flyer}" class="launch-flyer" alt="${esc(e.name)} flyer"><div class="card body"><div class="red">OCTOBER • NOVEMBER • DECEMBER 2026</div><h1>${esc(e.name)}</h1><div class="small"><b>${fmtDate(e.date)}</b><br>${esc(e.location)}<br>${esc(e.address)}</div><div class="launch-stats"><div><b>$${e.fee}</b><span>${e.unit}</span></div><div><b>${e.start||'See flyer'}</b><span>${e.start?'Start time':'Event time'}</span></div><div><b>FAA</b><span>Official event</span></div></div><h3>WEIGHT CLASSES</h3><div class="launch-pills big">${WEIGHTS.map(x=>`<span>${x}</span>`).join('')}</div><h3>CATEGORIES</h3><div class="launch-pills big">${CATS.map(x=>`<span>${x}</span>`).join('')}</div><h3>EVENT NOTES</h3><div class="small">${esc(e.desc)}</div><h3>PRIZES</h3><ul class="launch-prizes">${e.prizes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="cta" data-go="register" data-prefill-event="${e.id}">REGISTER FOR THIS EVENT →</button><button class="cta outline" data-go="events">← BACK TO EVENTS</button></div></div>`}
  function schedule(){return `<div class="launch-schedule">${EVENTS.map((e,i)=>`<button class="schedule-row" data-launch-event="${e.id}"><div class="schedule-num">${String(i+1).padStart(2,'0')}</div><div class="grow"><b>${fmtDate(e.date)}</b><strong>${esc(e.name)}</strong><span>${esc(e.location)}</span></div><div class="schedule-arrow">→</div></button>`).join('')}</div>`}
  function photos(){return `<div class="launch-photo-grid">${EVENTS.map(e=>`<button data-launch-event="${e.id}"><img src="${e.flyer}" alt="${esc(e.name)} flyer"><span>${esc(e.name)}</span></button>`).join('')}</div><div class="notice">Official FAA event flyers for the 2026 season.</div>`}
  async function api(path,opt={}){const headers=Object.assign({'Content-Type':'application/json'},opt.headers||{});const t=localStorage.getItem('FAA_TOKEN');if(t)headers.Authorization='Bearer '+t;const r=await fetch(path,Object.assign({},opt,{headers}));const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d}
  async function loadEvents(){try{const d=await api('/api/events');return d.events?.length?d.events:EVENTS}catch{return EVENTS}}
  async function refreshPublic(){
    const list=await loadEvents();
    const mapped=list.map(x=>Object.assign({},eventById(x.id),x,{status:x.status||eventById(x.id)?.status||'open'}));
    window.__FAA_REG_EVENTS=mapped;
    const first=mapped[0]||EVENTS[0];
    if($('nextEventHero'))$('nextEventHero').innerHTML=`<img src="${first.flyer}" alt="${esc(first.name)} flyer"><div class="body"><div class="red">NEXT EVENT</div><h1>${esc(first.name)}</h1><div class="small"><b>${fmtDate(first.date)}</b> • ${esc(first.location)}</div><div class="small">$${first.entryFee||first.fee} ${first.entryUnit||first.unit}</div></div>`;
    if($('eventCatalog'))$('eventCatalog').innerHTML=mapped.map(card).join('');
    if($('scheduleList'))$('scheduleList').innerHTML=schedule();
    if($('eventSelect'))$('eventSelect').innerHTML=mapped.map(e=>`<option value="${e.id}">${fmtShort(e.date)} — ${esc(e.name)}</option>`).join('');
    if($('right'))$('right').innerHTML='<option value="">Select class</option>'+WEIGHTS.map(x=>`<option>${x}</option>`).join('');
    if($('left'))$('left').innerHTML='<option value="">Select class</option>'+WEIGHTS.map(x=>`<option>${x}</option>`).join('');
  }
  function openEvent(id){const e=eventById(id);if($('eventDetails'))$('eventDetails').innerHTML=detail(e);window.__faaEvent=e;go('event')}
  const CHAMPION_WEIGHTS=['154 lbs','176 lbs','198 lbs','220 lbs','242 lbs','243+ lbs'];
  function renderChampions(){
    const board=$('championBoard'); if(!board)return;
    board.innerHTML=CHAMPION_WEIGHTS.map((weight,i)=>`<section class="champion-class">
      <h2>${esc(weight)}</h2>
      <div class="champion-pair">
        <div class="champion-slot">
          <div class="champion-arm">RIGHT HAND CHAMPION</div>
          <div class="champion-photo" id="champPhotoRight${i}"><span>CHAMPION<br>PHOTO<br><small>WEARING THE BELT</small></span></div>
          <input class="champion-name" id="champNameRight${i}" placeholder="Champion name" aria-label="${esc(weight)} right hand champion name">
          <input class="champion-upload" id="champUploadRight${i}" type="file" accept="image/*" aria-label="Upload ${esc(weight)} right hand champion photo">
        </div>
        <div class="champion-slot">
          <div class="champion-arm">LEFT HAND CHAMPION</div>
          <div class="champion-photo" id="champPhotoLeft${i}"><span>CHAMPION<br>PHOTO<br><small>WEARING THE BELT</small></span></div>
          <input class="champion-name" id="champNameLeft${i}" placeholder="Champion name" aria-label="${esc(weight)} left hand champion name">
          <input class="champion-upload" id="champUploadLeft${i}" type="file" accept="image/*" aria-label="Upload ${esc(weight)} left hand champion photo">
        </div>
      </div>
      <div class="champion-help">Add the champion's name and choose a belt photo. Photo previews are shown on this device.</div>
    </section>`).join('');
    CHAMPION_WEIGHTS.forEach((weight,i)=>{
      ['Right','Left'].forEach(side=>{
        const upload=$(`champUpload${side}${i}`), photo=$(`champPhoto${side}${i}`), name=$(`champName${side}${i}`);
        if(!upload||!photo)return;
        upload.onchange=()=>{
          const file=upload.files&&upload.files[0]; if(!file)return;
          if(!file.type.startsWith('image/'))return;
          const reader=new FileReader();
          reader.onload=()=>{photo.innerHTML='<img alt="'+esc(weight+' '+side+' hand champion wearing the belt')+'" src="'+reader.result+'">';};
          reader.readAsDataURL(file);
        };
        name.oninput=()=>{name.value=name.value.slice(0,80)};
      });
    });
  }
  function cleanResults(){if($('results'))$('results').innerHTML='<h1>RESULTS</h1><div class="notice">Official results will appear here after FAA events are completed and results are published.</div>';if($('brackets'))$('brackets').innerHTML='<h1>LIVE BRACKETS</h1><div class="notice">Live brackets will appear here during an active FAA event.</div>'}
  function cleanChampions(){return;}
  function cleanHome(){if($('home')){const n=$('home').querySelector('.small');if(n&&n.textContent.includes('Florida Armwrestling Kicks Off'))n.textContent='Official 2026 FAA events, registration, results and event photos.'}}
  function savePublicReceipt(items){try{const all=JSON.parse(localStorage.getItem('FAA_PUBLIC_REGS')||'[]');all.unshift(...items);localStorage.setItem('FAA_PUBLIC_REGS',JSON.stringify(all).slice(0,200000));}catch{}}
  function renderMyRegistrations(){
    const box=$('myList');if(!box)return;
    try{
      const rows=JSON.parse(localStorage.getItem('FAA_PUBLIC_REGS')||'[]');
      box.innerHTML=rows.length?rows.map(r=>`<div class="card form"><span class="pill open">${esc(String(r.status||'PENDING PAYMENT').replace('_',' ').toUpperCase())}</span><h2>${esc(r.eventName||'FAA Event')}</h2><div class="small"><b>${esc(r.name||'')}</b><br>${esc(r.email||'')}<br>${esc(r.division||'')} • ${esc(r.arm||'')}<br>${r.date?esc(fmtDate(r.date))+'<br>':''}Registration ID: ${esc(r.id||'')}</div></div>`).join(''):'<div class="notice">No registrations saved on this device yet.</div>';
    }catch{box.innerHTML='<div class="notice">No registrations saved on this device yet.</div>'}
  }
  function setupRegistration(){
    const next=$('next');if(!next)return;
    const edit=$('editRegistration'),eventSelect=$('eventSelect'),cat=$('category'),wrap=$('weightWrap'),weight=$('weight'),arm=$('arm'),summary=$('registrationSummary');
    const showMsg=(text)=>{if($('msg'))$('msg').innerHTML='<div class="notice">'+esc(text)+'</div>'};
    const selectedEvent=()=>eventById(eventSelect?.value);
    function syncCategory(){
      const e=selectedEvent();
      if(!cat)return;
      const cats=Array.isArray(e?.categories)&&e.categories.length?e.categories:CATS;
      cat.innerHTML='<option value="">Select category</option>'+cats.map(x=>`<option>${esc(x)}</option>`).join('');
      syncWeight();updateSummary();
    }
    function syncWeight(){
      const e=selectedEvent(),isWeighted=cat&&['Amateur','Pro'].includes(cat.value);
      if(wrap)wrap.style.display=isWeighted?'block':'none';
      if(!weight)return;
      const classes=Array.isArray(e?.weightClasses)&&e.weightClasses.length?e.weightClasses:WEIGHTS;
      weight.innerHTML='<option value="">Select weight class</option>'+classes.map(x=>`<option>${esc(x)}</option>`).join('');
      if(!isWeighted)weight.value='';
      updateSummary();
    }
    function currentData(){
      const n=$('name')?.value.trim(),em=$('email')?.value.trim().toLowerCase(),ph=$('phone')?.value.trim(),ct=$('city')?.value.trim(),eid=eventSelect?.value,category=cat?.value,wt=weight?.value,armValue=arm?.value||'right',e=selectedEvent();
      const division=category+' — '+(['Amateur','Pro'].includes(category)?wt:'Open Class');
      const arms=armValue==='both'?['Right Arm','Left Arm']:[armValue==='left'?'Left Arm':'Right Arm'];
      const total=(String(e?.entryUnit||'').toLowerCase().includes('hand')?Number(e?.entryFee||0)*arms.length:Number(e?.entryFee||0));
      return {n,em,ph,ct,eid,category,wt,armValue,e,division,arms,total};
    }
    function updateSummary(){
      if(!summary)return;
      const x=currentData();
      if(!x.n&&!x.em&&!x.ph&&!x.eid&&!x.category){summary.style.display='none';summary.innerHTML='';return}
      summary.innerHTML='<h3 style="margin-top:0">REGISTRATION DETAILS</h3><div class="small"><b>Athlete</b><br>'+esc(x.n||'—')+'<br>'+esc(x.em||'—')+'<br>'+esc(x.ph||'—')+(x.ct?'<br>'+esc(x.ct):'')+'<br><br><b>Event</b><br>'+esc(x.e?.name||'—')+(x.e?.date?'<br>'+esc(fmtDate(x.e.date)):'')+(x.e?.location?'<br>'+esc(x.e.location):'')+'<br><br><b>Division</b><br>'+esc(x.division===' — Open Class'?'Open Class':x.division||'—')+'<br><b>Arm</b><br>'+esc(x.arms.join(' + '))+'<br><br><b>Registration Fee</b><br>$'+x.total.toFixed(2)+' '+esc(x.e?.entryUnit||'')+'<br><br><span class="muted">Your registration will be saved as Pending Payment.</span></div>';
      summary.style.display='block';
    }
    eventSelect?.addEventListener('change',()=>{window.__faaEvent=selectedEvent();syncCategory();});
    cat?.addEventListener('change',()=>{syncWeight();});
    [weight,arm,$('name'),$('email'),$('phone'),$('city')].forEach(el=>el?.addEventListener('input',updateSummary));
    syncCategory();updateSummary();
    edit?.addEventListener('click',()=>{$('name')?.focus();window.scrollTo({top:0,behavior:'smooth'});});
    next.onclick=async()=>{
      const x=currentData();
      if(!x.n||!x.em||!x.ph||!x.eid||!x.category){showMsg('Please complete all required fields.');return}
      if(x.n.length<2){showMsg('Please enter your full name.');return}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.em)){showMsg('Please enter a valid email address.');return}
      if(x.ph.replace(/\D/g,'').length<7){showMsg('Please enter a valid phone number.');return}
      if(!x.e||x.e.status!=='open'){showMsg('This event is not currently open for registration.');return}
      if(['Amateur','Pro'].includes(x.category)&&!x.wt){showMsg('Please select a weight class.');return}
      next.disabled=true;next.textContent='SUBMITTING…';showMsg('');
      try{
        const payload={name:x.n,email:x.em,phone:x.ph,city:x.ct,eventId:x.eid,category:x.category,right:(x.armValue==='right'||x.armValue==='both')?(['Amateur','Pro'].includes(x.category)?x.wt:x.category):'',left:(x.armValue==='left'||x.armValue==='both')?(['Amateur','Pro'].includes(x.category)?x.wt:x.category):''};
        const r=await fetch('/api/public-registrations',{method:'POST',cache:'no-store',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),d=await r.json();
        if(!r.ok)throw Error(d.error||'Registration failed');
        const ids=(d.registrations||[]).map(x=>x.id).join(', ');
        savePublicReceipt((d.registrations||[]).map(r=>({id:r.id,status:r.status,name:x.n,email:x.em,eventName:x.e.name,date:x.e.date,division:x.division,arm:r.arm==='right'?'Right Arm':'Left Arm'})));
        if($('confirmationText'))$('confirmationText').innerHTML='<strong>'+esc(x.n)+'</strong><br><br>'+esc(x.e.name)+'<br>'+esc(fmtDate(x.e.date))+'<br>'+esc(x.division)+'<br>'+esc(x.arms.join(' + '))+'<br><br>Status: <strong>PENDING PAYMENT</strong><br><br>Registration ID: '+esc(ids||'Saved')+'<br><br>Your registration is saved. Online payment will be connected at the final launch stage.';
        next.textContent='REGISTRATION SAVED ✓';renderMyRegistrations();go('confirmation');
      }catch(err){next.disabled=false;next.textContent='SUBMIT REGISTRATION →';showMsg(err&&err.message==='Failed to fetch'?'Unable to reach the registration server. Please try again.':(err?.message||'Registration failed.'))}
    };
  }
  window.go=function(id){
    if(id==='more')id='my';
    document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
    const t=$(id);if(!t)return;t.classList.add('active');
    document.querySelectorAll('[data-go]').forEach(x=>x.classList.toggle('active',x.dataset.go===id));
    if(id==='results'||id==='brackets')cleanResults();
    if(id==='champions')cleanChampions();
    if(id==='home')cleanHome();
    if(id==='photos'&&$('photos'))$('photos').innerHTML='<h1>PHOTOS</h1>'+photos();
    if(id==='schedule'&&$('scheduleList'))$('scheduleList').innerHTML=schedule();
    if(id==='events'&&$('eventCatalog'))$('eventCatalog').innerHTML=EVENTS.map(card).join('');
    if(id==='register'&&window.__faaEvent&&$('eventSelect'))$('eventSelect').value=window.__faaEvent.id;
    if(id==='register'&&$('next')){$('next').disabled=false;$('next').textContent='REVIEW REGISTRATION →'}
    if(id==='my')renderMyRegistrations();
    window.scrollTo(0,0);
  };
  document.addEventListener('click',e=>{const b=e.target.closest('[data-launch-event]');if(b){e.preventDefault();openEvent(b.dataset.launchEvent);return}const p=e.target.closest('[data-prefill-event]');if(p){window.__faaEvent=eventById(p.dataset.prefillEvent);setTimeout(()=>{if($('eventSelect'))$('eventSelect').value=p.dataset.prefillEvent},0)}});
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{refreshPublic();setupRegistration();cleanResults();cleanChampions();cleanHome()},50)});
  setTimeout(()=>{refreshPublic();setupRegistration();cleanResults();cleanChampions();cleanHome()},100);
  window.FAA_LAUNCH_EVENTS=EVENTS;
})();


// V40: restore the global navigation click handler. This uses event delegation so
// buttons rendered later (event details, confirmation, etc.) work too.
document.addEventListener('click', function(e){
  const b=e.target.closest('[data-go]');
  if(!b) return;
  e.preventDefault();
  if(typeof window.go==='function') window.go(b.dataset.go);
});
