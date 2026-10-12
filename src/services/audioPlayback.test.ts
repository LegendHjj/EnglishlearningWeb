import { afterEach, expect, test, vi } from 'vitest'
import { createAudioPlayback } from './audioPlayback'

afterEach(() => vi.unstubAllGlobals())
test('audio context stays lazy and blocked resume reports a terminal error', async () => {
  const constructor = vi.fn().mockImplementation(() => ({ state: 'suspended', resume: async () => { throw new Error('NotAllowedError') }, close: vi.fn() }))
  vi.stubGlobal('AudioContext', constructor)
  const player = createAudioPlayback()
  expect(constructor).not.toHaveBeenCalled()
  await expect(player.activate()).rejects.toThrow(/blocked/i)
  expect(constructor).toHaveBeenCalledOnce()
  player.stop(); player.stop(); player.dispose()
})
