const fs=require('fs'),vm=require('vm'),cp=require('child_process'),assert=require('assert/strict'),katex=require('./dist/vendor/katex/katex.min.js');
const data=JSON.parse(cp.execFileSync('python',['-c',`import json
from calculations import calculate,json_safe
from exercises import generate_series
cases=[dict(mode='solve',a=a,b=b,n=n) for a,b,n in [(4,5,9),(7,2,11),(6,8,14),(6,5,14),(0,0,5),(0,1,5)]]
print(json.dumps(dict(results=[json_safe(calculate('congruences',c)) for c in cases],series=[generate_series(dict(code=f'M1-8-{level}-20-1234567890ABCDEF')) for level in (1,2,3)])))`],{encoding:'utf8'}));
const ctx=vm.createContext({katex:{renderToString(s,o){assert.ok(!/[\u0000-\u0008\u000b-\u001f]/.test(s));return katex.renderToString(s,{...o,throwOnError:true});}},answer:(a,b,c)=>a+b+c,step:(a,b)=>a+b});
vm.runInContext(fs.readFileSync('dist/results.js','utf8'),ctx);
for(const z of data.results){ctx.z=z;vm.runInContext('renderCongruences(z)',ctx);}
for(const series of data.series)for(const ex of series.exercises)for(const block of [...ex.prompt,...ex.solution])if(block.math){assert.ok(!/[\u0000-\u0008\u000b-\u001f]/.test(block.math));katex.renderToString(block.math,{throwOnError:true});}
console.log('PASS: equation solution cases and 60 generated worked solutions typeset correctly.');
