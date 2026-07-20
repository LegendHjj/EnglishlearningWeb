import type { NoteStage, ReviewRating, VocabularyEntry } from '../types'

type ParsedFields=Partial<Pick<VocabularyEntry,'english'|'chinese'|'partOfSpeech'|'simpleDefinition'|'example'|'exampleChinese'|'notes'|'commonForms'|'commonCollocations'>>
export interface VocabularyParseResult { fields:ParsedFields; detectedCount:number; unmatchedText:string; sourceText:string }

const aliases:Record<string,keyof ParsedFields>={
  english:'english',word:'english',chinese:'chinese','chinese meaning':'chinese','part of speech':'partOfSpeech','word type':'partOfSpeech',
  'simple definition':'simpleDefinition',definition:'simpleDefinition',example:'example','example sentence':'example','example chinese':'exampleChinese',
  'chinese example':'exampleChinese','example translation':'exampleChinese','common forms':'commonForms','word forms':'commonForms',forms:'commonForms',
  'common collocations':'commonCollocations',collocations:'commonCollocations',notes:'notes','usage notes':'notes',
}
const listKeys=new Set<keyof ParsedFields>(['commonForms','commonCollocations'])
const singleLineKeys=new Set<keyof ParsedFields>(['english','partOfSpeech'])
const clean=(value:string)=>value.replace(/^\s*[-*>#`_]+\s*/,'').replace(/[\s*_`#]+$/,'').trim()
const normaliseHeading=(value:string)=>clean(value).toLowerCase().replace(/\s+/g,' ')
const unique=(items:string[])=>{const seen=new Set<string>();return items.filter(item=>{const key=item.toLocaleLowerCase();if(!item||seen.has(key))return false;seen.add(key);return true})}
const splitList=(value:string)=>unique(value.split(/[,;\n]/).map(clean).filter(Boolean))

export function parseVocabularyText(sourceText:string):VocabularyParseResult{
  if(!sourceText.trim())return {fields:{},detectedCount:0,unmatchedText:'',sourceText}
  const values=new Map<keyof ParsedFields,string[]>()
  const unmatched:string[]=[]
  let active:keyof ParsedFields|undefined
  for(const rawLine of sourceText.split(/\r?\n/)){
    const line=rawLine.trim()
    if(!line)continue
    const match=line.match(/^\s*(?:#{1,6}\s*)?(?:\*\*|__)?\s*([^:]+?)\s*:\s*(?:\*\*|__)?\s*(.*)$/)
    const key=match?aliases[normaliseHeading(match[1])]:undefined
    if(key){active=key;if(!values.has(key))values.set(key,[]);const inline=clean(match![2]);if(inline)values.get(key)!.push(inline);continue}
    if(active){const current=values.get(active)!;if(singleLineKeys.has(active)&&current.length){unmatched.push(clean(line));continue}current.push(clean(line))}
    else unmatched.push(clean(line))
  }
  const fields:ParsedFields={}
  values.forEach((parts,key)=>{const joined=parts.filter(Boolean).join('\n').trim();if(!joined)return;if(listKeys.has(key))(fields as Record<string,unknown>)[key]=splitList(joined);else (fields as Record<string,unknown>)[key]=joined})
  return {fields,detectedCount:Object.keys(fields).length,unmatchedText:unmatched.filter(Boolean).join('\n'),sourceText}
}

const normaliseWord=(value:string)=>value.trim().replace(/\s+/g,' ').toLocaleLowerCase()
const normalisePart=(value?:string)=>normaliseWord(value||'')
export function findVocabularyDuplicate(entries:VocabularyEntry[],candidate:VocabularyEntry){
  const word=normaliseWord(candidate.english)
  const part=normalisePart(candidate.partOfSpeech)
  return entries.find(item=>normaliseWord(item.english)===word&&(!part||!normalisePart(item.partOfSpeech)||normalisePart(item.partOfSpeech)===part))
}

export const vocabularyNeedsDetails=(entry:Pick<VocabularyEntry,'chinese'|'partOfSpeech'|'simpleDefinition'|'example'>)=>![entry.chinese,entry.partOfSpeech,entry.simpleDefinition,entry.example].every(value=>value?.trim())
const mergeList=(a:string[],b:string[])=>unique([...a,...b].map(clean))
export function mergeVocabularyEntries(existing:VocabularyEntry,incoming:VocabularyEntry,updatedAt=new Date().toISOString()):VocabularyEntry{
  const scalar=<K extends keyof VocabularyEntry>(key:K)=>existing[key]||incoming[key]
  return {...incoming,...existing,
    chinese:scalar('chinese'),partOfSpeech:scalar('partOfSpeech'),simpleDefinition:scalar('simpleDefinition'),example:scalar('example'),exampleChinese:scalar('exampleChinese'),notes:scalar('notes'),personalSentence:scalar('personalSentence'),category:scalar('category'),sourceText:scalar('sourceText'),
    commonForms:mergeList(existing.commonForms,incoming.commonForms),commonCollocations:mergeList(existing.commonCollocations,incoming.commonCollocations),tags:mergeList(existing.tags,incoming.tags),
    favourite:existing.favourite||incoming.favourite,dateAdded:existing.dateAdded<incoming.dateAdded?existing.dateAdded:incoming.dateAdded,updatedAt,
    reviewStep:existing.reviewStep,timesReviewed:existing.timesReviewed,timesUsedInSpeaking:existing.timesUsedInSpeaking,lastReviewedAt:existing.lastReviewedAt,nextReviewAt:existing.nextReviewAt,
    needsDetails:vocabularyNeedsDetails({chinese:scalar('chinese'),partOfSpeech:scalar('partOfSpeech'),simpleDefinition:scalar('simpleDefinition'),example:scalar('example')}),
  }
}

const intervals=[1,3,7,14,30]
export function scheduleVocabularyReview(entry:VocabularyEntry,rating:ReviewRating,now=new Date()):VocabularyEntry{
  const step=rating==='Again'?0:rating==='Difficult'?entry.reviewStep:rating==='Good'?Math.min(4,entry.reviewStep+1):Math.min(4,entry.reviewStep+2)
  const reviewedAt=now.toISOString()
  return {...entry,reviewStep:step,timesReviewed:entry.timesReviewed+1,lastReviewedAt:reviewedAt,nextReviewAt:new Date(now.getTime()+intervals[step]*86400000).toISOString(),updatedAt:reviewedAt,status:step>=4?'Natural':step>=2?'Usable':'Learning'}
}
export const isVocabularyDue=(entry:VocabularyEntry,now=new Date())=>!entry.nextReviewAt||new Date(entry.nextReviewAt).getTime()<=now.getTime()
export function vocabularyHint(entry:VocabularyEntry,stage:NoteStage){
  if(stage==='Free')return entry.category||`Use ${entry.english} naturally`
  if(stage==='Recall')return `${entry.english.slice(0,1)}${'_'.repeat(Math.max(2,entry.english.length-1))}`
  return entry.english
}
