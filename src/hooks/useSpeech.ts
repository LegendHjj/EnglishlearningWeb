import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { speechController } from '../services/speechController'
import type { SpeechEngine, VoiceGender } from '../types'

let nextOwnerId = 0
export function useSpeech(preferredVoice?: string, voiceGender?: VoiceGender, engine: SpeechEngine = 'browser') {
  const ownerRef = useRef<string | null>(null)
  if (!ownerRef.current) ownerRef.current = `speech-${++nextOwnerId}`
  const ownerId = ownerRef.current
  const snapshot = useSyncExternalStore(speechController.subscribe, speechController.getSnapshot)
  const stop = useCallback(() => speechController.stopOwner(ownerId), [ownerId])
  useEffect(() => () => speechController.stopOwner(ownerId), [ownerId, preferredVoice, voiceGender, engine])
  const speak = useCallback((value: string, rate = 1) => {
    speechController.speak({ ownerId, engine, items: [value], rate, browserVoice: preferredVoice, voiceGender })
  }, [ownerId, engine, preferredVoice, voiceGender])
  const speakAll = useCallback((items: (string | undefined)[]) => {
    speechController.speak({ ownerId, engine, items: items.filter((item): item is string => typeof item === 'string'), rate: 1, browserVoice: preferredVoice, voiceGender })
  }, [ownerId, engine, preferredVoice, voiceGender])
  return {
    speak, speakAll, stop,
    speaking: snapshot.ownerId === ownerId && (snapshot.phase === 'preparing' || snapshot.phase === 'playing'),
    supported: speechController.supports(engine),
    snapshot,
  }
}
