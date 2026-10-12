import type { ChunkKind, ChunkRating, Phrase } from '../types'

export const chunkKinds:ChunkKind[]=['Fixed expression','Sentence frame','Collocation','Conversation marker']
export const chunkRatings:ChunkRating[]=['Again','With help','On my own']
const intervals=[1,3,7,14,30]
export const chunkKey=(text:string)=>text.toLowerCase().replace(/[’‘]/g,"'").replace(/(?:\.{3}|…|_+)/g,'').replace(/[.,!?;:]/g,'').replace(/\s+/g,' ').trim()

export function addStarterChunks(phrases:Phrase[],starters:Phrase[],now=new Date()):Phrase[]{
  const keys=new Set(phrases.map(p=>chunkKey(p.text)))
  const ids=new Set(phrases.map(p=>p.id))
  const additions=starters.filter(p=>{
    const key=chunkKey(p.text)
    if(keys.has(key)||ids.has(p.id))return false
    keys.add(key);ids.add(p.id);return true
  }).map(p=>({...p,dateAdded:now.toISOString().slice(0,10),tags:[...p.tags],variations:[]}))
  return [...additions,...phrases]
}

export const isChunkDue=(phrase:Phrase,now=new Date())=>!phrase.chunkReview||Date.parse(phrase.chunkReview.nextReviewAt)<=now.getTime()

export function reviewChunk(phrase:Phrase,rating:ChunkRating,used:boolean,now=new Date()):Phrase{
  const previous=phrase.chunkReview?.step??0
  const step=rating==='Again'?0:rating==='With help'?previous:Math.min(previous+1,intervals.length-1)
  return {...phrase,practised:phrase.practised+1,used:phrase.used+(used?1:0),status:phrase.status==='New'?'Practising':phrase.status,
    chunkReview:{step,timesReviewed:(phrase.chunkReview?.timesReviewed??0)+1,lastRating:rating,lastReviewedAt:now.toISOString(),nextReviewAt:new Date(now.getTime()+intervals[step]*86400000).toISOString()}}
}

// A learner may accidentally put the answer in their cue. Hide the fixed part, too.
export function chunkCue(phrase:Phrase):string{
  const raw=phrase.recallCue?.trim()||phrase.whenToUse?.trim()||phrase.meaning?.trim()||'Express an idea from your own day.'
  const stem=phrase.text.replace(/(?:\.{3}|…|_+).*$/,'').replace(/[.,!?;:]+$/,'').trim()
  if(!stem)return raw
  const escaped=stem.replace(/[.,!?;:]/g,' ').split(/\s+/).filter(Boolean).map(word=>word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/[’‘']/g,"[’‘']")).join('[\\s.,!?;:]+')
  return raw.replace(new RegExp(escaped,'gi'),'[your expression]')
}

export function normaliseChunkFields(phrase:Phrase):Phrase{
  const review=phrase.chunkReview
  const validReview=review&&Number.isInteger(review.step)&&review.step>=0&&review.step<intervals.length&&Number.isInteger(review.timesReviewed)&&review.timesReviewed>=0&&chunkRatings.includes(review.lastRating)&&Number.isFinite(Date.parse(review.lastReviewedAt))&&Number.isFinite(Date.parse(review.nextReviewAt))
  return {...phrase,chunkKind:chunkKinds.includes(phrase.chunkKind as ChunkKind)?phrase.chunkKind:undefined,source:typeof phrase.source==='string'?phrase.source:undefined,recallCue:typeof phrase.recallCue==='string'?phrase.recallCue:undefined,variations:Array.isArray(phrase.variations)?phrase.variations.filter((value):value is string=>typeof value==='string'):[],chunkReview:validReview?review:undefined}
}
