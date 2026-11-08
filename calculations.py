"""Algorithmes pédagogiques : entiers exacts, Euclide étendu, Euler et RSA."""
from math import gcd, isqrt
import re


def integer(value, label="Nombre"):
    if not isinstance(value, (str, int)) or isinstance(value, bool):
        raise ValueError(f"{label} : saisissez un entier.")
    text = str(value).strip()
    if len(text) > 100 or not re.fullmatch(r"[+-]?[0-9]+", text):
        raise ValueError(f"{label} : entier requis, limité à 100 caractères.")
    return int(text)


def extended_gcd(a, b):
    r, s, x, y, u, v = abs(a), abs(b), 1, 0, 0, 1
    sign_a, sign_b = (-1 if a < 0 else 1), (-1 if b < 0 else 1)
    rows, coefficients = [], [[r, sign_a, 0], [s, 0, sign_b]]
    while s:
        q, remainder = divmod(r, s)
        rows.append(dict(a=r, b=s, q=q, r=remainder))
        r, s = s, remainder
        x, u = u, x - q * u
        y, v = v, y - q * v
        if s:
            coefficients.append([s, u * sign_a, v * sign_b])
    return dict(g=r, x=x * sign_a, y=y * sign_b, rows=rows, coefficients=coefficients)


def inverse(a, n):
    if n < 2:
        raise ValueError("Le module doit être supérieur ou égal à 2.")
    result = extended_gcd(a, n)
    result["value"] = result["x"] % n if result["g"] == 1 else None
    return result


def factors(n):
    if not 1 <= n <= 10**12:
        raise ValueError("Choisissez n entre 1 et 1 000 000 000 000.")
    result, p = [], 2
    while p * p <= n:
        k = 0
        while n % p == 0:
            n //= p
            k += 1
        if k:
            result.append([p, k])
        p += 1 if p == 2 else 2
    if n > 1:
        result.append([n, 1])
    return result


def totient(n):
    result = n
    for p, _ in factors(n):
        result = result // p * (p - 1)
    return result


def is_prime(n):
    if n < 2:
        return False
    if n % 2 == 0:
        return n == 2
    return all(n % p for p in range(3, isqrt(n) + 1, 2))


def rsa_keys(p, q, e):
    if not (2 <= p <= 10**6 and 2 <= q <= 10**6) or not is_prime(p) or not is_prime(q):
        raise ValueError("p et q doivent être premiers, entre 2 et 1 000 000.")
    if p == q:
        raise ValueError("Choisissez deux nombres premiers distincts.")
    phi = (p - 1) * (q - 1)
    if not 1 < e < phi:
        raise ValueError("Il faut 1 < e < φ(n).")
    d = inverse(e, phi)["value"]
    if d is None:
        raise ValueError("e et φ(n) doivent être premiers entre eux.")
    return dict(p=p, q=q, e=e, n=p*q, t=phi, d=d)


