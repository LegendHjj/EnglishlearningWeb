import { ClipboardCopy, MessageSquareText } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Card } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import type { Big30Guide } from '../../content/types'
import type { Big30Answer, BigQuestion } from '../../types'
import { buildBig30Prompt, emptyBig30Answer } from '../../utils/big30Prompt'

export default function AnswerBuilder({question,guide,onPractise}:{question:BigQuestion;guide?:Big30Guide;onPractise:()=>void}){
  const {state,setState}=useApp()
  const draft=state.big30Answers[question.id]||emptyBig30Answer()
  const [message,setMessage]=useState('')
  const promptField=useRef<HTMLTextAreaElement>(null)
  const prompt=buildBig30Prompt(question,guide,draft)
  const update=(patch:Partial<Big30Answer>)=>{
    setMessage('')
    setState(s=>({...s,big30Answers:{...s.big30Answers,[question.id]:{...(s.big30Answers[question.id]||emptyBig30Answer()),...patch}}}))
  }
  const copy=async()=>{
    try{await navigator.clipboard.writeText(prompt);setMessage('Prompt copied. Paste it into ChatGPT or any AI tool you prefer.')}
    catch{promptField.current?.focus();promptField.current?.select();setMessage('Select the prompt and copy manually using your browser or keyboard.')}
  }
  return <div className="big30-answer-builder">
    <Card className="answer-builder-intro"><span className="eyebrow">Your ideas. Your voice.</span><h2>Turn your story into a short answer.</h2><p>Describe what you mean, copy a prompt into your preferred AI tool, then bring the answer back here. Long notes, Chinese, and imperfect English are all welcome.</p><p className="muted">This app builds the prompt on your device. You choose what to share with an AI tool. Your notes and answer are saved here as you edit.</p></Card>
    <div className="answer-builder-grid">
      <Card><span className="eyebrow">1 · Describe</span><h3>What do you want to say?</h3><label className="field"><span>What I want to say</span><textarea rows={8} value={draft.notes} onChange={e=>update({notes:e.target.value})} placeholder="Tell your story in your own way. Include the real detail you want someone to remember."/></label><label className="field"><span>Answer length</span><select value={draft.targetSeconds} onChange={e=>update({targetSeconds:Number(e.target.value) as Big30Answer['targetSeconds']})}><option value={30}>Short · about 30 seconds</option><option value={60}>More detail · about 60 seconds</option><option value={90}>Longer · about 90 seconds</option></select></label><p className="muted">The AI will select relevant details for this question’s purpose. Speaking time is approximate.</p></Card>
      <Card><span className="eyebrow">2 · Ask your AI tool</span><h3>A prompt for this question</h3><p className="muted">Includes the purpose, planner, and common trap above. Requests an answer, recall keywords, and three useful chunks.</p><label className="field"><span>Prompt to copy</span><textarea ref={promptField} className="big30-prompt" rows={10} readOnly value={prompt}/></label><Button disabled={!draft.notes.trim()} onClick={copy}><ClipboardCopy size={17}/> Copy AI prompt</Button>{message&&<p className="notice" role="status">{message}</p>}</Card>
    </div>
    <Card className="answer-editor"><span className="eyebrow">3 · Bring it back</span><h3>Make the answer yours.</h3><p className="muted">Paste each section from the AI response into its matching field. Check the facts and adjust any wording you would not normally use.</p><label className="field"><span>My spoken answer</span><textarea rows={6} value={draft.answer} onChange={e=>update({answer:e.target.value})} placeholder="Paste the ANSWER section here, then edit it to sound like you."/></label><div className="answer-builder-grid"><label className="field"><span>Recall keywords</span><textarea rows={3} value={draft.keywords} onChange={e=>update({keywords:e.target.value})} placeholder="Paste the KEYWORDS section. Keep just a few short cues."/></label><label className="field"><span>Useful chunks</span><textarea rows={3} value={draft.chunks} onChange={e=>update({chunks:e.target.value})} placeholder="Paste the USEFUL CHUNKS section. You can add expressions to your Library later."/></label></div><p className="muted">Practise the message, then try it with less support. You can change the wording each time.</p><Button disabled={!draft.answer.trim()} onClick={()=>{update({useForPractice:true});onPractise()}}><MessageSquareText size={17}/> Practise my answer</Button></Card>
  </div>
}
