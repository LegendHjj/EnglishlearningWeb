import type { AudioPlayback, SpeechBackend, SpeechRequest, SpeechSnapshot } from './speechTypes'

interface WorkerEvent { type: 'ready' | 'progress' | 'chunk' | 'done' | 'error'; jobId: number; file?: string; loaded?: number; total?: number; pcm?: ArrayBuffer; sampleRate?: number; message?: string }

export function createHeartVoice(audio: AudioPlayback): SpeechBackend {
  let worker: Worker | undefined
  let prepared = false
  let nextJob = 0
  let active: { id: number; resolve: () => void; reject: (error: Error) => void; signal: AbortSignal; onAbort: () => void; report: (patch: Partial<SpeechSnapshot>) => void; request: SpeechRequest } | undefined
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
      worker?.postMessage({ type: 'cancel', jobId: job.id })
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
      job.report({ phase: 'preparing', progress: { file: data.file || 'model file', loaded: data.loaded || 0, total: data.total } })
    } else if (data.type === 'ready') {
      prepared = true
      worker?.postMessage({ type: 'speak', jobId: job.id, items: job.request.items, rate: job.request.rate })
    } else if (data.type === 'chunk') {
      if (!data.pcm || !data.sampleRate) { finish(new Error('Heart returned incomplete audio. Try again.')); return }
      job.report({ phase: 'playing', progress: undefined })
      void audio.play(new Float32Array(data.pcm), data.sampleRate, job.signal).then(() => {
        if (active?.id === job.id && !job.signal.aborted) worker?.postMessage({ type: 'continue', jobId: job.id })
      }, error => {
        if (active?.id === job.id) {
          worker?.postMessage({ type: 'cancel', jobId: job.id })
          audio.stop()
          finish(error instanceof Error ? error : new Error('Audio playback was blocked.'))
        }
      })
    } else if (data.type === 'done') {
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
      if (!worker) {
        worker = new Worker(new URL('../workers/heartVoice.worker.ts', import.meta.url), { type: 'module' })
        worker.onmessage = handle
        worker.onerror = () => { releaseWorker(); finish(new Error('Heart could not start in this browser. Retry or use a browser voice for now.')) }
      }
      const id = ++nextJob
      return new Promise<void>((resolve, reject) => {
        const onAbort = () => stop()
        active = { id, resolve, reject, signal, onAbort, report, request }
        signal.addEventListener('abort', onAbort, { once: true })
        if (prepared) worker?.postMessage({ type: 'speak', jobId: id, items: request.items, rate: request.rate })
        else worker?.postMessage({ type: 'prepare', jobId: id })
      })
    },
    stop,
    dispose() { stop(); releaseWorker() },
  }
}
