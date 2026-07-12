import { Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Card } from '../components/ui'
import type { Recording } from '../types'
import { formatDuration } from '../utils/practice'
import RecordingPlayer from './RecordingPlayer'

export type RecordingItem=Recording&{blob:Blob}

export default function RecordingList({items,onDelete,compact=false}:{items:RecordingItem[];onDelete?:(id:string)=>void;compact?:boolean}){
  const urls=useMemo(()=>new Map(items.map(x=>[x.id,URL.createObjectURL(x.blob)])),[items])
  useEffect(()=>()=>urls.forEach(url=>URL.revokeObjectURL(url)),[urls])
  return <div className={`recording-list ${compact?'recording-list-compact':''}`}>{items.map(item=><Card key={item.id}>
    <div className="recording-info"><strong>{item.name}</strong><span>{new Date(item.createdAt).toLocaleDateString()} · {formatDuration(item.duration)}</span>{item.questionId&&<span className="source-label">Big 30 question {item.questionId.slice(1)}</span>}</div>
    <RecordingPlayer src={urls.get(item.id)!} label={item.name}/>
    {onDelete&&<button className="icon-btn" onClick={()=>onDelete(item.id)} aria-label={`Delete ${item.name}`}><Trash2/></button>}
  </Card>)}</div>
}
