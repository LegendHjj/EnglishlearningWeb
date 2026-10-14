import { afterEach, expect, test, vi } from 'vitest'
import { createHeartVoice } from './heartVoice'
import type { AudioPlayback } from './speechTypes'

afterEach(() => vi.unstubAllGlobals())
test('completed Heart audio is reused across owners without generating again', async () => {
  let worker!: { commands: unknown[]; onmessage?: (event: MessageEvent) => void }
  vi.stubGlobal('Worker', class {
    commands: unknown[] = []
    onmessage?: (event: MessageEvent) => void
    constructor() { worker = this }
    postMessage(value: unknown) { this.commands.push(value) }
    terminate() {}
  })
  const audio: AudioPlayback = { activate: vi.fn(async () => {}), play: vi.fn(async () => {}), stop: vi.fn(), dispose: vi.fn() }
  const backend = createHeartVoice(audio)
  const request = { ownerId: 'library', engine: 'heart' as const, items: ['That makes sense.'], rate: 1 }
  const emit = (data: unknown) => worker.onmessage?.({ data } as MessageEvent)
  const first = backend.play(request, new AbortController().signal, vi.fn())
  emit({ type: 'ready', jobId: 1 })
  emit({ type: 'chunk', jobId: 1, pcm: new Float32Array([.2, .3]).buffer, sampleRate: 24000 })
  await Promise.resolve()
  emit({ type: 'done', jobId: 1 })
  await first
  const count = worker.commands.length
  const report = vi.fn()
  await backend.play({ ...request, ownerId: 'practice' }, new AbortController().signal, report)
  expect(worker.commands).toHaveLength(count)
  expect(audio.play).toHaveBeenCalledTimes(2)
  expect(report).toHaveBeenCalledWith(expect.objectContaining({ phase: 'playing' }))
  const changedRate = backend.play({ ...request, rate: .8 }, new AbortController().signal, vi.fn())
  expect(worker.commands).toContainEqual(expect.objectContaining({ type: 'speak', rate: .8 }))
  backend.stop()
  await changedRate
  backend.dispose()
})

test('Stop during cached playback prevents later chunks from playing', async () => {
  let worker!: { onmessage?: (event: MessageEvent) => void }
  vi.stubGlobal('Worker', class {
    onmessage?: (event: MessageEvent) => void
    constructor() { worker = this }
    postMessage() {}
    terminate() {}
  })
  const play = vi.fn(async () => {})
  const backend = createHeartVoice({ activate: async () => {}, play, stop: vi.fn(), dispose: vi.fn() })
  const request = { ownerId: 'A', engine: 'heart' as const, items: ['First. Second.'], rate: 1 }
  const emit = (data: unknown) => worker.onmessage?.({ data } as MessageEvent)
  const first = backend.play(request, new AbortController().signal, vi.fn())
  emit({ type: 'ready', jobId: 1 })
  for (const sample of [.1, .2]) {
    emit({ type: 'chunk', jobId: 1, pcm: new Float32Array([sample]).buffer, sampleRate: 24000 })
    await Promise.resolve()
  }
  emit({ type: 'done', jobId: 1 })
  await first
  let resolve!: () => void
  play.mockImplementationOnce(() => new Promise<void>(done => { resolve = done }))
  const replay = backend.play(request, new AbortController().signal, vi.fn())
  expect(play).toHaveBeenCalledTimes(3)
  backend.stop()
  resolve()
  await replay
  await Promise.resolve()
  expect(play).toHaveBeenCalledTimes(3)
  backend.dispose()
})

test('Heart worker stays lazy and ignores a stopped job’s late audio', async () => {
  class FakeWorker {
    static instances: FakeWorker[] = []
    onmessage?: (event: MessageEvent) => void
    onerror?: () => void
    commands: unknown[] = []
    terminate = vi.fn()
    constructor() { FakeWorker.instances.push(this) }
    postMessage(command: unknown) { this.commands.push(command) }
    emit(data: unknown) { this.onmessage?.({ data } as MessageEvent) }
  }
  vi.stubGlobal('Worker', FakeWorker)
  const audio: AudioPlayback = { activate: vi.fn(async () => {}), play: vi.fn(async () => {}), stop: vi.fn(), dispose: vi.fn() }
  const backend = createHeartVoice(audio)
  expect(FakeWorker.instances).toHaveLength(0)
  const signal = new AbortController()
  const request = { ownerId: 'A', engine: 'heart' as const, items: ['Hello'], rate: 1 }
  const first = backend.play(request, signal.signal, vi.fn())
  const worker = FakeWorker.instances[0]
  expect(worker.commands).toContainEqual({ type: 'prepare', jobId: 1 })
  worker.emit({ type: 'ready', jobId: 1 })
  backend.stop()
  await first
  worker.emit({ type: 'chunk', jobId: 1, pcm: new Float32Array([.3]).buffer, sampleRate: 24000 })
  expect(audio.play).not.toHaveBeenCalled()
  backend.dispose()
})

test('failed audio playback cancels the worker job so a retry can proceed', async () => {
  class FakeWorker {
    onmessage?: (event: MessageEvent) => void
    onerror?: () => void
    commands: unknown[] = []
    postMessage(command: unknown) { this.commands.push(command) }
    terminate() {}
    emit(data: unknown) { this.onmessage?.({ data } as MessageEvent) }
  }
  let worker!: FakeWorker
  vi.stubGlobal('Worker', class extends FakeWorker { constructor() { super(); worker = this } })
  const audio: AudioPlayback = { activate: vi.fn(async () => {}), play: vi.fn(async () => { throw new Error('blocked') }), stop: vi.fn(), dispose: vi.fn() }
  const backend = createHeartVoice(audio)
  const request = { ownerId: 'A', engine: 'heart' as const, items: ['Hello'], rate: 1 }
  const promise = backend.play(request, new AbortController().signal, vi.fn())
  worker.emit({ type: 'ready', jobId: 1 })
  worker.emit({ type: 'chunk', jobId: 1, pcm: new Float32Array([.3]).buffer, sampleRate: 24000 })
  await expect(promise).rejects.toThrow('blocked')
  expect(worker.commands).toContainEqual({ type: 'cancel', jobId: 1 })
  backend.dispose()
})
