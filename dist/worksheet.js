'use strict';
// Native MathML keeps printed equations semantic without KaTeX's HTML layout tree.
function printBlocks(items) {
 return items.map(item=>item.math!==undefined
  ? `<div class="exercise-math">${katex.renderToString(item.math,{output:'mathml',displayMode:true,throwOnError:true,trust:false})}</div>`
  : `<p>${escapeHTML(item.text)}</p>`).join('');
}
function buildPrintDocument(series,mode) {
 const correction = mode === 'correction';
 const groups = correction ? series.exercises.map(ex=>[ex])
  : series.exercises.reduce((pages,ex,index)=>{if(index%2===0) pages.push([]);pages[pages.length-1].push(ex);return pages;},[]);
 return groups.map((group,index)=>`<section class="print-page ${correction?'correction-page':''}">
  <div class="print-header"><strong>modulo</strong><span>${correction?'CORRIGÉ DÉTAILLÉ':'SÉRIE D’EXERCICES'}</span></div>
  <h1>${correction?'Comprendre chaque étape.':'À vous de jouer.'}</h1>
  <div class="print-meta">${escapeHTML(series.level_label)} · ${series.count} exercices · Série ${escapeHTML(series.code)}</div>
  ${correction?'':'<div class="student-line"><span>Nom : ______________________________</span><span>Date : ______________</span></div>'}
  ${group.map(ex=>`<article class="printed-exercise"><h2>Exercice ${ex.number} · ${escapeHTML(ex.title)}</h2><div class="exercise-block">${printBlocks(ex.prompt)}</div>${correction?`<div class="printed-solution"><h3>Correction</h3><div class="exercise-block">${printBlocks(ex.solution)}</div></div>`:`<div class="writing-space" aria-hidden="true">${'<div></div>'.repeat(6)}</div>`}</article>`).join('')}
  <div class="print-footer"><span>${correction?'Corrigé':'Énoncés'} · ${escapeHTML(series.code)}</span><span>${index+1} / ${groups.length}</span></div>
 </section>`).join('');
}
