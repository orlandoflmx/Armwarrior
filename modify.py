from pathlib import Path
p=Path('/mnt/data/v26/server.js')
s=p.read_text()
# Replace public athletes/upload block with public champions only
start=s.index("  if(q.method==='GET'&&p==='/api/public/champions')")
end=s.index("  if(q.method==='GET'&&p==='/api/public/results')", start)
new="""  if(q.method==='GET'&&p==='/api/public/champions')return send(r,200,{champions:d.champions,weights:COMMON.weightClasses});\n"""
s=s[:start]+new+s[end:]
# Replace admin champion endpoint block through delete endpoint
start=s.index("  if(q.method==='POST'&&p==='/api/admin/champions')")
end=s.index("  if(q.method==='DELETE'&&p.startsWith('/api/admin/champions/'))", start)
new="""  if(q.method==='POST'&&p==='/api/admin/champions'){
   if(!admin(q,d))return send(r,403,{error:'Admin access required'});
   const b=await body(q),weight=String(b.weight||''),side=String(b.side||'').toLowerCase(),name=String(b.name||'').trim(),photo=String(b.photo||'');
   if(!COMMON.weightClasses.includes(weight)||!['right','left'].includes(side))return send(r,400,{error:'Valid weight class and hand are required'});
   if(!name)return send(r,400,{error:'Champion name is required'});
   if(photo && (!/^data:image\\/(jpeg|jpg|png|webp);base64,/i.test(photo)||photo.length>1500000))return send(r,400,{error:'Please upload a JPG, PNG or WebP image under 1 MB.'});
   let c=d.champions.find(x=>x.weight===weight&&x.side===side);if(!c){c={id:id('champ'),weight,side};d.champions.push(c)}
   c.name=name;if(photo)c.photo=photo;c.updatedAt=new Date().toISOString();write(d);return send(r,200,{champion:c});
  }
"""
s=s[:start]+new+s[end:]
# remove athlete patch endpoint
start=s.find("  if(q.method==='PATCH'&&p.startsWith('/api/admin/athlete-profiles/'))")
if start!=-1:
    end=s.index("  if(q.method", start+10)
    s=s[:start]+s[end:]
p.write_text(s)

