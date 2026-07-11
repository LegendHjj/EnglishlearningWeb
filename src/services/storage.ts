import { defaultState } from '../data/seed'
import type { AppState } from '../types'

const KEY='fluency-reset-state-v1'
const cloneDefault=():AppState=>JSON.parse(JSON.stringify(defaultState)) as AppState
export function loadState():AppState { try { const raw=localStorage.getItem(KEY); if(!raw)return cloneDefault(); const parsed=JSON.parse(raw) as Partial<AppState>; return {...cloneDefault(),...parsed,preferences:{...defaultState.preferences,...parsed.preferences}} } catch { return cloneDefault() } }
export function saveState(state:AppState){ localStorage.setItem(KEY,JSON.stringify(state)) }
export function exportState(state:AppState){ return JSON.stringify({app:'fluency-reset',version:1,exportedAt:new Date().toISOString(),state},null,2) }
export function importState(raw:string):AppState { const parsed=JSON.parse(raw) as {app?:string;version?:number;state?:AppState}; if(parsed.app!=='fluency-reset'||parsed.version!==1||!parsed.state?.preferences||!Array.isArray(parsed.state.phrases)) throw new Error('This file is not a valid Fluency Reset export.'); return parsed.state }
export function resetState(){ localStorage.removeItem(KEY) }
