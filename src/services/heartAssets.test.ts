import { expect, test, vi } from 'vitest'
import { HEART_REVISION, fetchPinnedHeartResource, pinHeartResourceUrl } from './heartAssets'

test('Heart voice assets use the reviewed revision', () => {
  expect(pinHeartResourceUrl('https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/af_heart.bin'))
    .toBe(`https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/${HEART_REVISION}/voices/af_heart.bin`)
  expect(pinHeartResourceUrl(`https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/${HEART_REVISION}/voices/af_heart.bin`))
    .toContain(`/resolve/${HEART_REVISION}/`)
})

test('a failed voice response cannot reach the cache and a later retry succeeds', async () => {
  const cachePut = vi.fn()
  const url = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/af_heart.bin'
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('temporary failure', { status: 503 }))
    .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3])))
  const load = async () => {
    const response = await fetchPinnedHeartResource(fetcher, url)
    const data = await response.arrayBuffer()
    await cachePut(url, new Response(data))
  }
  await expect(load()).rejects.toThrow(/download failed/i)
  expect(cachePut).not.toHaveBeenCalled()
  await expect(load()).resolves.toBeUndefined()
  expect(cachePut).toHaveBeenCalledOnce()
  expect(fetcher).toHaveBeenNthCalledWith(2, expect.stringContaining(`/resolve/${HEART_REVISION}/`), undefined)
})

test('optional model responses remain available to the Transformers loader', async () => {
  const url = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/optional.json'
  const response = new Response('missing', { status: 404 })
  expect(await fetchPinnedHeartResource(vi.fn(async () => response), url)).toBe(response)
})
