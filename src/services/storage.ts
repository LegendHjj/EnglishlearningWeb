import { defaultState } from '../data/seed'
import type { AppState, Recording } from '../types'
import { listRecordings, replaceRecordings } from './recordingDb'
import { migrateLegacyMissionIds } from '../utils/programme'
import { normaliseChunkFields } from '../utils/chunks'
import { normaliseBig30Answers } from '../utils/big30Prompt'
import { normalisePracticePacks, normalisePackPractice } from './practicePacks'

const KEY='fluency-reset-state-v1'
const SCHEMA_VERSION=8
const cloneDefault=():AppState=>JSON.parse(JSON.stringify(defaultState)) as AppState
const isRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)
const migrateState=(saved:unknown):AppState=>{
  if(!isRecord(saved)||!isRecord(saved.preferences)||!Array.isArray(saved.phrases))throw new Error('This file is not a valid Fluency Reset export.')
  const base=cloneDefault()
  const practicePacks=normalisePracticePacks(saved.practicePacks)
  const oldCompleted=Array.isArray(saved.completedMissions)?saved.completedMissions as string[]:[]
  const migrated=migrateLegacyMissionIds(oldCompleted)
  return {...base,...saved,
    schemaVersion:SCHEMA_VERSION,
    preferences:{...base.preferences,...saved.preferences,speechEngine:saved.preferences.speechEngine==='heart'?'heart':'browser'},
    phrases:(saved.phrases as AppState['phrases']).map(normaliseChunkFields),
    packs:Array.isArray(saved.packs)?saved.packs as AppState['packs']:base.packs,
    vocabulary:Array.isArray(saved.vocabulary)?saved.vocabulary as AppState['vocabulary']:[],
    progress:Array.isArray(saved.progress)?saved.progress as AppState['progress']:[],
    programmeVersion:1,
    completedMissions:oldCompleted,
    legacyCompletedMissions:Array.isArray(saved.legacyCompletedMissions)?saved.legacyCompletedMissions as string[]:migrated.legacyIds,
    completedProgrammeMissionIds:Array.isArray(saved.completedProgrammeMissionIds)?saved.completedProgrammeMissionIds as string[]:migrated.programmeIds,
    completedPracticeDrillIds:Array.isArray(saved.completedPracticeDrillIds)?saved.completedPracticeDrillIds as string[]:[],
    missionSelfChecks:Array.isArray(saved.missionSelfChecks)?saved.missionSelfChecks as AppState['missionSelfChecks']:[],
    unfinishedMission:isRecord(saved.unfinishedMission)?saved.unfinishedMission as unknown as AppState['unfinishedMission']:undefined,
    checkpointRecordingIds:isRecord(saved.checkpointRecordingIds)?saved.checkpointRecordingIds as Record<string,string[]>:{},
    practiceQueue:Array.isArray(saved.practiceQueue)?(saved.practiceQueue as AppState['practiceQueue']).slice(0,10):[],
    completedQuestions:Array.isArray(saved.completedQuestions)?saved.completedQuestions as string[]:[],
    memos:isRecord(saved.memos)?saved.memos as Record<string,string>:{},
    big30Answers:normaliseBig30Answers(saved.big30Answers),
    practicePacks,packPractice:normalisePackPractice(saved.packPractice,practicePacks),
    pinnedPhraseIds:Array.isArray(saved.pinnedPhraseIds)?saved.pinnedPhraseIds as string[]:[],
    pinnedVocabularyIds:Array.isArray(saved.pinnedVocabularyIds)?saved.pinnedVocabularyIds as string[]:[],
    practiceResults:Array.isArray(saved.practiceResults)?saved.practiceResults as AppState['practiceResults']:[],
    libraryTab:saved.libraryTab==='Speaking Phrases'||saved.libraryTab==='Speaking Packs'||saved.libraryTab==='Chunk Practice'?saved.libraryTab:'Vocabulary',
  }
}

export function loadState():AppState{try{const raw=localStorage.getItem(KEY);if(!raw)return cloneDefault();return migrateState(JSON.parse(raw))}catch{return cloneDefault()}}
export function saveState(state:AppState){ localStorage.setItem(KEY,JSON.stringify(state)) }
export function exportState(state:AppState){return JSON.stringify({app:'fluency-reset',version:8,kind:'progress-library',exportedAt:new Date().toISOString(),state:{...state,schemaVersion:SCHEMA_VERSION}},null,2)}
export function importState(raw:string):AppState{const parsed=JSON.parse(raw) as {app?:string;version?:number;state?:unknown};if(parsed.app!=='fluency-reset'||![1,2,3,4,5,6,7,8].includes(parsed.version||0))throw new Error('This file is not a valid Fluency Reset export.');return migrateState(parsed.state)}
export function resetState(){ localStorage.removeItem(KEY) }

type EncodedRecording={meta:Recording;audio:string}
type Backup={app:'fluency-reset';version:8;kind:'complete';exportedAt:string;state:AppState;recordings:EncodedRecording[]}

const blobToBase64=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})
const base64ToBlob=(value:string,type:string)=>{const binary=atob(value);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type})}

export async function exportBackup(state:AppState){
  const recordings=await listRecordings()
  const encoded:EncodedRecording[]=[]
  for(const {blob,...meta} of recordings)encoded.push({meta,audio:await blobToBase64(blob)})
  const backup:Backup={app:'fluency-reset',version:8,kind:'complete',exportedAt:new Date().toISOString(),state:{...state,schemaVersion:SCHEMA_VERSION},recordings:encoded}
  return JSON.stringify(backup,null,2)
}

export async function importBackup(raw:string){
  const parsed=JSON.parse(raw) as {app?:string;version?:number;state?:unknown;recordings?:EncodedRecording[]}
  if(parsed.app!=='fluency-reset')throw new Error('This file is not a valid Fluency Reset backup.')
  if(parsed.version===1)return importState(raw)
  if(![2,3,4,5,6,7,8].includes(parsed.version||0)||!Array.isArray(parsed.recordings))throw new Error('This file is not a valid Fluency Reset backup.')
  const state=migrateState(parsed.state)
  const recordings=parsed.recordings.map(item=>{if(!item.meta?.id||typeof item.audio!=='string')throw new Error('This backup contains an invalid recording.');return {...item.meta,blob:base64ToBlob(item.audio,item.meta.mimeType)}})
  await replaceRecordings(recordings)
  return state
}
