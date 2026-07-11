import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadState, saveState } from '../services/storage'
import type { AppState, Phrase } from '../types'

type Store={state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;upsertPhrase:(p:Phrase)=>void;deletePhrase:(id:string)=>void;togglePin:(id:string)=>void}
const C=createContext<Store|null>(null)
export function AppProvider({children}:{children:ReactNode}){const [state,setState]=useState<AppState>(()=>loadState());useEffect(()=>saveState(state),[state]);const value=useMemo<Store>(()=>({state,setState,upsertPhrase:p=>setState(s=>({...s,phrases:s.phrases.some(x=>x.id===p.id)?s.phrases.map(x=>x.id===p.id?p:x):[p,...s.phrases]})),deletePhrase:id=>setState(s=>({...s,phrases:s.phrases.filter(p=>p.id!==id),pinnedPhraseIds:s.pinnedPhraseIds.filter(x=>x!==id)})),togglePin:id=>setState(s=>({...s,pinnedPhraseIds:s.pinnedPhraseIds.includes(id)?s.pinnedPhraseIds.filter(x=>x!==id):s.pinnedPhraseIds.length<3?[...s.pinnedPhraseIds,id]:s.pinnedPhraseIds}))}),[state]);return <C.Provider value={value}>{children}</C.Provider>}
export function useApp(){const value=useContext(C);if(!value)throw new Error('useApp must be inside AppProvider');return value}
