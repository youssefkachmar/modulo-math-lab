'use strict';
let currentSeries = null;
let showSolutions = false;
let busy = false;
let renderedBlocks = new WeakMap();
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function blocks(items) {
 if(renderedBlocks.has(items)) return renderedBlocks.get(items);
 const html = items.map(item => item.math !== undefined
  ? `<div class="exercise-math">${katex.renderToString(item.math,{displayMode:true,throwOnError:true,trust:false})}</div>`
  : `<p>${escapeHTML(item.text)}</p>`).join('');
 renderedBlocks.set(items,html);
 return html;
}
function renderSeries() {
 $('#empty-series').hidden = true;
 $('#series-result').hidden = false;
 $('#series-title').textContent = `Série de ${currentSeries.count} exercice${Number(currentSeries.count)>1?'s':''}`;
 $('#series-meta').textContent = `${currentSeries.level_label} · ${currentSeries.topics.length} thème${currentSeries.topics.length>1?'s':''} · Calculatrice autorisée pour RSA`;
 $('#current-code').textContent = currentSeries.code;
 $('#exercise-list').innerHTML = currentSeries.exercises.map(ex => `<article class="exercise-card"><h3><span class="exercise-number">${String(ex.number).padStart(2,'0')}</span>${escapeHTML(ex.title)}</h3><div class="exercise-block">${blocks(ex.prompt)}</div><section class="exercise-solution" hidden></section></article>`).join('');
 updateSolutions();
}
function updateSolutions() {
 document.querySelectorAll('.exercise-solution').forEach((element,index)=>{
  if(showSolutions && !element.hasChildNodes()) {
   element.innerHTML=`<div class="solution-label">CORRECTION · LE RAISONNEMENT</div><div class="exercise-block">${blocks(currentSeries.exercises[index].solution)}</div>`;
  }
  element.hidden=!showSolutions;
 });
 $('#toggle-correction').textContent = showSolutions ? 'Masquer le corrigé' : 'Afficher le corrigé';
 $('#toggle-correction').setAttribute('aria-expanded',String(showSolutions));
}
function status(message, error=false) {
 $('#series-status').textContent = message;
 $('#series-status').classList.toggle('error',error);
}
async function generate(data) {
 if(busy || printing) return;
 busy = true;
 document.querySelectorAll('form button').forEach(b=>b.disabled=true);
 status('Préparation de la série et de son corrigé…');
 try {
  const response = await fetch('/api/exercises',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result = await response.json();
  if(!response.ok) throw Error(result.error || 'La série n’a pas pu être créée.');
  currentSeries=result; showSolutions=false;
  renderedBlocks=new WeakMap();
  preparedPrintKey='';
  $('#print-document').innerHTML='';
  renderSeries();
  $('#series-level').value=result.level;
  $('#series-count').value=result.count;
  document.querySelectorAll('[name=topic]').forEach(el=>el.checked=result.topics.includes(el.value));
  $('#series-code').value=result.code;
  history.replaceState(null,'',`#serie=${encodeURIComponent(result.code)}`);
  status('Série prête. Gardez son numéro pour retrouver exactement les mêmes exercices.');
 } catch(error) {
  status(error instanceof SyntaxError ? 'Lancez l’application avec Python pour générer les exercices.' : error.message, true);
 } finally {
  busy=false;
  document.querySelectorAll('form button').forEach(b=>b.disabled=false);
 }
}
$('#series-form').addEventListener('submit',event=>{
 event.preventDefault();
 const topics=[...document.querySelectorAll('[name=topic]:checked')].map(el=>el.value);
 if(!topics.length) { status('Choisissez au moins un thème.',true); return; }
 generate({topics,level:$('#series-level').value,count:$('#series-count').value});
});
$('#restore-form').addEventListener('submit',event=>{event.preventDefault();generate({code:$('#series-code').value.trim()});});
$('#series-form').addEventListener('change',()=>{
 if(currentSeries) status('Paramètres modifiés : cliquez sur « Générer » pour créer une nouvelle feuille. La série affichée reste inchangée.');
});
$('#toggle-correction').addEventListener('click',()=>{showSolutions=!showSolutions;updateSolutions();});
$('#copy-code').addEventListener('click',async()=>{
 try { await navigator.clipboard.writeText(currentSeries.code); status('Numéro copié. Collez-le dans « Retrouver une série » pour la rouvrir.'); }
 catch { status('Sélectionnez et copiez le numéro affiché au-dessus des boutons.'); }
});
let printMode = 'exercises';
let preparedPrintKey = '';
let printing = false;
function preparePrint(mode) {
 if(!currentSeries) return;
 const key=`${currentSeries.code}:${mode}`;
 if(preparedPrintKey===key) return;
 const correction = mode === 'correction';
 const groups = correction ? currentSeries.exercises.map(ex=>[ex])
  : currentSeries.exercises.reduce((pages,ex,index)=>{if(index%2===0) pages.push([]);pages[pages.length-1].push(ex);return pages;},[]);
 $('#print-document').innerHTML=groups.map((group,index)=>`<section class="print-page ${correction?'correction-page':''}">
  <div class="print-header"><strong>modulo</strong><span>${correction?'CORRIGÉ DÉTAILLÉ':'SÉRIE D’EXERCICES'}</span></div>
  <h1>${correction?'Comprendre chaque étape.':'À vous de jouer.'}</h1>
  <div class="print-meta">${escapeHTML(currentSeries.level_label)} · ${currentSeries.count} exercices · Série ${escapeHTML(currentSeries.code)}</div>
  ${correction?'':'<div class="student-line"><span>Nom : ______________________________</span><span>Date : ______________</span></div>'}
  ${group.map(ex=>`<article class="printed-exercise"><h2>Exercice ${ex.number} · ${escapeHTML(ex.title)}</h2><div class="exercise-block">${blocks(ex.prompt)}</div>${correction?`<div class="printed-solution"><h3>Correction</h3><div class="exercise-block">${blocks(ex.solution)}</div></div>`:`<div class="writing-space" aria-hidden="true">${'<div></div>'.repeat(6)}</div>`}</article>`).join('')}
  <div class="print-footer"><span>${correction?'Corrigé':'Énoncés'} · ${escapeHTML(currentSeries.code)}</span><span>${index+1} / ${groups.length}</span></div>
 </section>`).join('');
 preparedPrintKey=key;
}
function releasePrint() {
 $('#print-document').replaceChildren();
 preparedPrintKey='';
 printMode='exercises';
 printing=false;
 $('#print-exercises').disabled=false;
 $('#print-correction').disabled=false;
}
async function printSeries(mode) {
 if(!currentSeries || printing || busy) return;
 printing=true;
 $('#print-exercises').disabled=true;
 $('#print-correction').disabled=true;
 try {
  printMode=mode;
  preparePrint(mode);
  await document.fonts.ready;
  window.print();
 } catch(error) {
  status('L’impression n’a pas pu démarrer. Réessayez depuis votre navigateur.',true);
  releasePrint();
 }
}
$('#print-exercises').addEventListener('click',()=>printSeries('exercises'));
$('#print-correction').addEventListener('click',()=>printSeries('correction'));
window.addEventListener('beforeprint',()=>preparePrint(printMode));
window.addEventListener('afterprint',releasePrint);
const initialCode = new URLSearchParams(location.hash.slice(1)).get('serie');
if(initialCode) generate({code:initialCode});
