import type { PackPracticeProgress, PracticePack } from './practicePacks'
export type Goal = 'Workplace English' | 'Customer conversations' | 'Job interview' | 'Daily conversation' | 'Travel' | 'Presentations' | 'Social confidence'
export type PhraseStatus = 'New' | 'Practising' | 'Remembering' | 'Natural'
export type PhraseType = 'Useful phrase' | 'Sentence frame' | 'Personal script' | 'Rescue phrase'
export type Difficulty = 'Easy' | 'Practical' | 'Brave'
export type NoteStage = 'Follow' | 'Recall' | 'Free'
export type VocabularyStatus = 'New' | 'Learning' | 'Usable' | 'Natural'
export type ReviewRating = 'Again' | 'Difficult' | 'Good' | 'Easy'
export type LibraryTab = 'Vocabulary' | 'Speaking Phrases' | 'Speaking Packs' | 'Chunk Practice'
export type ChunkKind = 'Fixed expression' | 'Sentence frame' | 'Collocation' | 'Conversation marker'
export type ChunkRating = 'Again' | 'With help' | 'On my own'
export interface ChunkReview { step:number; timesReviewed:number; lastReviewedAt:string; nextReviewAt:string; lastRating:ChunkRating }

export type VoiceGender = 'auto' | 'female' | 'male'
export type SpeechEngine = 'browser' | 'heart'
export interface UserPreferences { name: string; level: string; goals: Goal[]; struggle: string; duration: 2 | 5 | 10; situations: string[]; voice?: string; voiceGender?: VoiceGender; speechEngine?: SpeechEngine; onboarded: boolean }
export interface Phrase { id: string; text: string; meaning: string; whenToUse: string; example: string; personalExample: string; category: string; tags: string[]; status: PhraseStatus; type: PhraseType; dateAdded: string; practised: number; used: number; favourite: boolean; chunkKind?:ChunkKind; source?:string; recallCue?:string; variations?:string[]; chunkReview?:ChunkReview }
export interface SpeakingPack { id: string; name: string; description: string; phraseIds: string[]; color: string }
export interface SpeakingMission { id: string; title: string; situation: string; category: string; goal: Goal; keyPoints: string[]; suggestedPhraseIds: string[]; difficulty: Difficulty }
export interface SpeakingMemo { missionId: string; bullets: string[]; updatedAt: string }
export interface Recording { id: string; name: string; createdAt: string; duration: number; missionId?: string; questionId?: string; phraseId?:string; practiceItemId?:string; mimeType: string; size: number }
export interface DailyProgress { date: string; minutes: number; missions: number; confidence: number }
export interface BigQuestion { id: string; question: string; category: string; keyPoints: string[]; frames: string[]; modelAnswer: string }
export interface Big30Answer { notes:string; targetSeconds:30|60|90; answer:string; keywords:string; chunks:string; useForPractice:boolean }
export interface PracticeResult { id: string; mode: string; exerciseId: string; date: string; duration: number }
export type MessageCompletion = 'yes'|'partly'|'not-yet'
export interface MissionSelfCheck { missionId:string; completedAt:string; duration:number; messageCompleted:MessageCompletion; usedPhraseIds:string[]; usedVocabularyIds:string[]; confidence:1|2|3|4|5; answeredFollowUp:boolean; noteStage:NoteStage; sessionDuration:2|5|10; difficulty:Difficulty; retryCompleted:boolean; recordingIds:string[] }
export interface UnfinishedMissionSession { missionId:string; sessionDuration:2|5|10; difficulty:Difficulty; stage:string; memo:string; noteStage:NoteStage; updatedAt:string; returnTo?:string }
export interface PracticeQueueItem { id:string; type:'mission'|'drill'|'big30'|'phrase'|'vocabulary'; contentId:string; title:string; estimatedMinutes:number }
export interface VocabularyEntry { id:string; english:string; chinese?:string; partOfSpeech?:string; simpleDefinition?:string; example?:string; exampleChinese?:string; commonForms:string[]; commonCollocations:string[]; notes?:string; personalSentence?:string; category?:string; tags:string[]; status:VocabularyStatus; favourite:boolean; needsDetails:boolean; reviewStep:number; timesReviewed:number; timesUsedInSpeaking:number; dateAdded:string; updatedAt:string; lastReviewedAt?:string; nextReviewAt?:string; source:'quick'|'manual'|'chatgpt-paste'|'seed'; sourceText?:string }
export interface AppState { schemaVersion:number; programmeVersion:number; preferences:UserPreferences; phrases:Phrase[]; packs:SpeakingPack[]; vocabulary:VocabularyEntry[]; progress:DailyProgress[]; completedMissions:string[]; legacyCompletedMissions:string[]; completedProgrammeMissionIds:string[]; completedPracticeDrillIds:string[]; missionSelfChecks:MissionSelfCheck[]; unfinishedMission?:UnfinishedMissionSession; checkpointRecordingIds:Record<string,string[]>; practiceQueue:PracticeQueueItem[]; completedQuestions:string[]; memos:Record<string,string>; big30Answers:Record<string,Big30Answer>; practicePacks:PracticePack[]; packPractice:Record<string,PackPracticeProgress>; pinnedPhraseIds:string[]; pinnedVocabularyIds:string[]; practiceResults:PracticeResult[]; libraryTab:LibraryTab }
