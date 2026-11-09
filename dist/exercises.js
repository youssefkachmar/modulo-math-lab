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
 $('#exercise-list').innerHTML = currentSeries.exercises.map((ex,index) => `<article class="exercise-card"><h3><span class="exercise-number">${String(ex.number).padStart(2,'0')}</span>${escapeHTML(ex.title)}</h3><div class="exercise-block">${blocks(ex.prompt)}</div>${practiceHTML(ex,index)}<section class="exercise-solution" hidden></section></article>`).join('');
 updateSolutions();
}
function practiceHTML(ex,index) {
 const p=ex.practice;
 if(!p)return '';
 return `<div class="practice-area"><div class="hint-actions"><button type="button" class="secondary" data-hint="${index}">Un indice (0/${p.hints.length})</button><span>Les indices se dévoilent un à un.</span></div><ol class="hint-list" id="hints-${index}" aria-live="polite" hidden></ol><form class="answer-form" data-index="${index}" data-revision="0"><h4>À vous de répondre</h4><p class="practice-note">Vérifiez vos résultats ici. Gardez votre raisonnement sur papier : les étapes rédigées ne sont pas évaluées.</p><div class="practice-fields">${p.fields.map(f=>`<label ${f.when?`data-when="${f.when}" hidden`:''}>${escapeHTML(f.label)}${f.options?`<select name="${f.key}" required><option value="">Choisir…</option>${f.options.map(([v,label])=>`<option value="${v}">${label}</option>`).join('')}</select>`:`<input name="${f.key}" inputmode="numeric" autocomplete="off" maxlength="100" required ${f.when?'disabled':''}>`}</label>`).join('')}</div><button class="secondary" type="submit">Vérifier mes réponses</button><div class="answer-feedback" role="status" aria-live="polite"></div></form></div>`;
}
$('#exercise-list').addEventListener('click',event=>{
 const button=event.target.closest('[data-hint]');
 if(!button)return;
 const index=Number(button.dataset.hint), hints=currentSeries.exercises[index].practice.hints;
 const list=$('#hints-'+index), count=list.children.length;
 if(count>=hints.length)return;
 const item=document.createElement('li');item.textContent=hints[count];list.append(item);list.hidden=false;
 button.textContent=count+1===hints.length?'Tous les indices sont affichés':`Indice suivant (${count+1}/${hints.length})`;
 button.disabled=count+1===hints.length;
});
$('#exercise-list').addEventListener('input',event=>{
 const form=event.target.closest('.answer-form');if(!form)return;
 form.dataset.revision=String(Number(form.dataset.revision)+1);
 form.querySelector('.answer-feedback').replaceChildren();
 form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
 form.querySelectorAll('[data-when]').forEach(label=>{
  const [key,value]=label.dataset.when.split(':');
  const active=form.elements.namedItem(key).value===value;
  label.hidden=!active;label.querySelector('input').disabled=!active;
 });
});
$('#exercise-list').addEventListener('submit',async event=>{
 const form=event.target.closest('.answer-form');if(!form)return;
 event.preventDefault();
 const button=form.querySelector('button[type=submit]');if(button.disabled)return;
 const code=currentSeries.code, revision=form.dataset.revision, feedback=form.querySelector('.answer-feedback');
 button.disabled=true;feedback.textContent='Vérification…';
 try {
  const values=Object.fromEntries(new FormData(form));
  const response=await fetch('/api/check-answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,index:Number(form.dataset.index),values})});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Vérification impossible.');
  if(!form.isConnected||currentSeries.code!==code||form.dataset.revision!==revision)return;
  feedback.className='answer-feedback '+(result.correct?'answer-correct':'answer-retry');
  feedback.innerHTML=`<strong>${result.correct?'✓ Tous les résultats saisis sont corrects.':'Certains résultats sont à revoir. Vous pouvez réessayer ou demander un indice.'}</strong><ul>${result.results.map(r=>`<li>${escapeHTML(r.message)}</li>`).join('')}</ul>`;
  result.results.forEach(r=>form.elements.namedItem(r.key)?.setAttribute('aria-invalid',String(!r.correct)));
 } catch(error) {
  if(form.isConnected&&form.dataset.revision===revision)feedback.textContent='Impossible de vérifier : '+error.message;
 } finally {button.disabled=false;}
});
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
 $('#print-document').innerHTML=buildPrintDocument(currentSeries,mode);
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
 if(!currentSeries || busy || printing) return;
 printing=true;
 $('#print-exercises').disabled=true;
 $('#print-correction').disabled=true;
 try {
  printMode=mode;
  preparePrint(mode);
  await document.fonts.ready;
  window.print();
 } catch(error) {
  status('Impossible de démarrer l’impression. Réessayez.',true);
  releasePrint();
 }
}
$('#print-exercises').addEventListener('click',()=>printSeries('exercises'));
$('#print-correction').addEventListener('click',()=>printSeries('correction'));
window.addEventListener('beforeprint',()=>preparePrint(printMode));
window.addEventListener('afterprint',releasePrint);
const initialCode = new URLSearchParams(location.hash.slice(1)).get('serie');
if(initialCode) generate({code:initialCode});
