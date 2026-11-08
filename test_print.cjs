// Regression checks for expensive print lifecycle work, without opening a printer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const katex = require('./dist/vendor/katex/katex.min.js');
const series = JSON.parse(execFileSync('python',['-c',
 "import json; from exercises import generate_series; print(json.dumps(generate_series({'code':'M1-7-3-20-1234567890ABCDEF'})))"],{encoding:'utf8'}));
const elements = new Map(), events = {};
let solutions = [], renderCount = 0, printCount = 0, writes = 0;
function element(selector) {
 if(!elements.has(selector)) {
  let html='';
  elements.set(selector,{
   hidden:false,disabled:false,textContent:'',classList:{toggle(){}},
   addEventListener(){},setAttribute(){},hasChildNodes(){return !!html;},
   replaceChildren(){html='';},
   get innerHTML(){return html;},
   set innerHTML(value){html=value;
    if(selector==='#exercise-list') solutions=series.exercises.map((_,i)=>element(`solution-${i}`));
    if(selector==='#print-document') writes++;
   }
  });
 }
 return elements.get(selector);
}
const context=vm.createContext({console,URLSearchParams,location:{hash:''},
 document:{querySelector:element,querySelectorAll:s=>s==='.exercise-solution'?solutions:[],fonts:{ready:Promise.resolve()}},
 window:{addEventListener:(name,fn)=>events[name]=fn,print(){printCount++;events.beforeprint();events.beforeprint();}},
 katex:{renderToString(...args){renderCount++;return katex.renderToString(...args);}},series
});
vm.runInContext(fs.readFileSync('dist/exercises.js','utf8'),context);
vm.runInContext('currentSeries=series;renderSeries()',context);
const promptCount=series.exercises.reduce((n,e)=>n+e.prompt.filter(b=>'math' in b).length,0);
const solutionCount=series.exercises.reduce((n,e)=>n+e.solution.filter(b=>'math' in b).length,0);
assert.equal(renderCount,promptCount,'Hidden solutions must not be typeset');
(async()=>{
 await vm.runInContext("printSeries('exercises')",context);
 assert.equal(renderCount,promptCount,'Printing questions reuses typeset prompts');
 assert.equal(writes,1,'Repeated beforeprint events must not rebuild the document');
 assert.ok(!element('#print-document').innerHTML.includes('printed-solution'));
 await vm.runInContext("printSeries('correction')",context);
 assert.equal(printCount,1,'A second print must be blocked while a dialog is active');
 events.afterprint();
 assert.equal(element('#print-document').innerHTML,'','Release the print document after closing');
 await vm.runInContext("printSeries('correction')",context);
 assert.equal(renderCount,promptCount+solutionCount,'Render each solution only once');
 assert.equal(writes,2);
 assert.ok(element('#print-document').innerHTML.includes('printed-solution'));
 events.afterprint();
 vm.runInContext('showSolutions=true;updateSolutions();showSolutions=false;updateSolutions();showSolutions=true;updateSolutions()',context);
 assert.equal(renderCount,promptCount+solutionCount,'Correction toggles reuse existing content');
 console.log(`PASS: ${promptCount} prompt formulas; ${solutionCount} solution formulas rendered only on demand; no duplicate print build; print DOM released.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
