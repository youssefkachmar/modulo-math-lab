'use strict';
let requestId = 0;
async function api(operation, data) {
  if (location.protocol === 'file:') throw Error('Ouvrez « Lancer Modulo.bat » pour démarrer les calculs Python.');
  let response;
  try { response = await fetch('/api/' + operation, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); }
  catch { throw Error('Le serveur Python ne répond pas. Relancez « Lancer Modulo.bat ».'); }
  let result;
  try { result=await response.json(); } catch { throw Error('Lancez l’application avec « python app.py » pour activer les calculs.'); }
  if (!response.ok) throw Error(result.error || 'Le calcul a échoué.');
  return result;
}
function inputs() { const data={}; document.querySelectorAll('#calc input').forEach(e=>data[e.name]=e.value);return data; }
function tex(source, display=true) { return `<div class="math-equation">${katex.renderToString(source,{displayMode:display,throwOnError:false,trust:false})}</div>`; }
function divisions(rows) { return rows.map(r=>tex(`${r.a} = ${r.b} \\times ${r.q} + ${r.r}`)).join(''); }
function bezoutTable(z) { return `<details><summary>Comment obtient-on les coefficients ?</summary><p>Chaque ligne vérifie r = au + bv. On soustrait le quotient multiplié par la ligne actuelle à la ligne précédente.</p><div class="table-wrap"><table><thead><tr><th>r</th><th>u</th><th>v</th></tr></thead><tbody>${z.coefficients.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`; }
function renderInverse(z) {
 const {a,n}=z;
 if(z.value===null)return answer('PAS D’INVERSE',`PGCD(${a}, ${n}) = ${z.g}`, 'Ces deux nombres ne sont pas premiers entre eux.',true)+`<div class="steps">${step('Calculer le PGCD',divisions(z.rows))}${step('Conclure','<p>Le PGCD doit être égal à 1 pour que l’inverse existe. Ici, cette condition n’est pas vérifiée.</p>')}</div>`;
 return answer('L’INVERSE EXISTE',tex(`${a}^{-1}\\equiv ${z.value}\\pmod{${n}}`),`PGCD(${a}, ${n}) = 1.`)+`<div class="steps">${step('Les divisions d’Euclide',divisions(z.rows))}${step('L’identité de Bézout',tex(`${a}\\times (${z.x})+${n}\\times (${z.y})=1`)+`<p>Le coefficient de ${a}, c’est ${z.x}. Il donne un inverse modulo ${n}.</p>`+bezoutTable(z))}${step('Le représentant positif',tex(`${z.x}\\equiv ${z.value}\\pmod{${n}}`)+`<p>On choisit le représentant compris entre 0 et ${z.last}.</p>`)}</div><div class="verification">✓ Vérification${tex(`${a}\\times ${z.value}=${z.product}\\equiv1\\pmod{${n}}`)}</div>`+(z.phi?`<details><summary>Autre méthode : ${z.prime?'Fermat':'Euler'}</summary><p>Le PGCD vaut 1 et φ(${n}) = ${z.phi}.</p>${tex(`${a}^{${z.exponent}}\\equiv${z.value}\\pmod{${n}}`)}</details>`:'');
}
function renderEuclide(z) {
 return answer('PGCD',tex(`\\operatorname{PGCD}(${z.a},${z.b})=${z.g}`),z.g==='1'?'Ces nombres sont premiers entre eux.':`Le plus grand diviseur commun est ${z.g}.`)+`<div class="steps">${step('La division euclidienne',z.division?tex(`${z.a}=${z.b}\\times (${z.division.q})+${z.division.r}`):'<p>La division par zéro n’est pas définie.</p>')}${step('L’algorithme d’Euclide',divisions(z.rows)||'<p>Un entier est nul : le PGCD est la valeur absolue de l’autre.</p>')}${step('Les coefficients de Bézout',tex(`${z.a}\\times(${z.x})+${z.b}\\times(${z.y})=${z.g}`)+bezoutTable(z))}${step('Le PPCM',tex(`\\operatorname{PPCM}(${z.a},${z.b})=\\frac{|${z.a}\\times${z.b}|}{${z.g}}=${z.lcm}`))}</div>`;
}
function renderEuler(z) {
 return answer('INDICATRICE D’EULER',tex(`\\varphi(${z.n})=${z.phi}`),`On compte ${z.phi} entiers de 1 à ${z.n} premiers avec ${z.n}.`)+`<div class="steps">${step('Les facteurs premiers',tex(`${z.n}=${z.factors.length?z.factors.map(([p,k])=>`${p}^{${k}}`).join('\\times'):'1'}`))}${step('La formule d’Euler',tex(`\\varphi(${z.n})=${z.n}${z.factors.map(([p])=>`\\left(1-\\frac1{${p}}\\right)`).join('')}=${z.phi}`)+'<p>On utilise chaque facteur premier distinct une seule fois.</p>')}${step('Les nombres premiers avec n',z.residues.length?'<p>Les nombres sur fond bleu sont premiers avec '+z.n+'.</p><div class="residue-list">'+z.residues.map(r=>`<span class="${r.coprime?'coprime':''}">${r.k}</span>`).join('')+'</div>':'<p>Ce sont les entiers qui ne sont divisibles par aucun des facteurs premiers de n.</p>')}</div>`;
}
function rsaResult(k=rsaKey) {
 return answer('LES CLÉS SONT PRÊTES',tex(`n=${k.n}`),`${k.p} et ${k.q} sont deux nombres premiers distincts.`)+`<div class="key-grid"><div class="key"><small>CLÉ PUBLIQUE (n, e)</small><p>(${k.n}, ${k.e})</p></div><div class="key"><small>CLÉ PRIVÉE (n, d)</small><p>(${k.n}, ${k.d})</p></div></div><div class="steps">${step('Le module',tex(`n=pq=${k.p}\\times${k.q}=${k.n}`))}${step('L’indicatrice',tex(`\\varphi(n)=(p-1)(q-1)=${k.t}`))}${step('La clé privée',tex(`d=e^{-1}\\bmod\\varphi(n)=${k.d}`)+tex(`${k.e}\\times${k.d}\\equiv1\\pmod{${k.t}}`))}</div><div id="message-result"></div><p class="small-note">RSA pédagogique : petits nombres et chiffrement sans bourrage. Pour apprendre les maths, pas pour protéger de vraies données.</p>`;
}
async function calculate() {
 const id=++requestId, current=view;
 $('#result').setAttribute('aria-busy','true');
 try { const z=await api(current,inputs());if(id!==requestId||view!==current)return;
  if(current==='rsa')rsaKey=z;
  $('#result').innerHTML=({inverse:renderInverse,euclide:renderEuclide,euler:renderEuler,ppcm:renderPPCM,congruences:renderCongruences,fermat:renderFermat,rsa:rsaResult})[current](z);
 } catch(e) {if(id===requestId)showError(e);} finally {if(id===requestId)$('#result').removeAttribute('aria-busy');}
}
async function crypt(action) {
 const id=++requestId;
 try {const z=await api('crypt',{...inputs(),action,mode:$('#mode').value,message:$('#message').value});if(id!==requestId||view!=='rsa')return;
 rsaKey=z.key;$('#result').innerHTML=rsaResult();
 const note=tex(`${z.input[0]}^{${z.exponent}}\\bmod ${z.key.n}=${z.output[0]}`);
 if(action==='encrypt'){
  $('#message-result').innerHTML=`<h3 class="subhead">MESSAGE CHIFFRÉ</h3><p class="small-note">${z.mode==='text'?'Chaque octet UTF-8 est chiffré séparément.':'Le message est un entier compris entre 0 et n − 1.'}</p><div class="answer"><div class="cipher">${z.output.join(' ')}</div></div><p class="small-note">Calcul du premier bloc :</p>${note}<button class="secondary" id="use-cipher">Reprendre ce résultat pour déchiffrer ↓</button>`;
  $('#use-cipher').onclick=()=>{$('#message').value=z.output.join(' ');crypt('decrypt');};
 }else $('#message-result').innerHTML=`<h3 class="subhead">MESSAGE DÉCHIFFRÉ</h3><div class="answer"><div class="result-text">${esc(z.decoded)}</div></div><p class="small-note">Calcul du premier bloc :</p>${note}`;
 }catch(e){if(id===requestId)showError(e);}
}
function renderPPCM(z) {
 const method=(z.a==='0'||z.b==='0')?'<p>Par convention, le PPCM vaut 0 si l’un des deux entiers est nul.</p>':tex(`\\operatorname{PPCM}(${z.a},${z.b})=\\frac{|(${z.a})\\times(${z.b})|}{${z.g}}=${z.lcm}`);
 return answer('PLUS PETIT MULTIPLE COMMUN',tex(`\\operatorname{PPCM}(${z.a},${z.b})=${z.lcm}`),'Le résultat est positif ou nul.')+`<div class="steps">${step('Trouver le PGCD',divisions(z.rows)+tex(`\\operatorname{PGCD}(${z.a},${z.b})=${z.g}`))}${step('En déduire le PPCM',method)}</div>`;
}
function renderCongruences(z) {
 return answer(z.congruent?'CONGRUENCE VÉRIFIÉE':'PAS DE CONGRUENCE',tex(`${z.a}${z.congruent?'\\equiv':'\\not\\equiv'}${z.b}\\pmod{${z.n}}`),z.congruent?'Les deux entiers ont le même reste.':'Les deux restes sont différents.',!z.congruent)+`<div class="steps">${step('Réduire les deux entiers',tex(`${z.a}=${z.n}\\times(${z.qa})+${z.ra}`)+tex(`${z.b}=${z.n}\\times(${z.qb})+${z.rb}`))}${step('Comparer les restes',tex(`r_a=${z.ra},\\qquad r_b=${z.rb}`))}${step('Vérifier par la différence',tex(`${z.a}-(${z.b})=${z.difference}=${z.n}\\times(${z.quotient})+${z.remainder}`)+`<p>${z.congruent?'La différence est un multiple de n.':'La différence n’est pas divisible par n.'}</p>`)}</div>`;
}
function renderFermat(z) {
 const theorem=z.period?(z.prime?'Petit théorème de Fermat':'Théorème d’Euler'):'Carrés successifs';
 const conditions=tex(`\\operatorname{PGCD}(${z.a},${z.n})=${z.g}`)+`<p>${z.n} ${z.prime?'est premier':'n’est pas premier'}. ${z.period?'Les conditions du théorème sont satisfaites.':'On ne peut pas appliquer la réduction de l’exposant de Fermat ou d’Euler : la base et le module ne sont pas premiers entre eux.'}</p>`;
 const reduction=z.period?(z.prime?tex(`p-1=${z.n}-1=${z.period}`):tex(`\\varphi(${z.n})=${z.period}`))+tex(`(${z.a})^{${z.period}}\\equiv1\\pmod{${z.n}}`)+tex(`${z.exponent}=${z.quotient}\\times${z.period}+${z.reduced}`)+tex(`(${z.a})^{${z.exponent}}\\equiv(${z.a})^{${z.reduced}}\\pmod{${z.n}}`):'<p>On conserve l’exposant initial et on réduit chaque carré modulo n.</p>';
 const selected=z.rows.filter(r=>r.used);
 const powers=z.rows.length?z.rows.map(r=>tex(`(${z.a})^{${r.power}}\\equiv${r.residue}\\pmod{${z.n}}`)).join('')+tex(`${z.reduced}=${selected.map(r=>r.power).join('+')}`)+tex(`${selected.map(r=>r.residue).join('\\times')}\\equiv${z.value}\\pmod{${z.n}}`):tex(`(${z.a})^0=1`);
 return answer(theorem.toUpperCase(),tex(`(${z.a})^{${z.exponent}}\\equiv${z.value}\\pmod{${z.n}}`),z.exponent==='0'?'Pour un exposant nul, la puissance vaut 1 (convention de calcul, y compris 0⁰).':'Reste calculé exactement en Python.')+`<div class="steps">${step('Vérifier les conditions',conditions)}${step('Réduire l’exposant si possible',reduction)}${step('Terminer le calcul',powers)}</div>`;
}
