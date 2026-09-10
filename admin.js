
const $=id=>document.getElementById(id);let data=null;const tokenKey='faa_token';
const flyer={evt_garage_grinder_2:'flyer-garage-grinder.jpg',evt_lucky_u_motorcycle_pull:'flyer-lucky-u.jpg',evt_florida_state_2026:'flyer-state-championship.jpg'};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function api(p,o={}){const h=Object.assign({'Content-Type':'application/json'},o.headers||{}),t=localStorage.getItem(tokenKey);if(t)h.Authorization='Bearer '+t;const r=await fetch(p,Object.assign({},o,{headers:h})),d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d}
async function login(){localStorage.removeItem(tokenKey);try{const d=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('pw').value})});if(d.user.role!=='admin')throw Error('This account is not an admin.');localStorage.setItem(tokenKey,d.token);$('login').classList.add('hide');$('app').classList.remove('hide');await load()}catch(e){$('loginMsg').textContent=e.message}}
async function autoAdmin(){const t=localStorage.getItem(tokenKey);if(!t)return;try{const d=await api('/api/me');if(d.user&&d.user.role==='admin'){ $('login').classList.add('hide'); $('app').classList.remove('hide'); await load(); }}catch(e){}}
window.addEventListener('load',autoAdmin);
function logout(){localStorage.removeItem(tokenKey);location.reload()}
async function load(){try{data=await api('/api/admin/dashboard');renderAll()}catch(e){$('login').classList.remove('hide');$('app').classList.add('hide');$('loginMsg').textContent=e.message}}
function tab(id,b){document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(id==='dash'||id==='roster'||id==='athletes'||id==='results')load()}
function renderAll(){renderDash();renderEvents();renderRoster();renderAthletes();renderResults();renderChampions();renderPhotos()}
function renderDash(){const regs=data.registrations.filter(r=>r.status!=='cancelled'),future=data.events.filter(e=>e.date>='2026-09-09');$('stats').innerHTML=[['Events',data.events.length],['Athletes',new Set(regs.map(r=>r.athleteEmail||r.userId).filter(Boolean)).size],['Active Registrations',regs.length],['Published Results',data.results.length]].map(x=>`<div class="card"><div class="muted">${x[0]}</div><div class="big">${x[1]}</div></div>`).join('');$('upcoming').innerHTML=future.map(e=>`<div style="padding:10px 0;border-bottom:1px solid #292929"><b>${esc(e.name)}</b><div class="small">${e.date} • ${esc(e.location)} • $${e.entryFee} ${esc(e.entryUnit||'')}</div></div>`).join('')||'<div class="muted">No upcoming events.</div>';$('recent').innerHTML=data.registrations.slice(-8).reverse().map(r=>{const u=data.users.find(x=>x.id===r.userId),e=data.events.find(x=>x.id===r.eventId),name=u?.name||r.athleteName||'Unknown',email=u?.email||r.athleteEmail||'';return `<div style="padding:9px 0;border-bottom:1px solid #292929"><b>${esc(name)}</b> — ${esc(e?.name||r.eventId)}<div class="small">${esc(email)} • ${esc(r.division)} • ${esc(r.arm||'')} • <span class="badge">${esc(r.status)}</span></div></div>`}).join('')||'<div class="muted">No registrations yet.</div>'}
function renderEvents(){const sorted=[...data.events].sort((a,b)=>a.date.localeCompare(b.date));$('eventsList').innerHTML=sorted.map(e=>`<div class="card event-admin"><img src="${e.flyer||flyer[e.id]||''}" onerror="this.style.display='none'" alt=""><div><div class="topline"><h2>${esc(e.name)}</h2><span class="badge ${e.status==='open'?'open':'closed'}">${esc(e.status)}</span></div><div class="small"><b>${esc(e.date)}</b> • ${esc(e.location)}<br>${esc(e.address)}<br>$${Number(e.entryFee||0)} ${esc(e.entryUnit||'')} ${e.startTime?'• Starts '+esc(e.startTime):''} ${e.doorsTime?'• Doors '+esc(e.doorsTime):''}</div><div class="actions"><button class="btn" onclick="toggleEdit('${e.id}')">EDIT</button><button class="btn" onclick="toggleStatus('${e.id}')">${e.status==='open'?'CLOSE REGISTRATION':'OPEN REGISTRATION'}</button></div><div id="edit-${e.id}" class="event-edit hide">${editForm(e)}</div></div></div>`).join('')}
function editForm(e){return `<div class="row"><div><label>Name</label><input id="n-${e.id}" value="${esc(e.name)}"></div><div><label>Date</label><input id="d-${e.id}" type="date" value="${esc(e.date)}"></div><div><label>Location</label><input id="l-${e.id}" value="${esc(e.location)}"></div><div><label>Address</label><input id="a-${e.id}" value="${esc(e.address)}"></div><div><label>Fee</label><input id="f-${e.id}" type="number" value="${Number(e.entryFee||0)}"></div><div><label>Fee Unit</label><select id="u-${e.id}"><option ${e.entryUnit==='per hand'?'selected':''}>per hand</option><option ${e.entryUnit==='per class'?'selected':''}>per class</option></select></div><div><label>Start</label><input id="s-${e.id}" value="${esc(e.startTime||'')}"></div><div><label>Doors</label><input id="o-${e.id}" value="${esc(e.doorsTime||'')}"></div></div><label>Replace Event Flyer</label><input id="ef-${e.id}" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewEventEditFlyer('${e.id}',this)"><div id="efp-${e.id}" class="small" style="margin-top:7px"></div><label>Description</label><textarea id="x-${e.id}">${esc(e.description||'')}</textarea><div class="actions"><button class="btn primary" onclick="saveEvent('${e.id}')">SAVE CHANGES</button></div>`}
function toggleEdit(id){$('edit-'+id).classList.toggle('hide')}
async function toggleStatus(id){const e=data.events.find(x=>x.id===id);try{await api('/api/admin/events/'+id,{method:'PATCH',body:JSON.stringify({status:e.status==='open'?'closed':'open'})});await load()}catch(err){alert(err.message)}}
async function saveEvent(id){try{await api('/api/admin/events/'+id,{method:'PATCH',body:JSON.stringify({name:$('n-'+id).value,date:$('d-'+id).value,location:$('l-'+id).value,address:$('a-'+id).value,entryFee:Number($('f-'+id).value||0),entryUnit:$('u-'+id).value,startTime:$('s-'+id).value,doorsTime:$('o-'+id).value,description:$('x-'+id).value,flyer:$('ef-'+id)?.dataset.image||undefined})});await load()}catch(e){alert(e.message)}}
async function createEvent(){try{await api('/api/admin/events',{method:'POST',body:JSON.stringify({name:$('ename').value,date:$('edate').value,location:$('eloc').value,address:$('eaddress').value,entryFee:Number($('efee').value||0),entryUnit:$('eunit').value,startTime:$('estart').value,doorsTime:$('edoors').value,status:$('estatus').value,flyer:$('eflyer').dataset.image||'',weightClasses:$('eweights').value.split(',').map(x=>x.trim()).filter(Boolean),divisions:$('eweights').value.split(',').map(x=>x.trim()).filter(Boolean),categories:$('ecats').value.split(',').map(x=>x.trim()).filter(Boolean),prizes:$('eprizes').value.split('\n').map(x=>x.trim()).filter(Boolean),description:$('edesc').value})});$('eventMsg').textContent='Event created.';await load()}catch(e){$('eventMsg').textContent=e.message}}
function renderRoster(){if(!$('regTable')||!data)return;const q=($('regSearch')?.value||'').toLowerCase();const rows=data.registrations.filter(r=>{const u=data.users.find(x=>x.id===r.userId),e=data.events.find(x=>x.id===r.eventId),name=u?.name||r.athleteName||'',email=u?.email||r.athleteEmail||'';return !q||`${name} ${email} ${e?.name||''} ${r.division} ${r.arm||''}`.toLowerCase().includes(q)}).map(r=>{const u=data.users.find(x=>x.id===r.userId),e=data.events.find(x=>x.id===r.eventId),name=u?.name||r.athleteName||'Unknown',email=u?.email||r.athleteEmail||'';return `<tr><td><b>${esc(name)}</b><br><span class="muted">${esc(email)}</span><br><span class="muted">${esc(r.phone||'')}</span></td><td>${esc(e?.name||r.eventId)}</td><td>${esc(r.category||'')}<br>${esc(r.division)}<br>${esc(r.arm||'')}</td><td><span class="badge">${esc(r.status)}</span></td><td><div class="actions"><button class="btn" onclick="setStatus('${r.id}','checked_in')">CHECK IN</button><button class="btn" onclick="setStatus('${r.id}','cancelled')">CANCEL</button></div></td></tr>`});$('regTable').innerHTML=rows.length?`<table><thead><tr><th>Athlete</th><th>Event</th><th>Division</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.join('')}</tbody></table>`:'<div class="muted">No matching registrations.</div>'}
async function setStatus(id,status){try{await api('/api/admin/registrations/'+id,{method:'PATCH',body:JSON.stringify({status})});await load()}catch(e){alert(e.message)}}
function renderAthletes(){const rows=data.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td><span class="badge">${esc(u.role)}</span></td><td>${data.registrations.filter(r=>r.userId===u.id&&r.status!=='cancelled').length}</td></tr>`);$('athTable').innerHTML=rows.length?`<table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Registrations</th></tr></thead><tbody>${rows.join('')}</tbody></table>`:'<div class="muted">No athletes yet.</div>'}
function renderResults(){$('revent').innerHTML=data.events.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('');const rows=data.results.map(r=>{const e=data.events.find(x=>x.id===r.eventId);return `<tr><td>${esc(e?.name||r.eventId)}</td><td>${esc(r.division)}</td><td>${esc(r.athlete)}</td><td>${Number(r.place)||''}</td></tr>`});$('resultsTable').innerHTML=rows.length?`<table><thead><tr><th>Event</th><th>Class</th><th>Athlete</th><th>Place</th></tr></thead><tbody>${rows.join('')}</tbody></table>`:'<div class="muted">No results published yet.</div>'}
async function addResult(){try{await api('/api/admin/results',{method:'POST',body:JSON.stringify({eventId:$('revent').value,division:$('rdiv').value,athlete:$('rath').value,place:Number($('rplace').value)})});$('resultMsg').textContent='Result saved.';await load()}catch(e){$('resultMsg').textContent=e.message}}
function renderPhotos(){const box=$('adminPhotos');if(!box||!data)return;const arr=data.photos||[];box.innerHTML=arr.length?arr.map(x=>`<div class=\"card\"><img class=\"admin-photo\" src=\"${x.photo}\" alt=\"${esc(x.title)}\"><h2 style=\"margin-top:9px\">${esc(x.title)}</h2><div class=\"small\">${esc(x.caption||'')}</div><div class=\"actions\"><button class=\"btn\" onclick=\"removePhoto('${x.id}')\">DELETE</button></div></div>`).join(''):'<div class=\"muted\">No photos uploaded yet.</div>'}
function resizeImage(file){
  return new Promise((resolve,reject)=>{
    if(!file || !/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)){reject(new Error('Please choose a JPG, PNG or WebP image.'));return}
    const r=new FileReader();
    r.onerror=()=>reject(new Error('Could not read that image.'));
    r.onload=()=>{
      const im=new Image();
      im.onerror=()=>reject(new Error('Could not decode that image.'));
      im.onload=()=>{
        let max=900, q=.68, attempts=0;
        const make=()=>{
          const scale=Math.min(1,max/Math.max(im.width,im.height));
          const c=document.createElement('canvas');
          c.width=Math.max(1,Math.round(im.width*scale));
          c.height=Math.max(1,Math.round(im.height*scale));
          const ctx=c.getContext('2d');
          ctx.drawImage(im,0,0,c.width,c.height);
          const out=c.toDataURL('image/jpeg',q);
          if(out.length>850000 && attempts<8){
            attempts++; max=Math.max(450,Math.round(max*.82)); q=Math.max(.5,q-.04);
            setTimeout(make,0); return;
          }
          if(out.length>1100000){reject(new Error('That image is too large. Please choose a smaller photo.'));return}
          resolve(out);
        };
        make();
      };
      im.src=r.result;
    };
    r.readAsDataURL(file);
  });
}
async function previewGalleryPhoto(input){const f=input.files?.[0];if(!f)return;const box=$('photoPreview');box.textContent='Preparing photo…';try{input.dataset.image=await resizeImage(f);box.innerHTML='<img src="'+input.dataset.image+'" style="max-width:100%;max-height:160px;border-radius:8px" alt="Preview">'}catch{box.textContent='Could not read that image.'}}
async function savePhoto(){
  const title=$('photoTitle').value.trim(),caption=$('photoCaption').value.trim(),photo=$('photoFile').dataset.image||'';
  const msg=$('photoMsg'); const btn=document.querySelector('#photos button[onclick="savePhoto()"]');
  if(!title){msg.textContent='Enter a photo title.';return}
  if(!photo){msg.textContent='Choose a photo first and wait for the preview to finish.';return}
  if(btn){btn.disabled=true;btn.textContent='UPLOADING…'} msg.textContent='Saving photo…';
  try{
    await api('/api/admin/photos',{method:'POST',body:JSON.stringify({title,caption,photo})});
    $('photoTitle').value='';$('photoCaption').value='';$('photoFile').value='';$('photoFile').dataset.image='';$('photoPreview').innerHTML='';msg.textContent='Photo added successfully.';await load();
  }catch(e){msg.textContent='Upload failed: '+e.message}
  finally{if(btn){btn.disabled=false;btn.textContent='ADD PHOTO'}}
}
async function removePhoto(id){if(!confirm('Delete this photo from the public Photos page?'))return;try{await api('/api/admin/photos/'+id,{method:'DELETE'});await load()}catch(e){alert(e.message)}}
async function previewEventFlyer(input){const f=input.files?.[0];if(!f)return;const box=$('eflyerPreview');box.textContent='Preparing flyer…';try{input.dataset.image=await resizeImage(f);box.innerHTML='<img src="'+input.dataset.image+'" style="max-width:280px;max-height:180px;border-radius:8px" alt="Flyer preview">'}catch{box.textContent='Could not read that image.'}}
async function previewEventEditFlyer(id,input){const f=input.files?.[0];if(!f)return;const box=$('efp-'+id);box.textContent='Preparing flyer…';try{input.dataset.image=await resizeImage(f);box.innerHTML='<img src="'+input.dataset.image+'" style="max-width:280px;max-height:180px;border-radius:8px" alt="Flyer preview">'}catch{box.textContent='Could not read that image.'}}
function renderChampions(){
 const list=$('championAdminList');if(!list||!data)return;
 const weights=['154 lbs','176 lbs','198 lbs','220 lbs','242 lbs','243+ lbs'];
 const groups=[{title:'PRO CHAMPIONS',items:weights,kind:'pro'},{title:'LADIES CHAMPIONS',items:['Ladies'],kind:'ladies'},{title:'MASTERS CHAMPIONS',items:['Masters'],kind:'masters'}];
 list.innerHTML=groups.map(g=>`<section class="champion-admin-group"><h2 class="champion-admin-title">${g.title}</h2><div class="champ-admin-grid">${g.items.flatMap(w=>['right','left'].map(side=>{
   const c=(data.champions||[]).find(x=>x.weight===w&&x.side===side); const key=(g.kind+'-'+side+'-'+w.replace(/[^a-z0-9]/gi,'')).toLowerCase();
   const displayWeight=g.kind==='pro'?w:g.title.replace(' CHAMPIONS','');
   const label=g.kind==='pro'?'PRO CHAMPION':g.kind==='ladies'?'LADIES CHAMPION':'MASTERS CHAMPION';
   return `<div class="champ-admin-card"><div class="muted">${esc(displayWeight)}</div><h2>${side==='right'?'RIGHT HAND':'LEFT HAND'} ${label}</h2>${c?.photo?`<img class="champ-admin-photo" src="${c.photo}" alt="${esc(c.name||'Champion photo')}">`:'<div class="champ-admin-empty">UPLOAD OFFICIAL<br>CHAMPION PHOTO</div>'}<label>Champion Name</label><input id="name-${key}" value="${esc(c?.name||'')}" placeholder="Champion name"><label class="file-label">Official Champion Photo</label><input id="file-${key}" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewChampion('${key}',this)"><div id="preview-${key}" class="small" style="margin-top:7px"></div><div class="actions"><button type="button" class="btn primary" onclick="saveChampion('${esc(w)}','${side}','${key}')">SAVE</button><span class="champ-save-msg muted"></span>${c?`<button class="btn" onclick="removeChampion('${c.id}')">CLEAR</button>`:''}</div></div>`;
 })).join('')}</div></section>`).join('');
}

async function previewChampion(key,input){const f=input.files?.[0],box=$('preview-'+key);if(!f)return;box.textContent='Preparing photo…';try{input.dataset.image=await resizeImage(f);box.innerHTML='<img src="'+input.dataset.image+'" style="max-width:100%;max-height:150px;border-radius:8px" alt="Preview">'}catch{box.textContent='Could not read that image.'}}
async function saveChampion(weight,side,key){
  const name=$('name-'+key).value.trim(),input=$('file-'+key),photo=input?.dataset.image||'';
  const card=input?.closest('.champ-admin-card'),btn=card?.querySelector('button[onclick^="saveChampion("]');
  const status=card?.querySelector('.champ-save-msg');
  if(!name){if(status)status.textContent='Enter the champion name.';return}
  if(!photo && !(data.champions||[]).some(c=>c.weight===weight&&c.side===side)){if(status)status.textContent='Choose the champion photo first.';return}
  if(btn){btn.disabled=true;btn.textContent='UPLOADING…'} if(status)status.textContent='Saving champion…';
  try{
    await api('/api/admin/champions',{method:'POST',body:JSON.stringify({weight,side,name,photo})});
    if(status)status.textContent='Champion saved successfully.';await load();
  }catch(e){if(status)status.textContent='Upload failed: '+e.message}
  finally{if(btn){btn.disabled=false;btn.textContent='SAVE'}}
}
async function removeChampion(id){if(!confirm('Clear this champion slot?'))return;try{await api('/api/admin/champions/'+id,{method:'DELETE'});await load()}catch(e){alert(e.message)}}
if(localStorage.getItem(tokenKey))load();
