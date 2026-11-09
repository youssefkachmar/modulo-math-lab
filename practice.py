"""Hints and exact, mathematical answer validation for worksheet practice."""
from calculations import integer

HINTS = {
 '1': ['Cherchez le multiple de b juste inférieur ou égal à a.', 'Écrivez a = bq + r, avec 0 ≤ r < b. Pour a négatif, le quotient peut être négatif.', 'Calculez r = a − bq, puis vérifiez les deux bornes du reste.'],
 '2': ['Appliquez les divisions successives d’Euclide.', 'Le dernier reste non nul est le PGCD. Remontez les divisions pour écrire ce PGCD sous la forme au + bv.', 'Le PPCM vaut |ab| / PGCD(a, b). Plusieurs couples de coefficients de Bézout sont possibles.'],
 '3': ['Effectuez les deux divisions euclidiennes par n.', 'Pour un entier négatif aussi, choisissez un reste entre 0 et n − 1.', 'Comparez les restes : ils sont égaux si et seulement si les nombres sont congrus.'],
 '4': ['Commencez par calculer PGCD(a, n).', 'Un inverse existe exactement lorsque ce PGCD vaut 1.', 'Dans au + nv = 1, le coefficient u est un inverse. Réduisez-le modulo n.'],
 '5': ['Décomposez n en facteurs premiers.', 'Dans φ(n) = n × ∏(1 − 1/p), utilisez chaque facteur premier distinct une seule fois.', 'Pour une puissance première, φ(pᵏ) = pᵏ − pᵏ⁻¹. Multipliez les contributions des facteurs distincts.'],
 '6': ['Vérifiez que la base et le module sont premiers entre eux.', 'Réduisez l’exposant modulo φ(n), ou modulo n − 1 lorsque n est premier.', 'Calculez la puissance restante par carrés successifs, en réduisant chaque résultat modulo n.'],
 '7': ['Calculez n = pq et φ(n) = (p − 1)(q − 1).', 'La clé privée d est un inverse de e modulo φ(n). Utilisez Euclide étendu.', 'Chiffrez avec c ≡ mᵉ (mod n), puis vérifiez cᵈ ≡ m (mod n). Les clés sont (n, e) et (n, d).'],
 '8': ['Calculez g = PGCD(a, n). Une solution existe exactement lorsque g divise b.', 'Si g divise b, divisez a, b et n par g, puis inversez le coefficient simplifié.', 'Après multiplication par cet inverse, écrivez toutes les solutions sous la forme x = r + Mt, avec t entier et M = n/g.'],
}

def practice_for(ex):
    def field(key,label,options=None,when=None):
        return dict(key=key,label=label,options=options,when=when)
    yesno=[['yes','Oui'],['no','Non']]
    fields={
      '1':[field('q','Quotient q'),field('r','Reste r')],
      '2':[field('g','PGCD'),field('u','Coefficient u : au + bv = PGCD'),field('v','Coefficient v'),field('lcm','PPCM')],
      '3':[field('r','Reste de a'),field('s','Reste de b'),field('congruent','Les nombres sont-ils congrus ?',yesno)],
      '4':[field('exists','L’inverse existe-t-il ?',yesno),field('value','Un inverse de a modulo n',when='exists:yes')],
      '5':[field('phi','φ(n)')],
      '6':[field('value','Reste de la puissance')],
      '7':[field('n','Module n'),field('t','φ(n)'),field('d','Exposant privé d'),field('c','Message chiffré c'),field('decoded','Message déchiffré')],
      '8':[field('exists','Existe-t-il une solution ?',yesno),field('x','r dans x = r + Mt',when='exists:yes'),field('modulus','M dans x = r + Mt',when='exists:yes')],
    }[ex['topic']]
    return dict(hints=HINTS[ex['topic']],fields=fields)

def check_answer(ex, values):
    if not isinstance(values,dict):
        raise ValueError('Réponses invalides.')
    a=ex['answer']; topic=ex['topic']; results=[]; parsed={}
    for f in practice_for(ex)['fields']:
        if f['when']:
            key,expected=f['when'].split(':')
            if values.get(key)!=expected: continue
        key=f['key']; raw=values.get(key,'')
        try:
            if f['options']:
                if raw not in [option[0] for option in f['options']]:
                    raise ValueError('Choisissez Oui ou Non.')
                parsed[key]=raw=='yes'
            else:
                parsed[key]=integer(raw,f['label'])
        except (ValueError,TypeError):
            results.append(dict(key=key,correct=False,message=f['label']+' : '+('choisissez une réponse.' if f['options'] else 'saisissez un entier.')))
    for key,value in parsed.items():
        if key=='exists': correct=value==(a.get('value') is not None if topic=='4' else a['solvable'])
        elif topic=='2' and key in ('u','v'):
            correct='u' in parsed and 'v' in parsed and a['a']*parsed['u']+a['b']*parsed['v']==a['g']
        elif topic=='4': correct=a['value'] is not None and a['a']*value%a['n']==1
        elif topic=='8':
            correct=a['solvable'] and (value==a['modulus'] if key=='modulus' else (value-a['x'])%a['modulus']==0)
        elif topic=='7' and key=='d': correct=value>0 and value*a['e']%a['t']==1
        elif key=='decoded': correct=value==a['m']
        else: correct=value==a[key]
        label=next(f['label'] for f in practice_for(ex)['fields'] if f['key']==key)
        results.append(dict(key=key,correct=correct,message=label+(' : correct.' if correct else ' : à revoir.')))
    return dict(correct=bool(results) and all(r['correct'] for r in results),results=results)
