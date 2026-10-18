import type { NoteStage } from './index'

export type PackItemKind='chunk'|'answer'|'conversation'|'pattern'|'prompt'
export interface PackItem {
  id:string; kind:PackItemKind; title:string; topic:string; cue:string; model:string
  examples:string[]; keywords:string[]; expressions:string[]
  questionId?:string; meaning?:string; note?:string
  challenge?:{cue:string;model:string;followUp:string}
  tasks?:{tight:string;loose:string;free:string}
}
export interface PracticePack {
  app:'fluency-reset-practice-pack'; version:1; id:string; name:string; description:string
  items:PackItem[]; resources?:{title:string;body:string}[]
}
export interface PackPracticeProgress { notes:string; reply:string; stage:NoteStage; attempts:number; lastPractisedAt?:string }
