import { Blob as NodeBlob } from 'node:buffer'
import { createHash } from 'node:crypto'

const revision = '1939ad2a8e416c0acfeecc08a694d14ef25f2231'
const hash = (input: string | Uint8Array) => createHash('sha256').update(input).digest('hex')

export function sampleWav(samples = 480): ArrayBuffer {
  const bytes = new ArrayBuffer(44 + samples * 2), v = new DataView(bytes)
  const ascii = (offset: number, value: string) => [...value].forEach((c, i) => v.setUint8(offset + i, c.charCodeAt(0)))
  ascii(0, 'RIFF'); v.setUint32(4, bytes.byteLength - 8, true); ascii(8, 'WAVE'); ascii(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, 24000, true); v.setUint32(28, 48000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  ascii(36, 'data'); v.setUint32(40, samples * 2, true)
  for (let i = 0; i < samples; i++) v.setInt16(44 + i * 2, Math.round(Math.sin(i / 10) * 4000), true)
  return bytes
}

export function enableVoicePackLocks() {
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: async (_name: string, _options: unknown, action: (lock: object) => unknown) => action({}) } })
}

export function makeMultiVoicePack(count: number, samples = 480): Blob {
  const wav = new Uint8Array(sampleWav(samples))
  const clips = Array.from({ length: count }, (_, i) => {
    const text = `Example ${i}.`, key = hash(JSON.stringify(['af_heart', revision, 1, text]))
    return { key, text, rate: 1, file: `audio/${key}.wav`, bytes: wav.length, sha256: hash(wav), samples }
  })
  const manifest = { app: 'fluency-reset-voice-pack', version: 1, id: 'multi-heart', name: 'Multiple clips', voice: 'af_heart', model: 'onnx-community/Kokoro-82M-v1.0-ONNX', revision, createdAt: '2026-10-19T00:00:00Z', clips }
  return storedZip([['manifest.json', new TextEncoder().encode(JSON.stringify(manifest))], ...clips.map(clip => [clip.file, wav] as [string, Uint8Array])])
}

export function storedZip(files: [string, Uint8Array][], compressed = false): Blob {
  const encoder = new TextEncoder(), parts: Uint8Array[] = [], directory: Uint8Array[] = []
  let offset = 0
  for (const [name, data] of files) {
    const path = encoder.encode(name), header = new Uint8Array(30 + path.length), h = new DataView(header.buffer)
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, compressed ? 8 : 0, true)
    h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, path.length, true); header.set(path, 30)
    const central = new Uint8Array(46 + path.length), c = new DataView(central.buffer)
    c.setUint32(0, 0x02014b50, true); c.setUint16(6, 20, true); c.setUint16(10, compressed ? 8 : 0, true)
    c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, path.length, true); c.setUint32(42, offset, true)
    central.set(path, 46); directory.push(central); parts.push(header, data); offset += header.length + data.length
  }
  const end = new Uint8Array(22), e = new DataView(end.buffer), dirLength = directory.reduce((sum, p) => sum + p.length, 0)
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true)
  e.setUint32(12, dirLength, true); e.setUint32(16, offset, true)
  return new NodeBlob([...parts, ...directory, end] as never[]) as unknown as Blob
}

export async function makeVoicePack(options: { name?: string; corrupt?: boolean; duplicate?: boolean; compressed?: boolean; key?: string } = {}): Promise<Blob> {
  const text = 'Hello there.', wav = new Uint8Array(sampleWav()), key = options.key || hash(JSON.stringify(['af_heart', revision, 1, text]))
  const clip = { key, text, rate: 1, file: `audio/${key}.wav`, bytes: wav.length, sha256: hash(wav), samples: 480 }
  const manifest = { app: 'fluency-reset-voice-pack', version: 1, id: 'test-heart', name: options.name || 'Test Heart', voice: 'af_heart', model: 'onnx-community/Kokoro-82M-v1.0-ONNX', revision, createdAt: '2026-10-19T00:00:00Z', clips: [clip] }
  if (options.corrupt) wav[60] ^= 42
  const files: [string, Uint8Array][] = [['manifest.json', new TextEncoder().encode(JSON.stringify(manifest))], [clip.file, wav]]
  if (options.duplicate) files.push([clip.file, wav])
  return storedZip(files, options.compressed)
}
