// Regression checks for expensive print lifecycle work, without opening a printer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const katex = require('./dist/vendor/katex/katex.min.js');
const series = JSON.parse(execFileSync('python',['-c',
 "import json; from exercises import generate_series; print(json.dumps(generate_series({'code':'M1-7-3-20-1234567890ABCDEF'})))"],{encoding:'utf8'}));
const elements = new Map(), events = {};
let solutions = [], renderCount = 0, printCount = 0, writes = 0, openedURL = null;
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
 window:{open(url){openedURL=url;printCount++;},addEventListener:(name,fn)=>events[name]=fn,print(){printCount++;events.beforeprint();events.beforeprint();}},
 katex:{renderToString(...args){renderCount++;return katex.renderToString(...args);}},series
});
vm.runInContext(fs.readFileSync('dist/worksheet.js','utf8'),context);
vm.runInContext(fs.readFileSync('dist/exercises.js','utf8'),context);
vm.runInContext('currentSeries=series;renderSeries()',context);
const promptCount=series.exercises.reduce((n,e)=>n+e.prompt.filter(b=>'math' in b).length,0);
const solutionCount=series.exercises.reduce((n,e)=>n+e.solution.filter(b=>'math' in b).length,0);
assert.equal(renderCount,promptCount,'Hidden solutions must not be typeset');
vm.runInContext("printSeries('correction')",context);
assert.ok(openedURL.startsWith('print.html?mode=correction&code='));
assert.equal(renderCount,promptCount,'Opening a print sheet must not build hidden print formulas in the app');
assert.equal(writes,0);
// Ctrl+P fallback still creates only one document for repeated browser events.
events.beforeprint(); events.beforeprint();
assert.equal(writes,1);
assert.ok(!element('#print-document').innerHTML.includes('printed-solution'));
events.afterprint();
assert.equal(element('#print-document').innerHTML,'');
const correction=vm.runInContext("buildPrintDocument(series,'correction')",context);
assert.equal((correction.match(/class="print-page/g)||[]).length,20);
assert.equal((correction.match(/<math /g)||[]).length,promptCount+solutionCount);
assert.ok(!correction.includes('katex-html'),'Print sheets must not contain the HTML formula layout tree');
assert.ok(correction.includes('printed-solution'));
const questions=vm.runInContext("buildPrintDocument(series,'exercises')",context);
assert.equal((questions.match(/class="print-page/g)||[]).length,10);
assert.ok(!questions.includes('printed-solution'));
const beforeToggle=renderCount;
vm.runInContext('showSolutions=true;updateSolutions();showSolutions=false;updateSolutions();showSolutions=true;updateSolutions()',context);
assert.equal(renderCount-beforeToggle,solutionCount,'Correction toggles typeset each solution only once');
// Compare identical print sheets with the old formula renderer and the new one.
const baselineContext=vm.createContext({series,katex});
vm.runInContext("const escapeHTML=value=>String(value);",baselineContext);
vm.runInContext(fs.readFileSync('dist/worksheet.js','utf8').replace("output:'mathml'","output:'htmlAndMathml'"),baselineContext);
const baseline=vm.runInContext("buildPrintDocument(series,'correction')",baselineContext);
const tags=html=>(html.match(/<[a-z][^>]*>/gi)||[]).length;
assert.ok(tags(correction)<tags(baseline)*0.5);
console.log(`PASS: isolated print link; native maths; questions/corrections separated; Ctrl+P cleanup; print elements ${tags(baseline)} -> ${tags(correction)}; markup ${(Buffer.byteLength(baseline)/1024).toFixed(0)} KB -> ${(Buffer.byteLength(correction)/1024).toFixed(0)} KB.`);
