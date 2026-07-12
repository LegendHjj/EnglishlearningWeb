import { defaultState, seedPhrases } from '../data/seed'
import type { AppState, Recording } from '../types'
import { listRecordings, replaceRecordings } from './recordingDb'

const KEY='fluency-reset-state-v1'
const cloneDefault=():AppState=>JSON.parse(JSON.stringify(defaultState)) as AppState
const mergePhrases=(saved:AppState['phrases']|undefined)=>{
  const existing=saved||[]
  const ids=new Set(existing.map(p=>p.id))
  return [...existing,...seedPhrases.filter(p=>!ids.has(p.id))]
}

export function loadState():AppState { try { const raw=localStorage.getItem(KEY); if(!raw)return cloneDefault(); const parsed=JSON.parse(raw) as Partial<AppState>; return {...cloneDefault(),...parsed,phrases:mergePhrases(parsed.phrases),preferences:{...defaultState.preferences,...parsed.preferences}} } catch { return cloneDefault() } }
export function saveState(state:AppState){ localStorage.setItem(KEY,JSON.stringify(state)) }
export function exportState(state:AppState){ return JSON.stringify({app:'fluency-reset',version:1,exportedAt:new Date().toISOString(),state},null,2) }
export function importState(raw:string):AppState { const parsed=JSON.parse(raw) as {app?:string;version?:number;state?:AppState}; if(parsed.app!=='fluency-reset'||parsed.version!==1||!parsed.state?.preferences||!Array.isArray(parsed.state.phrases)) throw new Error('This file is not a valid Fluency Reset export.'); return {...parsed.state,phrases:mergePhrases(parsed.state.phrases)} }
export function resetState(){ localStorage.removeItem(KEY) }

type EncodedRecording={meta:Recording;audio:string}
type Backup={app:'fluency-reset';version:2;exportedAt:string;state:AppState;recordings:EncodedRecording[]}

const blobToBase64=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})
const base64ToBlob=(value:string,type:string)=>{const binary=atob(value);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type})}

export async function exportBackup(state:AppState){
  const recordings=await listRecordings()
  const encoded:EncodedRecording[]=[]
  for(const {blob,...meta} of recordings)encoded.push({meta,audio:await blobToBase64(blob)})
  const backup:Backup={app:'fluency-reset',version:2,exportedAt:new Date().toISOString(),state,recordings:encoded}
  return JSON.stringify(backup,null,2)
}

export async function importBackup(raw:string){
  const parsed=JSON.parse(raw) as {app?:string;version?:number;state?:AppState;recordings?:EncodedRecording[]}
  if(parsed.app!=='fluency-reset')throw new Error('This file is not a valid Fluency Reset backup.')
  if(parsed.version===1)return importState(raw)
  if(parsed.version!==2||!parsed.state?.preferences||!Array.isArray(parsed.state.phrases)||!Array.isArray(parsed.recordings))throw new Error('This file is not a valid Fluency Reset backup.')
  const recordings=parsed.recordings.map(item=>{if(!item.meta?.id||typeof item.audio!=='string')throw new Error('This backup contains an invalid recording.');return {...item.meta,blob:base64ToBlob(item.audio,item.meta.mimeType)}})
  await replaceRecordings(recordings)
  return {...parsed.state,phrases:mergePhrases(parsed.state.phrases)}
}
