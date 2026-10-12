import { expect, test, vi } from 'vitest'
import { createSpeechController } from './speechController'
import type { AudioPlayback, SpeechBackend, SpeechRequest } from './speechTypes'

const deferred = () => {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const request = (ownerId: string, engine: 'browser' | 'heart' = 'browser'): SpeechRequest => ({ ownerId, engine, items: ['Hello'], rate: 1 })
const setup = () => {
  const jobs: ReturnType<typeof deferred>[] = []
  const browser: SpeechBackend = { supported: () => true, play: vi.fn(() => { const job = deferred(); jobs.push(job); return job.promise }), stop: vi.fn(), dispose: vi.fn() }
  const heart: SpeechBackend = { supported: () => true, play: vi.fn(async () => {}), stop: vi.fn(), dispose: vi.fn() }
  const audio: AudioPlayback = { activate: vi.fn(async () => {}), play: vi.fn(async () => {}), stop: vi.fn(), dispose: vi.fn() }
  const controller = createSpeechController(browser, async () => heart, audio)
  return { controller, browser, heart, audio, jobs }
}

test('late A completion cannot finish B', async () => {
  const { controller, jobs } = setup()
  controller.speak(request('A'))
  controller.speak(request('B'))
  jobs[0].resolve()
  await Promise.resolve()
  expect(controller.getSnapshot().ownerId).toBe('B')
  expect(controller.getSnapshot().phase).not.toBe('idle')
  jobs[1].resolve()
  await Promise.resolve()
  expect(controller.getSnapshot().phase).toBe('idle')
})

test('microphone locks are owned, block all speech, and release independently', async () => {
  const { controller, browser, heart } = setup()
  controller.speak(request('first'))
  const releaseA = controller.acquireMicrophone('recorder-a')
  const releaseB = controller.acquireMicrophone('recorder-b')
  expect(browser.stop).toHaveBeenCalled()
  expect(heart.stop).not.toHaveBeenCalled() // Heart stays unloaded until explicitly chosen.
  expect(controller.getSnapshot().microphoneBlocked).toBe(true)
  controller.speak(request('blocked'))
  expect(browser.play).toHaveBeenCalledTimes(1)
  releaseA(); releaseA()
  expect(controller.getSnapshot().microphoneBlocked).toBe(true)
  controller.useBrowserForNow(); controller.retry()
  expect(browser.play).toHaveBeenCalledTimes(1)
  releaseB()
  expect(controller.getSnapshot().microphoneBlocked).toBe(false)
})

test('empty Heart requests do not activate audio or load the engine', () => {
  const browser: SpeechBackend = { supported: () => true, play: vi.fn(async () => {}), stop: vi.fn(), dispose: vi.fn() }
  const factory = vi.fn(async () => browser)
  const audio: AudioPlayback = { activate: vi.fn(async () => {}), play: vi.fn(async () => {}), stop: vi.fn(), dispose: vi.fn() }
  const controller = createSpeechController(browser, factory, audio)
  controller.speak({ ...request('A', 'heart'), items: ['  ', ''] })
  expect(factory).not.toHaveBeenCalled()
  expect(audio.activate).not.toHaveBeenCalled()
})

test('Heart activation begins synchronously before lazy loading', async () => {
  const { controller, audio } = setup()
  controller.speak(request('A', 'heart'))
  expect(audio.activate).toHaveBeenCalledOnce()
  await Promise.resolve()
})

test('activation failure reports promptly while the lazy engine import is pending', async () => {
  const { promise: loading } = deferred()
  const browser: SpeechBackend = { supported: () => true, play: vi.fn(async () => {}), stop: vi.fn(), dispose: vi.fn() }
  const audio: AudioPlayback = { activate: vi.fn(async () => { throw new Error('Audio is blocked') }), play: vi.fn(async () => {}), stop: vi.fn(), dispose: vi.fn() }
  const controller = createSpeechController(browser, async () => { await loading; return browser }, audio)
  controller.speak(request('A', 'heart'))
  await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('error'))
  expect(controller.getSnapshot().error).toBe('Audio is blocked')
})

test('unrelated owner cleanup leaves the active request alone', () => {
  const { controller } = setup()
  controller.speak(request('A'))
  controller.stopOwner('B')
  expect(controller.getSnapshot().ownerId).toBe('A')
})
