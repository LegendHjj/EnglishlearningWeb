export const HEART_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX'
export const HEART_REVISION = '1939ad2a8e416c0acfeecc08a694d14ef25f2231'
export const HEART_VOICE = 'af_heart'
const origin = `https://huggingface.co/${HEART_MODEL}/resolve/`

export function pinHeartResourceUrl(value: string) {
  if (!value.startsWith(origin)) return value
  const rest = value.slice(origin.length)
  const slash = rest.indexOf('/')
  if (slash < 0) throw new Error('Invalid Heart model resource URL.')
  return `${origin}${HEART_REVISION}/${rest.slice(slash + 1)}`
}

export async function fetchPinnedHeartResource(fetcher: typeof fetch, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const pinned = pinHeartResourceUrl(url)
  const response = await fetcher(pinned === url ? input : pinned, init)
  // Kokoro's voice loader caches any response as a successful binary. The
  // Transformers loader handles its own optional-file HTTP responses.
  if (url.startsWith(origin) && url.endsWith('/voices/af_heart.bin') && !response.ok) throw new Error(`Heart asset download failed (HTTP ${response.status}).`)
  return response
}
