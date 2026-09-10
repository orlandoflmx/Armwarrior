
// V40: restore the global navigation click handler. This uses event delegation so
// buttons rendered later (event details, confirmation, etc.) work too.
document.addEventListener('click', function(e){
  const b=e.target.closest('[data-go]');
  if(!b) return;
  e.preventDefault();
  if(typeof window.go==='function') window.go(b.dataset.go);
});
