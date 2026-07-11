import type { NoteStage } from '../types'
export function formatDuration(seconds:number){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
export function phraseHint(text:string,stage:NoteStage){if(stage==='Follow')return text;if(stage==='Free')return 'Use this idea naturally';const words=text.replace('…','').split(/\s+/);return `${words.slice(0,Math.min(2,words.length)).join(' ')}…`}
export function togglePinned(ids:string[],id:string){if(ids.includes(id))return ids.filter(x=>x!==id);return ids.length<3?[...ids,id]:ids}
