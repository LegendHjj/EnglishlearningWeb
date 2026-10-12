import { expect, test } from 'vitest'
import { pickBrowserVoice } from './browserSpeech'

const voice = (name: string) => ({ name, lang: 'en-US' }) as SpeechSynthesisVoice
test('named English browser voice overrides gender and gender fallback stays available', () => {
  const voices = [voice('Microsoft David'), voice('Microsoft Zira'), voice('Unknown English')]
  expect(pickBrowserVoice(voices, 'Microsoft David', 'female')?.name).toBe('Microsoft David')
  expect(pickBrowserVoice(voices, undefined, 'female')?.name).toBe('Microsoft Zira')
  expect(pickBrowserVoice(voices, undefined, 'male')?.name).toBe('Microsoft David')
})
