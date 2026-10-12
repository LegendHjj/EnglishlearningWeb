import type { VoiceGender } from '../types'
import type { SpeechBackend, SpeechRequest } from './speechTypes'

export function pickBrowserVoice(voices: SpeechSynthesisVoice[], preferredName?: string, gender?: VoiceGender) {
  const english = voices.filter(voice => voice.lang.toLowerCase().startsWith('en'))
  if (preferredName && preferredName !== 'Browser default') {
    const named = english.find(voice => voice.name === preferredName)
    if (named) return named
  }
  if (gender && gender !== 'auto') {
    const female = /female|woman|girl|zira|hazel|aria|jenny|eva|susan|karen|samantha|victoria|moira|tessa|fiona|kate|alice|nicky|sandy|serena|amelie|joana|helena|laura|anna|sara|sofie|ioana|luciana|paulina|lupe|marisol|siri/i
    const male = /male|man|guy|david|james|mark|daniel|george|richard|ryan|thomas|ravi|stefan|yannick|filip|damien|martin|luca|andika|heami|naayf|majed|alex/i
    return english.find(voice => (gender === 'female' ? female : male).test(voice.name)) ?? english.find(voice => !female.test(voice.name) && !male.test(voice.name)) ?? english[0]
  }
  return english[0]
}

export function createBrowserSpeech(): SpeechBackend {
  let cleanup: (() => void) | undefined
  const synth = () => typeof window !== 'undefined' ? window.speechSynthesis : undefined
  return {
    supported: () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
    async play(request: SpeechRequest, signal: AbortSignal, report) {
      const engine = synth()
      if (!engine) throw new Error('Browser voice playback is unavailable.')
      for (const text of request.items) {
        if (signal.aborted) return
        await new Promise<void>((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(text)
          const voice = pickBrowserVoice(engine.getVoices(), request.browserVoice, request.voiceGender)
          if (voice) utterance.voice = voice
          utterance.lang = voice?.lang ?? 'en-US'
          utterance.rate = request.rate
          const finish = (error?: Error) => {
            utterance.onend = null; utterance.onerror = null
            signal.removeEventListener('abort', onAbort)
            cleanup = undefined
            if (error) reject(error); else resolve()
          }
          const onAbort = () => { engine.cancel(); finish() }
          cleanup = onAbort
          signal.addEventListener('abort', onAbort, { once: true })
          utterance.onend = () => finish()
          utterance.onerror = () => finish(new Error('Browser voice playback stopped unexpectedly.'))
          report({ phase: 'playing' })
          engine.speak(utterance)
        })
      }
    },
    stop() { cleanup?.(); synth()?.cancel() },
    dispose() { cleanup?.(); synth()?.cancel() },
  }
}
