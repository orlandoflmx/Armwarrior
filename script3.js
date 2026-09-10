
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
