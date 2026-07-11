import { beforeEach, expect, test } from 'vitest'
import { bigQuestions, missions, seedPhrases } from '../data/seed'
import { importState, loadState } from './storage'

beforeEach(()=>localStorage.clear())
test('ships enough useful practice content',()=>{expect(missions).toHaveLength(12);expect(bigQuestions).toHaveLength(30);expect(seedPhrases).toHaveLength(30)})
test('falls back safely when saved data is corrupted',()=>{localStorage.setItem('fluency-reset-state-v1','{nope');expect(loadState().phrases).toHaveLength(30)})
test('rejects an unrelated import',()=>{expect(()=>importState('{"hello":"world"}')).toThrow(/valid Fluency Reset/)})
