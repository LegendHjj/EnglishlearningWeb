import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card } from '../components/ui'
import type { Recording } from '../types'
import { formatDuration } from '../utils/practice'
import RecordingPlayer from './RecordingPlayer'

export type RecordingItem=Recording&{blob:Blob}

export default function RecordingList({items,onDelete,compact=false}:{items:RecordingItem[];onDelete?:(id:string)=>void;compact?:boolean}){
  const [urls,setUrls]=useState<Map<string,string>>(()=>new Map())
  useEffect(()=>{
    const next=new Map(items.map(item=>[item.id,URL.createObjectURL(item.blob)]))
    setUrls(next)
    return ()=>next.forEach(url=>URL.revokeObjectURL(url))
  },[items])
  return <div className={`recording-list ${compact?'recording-list-compact':''}`}>{items.map(item=><Card key={item.id}>
    <div className="recording-info"><strong>{item.name}</strong><span>{new Date(item.createdAt).toLocaleDateString()} · {formatDuration(item.duration)}</span>{item.questionId&&<span className="source-label">Big 30 question {item.questionId.slice(1)}</span>}{item.phraseId&&<span className="source-label">Chunk practice</span>}</div>
    {urls.has(item.id)?<RecordingPlayer src={urls.get(item.id)!} label={item.name}/>:<span className="muted">Preparing audio…</span>}
    {onDelete&&<button className="icon-btn" onClick={()=>onDelete(item.id)} aria-label={`Delete ${item.name}`}><Trash2/></button>}
  </Card>)}</div>
}
