import { ArrowLeft, AudioLines, CheckCircle2, ChevronRight, Circle, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, ProgressBar } from '../components/ui'
import { useApp } from '../context/AppContext'
import { bigQuestions } from '../data/seed'
import Recorder from '../features/Recorder'
import RecordingList, { type RecordingItem } from '../features/RecordingList'
import { useSpeech } from '../hooks/useSpeech'
import { contentRepository } from '../services/contentRepository'
import { listRecordings } from '../services/recordingDb'
import type { NoteStage } from '../types'
import { addQueueItem } from '../utils/programme'

export default function Big30Page(){
  const {state,setState}=useApp();const {speak}=useSpeech(state.preferences.voice,state.preferences.voiceGender);const [query,setQuery]=useState('');const [selected,setSelected]=useState<typeof bigQuestions[number]|null>(null);const [stage,setStage]=useState<NoteStage>('Follow');const [recordings,setRecordings]=useState<RecordingItem[]>([])
  const memo=selected?state.memos[selected.id]||'':'';const guide=selected?contentRepository.getBig30Guide(selected.id):undefined
  const load=async(id:string)=>setRecordings((await listRecordings()).filter(r=>r.questionId===id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))
  useEffect(()=>{if(selected)void load(selected.id)},[selected])
  if(selected)return <><button className="btn btn-ghost" onClick={()=>setSelected(null)}><ArrowLeft/> All questions</button><div className="question-practice"><span className="eyebrow">Big 30 question {selected.id.slice(1)}</span><h1>{selected.question}</h1>
    {guide&&<Card className="big30-purpose"><strong>Purpose</strong><p>{guide.purpose}</p><div className="notice"><strong>Common trap:</strong> {guide.commonTrap}</div><Button variant="ghost" onClick={()=>setState(s=>({...s,practiceQueue:addQueueItem(s.practiceQueue,{id:crypto.randomUUID(),type:'big30',contentId:selected.id,title:selected.question,estimatedMinutes:5})}))}>Save to Practice next</Button></Card>}
    <div className="stage-tabs">{(['Follow','Recall','Free'] as NoteStage[]).map(value=><button key={value} className={stage===value?'active':''} onClick={()=>setStage(value)}>{value}</button>)}</div>
    <div className="question-grid"><Card><h3>Question-specific planner</h3><p className="muted">{guide?.practiceStages[stage.toLowerCase() as 'follow'|'recall'|'free']}</p><ul>{(guide?.keyPoints||selected.keyPoints).map(item=><li key={item}>{item}</li>)}</ul><h3>Support frames</h3>{stage==='Free'?<p className="muted">Frames hidden. Use your own words.</p>:(guide?.supportFrames||selected.frames).map(item=><button className="pill listen-pill" key={item} onClick={()=>speak(item)}>{stage==='Recall'?`${item.split(' ')[0]}…`:item}<AudioLines/></button>)}{guide&&<><h3>Timed rounds</h3><div className="round-list">{guide.recommendedRounds.map(round=><span className="pill" key={round.seconds}>{round.seconds}s · {round.focus}</span>)}</div></>}</Card><Card><h3>Speaking memo</h3><p className="muted">Keywords or short sentences both work.</p><textarea rows={7} value={memo} onChange={e=>setState(s=>({...s,memos:{...s.memos,[selected.id]:e.target.value}}))}/></Card></div>
    {guide&&<Card><span className="eyebrow">Listener follow-up</span><h3>{guide.followUpQuestion}</h3><p className="muted">Answer this after your main response to practise flexibility.</p></Card>}
    <Card className="model-answer"><details><summary><strong>Example answer - make it yours</strong></summary><p>{selected.modelAnswer}</p><Button variant="secondary" onClick={()=>speak(selected.modelAnswer)}><AudioLines/> Hear example</Button></details></Card>
    <Recorder questionId={selected.id} recordingName={`Big 30 · ${selected.question}`} onSaved={()=>setState(s=>({...s,completedQuestions:Array.from(new Set([...s.completedQuestions,selected.id]))}))} onStored={()=>void load(selected.id)}/>
    <section className="question-recordings"><span className="eyebrow">Then vs now</span><h2>Your recordings for this question</h2>{recordings.length?<RecordingList items={recordings} compact/>:<p className="muted">Saved attempts will appear here for comparison.</p>}</section></div></>
  const shown=bigQuestions.filter(item=>item.question.toLowerCase().includes(query.toLowerCase()))
  return <><div className="topline"><div><span className="eyebrow">Question-specific speaking guides</span><h1 className="page-title">Big 30 Questions</h1><p className="muted">Build flexible answers instead of memorising scripts.</p></div><Card className="big-progress"><strong>{state.completedQuestions.length}/30</strong><span>completed</span><ProgressBar value={state.completedQuestions.length} max={30}/></Card></div><label className="search"><Search/><input aria-label="Search questions" placeholder="Search questions" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="questions-list">{shown.map((question,index)=>{const done=state.completedQuestions.includes(question.id);return <button key={question.id} onClick={()=>setSelected(question)}><span className="question-number">{String(index+1).padStart(2,'0')}</span>{done?<CheckCircle2/>:<Circle/>}<span><strong>{question.question}</strong><small>{contentRepository.getBig30Guide(question.id)?.purpose||question.category}</small></span><ChevronRight/></button>})}</div></>
}
