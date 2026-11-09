import unittest
from exercises import generate_series
from practice import check_answer

class PracticeTests(unittest.TestCase):
    def values(self,ex):
        a=ex['answer']; t=ex['topic']; values={}
        for f in ex['practice']['fields']:
            k=f['key']
            if k=='exists': v=a['value'] is not None if t=='4' else a['solvable']
            elif k=='decoded': v=a['m']
            else: v=a.get(k,0)
            values[k]=('yes' if v else 'no') if f['options'] else str(v)
        return values

    def test_all_topics_feedback(self):
        for topic in '12345678':
            for level in (1,2,3):
                series=generate_series({'code':f'M1-{topic}-{level}-20-1234567890ABCDEF'})
                for ex in series['exercises']:
                    with self.subTest(topic=topic,answer=ex['answer']):
                        self.assertEqual(len(ex['practice']['hints']),3)
                        values=self.values(ex)
                        self.assertTrue(check_answer(ex,values)['correct'])
                        self.assertFalse(check_answer(ex,{})['correct'])
                        self.assertFalse(check_answer(ex,{k:'nonsense' for k in values})['correct'])
                        # Changing one active result must fail, unless mathematically equivalent.
                        if topic=='2':
                            a=ex['answer']; values['u']=str(a['u']+a['b']//a['g']);values['v']=str(a['v']-a['a']//a['g'])
                            self.assertTrue(check_answer(ex,values)['correct'])
                            values['g']=str(a['g']+1)
                        elif topic=='4' and ex['answer']['value'] is not None:
                            a=ex['answer'];values['value']=str(a['value']-a['n'])
                            self.assertTrue(check_answer(ex,values)['correct'])
                            values['value']=str(a['value']+1)
                        elif topic=='8' and ex['answer']['solvable']:
                            a=ex['answer'];values['x']=str(a['x']-a['modulus'])
                            self.assertTrue(check_answer(ex,values)['correct'])
                            values['modulus']=str(a['modulus']*2)
                        else:
                            k=next(iter(values));values[k]='no' if values[k]=='yes' else 'yes' if values[k]=='no' else str(int(values[k])+1)
                        self.assertFalse(check_answer(ex,values)['correct'])

if __name__=='__main__': unittest.main()
