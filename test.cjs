const assert=require('node:assert/strict');const M=require('./dist/math.js');
assert.equal(M.inverse(17n,43n).value,38n);assert.equal(M.inverse(3n,7n).value,5n);assert.equal(M.inverse(2n,6n).value,null);assert.equal(M.inverse(-3n,7n).value,2n);assert.equal(M.inverse(7n,15n).value,13n);assert.equal(M.inverse(11n,23n).value,21n);
for(let a=-30n;a<=30n;a++)for(let b=-30n;b<=30n;b++){const z=M.egcd(a,b);assert.equal(a*z.x+b*z.y,z.g);if(z.g){assert.equal(a%z.g,0n);assert.equal(b%z.g,0n);}}
for(let n=2n;n<80n;n++)for(let a=-20n;a<=20n;a++){const z=M.inverse(a,n);assert.equal(z.value!==null,z.g===1n);if(z.value!==null)assert.equal(M.mod(a*z.value,n),1n);}
for(let n=1n;n<150n;n++){let count=0n;for(let k=1n;k<=n;k++)if(M.egcd(k,n).g===1n)count++;assert.equal(M.phi(n),count);}
assert.equal(M.phi(360n),96n);const k=M.keys(61n,53n,17n);assert.equal(k.d,2753n);assert.equal(M.pow(65n,k.e,k.n),2790n);for(let m=0n;m<k.n;m++)assert.equal(M.pow(M.pow(m,k.e,k.n),k.d,k.n),m);
for(const text of ['Bonjour !','École 🔐','مرحبا']){const bytes=new TextEncoder().encode(text);const restored=Uint8Array.from(bytes,v=>Number(M.pow(M.pow(BigInt(v),k.e,k.n),k.d,k.n)));assert.equal(new TextDecoder().decode(restored),text);}
assert.throws(()=>M.keys(7n,7n,5n));assert.throws(()=>M.keys(12n,13n,7n));assert.throws(()=>M.keys(11n,13n,6n));assert.throws(()=>M.inverse(3n,1n));assert.throws(()=>M.integer('3.5'));assert.throws(()=>M.factors(1000000000001n));console.log('All arithmetic, inverse, Euler and RSA tests passed.');
