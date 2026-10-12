import { expect, test } from 'vitest'
import { splitHeartInput } from './heartSegments'

test('long answers keep every ordered word', () => {
  const words = Array.from({ length: 320 }, (_, i) => `word${i}`)
  const segments = splitHeartInput(words.join(' '))
  expect(segments.length).toBeGreaterThan(1)
  expect(segments.join(' ').split(/\s+/)).toEqual(words)
})

test('an unrepresentable single word is reported rather than truncated', () => {
  expect(() => splitHeartInput('x'.repeat(2000))).toThrow(/too long/i)
})

test('decimals and abbreviations stay intact for Kokoro normalization', () => {
  const input = 'Dr. Lee paid $3.50. Mr. Chen paid $2.75.'
  expect(splitHeartInput(input)).toEqual([input])
})
