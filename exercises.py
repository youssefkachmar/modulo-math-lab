"""Reproducible classroom worksheets. M1 codes include all generation settings."""
from math import gcd
import random
import re
import secrets
from calculations import extended_gcd, factors, inverse, totient, rsa_keys, integer

TOPICS = {
    "1": "Division euclidienne", "2": "PGCD & Bézout", "3": "Congruences",
    "4": "Inverse modulaire", "5": "Indicatrice d’Euler",
    "6": "Fermat & Euler", "7": "Chiffrement RSA",
}
LEVELS = {1: "Découverte", 2: "Entraînement", 3: "Défi"}


def text(value):
    return {"text": value}


def math(value):
    return {"math": value}


def euclid_steps(a, b):
    result = extended_gcd(a, b)
    steps = [text("On applique l’algorithme d’Euclide :")]
    steps += [math(f"{r['a']}={r['b']}\\times {r['q']}+{r['r']}") for r in result["rows"]]
    steps += [text("Le dernier reste non nul est le PGCD."),
              math(f"\\operatorname{{PGCD}}({a},{b})={result['g']}")]
    return result, steps


def bezout_steps(a, b, result):
    # Every row expresses the new remainder as a combination of the inputs.
    rows = result["coefficients"]
    steps = [text("Pour retrouver Bézout, on écrit chaque reste sous la forme au + bv. "
                  "À chaque division de quotient q, on soustrait q fois la ligne courante à la précédente.")]
    table = r"\begin{array}{r|r|r}r&u&v\\\hline "
    table += r"\\".join(f"{r}&{u}&{v}" for r, u, v in rows) + r"\end{array}"
    steps += [math(table), math(f"{a}\\times({result['x']})+{b}\\times({result['y']})={result['g']}")]
    return steps


def power_steps(a, exponent, n):
    steps = [text("On calcule par carrés successifs, en réduisant modulo n à chaque étape :")]
    terms, power, residue = [], 1, a % n
    while power <= exponent:
        steps.append(math(f"{a}^{{{power}}}\\equiv {residue}\\pmod{{{n}}}"))
        if exponent & power:
            terms.append((power, residue))
        residue = residue * residue % n
        power *= 2
    steps += [math(f"{exponent}=" + "+".join(str(p) for p, _ in terms)),
              math(f"{a}^{{{exponent}}}\\equiv " + r"\times".join(str(v) for _, v in terms)
                   + f"\\equiv {pow(a, exponent, n)}\\pmod{{{n}}}")]
    return steps


