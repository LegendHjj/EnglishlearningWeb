import { HEART_MODEL, HEART_REVISION, HEART_VOICE } from './heartAssets'
import type { ZipEntry } from './voicePackZip'

export interface VoiceClip { key: string; text: string; rate: number; file: string; bytes: number; sha256: string; samples: number }
export interface VoicePackManifest { app: 'fluency-reset-voice-pack'; version: 1; id: string; name: string; voice: string; model: string; revision: string; createdAt: string; clips: VoiceClip[] }
export const canonicalVoiceText = (text: string) => text.replace(/\s+/g, ' ').trim()
export async function voiceHash(bytes: ArrayBuffer): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('')
}
export const voiceClipKey = (text: string, rate: number) => voiceHash(new TextEncoder().encode(JSON.stringify([HEART_VOICE, HEART_REVISION, rate, canonicalVoiceText(text)])).buffer)

export async function validateVoiceManifest(raw: string, entries: Map<string, ZipEntry>): Promise<VoicePackManifest> {
  const value = JSON.parse(raw), bad = () => { throw new Error('This voice pack has an invalid manifest or does not match the installed Heart voice.') }
  if (!value || value.app !== 'fluency-reset-voice-pack' || value.version !== 1 || value.model !== HEART_MODEL || value.revision !== HEART_REVISION || value.voice !== HEART_VOICE || typeof value.id !== 'string' || !/^[\w-]{1,100}$/.test(value.id) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 200 || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) || !Array.isArray(value.clips) || !value.clips.length || value.clips.length > 15000) return bad()
  const keys = new Set<string>()
  for (const clip of value.clips) {
    if (!clip || typeof clip.key !== 'string' || !/^[a-f0-9]{64}$/.test(clip.key) || keys.has(clip.key) || typeof clip.text !== 'string' || !clip.text || clip.text.length > 30000 || clip.text !== canonicalVoiceText(clip.text) || typeof clip.rate !== 'number' || !Number.isFinite(clip.rate) || clip.rate < .7 || clip.rate > 1.5 || clip.file !== `audio/${clip.key}.wav` || !Number.isInteger(clip.bytes) || clip.bytes < 46 || clip.bytes > 32 * 1024 ** 2 || !Number.isInteger(clip.samples) || clip.samples < 1 || clip.samples > 16 * 1024 ** 2 || typeof clip.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(clip.sha256) || entries.get(clip.file)?.size !== clip.bytes) return bad()
    if (await voiceClipKey(clip.text, clip.rate) !== clip.key) throw new Error('A voice clip does not match its text and speaking speed.')
    keys.add(clip.key)
  }
  const expectedAudio = new Set(value.clips.map((clip: VoiceClip) => clip.file))
  for (const name of entries.keys()) if (name.startsWith('audio/') && !expectedAudio.has(name)) return bad()
  return value as VoicePackManifest
}

export function inspectVoiceWav(buffer: ArrayBuffer): { samples: number; sampleRate: number; dataStart: number } {
  const bad = () => { throw new Error('A voice clip is not a complete mono 24 kHz PCM16 WAV file.') }
  const view = new DataView(buffer), ascii = (offset: number, size: number) => new TextDecoder().decode(new Uint8Array(buffer, offset, size))
  if (buffer.byteLength < 46 || ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WAVE' || view.getUint32(4, true) + 8 !== buffer.byteLength) return bad()
  let position = 12, format = false, dataStart: number | undefined, samples = 0
  while (position + 8 <= buffer.byteLength) {
    const name = ascii(position, 4), length = view.getUint32(position + 4, true), start = position + 8
    if (start + length > buffer.byteLength) return bad()
    if (name === 'fmt ') {
      if (format || length < 16 || view.getUint16(start, true) !== 1 || view.getUint16(start + 2, true) !== 1 || view.getUint32(start + 4, true) !== 24000 || view.getUint32(start + 8, true) !== 48000 || view.getUint16(start + 12, true) !== 2 || view.getUint16(start + 14, true) !== 16) return bad()
      format = true
    } else if (name === 'data') {
      if (!format || dataStart !== undefined || !length || length % 2) return bad()
      dataStart = start; samples = length / 2
      let audible = false
      for (let i = 0; i < samples; i++) if (view.getInt16(start + i * 2, true)) { audible = true; break }
      if (!audible) throw new Error('A voice clip is empty or silent.')
    }
    position = start + length + (length % 2)
  }
  if (!format || dataStart === undefined || position !== buffer.byteLength) return bad()
  return { samples, sampleRate: 24000, dataStart }
}

export function decodeVoiceWav(buffer: ArrayBuffer): { pcm: Float32Array; sampleRate: number } {
  const { samples, sampleRate, dataStart } = inspectVoiceWav(buffer), view = new DataView(buffer)
  const pcm = new Float32Array(samples)
  for (let i = 0; i < samples; i++) pcm[i] = view.getInt16(dataStart + i * 2, true) / 32768
  return { pcm, sampleRate }
}
