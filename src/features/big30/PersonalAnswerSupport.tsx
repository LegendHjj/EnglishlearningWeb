import { AudioLines } from 'lucide-react'
import { useEffect } from 'react'
import { Button, Card } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useSpeech } from '../../hooks/useSpeech'
import type { NoteStage } from '../../types'

export default function PersonalAnswerSupport({questionId,stage,busy,onEdit}:{questionId:string;stage:NoteStage;busy:boolean;onEdit:()=>void}){
  const {state,setState}=useApp()
  const personal=state.big30Answers[questionId]
  const {speak,stop,supported}=useSpeech(state.preferences.voice,state.preferences.voiceGender)
  useEffect(()=>{if(busy)stop()},[busy,stop])
  useEffect(()=>()=>stop(),[stop])
  if(!personal?.answer.trim())return <Card className="personal-answer-support"><h3>Bring your own answer</h3><p className="muted">Use your own story with a prompt tailored to this question.</p><Button variant="secondary" disabled={busy} onClick={onEdit}>Create my answer</Button></Card>
  const active=personal.useForPractice
  const choose=(useForPractice:boolean)=>{stop();setState(s=>({...s,big30Answers:{...s.big30Answers,[questionId]:{...s.big30Answers[questionId],useForPractice}}}))}
  return <Card className="personal-answer-support"><div className="answer-support-header"><h3>Answer support</h3><div className="answer-source" aria-label="Answer source"><Button variant={active?'primary':'secondary'} aria-pressed={active} onClick={()=>choose(true)}>My answer</Button><Button variant={!active?'primary':'secondary'} aria-pressed={!active} onClick={()=>choose(false)}>Original guide</Button></div></div>
    {!active?<p className="muted">Use the original planner and example below. Your personal answer is saved in My Answer.</p>:stage==='Follow'?<><p className="personal-spoken-answer">{personal.answer}</p>{supported&&<Button variant="secondary" disabled={busy} onClick={()=>speak(personal.answer)}><AudioLines size={17}/> Hear my answer</Button>}{personal.chunks.trim()&&<details><summary>My useful chunks</summary><p className="personal-chunks">{personal.chunks}</p></details>}</>:stage==='Recall'?<><span className="eyebrow">Your recall cues</span><p className="personal-recall-keywords">{personal.keywords.trim()||'Add a few short recall keywords in My Answer, or try from memory.'}</p><p className="muted">Your full answer and chunks are hidden. Try saying it in your own words.</p></>:<p className="muted">Your answer, keywords, and chunks are hidden. Answer the question in your own words, then try the follow-up.</p>}
    <Button variant="ghost" disabled={busy} onClick={onEdit}>Edit in My Answer</Button>
  </Card>
}
