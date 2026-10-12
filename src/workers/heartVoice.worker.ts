/// <reference types="vite/client" />
import { KokoroTTS, TextSplitterStream } from 'kokoro-js'
import { env as transformerEnv } from '@huggingface/transformers'
import { HEART_MODEL, HEART_REVISION, fetchPinnedHeartResource, pinHeartResourceUrl } from '../services/heartAssets'
import { splitHeartInput, splitHeartSegment } from '../services/heartSegments'

type Command = { type: 'prepare' | 'speak' | 'continue' | 'cancel' | 'dispose'; jobId: number; items?: string[]; rate?: number }
const scope = self as unknown as { fetch: typeof fetch; caches: CacheStorage; postMessage: (message: unknown, transfer?: Transferable[]) => void; onmessage: ((event: MessageEvent<Command>) => void) | null; close: () => void }
let tts: KokoroTTS | undefined
let loading: Promise<KokoroTTS> | undefined
let running: Promise<void> = Promise.resolve()
const cancelled = new Set<number>()
const acknowledgements = new Map<number, () => void>()
class OverWindow extends Error {}

// This adapter exists only in the Heart worker. It redirects Kokoro's fixed
// /resolve/main/ voice URL and its cache keys to the approved immutable model.
const originalFetch = scope.fetch.bind(scope)
scope.fetch = ((input: RequestInfo | URL, init?: RequestInit) => fetchPinnedHeartResource(originalFetch, input, init)) as typeof fetch
if ('caches' in scope) {
  const originalOpen = scope.caches.open.bind(scope.caches)
  scope.caches.open = (async (name: string) => {
    const cache = await originalOpen(name)
    if (name !== 'kokoro-voices') return cache
    return new Proxy(cache, { get(target, property) {
      if (property === 'match') return (request: RequestInfo | URL, options?: CacheQueryOptions) => target.match(pinHeartResourceUrl(typeof request === 'string' ? request : request instanceof URL ? request.href : request.url), options)
      if (property === 'put') return (request: RequestInfo | URL, response: Response) => target.put(pinHeartResourceUrl(typeof request === 'string' ? request : request instanceof URL ? request.href : request.url), response)
      const value = Reflect.get(target, property, target)
      return typeof value === 'function' ? value.bind(target) : value
    } })
  }) as typeof scope.caches.open
}
transformerEnv.remotePathTemplate = `{model}/resolve/${HEART_REVISION}/`
const wasm = transformerEnv.backends.onnx.wasm
if (!wasm) throw new Error('Local Heart runtime is unavailable.')
wasm.numThreads = 1
wasm.wasmPaths = `${import.meta.env.BASE_URL}heart-runtime/`

function guardTokenizer(model: KokoroTTS) {
  const holder = model as unknown as { tokenizer: ((value: string, options: Record<string, unknown>) => { input_ids: { dims: number[] } }) & Record<string, unknown> }
  const original = holder.tokenizer
  holder.tokenizer = Object.assign((value: string, options: Record<string, unknown>) => {
    const output = original(value, { ...options, truncation: false })
    if ((output.input_ids.dims.at(-1) ?? 0) > 512) throw new OverWindow('Heart input window exceeded.')
    return output
  }, original)
}
async function prepare(jobId: number) {
  if (!loading) {
    loading = KokoroTTS.from_pretrained(HEART_MODEL, {
      dtype: 'q8', device: 'wasm',
      progress_callback: event => {
        if (cancelled.has(jobId)) return
        const item = event as { file?: string; loaded?: number; total?: number; status?: string }
        if (item.file && typeof item.loaded === 'number') scope.postMessage({ type: 'progress', jobId, file: item.file, loaded: item.loaded, total: item.total })
      },
    }).then(model => { guardTokenizer(model); tts = model; return model }).catch(error => { loading = undefined; throw error })
  }
  await loading
  if (!cancelled.has(jobId)) scope.postMessage({ type: 'ready', jobId })
}
async function waitForPlayback(jobId: number) {
  await new Promise<void>(resolve => { acknowledgements.set(jobId, resolve) })
  acknowledgements.delete(jobId)
}
async function speakPiece(value: string, jobId: number, rate: number): Promise<void> {
  if (cancelled.has(jobId)) return
  const splitter = new TextSplitterStream()
  splitter.push(value)
  splitter.close()
  try {
    for await (const { audio } of tts!.stream(splitter, { voice: 'af_heart', speed: rate })) {
      if (cancelled.has(jobId)) return
      const pcm = new Float32Array(audio.audio)
      if (!pcm.length) throw new Error('Empty Heart audio.')
      scope.postMessage({ type: 'chunk', jobId, pcm: pcm.buffer, sampleRate: audio.sampling_rate }, [pcm.buffer])
      await waitForPlayback(jobId)
      if (cancelled.has(jobId)) return
    }
  } catch (error) {
    if (!(error instanceof OverWindow)) throw error
    const [left, right] = splitHeartSegment(value)
    await speakPiece(left, jobId, rate)
    await speakPiece(right, jobId, rate)
  }
}
async function speak(command: Command) {
  try {
    if (!tts) throw new Error('Heart has not prepared.')
    const rate = Math.min(1.5, Math.max(.7, command.rate || 1))
    for (const item of command.items || []) {
      for (const piece of splitHeartInput(item)) {
        if (cancelled.has(command.jobId)) return
        const sentences = new TextSplitterStream()
        sentences.push(piece)
        sentences.close()
        // Retry each sentence independently: if a later sentence is too long,
        // earlier audio must not play again during recursive splitting.
        for await (const sentence of sentences) {
          if (cancelled.has(command.jobId)) return
          await speakPiece(sentence, command.jobId, rate)
        }
      }
    }
    if (!cancelled.has(command.jobId)) scope.postMessage({ type: 'done', jobId: command.jobId })
  } catch (error) {
    if (!cancelled.has(command.jobId)) scope.postMessage({ type: 'error', jobId: command.jobId, message: error instanceof Error && /too long/i.test(error.message) ? 'One word is too long for Heart to speak. Shorten it and retry.' : 'Heart could not generate this audio. Retry or use a browser voice for now.' })
  } finally { cancelled.delete(command.jobId) }
}
scope.onmessage = event => {
  const command = event.data as Command
  if (command.type === 'cancel') { cancelled.add(command.jobId); acknowledgements.get(command.jobId)?.(); return }
  if (command.type === 'continue') { acknowledgements.get(command.jobId)?.(); return }
  if (command.type === 'dispose') { scope.close(); return }
  if (command.type === 'prepare') { void prepare(command.jobId).catch(() => { if (!cancelled.has(command.jobId)) scope.postMessage({ type: 'error', jobId: command.jobId, message: 'Heart files could not download or prepare. Check your connection, then retry.' }) }); return }
  if (command.type === 'speak') running = running.then(() => speak(command))
}
