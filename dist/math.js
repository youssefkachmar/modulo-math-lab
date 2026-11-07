(function(root){
 'use strict';
 const abs=n=>n<0n?-n:n;
 const mod=(a,n)=>((a%n)+n)%n;
 function integer(s,label='Nombre'){if(!/^[+-]?\d+$/.test(String(s).trim())||String(s).length>100)throw Error(label+' : saisissez un entier (100 caractères maximum).');return BigInt(String(s).trim());}
 function egcd(a,b){let r=abs(a),s=abs(b),x=1n,y=0n,u=0n,v=1n;const rows=[];while(s){let q=r/s;rows.push({a:r,b:s,q,r:r%s});[r,s]=[s,r-q*s];[x,u]=[u,x-q*u];[y,v]=[v,y-q*v];}return {g:r,x:a<0n?-x:x,y:b<0n?-y:y,rows};}
 function inverse(a,n){if(n<2n)throw Error('Le module doit être supérieur ou égal à 2.');const z=egcd(a,n);return {...z,value:z.g===1n?mod(z.x,n):null};}
 function pow(a,e,n){if(n<1n||e<0n)throw Error('Exposant positif ou nul et module positif requis.');let r=1n%n;a=mod(a,n);while(e){if(e&1n)r=r*a%n;a=a*a%n;e>>=1n;}return r;}
 function factors(n){if(n<1n||n>1000000000000n)throw Error('Pour la décomposition, choisissez n entre 1 et 1 000 000 000 000.');let f=[];for(let p=2n;p*p<=n;p+=(p===2n?1n:2n)){let k=0;while(n%p===0n){n/=p;k++;}if(k)f.push([p,k]);}if(n>1n)f.push([n,1]);return f;}
 function phi(n){return factors(n).reduce((r,[p])=>r/p*(p-1n),n);}
 function prime(n){if(n<2n||n>1000000n)return false;for(let p=2n;p*p<=n;p++)if(n%p===0n)return false;return true;}
 function keys(p,q,e){if(!prime(p)||!prime(q))throw Error('p et q doivent être premiers, entre 2 et 1 000 000.');if(p===q)throw Error('Choisissez deux nombres premiers distincts.');let n=p*q,t=(p-1n)*(q-1n);if(e<=1n||e>=t)throw Error('Il faut 1 < e < φ(n).');let d=inverse(e,t).value;if(d===null)throw Error('e et φ(n) doivent être premiers entre eux.');return {p,q,e,n,t,d};}
 const api={abs,mod,integer,egcd,inverse,pow,factors,phi,prime,keys};root.Arith=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis==='undefined'?window:globalThis);