def calculate(operation, data):
    def number(key):
        return integer(data.get(key, ""), key)
    if operation == "inverse":
        a, n = number("a"), number("n")
        result = inverse(a, n)
        value = result["value"]
        result.update(a=a, n=n, last=n-1, product=None if value is None else a*value)
        if value is not None and n <= 10**12:
            result.update(phi=totient(n), prime=is_prime(n))
            result["exponent"] = result["phi"]-1
        return result
    if operation == "congruences":
        a, b, n = number("a"), number("b"), number("n")
        if n < 2:
            raise ValueError("Le module doit être supérieur ou égal à 2.")
        return dict(a=a, b=b, n=n, ra=a%n, rb=b%n, qa=a//n, qb=b//n,
                    difference=a-b, quotient=(a-b)//n, remainder=(a-b)%n, congruent=(a-b)%n==0)
    if operation == "fermat":
        a, exponent, n = number("a"), number("exponent"), number("n")
        if not 2 <= n <= 10**6 or not 0 <= exponent <= 10**12:
            raise ValueError("Choisissez 2 ≤ n ≤ 1 000 000 et 0 ≤ l’exposant ≤ 10¹².")
        g, prime = gcd(a,n), is_prime(n)
        period = (n-1 if prime else totient(n)) if g == 1 else None
        reduced = exponent % period if period else exponent
        rows, power, residue, accumulator = [], 1, a % n, 1
        while power <= reduced:
            used = bool(reduced & power)
            if used:
                accumulator = accumulator * residue % n
            rows.append(dict(power=power, residue=residue, used=used, accumulator=accumulator))
            power *= 2
            residue = residue * residue % n
        return dict(a=a, exponent=exponent, n=n, g=g, prime=prime, period=period,
                    reduced=reduced, quotient=exponent//period if period else None,
                    rows=rows, value=pow(a,exponent,n))
    if operation in ("euclide", "ppcm"):
        a, b = number("a"), number("b")
        if a == b == 0 and operation == "euclide":
            raise ValueError("Choisissez au moins un entier non nul.")
        result = extended_gcd(a, b)
        result.update(a=a, b=b, lcm=abs(a*b)//result["g"] if result["g"] else 0)
        result["division"] = None if b == 0 else dict(q=(a-a%abs(b))//b, r=a%abs(b))
        return result
    if operation == "euler":
        n = number("n")
        fs = factors(n)
        return dict(n=n, factors=fs, phi=totient(n), residues=[dict(k=k, coprime=gcd(k,n)==1) for k in range(1,n+1)] if n<=100 else [])
    if operation in ("rsa", "crypt"):
        key = rsa_keys(number("p"), number("q"), number("e"))
        if operation == "rsa":
            return key
        mode, action, message = data.get("mode"), data.get("action"), data.get("message")
        if mode not in ("text", "number") or action not in ("encrypt", "decrypt"):
            raise ValueError("Mode ou opération RSA invalide.")
        if not isinstance(message, str) or not message.strip():
            raise ValueError("Saisissez un message ou un nombre.")
        if action == "encrypt":
            if mode == "text":
                if key["n"] <= 255:
                    raise ValueError("Pour le texte UTF-8, n doit être supérieur à 255 (essayez 61 et 53).")
                if len(message) > 500:
                    raise ValueError("Limitez le message à 500 caractères.")
                blocks = list(message.encode("utf-8"))
            else:
                blocks = [integer(message, "Message")]
            exponent = key["e"]
        else:
            parts = re.split(r"[\s,;]+", message.strip())
            if len(parts) > 2000 or (mode == "number" and len(parts) != 1):
                raise ValueError("Un bloc en mode Nombre ; au maximum 2 000 blocs en mode Texte.")
            blocks = [integer(part, "Bloc chiffré") for part in parts]
            exponent = key["d"]
        if any(not 0 <= b < key["n"] for b in blocks):
            raise ValueError(f"Chaque bloc doit être compris entre 0 et {key['n']-1}.")
        output = [pow(b, exponent, key["n"]) for b in blocks]
        decoded = None
        if action == "decrypt":
            if mode == "text":
                try:
                    decoded = bytes(output).decode("utf-8")
                except (ValueError, UnicodeDecodeError):
                    raise ValueError("Le résultat n’est pas un texte UTF-8 valide. Vérifiez les clés et les blocs.") from None
            else:
                decoded = str(output[0])
        return dict(key=key, input=blocks, output=output, decoded=decoded, mode=mode, action=action, exponent=exponent)
    raise ValueError("Module inconnu.")


def json_safe(value):
    """Éviter toute perte de précision dans le navigateur : nombres en chaînes."""
    if isinstance(value, bool) or value is None:
        return value
    if isinstance(value, int):
        return str(value)
    if isinstance(value, dict):
        return {k:json_safe(v) for k,v in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(v) for v in value]
    return value
