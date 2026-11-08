"""Check generated exercises against independent mathematical invariants."""
import unittest
from math import gcd, prod
from exercises import generate_series, TOPICS


class SeriesTests(unittest.TestCase):
    def test_reproduction_and_new_series(self):
        codes = set()
        for _ in range(12):
            series = generate_series({"topics":["2","4","7"],"count":9,"level":3})
            self.assertEqual(series, generate_series({"code":series["code"]}))
            self.assertEqual(series, generate_series({"code":" " + series["code"].lower() + " "}))
            codes.add(series["code"])
        self.assertEqual(len(codes),12)

    def test_balanced_topics_and_no_duplicates(self):
        series = generate_series({"count":20})
        counts = [sum(ex["topic"] == topic for ex in series["exercises"]) for topic in TOPICS]
        self.assertLessEqual(max(counts)-min(counts),1)
        self.assertEqual(len({repr(ex["prompt"]) for ex in series["exercises"]}),20)

    def test_all_topics_and_levels(self):
        for topic in TOPICS:
            for level in (1,2,3):
                for seed in ("0000000000000000","1234567890ABCDEF","FFFFFFFFFFFFFFFF"):
                    series = generate_series({"code":f"M1-{topic}-{level}-20-{seed}"})
                    self.assertEqual(len(series["exercises"]),20)
                    for ex in series["exercises"]:
                        a = ex["answer"]
                        with self.subTest(topic=topic,level=level,answer=a):
                            self.assertTrue(ex["prompt"])
                            self.assertTrue(ex["solution"])
                            if topic == "1":
                                self.assertEqual(a["a"],a["b"]*a["q"]+a["r"])
                                self.assertTrue(0 <= a["r"] < a["b"])
                            elif topic == "2":
                                self.assertEqual(a["g"],gcd(a["a"],a["b"]))
                                self.assertEqual(a["a"]*a["u"]+a["b"]*a["v"],a["g"])
                                self.assertEqual(a["lcm"]*a["g"],a["a"]*a["b"])
                            elif topic == "3":
                                self.assertEqual(a["congruent"],(a["a"]-a["b"])%a["n"] == 0)
                                self.assertEqual(a["r"],a["a"]%a["n"])
                                self.assertEqual(a["s"],a["b"]%a["n"])
                            elif topic == "4":
                                if a["value"] is None:
                                    self.assertNotEqual(gcd(a["a"],a["n"]),1)
                                else:
                                    self.assertEqual(a["a"]*a["value"]%a["n"],1)
                                    self.assertTrue(0 <= a["value"] < a["n"])
                            elif topic == "5":
                                self.assertEqual(a["phi"],sum(gcd(k,a["n"])==1 for k in range(1,a["n"]+1)))
                                self.assertEqual(prod(p**k for p,k in a["factors"]),a["n"])
                            elif topic == "6":
                                self.assertEqual(a["value"],pow(a["a"],a["exponent"],a["n"]))
                                self.assertEqual(gcd(a["a"],a["n"]),1)
                            else:
                                self.assertEqual(a["n"],a["p"]*a["q"])
                                self.assertEqual(a["e"]*a["d"]%a["t"],1)
                                self.assertEqual(a["c"],pow(a["m"],a["e"],a["n"]))
                                self.assertEqual(a["m"],pow(a["c"],a["d"],a["n"]))

    def test_invalid_settings(self):
        cases = [{"topics":[]},{"topics":["8"]},{"topics":"1"},{"topics":[{}]},
                 {"level":0},{"level":True},{"count":21},{"count":0},{"count":"1.5"},
                 {"code":"M1-11-2-5-1234567890ABCDEF"},{"code":"M1-1-2-99-1234567890ABCDEF"},
                 {"code":"<script>"},{"code":123}]
        for data in cases:
            with self.subTest(data=data), self.assertRaises(ValueError):
                generate_series(data)


if __name__ == "__main__":
    unittest.main()
