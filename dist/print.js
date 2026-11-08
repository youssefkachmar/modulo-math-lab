'use strict';
const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parameters=new URLSearchParams(location.search);
const mode=parameters.get('mode'), code=parameters.get('code');
const message=document.querySelector('#print-status');
const printButton=document.querySelector('#print-sheet');
let printing=false;
async function loadSheet(){
 try{
  if(!code || !['exercises','correction'].includes(mode)) throw Error('Ouvrez cette feuille depuis une série d’exercices.');
  const response=await fetch('/api/exercises',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
  const series=await response.json();
  if(!response.ok) throw Error(series.error || 'Impossible de retrouver cette série.');
  document.querySelector('#print-document').innerHTML=buildPrintDocument(series,mode);
  document.querySelector('.print-toolbar a').href=`exercises.html#serie=${encodeURIComponent(series.code)}`;
  document.title=`Modulo — ${mode==='correction'?'Corrigé':'Exercices'} — ${series.code}`;
  await document.fonts.ready;
  message.textContent='Feuille prête. Cliquez sur « Imprimer / PDF ». Vous pouvez fermer cet onglet après l’impression.';
  printButton.disabled=false;
 }catch(error){message.textContent=error.message;}
}
printButton.addEventListener('click',()=>{
 if(printing) return;
 printing=true;
 try{window.print();}finally{printing=false;}
});
loadSheet();
