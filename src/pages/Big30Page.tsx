import { ArrowLeft, AudioLines, CheckCircle2, ChevronRight, Circle, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, ProgressBar } from '../components/ui'
import { useApp } from '../context/AppContext'
import { bigQuestions } from '../data/seed'
import Recorder from '../features/Recorder'
import RecordingList, { type RecordingItem } from '../features/RecordingList'
import { useSpeech } from '../hooks/useSpeech'
import { listRecordings } from '../services/recordingDb'
import type { NoteStage } from '../types'

export default function Big30Page(){
  const {state,setState}=useApp()
  const {speak}=useSpeech()
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState<typeof bigQuestions[number]|null>(null)
  const [stage,setStage]=useState<NoteStage>('Follow')
  const [recordings,setRecordings]=useState<RecordingItem[]>([])
  const memo=selected?state.memos[selected.id]||'':''
  const loadQuestionRecordings=async(id:string)=>setRecordings((await listRecordings()).filter(r=>r.questionId===id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))
  useEffect(()=>{if(selected)void loadQuestionRecordings(selected.id)},[selected])

  if(selected)return <><button className="btn btn-ghost" onClick={()=>setSelected(null)}><ArrowLeft size={17}/> All questions</button><div className="question-practice">
    <span className="eyebrow">Big 30 question {selected.id.slice(1)}</span><h1>{selected.question}</h1>
    <div className="stage-tabs">{(['Follow','Recall','Free'] as NoteStage[]).map(x=><button key={x} className={stage===x?'active':''} onClick={()=>setStage(x)}>{x}</button>)}</div>
    <div className="question-grid"><Card><h3>Key point planner</h3><ul>{selected.keyPoints.map(x=><li key={x}>{x}</li>)}</ul><h3>Suggested sentence frames</h3>{stage==='Free'?<p className="muted">Frames hidden. Use your own words.</p>:selected.frames.map(x=><button className="pill listen-pill" key={x} onClick={()=>speak(x)}>{stage==='Recall'?`${x.split(' ')[0]}…`:x}<AudioLines size={13}/></button>)}</Card>
      <Card><div className="card-title-row"><div><h3>Speaking memo</h3><p className="muted">Keywords or sentences both work.</p></div>{memo.trim()&&<Button variant="ghost" onClick={()=>speak(memo)}><AudioLines size={16}/> Hear my memo</Button>}</div><textarea rows={7} value={memo} onChange={e=>setState(s=>({...s,memos:{...s.memos,[selected.id]:e.target.value}}))} placeholder="work · product designer · 5 years · enjoy solving problems"/></Card>
    </div>
    <Card className="model-answer"><div className="card-title-row"><div><span className="eyebrow">Model answer</span><h3>Listen for structure, then make it yours.</h3></div><Button variant="secondary" onClick={()=>speak(selected.modelAnswer)}><AudioLines size={17}/> Hear model</Button></div><p>{selected.modelAnswer}</p></Card>
    <Recorder questionId={selected.id} recordingName={`Big 30 · ${selected.question}`} onSaved={()=>setState(s=>({...s,completedQuestions:Array.from(new Set([...s.completedQuestions,selected.id]))}))} onStored={()=>void loadQuestionRecordings(selected.id)}/>
    <section className="question-recordings"><div className="card-title-row"><div><span className="eyebrow">Your history</span><h2>Recordings for question {selected.id.slice(1)}</h2></div></div>{recordings.length?<RecordingList items={recordings} compact/>:<p className="muted">Your saved attempts for this question will appear here.</p>}</section>
  </div></>

  const shown=bigQuestions.filter(q=>q.question.toLowerCase().includes(query.toLowerCase()))
  return <><div className="topline"><div><span className="eyebrow">Answers that become automatic</span><h1 className="page-title">Big 30 Questions</h1><p className="muted">Build answers you can use again and again.</p></div><Card className="big-progress"><strong>{state.completedQuestions.length}/30</strong><span>completed</span><ProgressBar value={state.completedQuestions.length} max={30}/></Card></div><label className="search" style={{marginBottom:'1rem'}}><Search size={18}/><input placeholder="Search questions" value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search questions"/></label><div className="questions-list">{shown.map((q,i)=>{const done=state.completedQuestions.includes(q.id);return <button key={q.id} onClick={()=>setSelected(q)}><span className="question-number">{String(i+1).padStart(2,'0')}</span>{done?<CheckCircle2 color="var(--green)"/>:<Circle color="#abb7b1"/>}<span><strong>{q.question}</strong><small>{q.category}</small></span><ChevronRight/></button>})}</div></>
}
