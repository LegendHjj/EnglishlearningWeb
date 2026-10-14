import type { AudioPlayback, SpeechBackend, SpeechRequest, SpeechSnapshot } from './speechTypes'

interface WorkerEvent { type: 'ready' | 'progress' | 'chunk' | 'done' | 'error'; jobId: number; file?: string; loaded?: number; total?: number; pcm?: ArrayBuffer; sampleRate?: number; message?: string }
type Chunk = { pcm: Float32Array; sampleRate: number }
const MAX_CACHE_BYTES = 16 * 1024 * 1024

export function createHeartVoice(audio: AudioPlayback): SpeechBackend {
  let worker: Worker | undefined
  let prepared = false
  let nextJob = 0
  // Session-only, bounded LRU: generated learner audio is never persisted or uploaded.
  const cache = new Map<string, { chunks: Chunk[]; bytes: number }>()
  let cacheBytes = 0
  const keyFor = (request: SpeechRequest) => JSON.stringify([request.rate, request.items])
  let active: { id: number; resolve: () => void; reject: (error: Error) => void; signal: AbortSignal; onAbort: () => void; report: (patch: Partial<SpeechSnapshot>) => void; request: SpeechRequest; chunks?: Chunk[]; bytes: number; replaying: boolean } | undefined
  const releaseWorker = () => { worker?.terminate(); worker = undefined; prepared = false }
  const finish = (error?: Error) => {
    const job = active
    if (!job) return
    active = undefined
    job.signal.removeEventListener('abort', job.onAbort)
    if (error) job.reject(error); else job.resolve()
  }
  const stop = () => {
    const job = active
    if (job) {
      if (!job.replaying) worker?.postMessage({ type: 'cancel', jobId: job.id })
      audio.stop()
      finish()
      if (!prepared) releaseWorker()
    }
  }
  const handle = (event: MessageEvent<WorkerEvent>) => {
    const data = event.data
    const job = active
    if (!job || data.jobId !== job.id || job.signal.aborted) return
    if (data.type === 'progress') {
      job.report({ phase: 'preparing', preparation: 'loading', progress: { file: data.file || 'model file', loaded: data.loaded || 0, total: data.total } })
    } else if (data.type === 'ready') {
      prepared = true
      job.report({ phase: 'preparing', preparation: 'generating', progress: undefined })
      worker?.postMessage({ type: 'speak', jobId: job.id, items: job.request.items, rate: job.request.rate })
    } else if (data.type === 'chunk') {
      if (!data.pcm || !data.sampleRate) { finish(new Error('Heart returned incomplete audio. Try again.')); return }
      const chunk = { pcm: new Float32Array(data.pcm), sampleRate: data.sampleRate }
      job.bytes += chunk.pcm.byteLength
      if (job.bytes <= MAX_CACHE_BYTES) job.chunks?.push(chunk)
      else job.chunks = undefined
      job.report({ phase: 'playing', preparation: undefined, progress: undefined })
      void audio.play(chunk.pcm, chunk.sampleRate, job.signal).then(() => {
        if (active?.id === job.id && !job.signal.aborted) worker?.postMessage({ type: 'continue', jobId: job.id })
      }, error => {
        if (active?.id === job.id) {
          worker?.postMessage({ type: 'cancel', jobId: job.id })
          audio.stop()
          finish(error instanceof Error ? error : new Error('Audio playback was blocked.'))
        }
      })
    } else if (data.type === 'done') {
      if (job.chunks?.length) {
        while (cache.size && (cacheBytes + job.bytes > MAX_CACHE_BYTES || cache.size >= 64)) {
          const oldest = cache.keys().next().value!
          cacheBytes -= cache.get(oldest)!.bytes
          cache.delete(oldest)
        }
        cache.set(keyFor(job.request), { chunks: job.chunks, bytes: job.bytes })
        cacheBytes += job.bytes
      }
      finish()
    } else if (data.type === 'error') {
      releaseWorker()
      finish(new Error(data.message || 'Heart could not prepare. Retry or use a browser voice for now.'))
    }
  }
  return {
    supported: () => typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined',
    play(request, signal, report) {
      if (signal.aborted) return Promise.resolve()
      stop()
      const key = keyFor(request)
      const cached = cache.get(key)
      if (cached) { cache.delete(key); cache.set(key, cached) }
      if (!cached && !worker) {
        worker = new Worker(new URL('../workers/heartVoice.worker.ts', import.meta.url), { type: 'module' })
        worker.onmessage = handle
        worker.onerror = () => { releaseWorker(); finish(new Error('Heart could not start in this browser. Retry or use a browser voice for now.')) }
      }
      const id = ++nextJob
      return new Promise<void>((resolve, reject) => {
        const onAbort = () => stop()
        active = { id, resolve, reject, signal, onAbort, report, request, chunks: [], bytes: 0, replaying: !!cached }
        signal.addEventListener('abort', onAbort, { once: true })
        if (cached) {
          report({ phase: 'playing', preparation: undefined, progress: undefined })
          void (async () => {
            try {
              for (const chunk of cached.chunks) {
                if (active?.id !== id || signal.aborted) return
                await audio.play(chunk.pcm, chunk.sampleRate, signal)
              }
              if (active?.id === id) finish()
            } catch (error) { if (active?.id === id) finish(error instanceof Error ? error : new Error('Audio playback was blocked.')) }
          })()
        }
        else if (prepared) {
          report({ phase: 'preparing', preparation: 'generating', progress: undefined })
          worker?.postMessage({ type: 'speak', jobId: id, items: request.items, rate: request.rate })
        }
        else worker?.postMessage({ type: 'prepare', jobId: id })
      })
    },
    stop,
    dispose() { stop(); releaseWorker(); cache.clear(); cacheBytes = 0 },
  }
}
