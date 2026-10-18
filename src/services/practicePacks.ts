import type { AppState, Phrase } from '../types'
import type { PackItem, PackItemKind, PackPracticeProgress, PracticePack } from '../types/practicePacks'
import { chunkKey } from '../utils/chunks'

const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
const bad=()=>{throw new Error('This is not a valid practice pack. Download a pack from Settings or check its format.')}
const text=(v:unknown,max=20000):string=>typeof v==='string'&&v.length<=max?v:bad()
const required=(v:unknown,max=20000)=>text(v,max).trim()||bad()
const list=(v:unknown):string[]=>Array.isArray(v)&&v.length<=100?v.map(x=>text(x)):bad()
const identifier=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(v)?v:bad()
const kinds:PackItemKind[]=['chunk','answer','conversation','pattern','prompt']
function validatePack(value:unknown):PracticePack{
  if(!record(value)||value.app!=='fluency-reset-practice-pack'||value.version!==1||!Array.isArray(value.items)||!value.items.length||value.items.length>2500)return bad()
  const ids=new Set<string>()
  const items:PackItem[]=value.items.map(v=>{
    if(!record(v)||!kinds.includes(v.kind as PackItemKind))return bad()
    const id=identifier(v.id)
    if(ids.has(id))throw new Error('This practice pack contains duplicate item IDs.')
    ids.add(id)
    const item:PackItem={id,kind:v.kind as PackItemKind,title:required(v.title,300),topic:required(v.topic,150),cue:required(v.cue),model:required(v.model),examples:list(v.examples),keywords:list(v.keywords),expressions:list(v.expressions)}
    if(v.questionId!==undefined){if(typeof v.questionId!=='string'||!/^q([1-9]|[12]\d|30)$/.test(v.questionId))throw new Error('Invalid Big 30 question in practice pack.');item.questionId=v.questionId}
    if(item.kind==='answer'&&!item.questionId)return bad()
    if(v.meaning!==undefined)item.meaning=text(v.meaning)
    if(v.note!==undefined)item.note=text(v.note)
    if(v.challenge!==undefined){if(!record(v.challenge))return bad();item.challenge={cue:required(v.challenge.cue),model:text(v.challenge.model),followUp:text(v.challenge.followUp)}}
    if(v.tasks!==undefined){if(!record(v.tasks))return bad();item.tasks={tight:required(v.tasks.tight),loose:required(v.tasks.loose),free:required(v.tasks.free)}}
    return item
  })
  const pack:PracticePack={app:'fluency-reset-practice-pack',version:1,id:identifier(value.id),name:required(value.name,200),description:required(value.description,2000),items}
  if(value.resources!==undefined){if(!Array.isArray(value.resources)||value.resources.length>500)return bad();pack.resources=value.resources.map(r=>{if(!record(r))return bad();return {title:required(r.title,300),body:required(r.body)}})}
  return pack
}
export function parsePracticePack(raw:string):PracticePack{
  if(raw.length>5_000_000)throw new Error('This practice pack is too large. Please choose a file smaller than 5 MB.')
  try{return validatePack(JSON.parse(raw))}catch(error){if(error instanceof SyntaxError)return bad();throw error}
}
export const practiceItemKey=(pack:PracticePack,item:PackItem)=>`${pack.id}/${item.id}`
export function mergePracticePack(state:AppState,pack:PracticePack):AppState{
  const existing=state.practicePacks.find(p=>p.id===pack.id)
  const ids=new Set(existing?.items.map(i=>i.id))
  const additions=pack.items.filter(i=>!ids.has(i.id))
  if(existing&&!additions.length)return state
  const merged=existing?{...existing,items:[...existing.items,...additions]}:pack
  const keys=new Set(state.phrases.map(p=>chunkKey(p.text)))
  const phraseIds=new Set(state.phrases.map(p=>p.id))
  const phrases:Phrase[]=[]
  for(const item of additions){
    const id=`pack-${pack.id}-${item.id}`,key=chunkKey(item.title)
    if(item.kind!=='chunk'||keys.has(key)||phraseIds.has(id))continue
    keys.add(key);phraseIds.add(id)
    phrases.push({id,text:item.title,meaning:item.meaning||item.cue,whenToUse:item.cue,example:[item.model,...item.examples].join('\n\n'),personalExample:'',category:item.topic,tags:['practice pack',pack.id],status:'New',type:item.title.includes('...')?'Sentence frame':'Useful phrase',dateAdded:new Date().toISOString().slice(0,10),practised:0,used:0,favourite:false,source:pack.name,recallCue:item.cue,variations:[]})
  }
  return {...state,phrases:[...state.phrases,...phrases],practicePacks:existing?state.practicePacks.map(p=>p.id===pack.id?merged:p):[...state.practicePacks,merged]}
}
export function normalisePracticePacks(value:unknown):PracticePack[]{
  if(!Array.isArray(value))return []
  const ids=new Set<string>()
  return value.flatMap(v=>{try{const p=validatePack(v);if(ids.has(p.id))return [];ids.add(p.id);return [p]}catch{return []}})
}
export function normalisePackPractice(value:unknown,packs:PracticePack[]):Record<string,PackPracticeProgress>{
  const result:Record<string,PackPracticeProgress>={}
  if(!record(value))return result
  for(const pack of packs)for(const item of pack.items){const key=practiceItemKey(pack,item),v=value[key];if(!record(v))continue
    result[key]={notes:typeof v.notes==='string'?v.notes:'',reply:typeof v.reply==='string'?v.reply:'',stage:v.stage==='Recall'||v.stage==='Free'?v.stage:'Follow',attempts:typeof v.attempts==='number'&&Number.isInteger(v.attempts)&&v.attempts>=0?v.attempts:0,lastPractisedAt:typeof v.lastPractisedAt==='string'&&Number.isFinite(Date.parse(v.lastPractisedAt))?v.lastPractisedAt:undefined}
  }
  return result
}
export const emptyPackProgress:PackPracticeProgress={notes:'',reply:'',stage:'Follow',attempts:0}
