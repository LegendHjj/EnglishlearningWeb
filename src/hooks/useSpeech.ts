import { useCallback, useState } from 'react'
import type { VoiceGender } from '../types'

// Heuristic: classify a SpeechSynthesisVoice as female or male from its name.
// Browser voice names are not standardised, so we check common patterns.
function classifyGender(voice: SpeechSynthesisVoice): 'female' | 'male' | 'unknown' {
  const n = voice.name.toLowerCase()
  const femaleWords = [
    'female','woman','girl',
    // Common female voice names across Chrome/Edge/Safari/Firefox
    'zira','hazel','aria','jenny','eva','susan','karen','samantha',
    'victoria','moira','tessa','fiona','kate','alice','nicky','sandy',
    'serena','amelie','joana','helena','laura','anna','sara','sofie',
    'ioana','luciana','paulina','lupe','marisol','siri',
  ]
  const maleWords = [
    'male','man','guy',
    'david','james','mark','daniel','george','richard','ryan','thomas',
    'ravi','stefan','yannick','filip','damien','martin','luca','andika',
    'heami','naayf','majed','alex',
  ]
  if (femaleWords.some(w => n.includes(w))) return 'female'
  if (maleWords.some(w => n.includes(w))) return 'male'
  return 'unknown'
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  preferredName?: string,
  gender?: VoiceGender,
): SpeechSynthesisVoice | undefined {
  const english = voices.filter(v => v.lang.toLowerCase().startsWith('en'))
  // Explicit name override takes priority
  if (preferredName && preferredName !== 'Browser default') {
    const named = english.find(v => v.name === preferredName)
    if (named) return named
  }
  // Gender pick: prefer exact gender, fall back to 'unknown', then anything
  if (gender && gender !== 'auto') {
    const exact = english.find(v => classifyGender(v) === gender)
    if (exact) return exact
    const fallback = english.find(v => classifyGender(v) === 'unknown')
    if (fallback) return fallback
  }
  // Auto / default: first English voice
  return english[0]
}

export function useSpeech(preferredVoice?: string, voiceGender?: VoiceGender) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const createUtterance = useCallback((text: string, onEnd?: () => void, rate = 1) => {
    const value = text.trim()
    if (!supported || !value) { onEnd?.(); return }
    const item = new SpeechSynthesisUtterance(value)
    const voices = window.speechSynthesis.getVoices()
    const voice = pickVoice(voices, preferredVoice, voiceGender)
    if (voice) item.voice = voice
    item.lang = voice?.lang || 'en-US'
    item.rate = rate
    item.onend = () => onEnd?.()
    item.onerror = () => onEnd?.()
    window.speechSynthesis.speak(item)
  }, [preferredVoice, voiceGender, supported])

  const speak = useCallback((text: string, rate = 1) => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(true)
    createUtterance(text, () => setSpeaking(false), rate)
  }, [createUtterance, supported])

  const speakAll = useCallback((items: (string | undefined)[]) => {
    if (!supported) return
    const queue = items.map(item => item?.trim()).filter(Boolean) as string[]
    window.speechSynthesis.cancel()
    if (!queue.length) return
    setSpeaking(true)
    const next = () => {
      const item = queue.shift()
      if (!item) { setSpeaking(false); return }
      createUtterance(item, next)
    }
    next()
  }, [createUtterance, supported])

  return { speak, speakAll, stop, speaking, supported }
}
