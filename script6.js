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
    const mapped=list.map(x=>Object.assign({},eventById(x.id),x));
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
    const eventSelect=$('eventSelect'),cat=$('category'),wrap=$('weightWrap'),weight=$('weight'),arm=$('arm'),review=$('review');
    const showMsg=(text)=>{if($('msg'))$('msg').innerHTML='<div class="notice">'+esc(text)+'</div>'};
    const selectedEvent=()=>eventById(eventSelect?.value);
    function syncCategory(){
      const e=selectedEvent();
      if(!cat)return;
      const cats=Array.isArray(e?.categories)&&e.categories.length?e.categories:CATS;
      cat.innerHTML='<option value="">Select category</option>'+cats.map(x=>`<option>${esc(x)}</option>`).join('');
      syncWeight();
    }
    function syncWeight(){
      const e=selectedEvent(),isWeighted=cat&&['Amateur','Pro'].includes(cat.value);
      if(wrap)wrap.style.display=isWeighted?'block':'none';
      if(!weight)return;
      const classes=Array.isArray(e?.weightClasses)&&e.weightClasses.length?e.weightClasses:WEIGHTS;
      weight.innerHTML='<option value="">Select weight class</option>'+classes.map(x=>`<option>${esc(x)}</option>`).join('');
      if(!isWeighted)weight.value='';
    }
    eventSelect?.addEventListener('change',()=>{window.__faaEvent=selectedEvent();syncCategory();if(review)review.style.display='none';});
    cat?.addEventListener('change',()=>{syncWeight();if(review)review.style.display='none';});
    [weight,arm,$('name'),$('email'),$('phone'),$('city')].forEach(el=>el?.addEventListener('input',()=>{if(review)review.style.display='none';}));
    syncCategory();
    next.onclick=async()=>{
      const n=$('name')?.value.trim(),em=$('email')?.value.trim().toLowerCase(),ph=$('phone')?.value.trim(),ct=$('city')?.value.trim(),eid=eventSelect?.value,category=cat?.value,wt=weight?.value,armValue=arm?.value||'right',e=selectedEvent();
      if(!n||!em||!ph||!eid||!category){showMsg('Please complete all required fields.');return}
      if(n.length<2){showMsg('Please enter your full name.');return}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){showMsg('Please enter a valid email address.');return}
      if(ph.replace(/\D/g,'').length<7){showMsg('Please enter a valid phone number.');return}
      if(!e||e.status!=='open'){showMsg('This event is not currently open for registration.');return}
      if(['Amateur','Pro'].includes(category)&&!wt){showMsg('Please select a weight class.');return}
      const division=category+' — '+(['Amateur','Pro'].includes(category)?wt:'Open Class');
      const arms=armValue==='both'?['Right Arm','Left Arm']:[armValue==='left'?'Left Arm':'Right Arm'];
      const total=(String(e.entryUnit||'').toLowerCase().includes('hand')?Number(e.entryFee||0)*arms.length:Number(e.entryFee||0));
      review.innerHTML='<h3 style="margin-top:0">REVIEW YOUR REGISTRATION</h3><div class="small"><b>Athlete</b><br>'+esc(n)+'<br>'+esc(em)+'<br>'+esc(ph)+(ct?'<br>'+esc(ct):'')+'<br><br><b>Event</b><br>'+esc(e.name)+'<br>'+esc(fmtDate(e.date))+'<br>'+esc(e.location)+'<br><br><b>Division</b><br>'+esc(division)+'<br><b>Arm</b><br>'+esc(arms.join(' + '))+'<br><br><b>Registration Fee</b><br>$'+total.toFixed(2)+' '+esc(e.entryUnit||'')+'<br><br><span class="muted">Your registration will be saved as Pending Payment. No card will be charged.</span></div><div class="actions"><button class="cta" id="confirmRegistration">CONFIRM & SUBMIT →</button><button class="cta outline" id="editRegistration">← EDIT</button></div>';
      review.style.display='block';
      $('confirmRegistration').onclick=async()=>{
        const confirmBtn=$('confirmRegistration');confirmBtn.disabled=true;confirmBtn.textContent='SUBMITTING…';
        try{
          const payload={name:n,email:em,phone:ph,city:ct,eventId:eid,category,right:(armValue==='right'||armValue==='both')?(['Amateur','Pro'].includes(category)?wt:category):'',left:(armValue==='left'||armValue==='both')?(['Amateur','Pro'].includes(category)?wt:category):''};
          const r=await fetch('/api/public-registrations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),d=await r.json();
          if(!r.ok)throw Error(d.error||'Registration failed');
          const ids=(d.registrations||[]).map(x=>x.id).join(', ');
          savePublicReceipt((d.registrations||[]).map(x=>({id:x.id,status:x.status,name:n,email:em,eventName:e.name,date:e.date,division:division,arm:x.arm==='right'?'Right Arm':'Left Arm'})));
          if($('confirmationText'))$('confirmationText').innerHTML='<strong>'+esc(n)+'</strong><br><br>'+esc(e.name)+'<br>'+esc(fmtDate(e.date))+'<br>'+esc(division)+'<br>'+esc(arms.join(' + '))+'<br><br>Status: <strong>PENDING PAYMENT</strong><br><br>Registration ID: '+esc(ids||'Saved')+'<br><br>Your registration is saved. Online payment will be connected at the final launch stage.';
          review.style.display='none';next.textContent='REGISTRATION SAVED ✓';next.disabled=true;renderMyRegistrations();go('confirmation');
        }catch(err){confirmBtn.disabled=false;confirmBtn.textContent='CONFIRM & SUBMIT →';showMsg(err.message)}
      };
      $('editRegistration').onclick=()=>{review.style.display='none';window.scrollTo(0,0)};
      review.scrollIntoView({behavior:'smooth',block:'start'});
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
