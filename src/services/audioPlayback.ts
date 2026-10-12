import type { AudioPlayback } from './speechTypes'

export function createAudioPlayback(): AudioPlayback {
  let context: AudioContext | undefined
  let source: AudioBufferSourceNode | undefined
  let finish: (() => void) | undefined
  const stop = () => {
    if (source) { try { source.stop() } catch { /* already ended */ } source.disconnect(); source = undefined }
    finish?.(); finish = undefined
  }
  return {
    async activate() {
      if (!context) {
        const Constructor = globalThis.AudioContext ?? (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Constructor) throw new Error('This browser cannot play the Heart voice. Try a browser voice.')
        context = new Constructor()
      }
      try { if (context.state !== 'running') await context.resume() }
      catch { throw new Error('Audio playback was blocked. Tap Retry or use a browser voice for now.') }
    },
    play(pcm, sampleRate, signal) {
      if (!context || context.state !== 'running') return Promise.reject(new Error('Audio playback was blocked. Tap Retry or use a browser voice for now.'))
      if (signal.aborted) return Promise.resolve()
      stop()
      return new Promise<void>(resolve => {
        const buffer = context!.createBuffer(1, pcm.length, sampleRate)
        buffer.copyToChannel(pcm, 0)
        const active = context!.createBufferSource()
        source = active
        active.buffer = buffer
        active.connect(context!.destination)
        let ended = false
        const done = () => {
          if (ended) return
          ended = true
          signal.removeEventListener('abort', done)
          active.onended = null
          active.disconnect()
          if (source === active) source = undefined
          if (finish === done) finish = undefined
          resolve()
        }
        finish = done
        active.onended = done
        signal.addEventListener('abort', done, { once: true })
        active.start()
      })
    },
    stop,
    dispose() { stop(); void context?.close(); context = undefined },
  }
}

export const audioPlayback = createAudioPlayback()
