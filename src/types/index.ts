export type Goal = 'Workplace English' | 'Customer conversations' | 'Job interview' | 'Daily conversation' | 'Travel' | 'Presentations' | 'Social confidence'
export type PhraseStatus = 'New' | 'Practising' | 'Remembering' | 'Natural'
export type PhraseType = 'Useful phrase' | 'Sentence frame' | 'Personal script' | 'Rescue phrase'
export type Difficulty = 'Easy' | 'Practical' | 'Brave'
export type NoteStage = 'Follow' | 'Recall' | 'Free'

export interface UserPreferences { name: string; level: string; goals: Goal[]; struggle: string; duration: 2 | 5 | 10; situations: string[]; voice?: string; onboarded: boolean }
export interface Phrase { id: string; text: string; meaning: string; whenToUse: string; example: string; personalExample: string; category: string; tags: string[]; status: PhraseStatus; type: PhraseType; dateAdded: string; practised: number; used: number; favourite: boolean }
export interface SpeakingPack { id: string; name: string; description: string; phraseIds: string[]; color: string }
export interface SpeakingMission { id: string; title: string; situation: string; category: string; goal: Goal; keyPoints: string[]; suggestedPhraseIds: string[]; difficulty: Difficulty }
export interface SpeakingMemo { missionId: string; bullets: string[]; updatedAt: string }
export interface Recording { id: string; name: string; createdAt: string; duration: number; missionId?: string; questionId?: string; mimeType: string; size: number }
export interface DailyProgress { date: string; minutes: number; missions: number; confidence: number }
export interface BigQuestion { id: string; question: string; category: string; keyPoints: string[]; frames: string[]; modelAnswer: string }
export interface PracticeResult { id: string; mode: string; exerciseId: string; date: string; duration: number }
export interface AppState { preferences: UserPreferences; phrases: Phrase[]; packs: SpeakingPack[]; progress: DailyProgress[]; completedMissions: string[]; completedQuestions: string[]; memos: Record<string,string>; pinnedPhraseIds: string[]; practiceResults: PracticeResult[] }
