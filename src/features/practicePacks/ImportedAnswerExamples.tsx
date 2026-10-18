import { useState } from 'react'
import { Card } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { practiceItemKey } from '../../services/practicePacks'
import type { NoteStage } from '../../types'
import PackExample from './PackExample'

export default function ImportedAnswerExamples({questionId,stage,busy}:{questionId:string;stage:NoteStage;busy:boolean}){
  const {state}=useApp(),[selected,setSelected]=useState('')
  const examples=state.practicePacks.flatMap(pack=>pack.items.filter(item=>item.kind==='answer'&&item.questionId===questionId).map(item=>({pack,item,key:practiceItemKey(pack,item)})))
  const current=examples.find(e=>e.key===selected)||examples[0]
  if(!current)return null
  return <Card className="imported-answer-examples"><h3>Imported example answers</h3><p className="muted">Fictional examples to learn from. Your own answer stays saved in My Answer.</p><label className="field"><span>Choose an example answer</span><select disabled={busy} value={current.key} onChange={e=>setSelected(e.target.value)}>{examples.map(e=><option value={e.key} key={e.key}>{e.item.title.replace(/^.*? — /,'')}</option>)}</select></label><PackExample key={current.key} pack={current.pack} item={current.item} stage={stage} busy={busy}/></Card>
}