p=Path('/mnt/data/v26/admin.html'); s=p.read_text()
# Tab and panel
old='<section id="champions" class="panel"><h1>Champions</h1><div class="card"><div class="small">Choose an approved athlete profile for each weight class and hand. The public Champions page updates immediately. Athlete photos come from the public athlete-photo submission form.</div></div><div id="championAdminList"></div><h2 style="margin-top:18px">Athlete Photo Submissions</h2><div class="card"><div id="athletePhotoAdminTable" class="table-wrap"></div></div></section>'
new='<section id="champions" class="panel"><h1>Champions</h1><div class="card"><div class="small">Upload and manage the official champion photo for every weight class and hand. These are the photos the public Champions page displays. There is no public athlete-photo submission.</div></div><div id="championAdminList"></div></section>'
s=s.replace(old,new)
# CSS add
s=s.replace('</style></head>', '.champ-admin-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.champ-admin-card{background:linear-gradient(145deg,#151515,#090909);border:1px solid #333;border-radius:12px;padding:12px}.champ-admin-photo{width:100%;height:190px;object-fit:cover;border-radius:9px;border:1px solid #444;background:#050505}.champ-admin-empty{height:190px;border:1px dashed #555;border-radius:9px;display:flex;align-items:center;justify-content:center;text-align:center;color:#777;font-size:12px;font-weight:800}.file-label{display:block;margin-top:8px}.file-label input{padding:8px}@media(max-width:900px){.champ-admin-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.champ-admin-grid{grid-template-columns:1fr}}\n</style></head>')
# Replace function and save function and set status
start=s.index('function renderChampions(){')
end=s.index("if(localStorage.getItem(tokenKey))load();", start)
newjs=r'''function renderChampions(){
 const list=$('championAdminList');if(!list||!data)return;
 const weights=['154 lbs','176 lbs','198 lbs','220 lbs','242 lbs','243+ lbs'];
 list.innerHTML='<div class="champ-admin-grid">'+weights.flatMap(w=>['right','left'].map(side=>{
   const c=(data.champions||[]).find(x=>x.weight===w&&x.side===side); const key=side+'-'+w.replace(/[^0-9]/g,'');
   return `<div class="champ-admin-card"><div class="muted">${esc(w)}</div><h2>${side==='right'?'RIGHT HAND':'LEFT HAND'}</h2>${c?.photo?`<img class="champ-admin-photo" src="${c.photo}" alt="${esc(c.name||'Champion photo')}">`:'<div class="champ-admin-empty">UPLOAD OFFICIAL<br>CHAMPION PHOTO</div>'}<label>Champion Name</label><input id="name-${key}" value="${esc(c?.name||'')}" placeholder="Champion name"><label class="file-label">Official Champion Photo</label><input id="file-${key}" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewChampion('${key}',this)"><div id="preview-${key}" class="small" style="margin-top:7px"></div><div class="actions"><button class="btn primary" onclick="saveChampion('${esc(w)}','${side}','${key}')">SAVE</button>${c?`<button class="btn" onclick="removeChampion('${c.id}')">CLEAR</button>`:''}</div></div>`;
 })).join('')+'</div>';
}
function resizeImage(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>{const im=new Image();im.onload=()=>{const max=1100,scale=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.84))};im.onerror=reject;im.src=r.result};r.readAsDataURL(file)})}
async function previewChampion(key,input){const f=input.files?.[0],box=$('preview-'+key);if(!f)return;box.textContent='Preparing photo…';try{input.dataset.image=await resizeImage(f);box.innerHTML='<img src="'+input.dataset.image+'" style="max-width:100%;max-height:150px;border-radius:8px" alt="Preview">'}catch{box.textContent='Could not read that image.'}}
async function saveChampion(weight,side,key){const name=$('name-'+key).value.trim(),input=$('file-'+key),photo=input?.dataset.image||'';if(!name){alert('Enter the champion name.');return}try{await api('/api/admin/champions',{method:'POST',body:JSON.stringify({weight,side,name,photo})});await load()}catch(e){alert(e.message)}}
async function removeChampion(id){if(!confirm('Clear this champion slot?'))return;try{await api('/api/admin/champions/'+id,{method:'DELETE'});await load()}catch(e){alert(e.message)}}
'''
s=s[:start]+newjs+s[end:]
p.write_text(s)