def make_exercise(topic, level, rng):
    limit = {1: 30, 2: 100, 3: 250}[level]
    a, b = rng.randint(12, limit * 3), rng.randint(2, limit)
    if topic == "1":
        if level == 3:
            a = -a
        q, r = divmod(a, b)
        prompt = [text("Effectuer la division euclidienne de a par b. Donner le quotient et le reste, puis vérifier leur validité."),
                  math(f"a={a},\\qquad b={b}")]
        solution = [text("On cherche q tel que bq ≤ a < b(q + 1)."),
                    math(f"{b}\\times({q})\\le {a}<{b}\\times({q+1})"),
                    math(f"r={a}-{b}\\times({q})={r}"),
                    math(f"{a}={b}\\times({q})+{r},\\qquad 0\\le {r}<{b}"),
                    text(f"Le quotient est {q} et le reste est {r}.")]
        answer = dict(a=a, b=b, q=q, r=r)
    elif topic == "2":
        a, b = max(a, b), min(a, b)
        result, solution = euclid_steps(a, b)
        solution += bezout_steps(a, b, result)
        solution += [math(f"\\operatorname{{PPCM}}({a},{b})=\\frac{{{a}\\times {b}}}{{{result['g']}}}={a*b//result['g']}")]
        prompt = [text("Calculer le PGCD par l’algorithme d’Euclide, trouver une identité de Bézout et en déduire le PPCM."), math(f"a={a},\\qquad b={b}")]
        answer = dict(a=a, b=b, g=result["g"], u=result["x"], v=result["y"], lcm=a*b//result["g"])
    elif topic == "3":
        n = b
        if level == 3:
            a = -a
        other = a + rng.randint(2, 8) * n + rng.choice([0, 0, 1])
        r, s = a % n, other % n
        prompt = [text("Donner les restes de a et b modulo n. Ces deux entiers sont-ils congrus modulo n ? Justifier."), math(f"a={a},\\quad b={other},\\quad n={n}")]
        solution = [math(f"{a}={n}\\times({a//n})+{r}"), math(f"{other}={n}\\times({other//n})+{s}"),
                    text("Deux entiers sont congrus modulo n si et seulement s’ils ont le même reste."),
                    math(f"{a}" + (r"\equiv" if r == s else r"\not\equiv") + f"{other}\\pmod{{{n}}}"),
                    text(f"Les restes sont {'égaux' if r == s else 'différents'} : {r} et {s}.")]
        answer = dict(a=a, b=other, n=n, r=r, s=s, congruent=r == s)
    elif topic == "4":
        n = rng.randint(7, limit)
        a = rng.randint(2, n-1)
        result, solution = euclid_steps(a, n)
        prompt = [text("Déterminer si a possède un inverse modulo n. S’il existe, trouver son représentant entre 0 et n − 1 et vérifier."), math(f"a={a},\\qquad n={n}")]
        value = inverse(a, n)["value"]
        if value is None:
            solution += [text("Le PGCD n’est pas égal à 1. L’inverse n’existe donc pas.")]
        else:
            solution += bezout_steps(a, n, result)
            solution += [text("Le coefficient de a est un inverse. On le réduit modulo n :"),
                         math(f"{result['x']}\\equiv {value}\\pmod{{{n}}}"),
                         math(f"{a}\\times {value}={a*value}\\equiv 1\\pmod{{{n}}}")]
        answer = dict(a=a, n=n, value=value, g=result["g"])
    elif topic == "5":
        n = rng.randint(6, {1:40, 2:180, 3:600}[level])
        fs = factors(n)
        phi = totient(n)
        prompt = [text("Décomposer n en facteurs premiers, puis calculer φ(n). Expliquer ce que représente ce résultat."), math(f"n={n}")]
        solution = [math(f"{n}=" + r"\times".join(f"{p}^{{{k}}}" for p, k in fs)),
                    text("Dans le produit d’Euler, chaque facteur premier distinct intervient une seule fois."),
                    math(f"\\varphi({n})={n}" + "".join(f"\\left(1-\\frac{{1}}{{{p}}}\\right)" for p, _ in fs) + f"={phi}"),
                    text(f"Il y a {phi} entiers entre 1 et {n} qui sont premiers avec {n}.")]
        answer = dict(n=n, phi=phi, factors=fs)
    elif topic == "6":
        n = rng.choice([5, 7, 11, 13] if level == 1 else [9, 10, 12, 14, 15, 16, 18, 20, 25])
        a = rng.choice([k for k in range(2, n) if gcd(k,n)==1])
        phi = totient(n)
        exponent = rng.randint(3, 10 * level) * phi + rng.randint(1, phi-1)
        q, r = divmod(exponent, phi)
        prompt = [text("Calculer le reste de cette puissance modulo n sans développer la puissance entière. Justifier l’utilisation du théorème de Fermat ou d’Euler."), math(f"{a}^{{{exponent}}}\\pmod{{{n}}}")]
        solution = [math(f"\\operatorname{{PGCD}}({a},{n})=1,\\qquad\\varphi({n})={phi}"),
                    text("Les entiers sont premiers entre eux : le théorème d’Euler s’applique."),
                    math(f"{a}^{{{phi}}}\\equiv 1\\pmod{{{n}}}"),
                    math(f"{exponent}={q}\\times {phi}+{r}"),
                    math(f"{a}^{{{exponent}}}\\equiv( {a}^{{{phi}}})^{{{q}}}{a}^{{{r}}}\\equiv {a}^{{{r}}}\\pmod{{{n}}}")]
        solution += power_steps(a, r, n)
        answer = dict(a=a, exponent=exponent, n=n, value=pow(a,exponent,n))
    else:
        primes = [3,5,7,11] if level == 1 else [5,7,11,13] if level == 2 else [11,13,17,19]
        p, q = rng.sample(primes, 2)
        phi = (p-1)*(q-1)
        e = rng.choice([k for k in [3,5,7,11,13,17] if k < phi and gcd(k,phi)==1])
        key = rsa_keys(p,q,e)
        n, d = key["n"], key["d"]
        m = rng.randint(2,n-2)
        c = pow(m,e,n)
        prompt = [text("Calculer n et φ(n), vérifier la validité de e puis trouver d. Donner les clés publique et privée. Chiffrer m et vérifier le déchiffrement (calculatrice autorisée)."),
                  math(f"p={p},\\quad q={q},\\quad e={e},\\quad m={m}")]
        inv = extended_gcd(e,phi)
        solution = [math(f"n={p}\\times {q}={n},\\qquad\\varphi(n)=({p}-1)({q}-1)={phi}"),
                    math(f"1<{e}<{phi},\\qquad\\operatorname{{PGCD}}({e},{phi})=1"),
                    text("On utilise Euclide étendu pour inverser e modulo φ(n).")]
        solution += bezout_steps(e,phi,inv)
        solution += [math(f"d\\equiv {inv['x']}\\equiv {d}\\pmod{{{phi}}}"),
                     text(f"Clé publique (n, e) = ({n}, {e}) ; clé privée (n, d) = ({n}, {d})."),
                     text("Chiffrement par exponentiation modulaire :")]
        solution += power_steps(m,e,n)[1:]
        solution += [math(f"c={c},\\qquad {c}^{{{d}}}\\equiv {m}\\pmod{{{n}}}"),
                     text("Le déchiffrement retrouve bien le message initial. Ce RSA est un exemple pédagogique.")]
        answer = dict(**key, m=m, c=c)
    return dict(topic=topic, title=TOPICS[topic], prompt=prompt, solution=solution, answer=answer)


def generate_series(data):
    code = data.get("code", "")
    if code:
        if not isinstance(code, str) or len(code) > 60:
            raise ValueError("Numéro de série invalide.")
        match = re.fullmatch(r"M1-([1-7]{1,7})-([1-3])-(\d{1,2})-([0-9A-F]{16})", code.strip().upper())
        if not match:
            raise ValueError("Numéro invalide. Copiez le code complet commençant par M1-.")
        selection, level, count, seed = match.groups()
        level, count = int(level), int(count)
        if selection != "".join(sorted(set(selection))):
            raise ValueError("Numéro de série invalide.")
    else:
        selection = data.get("topics", list(TOPICS))
        if not isinstance(selection, list) or not selection or any(not isinstance(t,str) or t not in TOPICS for t in selection):
            raise ValueError("Choisissez au moins un thème valide.")
        selection = "".join(sorted(set(selection)))
        level = integer(data.get("level",2), "Difficulté")
        count = integer(data.get("count",6), "Nombre d’exercices")
        seed = secrets.token_hex(8).upper()
    if level not in LEVELS or not 1 <= count <= 20:
        raise ValueError("Choisissez une difficulté de 1 à 3 et entre 1 et 20 exercices.")
    code = f"M1-{selection}-{level}-{count}-{seed}"
    rng = random.Random(code)
    topics = list(selection)
    rng.shuffle(topics)
    exercises, signatures = [], set()
    for i in range(count):
        for _ in range(1000):
            item = make_exercise(topics[i % len(topics)],level,rng)
            signature = repr(item["prompt"])
            if signature not in signatures:
                break
        else:
            raise ValueError("Impossible de créer une série distincte. Essayez moins d’exercices.")
        signatures.add(signature)
        item["number"] = i+1
        exercises.append(item)
    return dict(code=code, level=level, level_label=LEVELS[level], count=count,
                topics=list(selection), exercises=exercises)
