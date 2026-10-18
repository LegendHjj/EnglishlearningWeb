import { useEffect, useState } from 'react'
import { AudioLines } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useSpeech } from '../../hooks/useSpeech'
import { emptyPackProgress, practiceItemKey } from '../../services/practicePacks'
import { listRecordings } from '../../services/recordingDb'
import type { NoteStage } from '../../types'
import type { PackItem, PackPracticeProgress, PracticePack } from '../../types/practicePacks'
import Recorder from '../Recorder'
import RecordingList, { type RecordingItem } from '../RecordingList'

type Props={pack:PracticePack;item:PackItem;stage?:NoteStage;busy?:boolean;record?:boolean;onBusyChange?:(busy:boolean)=>void}
export default function PackExample({pack,item,stage:controlledStage,busy=false,record=false,onBusyChange}:Props){
  const {state,setState}=useApp(),key=practiceItemKey(pack,item)
  const progress=state.packPractice[key]||emptyPackProgress
  const [localStage,setStage]=useState<NoteStage>('Follow'),[revealed,setRevealed]=useState(false),[recordingBusy,setRecordingBusy]=useState(false)
  const [recordings,setRecordings]=useState<RecordingItem[]>([]),[revision,setRevision]=useState(0),[message,setMessage]=useState('')
  const stage=controlledStage||localStage,locked=busy||recordingBusy
  const {speak,stop,supported}=useSpeech(state.preferences.voice,state.preferences.voiceGender,state.preferences.speechEngine??'browser')
  useEffect(()=>{stop();setRevealed(false);return ()=>stop()},[stage,key,stop])
  useEffect(()=>{if(locked)stop()},[locked,stop])
  useEffect(()=>{onBusyChange?.(recordingBusy)},[recordingBusy,onBusyChange])
  useEffect(()=>{
    if(!record)return
    let active=true
    listRecordings().then(items=>{if(active)setRecordings(items.filter(r=>r.practiceItemId===key))}).catch(()=>{if(active)setMessage('Saved audio could not be loaded. Your practice notes are still available.')})
    return ()=>{active=false}
  },[key,record,revision])
  const update=(changes:Partial<PackPracticeProgress>)=>setState(s=>({...s,packPractice:{...s.packPractice,[key]:{...(s.packPractice[key]||emptyPackProgress),...changes}}}))
  const task=item.tasks?.[stage==='Follow'?'tight':stage==='Recall'?'loose':'free']
  const complete=()=>{
    setState(s=>{const current=s.packPractice[key]||emptyPackProgress;return {...s,packPractice:{...s.packPractice,[key]:{...current,stage,attempts:current.attempts+1,lastPractisedAt:new Date().toISOString()}}}})
    setMessage(`Practice saved in ${stage}. You can return to this example whenever you like.`)
  }
  return <div className="pack-example">
    {!controlledStage&&<div className="stage-tabs" aria-label="Example support">{(['Follow','Recall','Free'] as const).map(s=><button key={s} aria-pressed={stage===s} className={stage===s?'active':''} disabled={locked} onClick={()=>{stop();setStage(s)}}>{s}</button>)}</div>}
    <p className="pack-cue">{item.cue}</p>{task&&<p><strong>{stage==='Follow'?'Tight':stage==='Recall'?'Loose':'Free'} practice:</strong> {task}</p>}
    {stage==='Follow'?<>
      <Card className="pack-model"><span className="eyebrow">{item.kind==='prompt'?'How to practise':'Example — adapt it to your life'}</span><p className="pack-text">{item.model}</p>{item.examples.map((ex,i)=><p className="pack-text" key={i}>{ex}</p>)}</Card>
      {supported&&<Button variant="secondary" disabled={locked} onClick={()=>speak([item.model,...item.examples].join('\n'))}><AudioLines size={16}/> Listen to example</Button>}
      {item.expressions.length>0&&<details><summary>Useful expressions</summary>{item.expressions.map((ex,i)=><p key={i}>{ex}</p>)}</details>}
      {item.note&&<p className="muted">{item.note}</p>}
      <label className="field"><span>My notes for this example</span><textarea rows={4} value={progress.notes} disabled={locked} onChange={e=>update({notes:e.target.value})} placeholder="Your true details, a new dialogue, or one thing to practise."/></label>
    </>:stage==='Recall'?<Card><h3>Recall cues</h3><p>{item.keywords.join(' · ')||item.topic}</p><p className="muted">The model and your notes are hidden. Build your own message from these cues.</p></Card>:<p className="muted">The model, cues and your notes are hidden. Respond in your own words.</p>}
    {item.challenge&&<Card className="pack-challenge"><h3>{item.kind==='answer'?'Listener follow-up':'Try an unexpected reply'}</h3><p>{item.challenge.cue}</p>
      {stage==='Follow'&&<><label className="field"><span>My reply to the challenge</span><textarea rows={3} value={progress.reply} disabled={locked} onChange={e=>update({reply:e.target.value})} placeholder="Try your reply before revealing the model."/></label>
        {(item.challenge.model||item.challenge.followUp)&&<Button variant="ghost" disabled={locked} onClick={()=>setRevealed(v=>!v)}>{revealed?'Hide possible reply':'Show possible reply'}</Button>}
        {revealed&&<div><p>{item.challenge.model}</p>{item.challenge.followUp&&<p><strong>Keep it going:</strong> {item.challenge.followUp}</p>}</div>}</>}
    </Card>}
    {record&&<><Recorder practiceItemId={key} recordingName={`${pack.name} · ${item.title}`} onBusyChange={setRecordingBusy} onStored={()=>setRevision(v=>v+1)}/>{recordings.length>0&&<details><summary>Recordings for this example ({recordings.length})</summary><RecordingList compact items={recordings}/></details>}</>}
    <div className="detail-actions"><Button disabled={locked} onClick={complete}>I practised this example</Button><span className="muted">{progress.attempts} saved {progress.attempts===1?'practice':'practices'}{progress.lastPractisedAt?` · Last: ${new Date(progress.lastPractisedAt).toLocaleDateString()}`:''}</span></div>
    <p className="muted">{locked?'Stop and save or delete your recording before continuing.':'Practise aloud first. Saving this check-in records your practice stage; it does not complete a programme day.'}</p>
    {message&&<p className="notice" role="status">{message}</p>}
  </div>
}
