import json
import math
import unittest
from calculations import calculate, extended_gcd, inverse, totient, rsa_keys, json_safe


class ArithmeticTests(unittest.TestCase):
    def test_new_calculators(self):
        for a in range(-10, 11):
            for b in range(-10, 11):
                self.assertEqual(calculate('ppcm',dict(a=a,b=b))['lcm'], math.lcm(a,b))
                z=calculate('congruences',dict(a=a,b=b,n=7))
                self.assertEqual(z['congruent'], (a-b)%7==0)
                self.assertEqual(a,7*z['qa']+z['ra'])
        for a in [-7,0,6,7]:
            for n in [2,13,15,16]:
                for k in [0,1,12,222,10**12]:
                    z=calculate('fermat',dict(a=a,n=n,exponent=k))
                    self.assertEqual(z['value'],pow(a,k,n))
                    product=1
                    for row in z['rows']:
                        self.assertEqual(row['residue'],pow(a,row['power'],n))
                        if row['used']: product=product*row['residue']%n
                    self.assertEqual(product,z['value'])
        for op,data in [('congruences',dict(a=1,b=2,n=1)),('fermat',dict(a=2,n=13,exponent=-1)),('fermat',dict(a=2,n=1000001,exponent=5))]:
            with self.assertRaises(ValueError): calculate(op,data)

    def test_bezout_for_signed_integers(self):
        for a in range(-25, 26):
            for b in range(-25, 26):
                result = extended_gcd(a, b)
                self.assertEqual(result['g'], math.gcd(a, b))
                self.assertEqual(a*result['x']+b*result['y'], result['g'])
                for r, u, v in result['coefficients']:
                    self.assertEqual(r, a*u+b*v)

    def test_inverses(self):
        self.assertEqual(inverse(17, 43)['value'], 38)
        self.assertEqual(inverse(11, 23)['value'], 21)
        self.assertIsNone(inverse(2, 6)['value'])
        for n in range(2, 80):
            for a in range(-20, 21):
                value = inverse(a, n)['value']
                if math.gcd(a,n) == 1:
                    self.assertEqual(a*value % n, 1)
                else:
                    self.assertIsNone(value)

    def test_totient_by_counting(self):
        for n in range(1, 150):
            expected = sum(math.gcd(k,n)==1 for k in range(1,n+1))
            self.assertEqual(totient(n), expected)

    def test_euclidean_division(self):
        for a,b in [(-17,5),(17,-5),(-17,-5),(0,5),(12,0)]:
            result=calculate('euclide',dict(a=a,b=b))
            if b:
                d=result['division'];self.assertEqual(a,b*d['q']+d['r'])
                self.assertTrue(0 <= d['r'] < abs(b))
            else:
                self.assertIsNone(result['division'])

    def test_rsa_all_residues(self):
        k=rsa_keys(61,53,17)
        self.assertEqual(k['d'],2753)
        self.assertEqual(pow(65,k['e'],k['n']),2790)
        for m in range(k['n']):
            self.assertEqual(pow(pow(m,k['e'],k['n']),k['d'],k['n']),m)
        self.assertEqual(pow(42,7,143),81)

    def test_utf8_roundtrip(self):
        for message in ['Bonjour !','École 🔐','مرحبا']:
            base=dict(p=61,q=53,e=17,mode='text')
            encrypted=calculate('crypt',dict(base,action='encrypt',message=message))
            decrypted=calculate('crypt',dict(base,action='decrypt',message=' '.join(map(str,encrypted['output']))))
            self.assertEqual(decrypted['decoded'],message)

    def test_validation(self):
        cases=[('rsa',dict(p=7,q=7,e=5)),('rsa',dict(p=12,q=13,e=7)),('rsa',dict(p=11,q=13,e=6)),('inverse',dict(a=3,n=1)),('inverse',dict(a='3.5',n=7)),('euler',dict(n=10**12+1)),('crypt',dict(p=11,q=13,e=7,mode='number',action='encrypt',message='143')),('crypt',dict(p=11,q=13,e=7,mode='text',action='encrypt',message='abc'))]
        for op,data in cases:
            with self.assertRaises(ValueError): calculate(op,data)

    def test_large_integers_are_serialized_exactly(self):
        a=10**70+1
        result=json_safe(calculate('inverse',dict(a=str(a),n='97')))
        self.assertEqual(result['a'],str(a))
        self.assertIsInstance(result['value'],str)
        json.dumps(result)


if __name__ == '__main__':
    unittest.main()
