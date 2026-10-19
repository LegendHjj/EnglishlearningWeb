import type { SpeechEngine, VoiceGender } from '../types'

export interface SpeechRequest { ownerId: string; engine: SpeechEngine; items: string[]; rate: number; browserVoice?: string; voiceGender?: VoiceGender }
export interface SpeechSnapshot {
  phase: 'idle' | 'preparing' | 'playing' | 'error'
  engine?: SpeechEngine
  ownerId?: string
  hostId?: string
  progress?: { file: string; loaded: number; total?: number }
  preparation?: 'loading' | 'generating'
  savedAudio?: boolean
  error?: string
  browserFallback: boolean
  microphoneBlocked: boolean
}
export interface SpeechBackend {
  supported(): boolean
  play(request: SpeechRequest, signal: AbortSignal, report: (patch: Partial<SpeechSnapshot>) => void): Promise<void>
  stop(): void
  dispose(): void
}
export interface AudioPlayback {
  activate(): Promise<void>
  play(pcm: Float32Array, sampleRate: number, signal: AbortSignal): Promise<void>
  stop(): void
  dispose(): void
}
