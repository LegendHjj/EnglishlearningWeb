import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadState, saveState } from '../services/storage'
import type { AppState, Phrase, ReviewRating, VocabularyEntry } from '../types'
import { scheduleVocabularyReview } from '../utils/vocabulary'

export type PinResult='pinned'|'unpinned'|'limit'
type Store={state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;upsertPhrase:(p:Phrase)=>void;deletePhrase:(id:string)=>void;togglePin:(id:string)=>PinResult;upsertVocabulary:(entry:VocabularyEntry)=>void;deleteVocabulary:(id:string)=>void;reviewVocabulary:(id:string,rating:ReviewRating)=>void;toggleVocabularyPin:(id:string)=>PinResult}
const C=createContext<Store|null>(null)
export function AppProvider({children}:{children:ReactNode}){
  const [state,setState]=useState<AppState>(()=>loadState())
  useEffect(()=>saveState(state),[state])
  const value=useMemo<Store>(()=>{
    const toggle=(kind:'phrase'|'vocabulary',id:string):PinResult=>{
      const own=kind==='phrase'?state.pinnedPhraseIds:state.pinnedVocabularyIds
      if(own.includes(id)){setState(s=>kind==='phrase'?{...s,pinnedPhraseIds:s.pinnedPhraseIds.filter(x=>x!==id)}:{...s,pinnedVocabularyIds:s.pinnedVocabularyIds.filter(x=>x!==id)});return 'unpinned'}
      if(state.pinnedPhraseIds.length+state.pinnedVocabularyIds.length>=3)return 'limit'
      setState(s=>kind==='phrase'?{...s,pinnedPhraseIds:[...s.pinnedPhraseIds,id]}:{...s,pinnedVocabularyIds:[...s.pinnedVocabularyIds,id]})
      return 'pinned'
    }
    return {state,setState,
      upsertPhrase:p=>setState(s=>({...s,phrases:s.phrases.some(x=>x.id===p.id)?s.phrases.map(x=>x.id===p.id?p:x):[p,...s.phrases]})),
      deletePhrase:id=>setState(s=>({...s,phrases:s.phrases.filter(p=>p.id!==id),pinnedPhraseIds:s.pinnedPhraseIds.filter(x=>x!==id)})),
      togglePin:id=>toggle('phrase',id),
      upsertVocabulary:entry=>setState(s=>({...s,vocabulary:s.vocabulary.some(item=>item.id===entry.id)?s.vocabulary.map(item=>item.id===entry.id?entry:item):[entry,...s.vocabulary]})),
      deleteVocabulary:id=>setState(s=>({...s,vocabulary:s.vocabulary.filter(item=>item.id!==id),pinnedVocabularyIds:s.pinnedVocabularyIds.filter(itemId=>itemId!==id)})),
      reviewVocabulary:(id,rating)=>setState(s=>({...s,vocabulary:s.vocabulary.map(item=>item.id===id?scheduleVocabularyReview(item,rating):item)})),
      toggleVocabularyPin:id=>toggle('vocabulary',id),
    }
  },[state])
  return <C.Provider value={value}>{children}</C.Provider>
}
export function useApp(){const value=useContext(C);if(!value)throw new Error('useApp must be inside AppProvider');return value}
