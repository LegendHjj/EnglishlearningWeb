import type { SpeechEngine } from '../types'
import type { AudioPlayback, SpeechBackend, SpeechRequest, SpeechSnapshot } from './speechTypes'
import { createBrowserSpeech } from './browserSpeech'
import { audioPlayback } from './audioPlayback'
import { readVoiceClip } from './voicePack'

type Host = { id: string; scope: 'page' | 'modal' }
type ClipLookup = (text: string, rate: number) => Promise<{ pcm: Float32Array; sampleRate: number } | undefined>
export function createSpeechController(browser: SpeechBackend, getHeart: () => Promise<SpeechBackend>, audio: AudioPlayback, lookup?: ClipLookup) {
  let snapshot: SpeechSnapshot = { phase: 'idle', browserFallback: false, microphoneBlocked: false }
  const listeners = new Set<() => void>()
  const hosts: Host[] = []
  const locks = new Set<symbol>()
  let sequence = 0
  let current: { id: number; ownerId: string; abort: AbortController; request: SpeechRequest } | undefined
  let failed: SpeechRequest | undefined
  let heart: SpeechBackend | undefined
  let heartPromise: Promise<SpeechBackend> | undefined
  const emit = (patch: Partial<SpeechSnapshot>) => {
    snapshot = { ...snapshot, ...patch }
    listeners.forEach(listener => listener())
  }
  const host = () => [...hosts].reverse().find(h => h.scope === 'modal') ?? [...hosts].reverse().find(h => h.scope === 'page')
  const updateHost = () => emit({ hostId: host()?.id })
  const stop = () => {
    sequence++
    current?.abort.abort()
    current = undefined
    failed = undefined
    browser.stop()
    heart?.stop()
    audio.stop()
    emit({ phase: 'idle', ownerId: undefined, engine: undefined, progress: undefined, preparation: undefined, savedAudio: undefined, error: undefined })
  }
  const loadHeart = () => {
    if (heart) return Promise.resolve(heart)
    if (!heartPromise) heartPromise = getHeart().then(value => { heart = value; return value }).catch(error => { heartPromise = undefined; throw error })
    return heartPromise
  }
  const speak = (incoming: SpeechRequest) => {
    const items = incoming.items.map(item => item.trim()).filter(Boolean)
    if (!items.length || locks.size) return
    const request = { ...incoming, items }
    stop()
    const id = ++sequence
    const abort = new AbortController()
    current = { id, ownerId: request.ownerId, abort, request }
    const effectiveEngine = request.engine === 'heart' && snapshot.browserFallback ? 'browser' : request.engine
    emit({ phase: effectiveEngine === 'heart' ? 'preparing' : 'playing', preparation: effectiveEngine === 'heart' ? 'loading' : undefined, engine: effectiveEngine, ownerId: request.ownerId, hostId: host()?.id })
    const isCurrent = () => current?.id === id && !abort.signal.aborted
    const report = (patch: Partial<SpeechSnapshot>) => { if (isCurrent()) emit(patch) }
    // Activation starts in this user gesture, before dynamic imports or network work.
    const activation = effectiveEngine === 'heart' ? audio.activate() : undefined
    const finish = () => { if (isCurrent()) { current = undefined; emit({ phase: 'idle', ownerId: undefined, engine: undefined, progress: undefined, savedAudio: undefined, error: undefined }) } }
    const fail = (error: unknown) => {
      if (!isCurrent()) return
      current = undefined
      failed = request
      emit({ phase: 'error', ownerId: request.ownerId, engine: effectiveEngine, progress: undefined, error: error instanceof Error ? error.message : 'Voice playback could not start.' })
    }
    if (effectiveEngine === 'browser') {
      try {
        if (!browser.supported()) throw new Error('Browser voice playback is unavailable.')
        void browser.play(request, abort.signal, report).then(finish, fail)
      } catch (error) { fail(error) }
      return
    }
    void (async () => {
      try {
        // Look up all items before starting: a partial match must not repeat the beginning through live synthesis.
        const [clips] = await Promise.all([
          lookup ? Promise.all(items.map(item => lookup(item, request.rate).catch(() => undefined))) : Promise.resolve([]),
          activation,
        ])
        if (!isCurrent()) return
        if (clips.length && clips.every(clip => clip !== undefined)) {
          report({ phase: 'playing', preparation: undefined, progress: undefined, savedAudio: true })
          for (const clip of clips) {
            if (!isCurrent()) return
            await audio.play(clip.pcm, clip.sampleRate, abort.signal)
          }
          finish()
          return
        }
        const backend = await loadHeart()
        if (!isCurrent()) return
        if (!backend.supported()) throw new Error('This voice is unavailable in this browser.')
        await backend.play(request, abort.signal, report)
        finish()
      } catch (error) { fail(error) }
    })()
  }
  return {
    speak, stop,
    stopOwner(ownerId: string) { if (current?.ownerId === ownerId || (failed?.ownerId === ownerId && snapshot.phase === 'error')) stop() },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot: () => snapshot,
    supports(engine: SpeechEngine) { return engine === 'browser' ? browser.supported() : typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' && (typeof AudioContext !== 'undefined' || typeof (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== 'undefined') },
    acquireMicrophone(_ownerId: string) {
      const token = Symbol('microphone')
      locks.add(token)
      stop()
      emit({ microphoneBlocked: true })
      let released = false
      return () => { if (released) return; released = true; locks.delete(token); emit({ microphoneBlocked: locks.size > 0 }) }
    },
    registerHost(value: Host) {
      hosts.push(value); updateHost()
      let removed = false
      return () => { if (removed) return; removed = true; const index = hosts.indexOf(value); if (index >= 0) hosts.splice(index, 1); updateHost() }
    },
    retry() { if (locks.size || !failed) return; const request = failed; emit({ browserFallback: false }); speak(request) },
    useBrowserForNow() { if (locks.size) return; const request = failed ?? current?.request; emit({ browserFallback: true }); if (request) speak(request) },
    clearBrowserFallback() { emit({ browserFallback: false }) },
    dispose() { stop(); browser.dispose(); heart?.dispose(); audio.dispose(); listeners.clear(); hosts.length = 0; locks.clear() },
  }
}

export const speechController = createSpeechController(
  createBrowserSpeech(),
  async () => (await import('./heartVoice')).createHeartVoice(audioPlayback),
  audioPlayback,
  readVoiceClip,
)
