import type { Goal } from '../types'

export type ProgrammeLevel = {
  speakSeconds: number
  prepSeconds: number
  prompt: string
  requiredElements: string[]
  pressureRule: string
}

export type ProgrammeMission = {
  id: string
  day: number
  phaseId: string
  title: string
  category: string
  goalTracks: Goal[]
  skillFocus: string[]
  realLifeSituation: string
  communicativeOutcome: string
  keyPoints: string[]
  supportPhrases: string[]
  memoStarter: string
  levels: { easy: ProgrammeLevel; practical: ProgrammeLevel; brave: ProgrammeLevel }
  firstAttemptInstruction: string
  retryFocus: string
  followUpQuestion: string
  reflectionQuestion: string
  completionCriteria: string
  linkedPracticeIds: string[]
  isCheckpoint: boolean
}

export type ProgrammePhase = { id: string; days: string; title: string; purpose: string }
export type ProgrammeContent = { schemaVersion: number; programId: string; title: string; description: string; phases: ProgrammePhase[]; missions: ProgrammeMission[] }

export type PracticeMode = 'mouthReps'|'tightBuild'|'looseStory'|'freeResponse'|'echoShadow'|'repairLab'|'fluencySprint'
export type PracticeDrill = Record<string, unknown> & { id: string; mode: PracticeMode; recommendedSeconds: number; title?: string; phrase?: string }
export type PracticeModeContent = { label: string; purpose: string; defaultFlow: string[]; items: Omit<PracticeDrill, 'mode'>[] }
export type PracticeContent = { schemaVersion: number; contentPackId: string; title: string; description: string; modeOrder: PracticeMode[]; modes: Record<PracticeMode, PracticeModeContent> }

export type Big30Guide = {
  id: string
  question: string
  purpose: string
  keyPoints: string[]
  supportFrames: string[]
  followUpQuestion: string
  commonTrap: string
  practiceStages: { follow: string; recall: string; free: string }
  recommendedRounds: { seconds: number; focus: string }[]
}
export type Big30Content = { schemaVersion: number; title: string; description: string; items: Big30Guide[] }

export type ContentStatus = { ok: boolean; errors: string[] }