p=Path('/mnt/data/v26/index.html'); s=p.read_text()
# Remove public submission form by replacing the whole main champions tail fragment
old='<main id="champions" class="screen"><h1>CHAMPIONS</h1><div class="small" style="margin-bottom:12px">Official champions are managed from the Admin side. Champions are selected from approved athlete profiles submitted here.</div><div id="championBoard"><div class="notice">Loading champions…</div></div><div class="card form" style="margin-top:14px"><h2>SUBMIT YOUR ATHLETE PHOTO</h2><div class="small">Upload a picture of yourself. After review, the FAA can use your approved profile for the Champions page and athlete gallery.</div><label>YOUR NAME *</label><input id="athletePhotoName" placeholder="John Smith"><label>EMAIL *</label><input id="athletePhotoEmail" type="email" placeholder="john@example.com"><label>CITY / HOMETOWN</label><input id="athletePhotoCity" placeholder="Jacksonville, FL"><label>PHOTO OF YOU</label><input id="athletePhotoFile" type="file" accept="image/jpeg,image/png,image/webp"><div id="athletePhotoPreview" class="notice" style="margin-top:8px">Choose a photo to preview it here.</div><button class="cta" id="athletePhotoSubmit" style="margin-top:10px">SUBMIT ATHLETE PHOTO →</button><div id="athletePhotoMsg" class="small" style="margin-top:8px"></div></div></main>'
new='<main id="champions" class="screen"><h1>CHAMPIONS</h1><div class="small" style="margin-bottom:12px">Official Florida Armwrestling champions. Photos are uploaded and managed by the FAA.</div><div id="championBoard"><div class="notice">Loading champions…</div></div></main>'
s=s.replace(old,new)
# Remove integrated athlete upload logic and switch to 12-card board; keep old script but replace whole block
start=s.index('<script id="faa-integrated-data-js">')
end=s.index('<script id="faa-public-photos-js">', start)
newscript='''<script id="faa-integrated-data-js">\n(()=>{\n const $=id=>document.getElementById(id),WEIGHTS=['154 lbs','176 lbs','198 lbs','220 lbs','242 lbs','243+ lbs'];\n const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));\n let CH=[];\n async function get(path){const r=await fetch(path),d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d}\n function renderChampions(){const b=$('championBoard');if(!b)return;b.innerHTML='<div class="champions-grid">'+WEIGHTS.flatMap(w=>['right','left'].map(side=>{const c=CH.find(x=>x.weight===w&&x.side===side),title=side==='right'?'RIGHT HAND':'LEFT HAND';return `<article class="champion-card"><div class="champion-weight">${esc(w)}</div><div class="champion-arm">${title} CHAMPION</div><div class="champion-photo">${c?.photo?`<img src="${c.photo}" alt="${esc(c.name||w+' '+title)}">`:'<span>OFFICIAL<br>CHAMPION<br>PHOTO</span>'}</div><div class="champion-name">${c?.name?esc(c.name):'Champion TBD'}</div></article>`})).join('')+'</div>'}\n async function loadIntegrated(){try{const c=await get('/api/public/champions');CH=c.champions||[];renderChampions()}catch(e){if($('championBoard'))$('championBoard').innerHTML='<div class="notice">Champions are temporarily unavailable.</div>'}}\n const oldGo=window.go;window.go=function(id){oldGo(id);if(id==='champions')loadIntegrated()};document.addEventListener('DOMContentLoaded',loadIntegrated);setTimeout(loadIntegrated,250);\n})();\n</script>\n'''
s=s[:start]+newscript+s[end:]
# Replace public photos script to show official champion photos, not submissions
start=s.index('<script id="faa-public-photos-js">')
end=s.index('<script id="faa-public-results-js">', start)
newphotos='''<script id="faa-public-photos-js">\n(()=>{const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));async function loadPhotos(){try{const d=await fetch('/api/public/champions').then(r=>r.json()),a=(d.champions||[]).filter(x=>x.photo);if($('photos'))$('photos').innerHTML='<h1>PHOTOS</h1><div class="small" style="margin-bottom:12px">Official champion photos uploaded by Florida Armwrestling.</div><div class="launch-photo-grid">'+(a.length?a.map(x=>`<div><img src="${x.photo}" alt="${esc(x.name||'Champion')}"><span>${esc(x.name||'Champion')} • ${esc(x.weight)} • ${x.side==='right'?'Right Hand':'Left Hand'}</span></div>`).join(''):'<div class="notice">Official champion photos will appear here.</div>')+'</div>'}catch{}}const old=window.go;window.go=function(id){old(id);if(id==='photos')loadPhotos()};document.addEventListener('DOMContentLoaded',loadPhotos)})();\n</script>\n'''
s=s[:start]+newphotos+s[end:]
# Add responsive 3x4 CSS near existing champion CSS
insert='.champions-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.champion-card{background:linear-gradient(145deg,#151515,#070707);border:1px solid #414b55;border-radius:12px;padding:10px;min-width:0}.champion-weight{font-size:13px;font-weight:900;color:#fff;text-align:center}.champion-arm{font-size:10px;font-weight:900;letter-spacing:.7px;color:#aaa;text-align:center;margin:4px 0 8px}.champion-photo{height:230px;border:1px solid #343434;border-radius:9px;display:flex;align-items:center;justify-content:center;text-align:center;color:#777;font-size:11px;font-weight:900;overflow:hidden;background:#050505}.champion-photo img{width:100%;height:100%;object-fit:cover}.champion-name{font-size:15px;font-weight:900;text-align:center;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:900px){.champions-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.champions-grid{grid-template-columns:1fr}.champion-photo{height:280px}}\n'
s=s.replace('</style></head>', insert+'</style></head>')
p.write_text(s)
