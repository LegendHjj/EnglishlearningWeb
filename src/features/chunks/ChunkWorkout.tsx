import { AudioLines, CheckCircle2, Pause, Pin, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, ProgressBar } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import Recorder from '../Recorder'
import RecordingList, { type RecordingItem } from '../RecordingList'
import { useSpeech } from '../../hooks/useSpeech'
import { listRecordings } from '../../services/recordingDb'
import type { ChunkRating, NoteStage } from '../../types'
import { chunkCue, chunkRatings, reviewChunk } from '../../utils/chunks'

const steps=['Listen & repeat','Make it yours','Recall from a situation','Speak freely','Self-check','Complete']

export default function ChunkWorkout({phraseId,onClose}:{phraseId:string;onClose:()=>void}){
  const {state,setState,togglePin}=useApp()
  const phrase=state.phrases.find(p=>p.id===phraseId)
  const {speak,stop,speaking,supported}=useSpeech(state.preferences.voice,state.preferences.voiceGender)
  const [phase,setPhase]=useState(0)
  const [first,setFirst]=useState(phrase?.personalExample||'')
  const [second,setSecond]=useState(phrase?.variations?.[0]||'')
  const [revealed,setRevealed]=useState(false)
  const [hint,setHint]=useState(false)
  const [support,setSupport]=useState<NoteStage>('Free')
  const [used,setUsed]=useState(false)
  const [recordings,setRecordings]=useState<RecordingItem[]>([])
  const [recordingRevision,setRecordingRevision]=useState(0)
  const [audioSaved,setAudioSaved]=useState(false)
  const [recorderBusy,setRecorderBusy]=useState(false)
  const [message,setMessage]=useState('')
  const dialog=useRef<HTMLDivElement>(null)
  const completed=useRef(false)
  const closeRef=useRef(onClose)
  closeRef.current=onClose

  useEffect(()=>{
    const returnFocus=document.activeElement as HTMLElement|null
    const previousOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    const background:{element:HTMLElement;inert:boolean}[]=[]
    let current:HTMLElement|null=dialog.current?.parentElement||null
    while(current?.parentElement){
      for(const sibling of Array.from(current.parentElement.children)){
        if(sibling!==current&&sibling instanceof HTMLElement){background.push({element:sibling,inert:sibling.inert});sibling.inert=true}
      }
      current=current.parentElement
      if(current===document.body)break
    }
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();closeRef.current();return}
      if(event.key!=='Tab')return
      const focusable=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,select,a[href],audio[controls]')||[]).filter(element=>element.getClientRects().length>0)
      const first=focusable[0],last=focusable.at(-1)
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
    }
    document.addEventListener('keydown',keydown)
    return ()=>{
      document.removeEventListener('keydown',keydown)
      document.body.style.overflow=previousOverflow
      background.forEach(({element,inert})=>{element.inert=inert})
      if('speechSynthesis' in window)window.speechSynthesis.cancel()
      returnFocus?.focus()
    }
  },[])

  useEffect(()=>{dialog.current?.querySelector<HTMLElement>('h2')?.focus()},[phase])

  useEffect(()=>{
    if(phase!==0&&phase!==5)return
    let active=true
    listRecordings().then(items=>{if(active)setRecordings(items.filter(item=>item.phraseId===phraseId))}).catch(()=>{if(active)setMessage('Your saved audio could not be loaded. You can still practise this chunk.')})
    return ()=>{active=false}
  },[phraseId,phase,recordingRevision])

  const next=(value:number)=>{stop();setRevealed(false);setHint(false);setPhase(value);dialog.current?.scrollTo?.({top:0})}
  const finish=(rating:ChunkRating)=>{
    if(completed.current)return
    completed.current=true
    setState(s=>({...s,phrases:s.phrases.map(p=>p.id===phraseId?reviewChunk(p,rating,used):p)}))
    next(5)
  }
  const pin=()=>{const result=togglePin(phraseId);setMessage(result==='limit'?'You can pin up to 3 support items. Remove one before adding this chunk.':result==='pinned'?'Chunk pinned for your next mission.':'Chunk removed from mission support.')}
  const cue=phrase?chunkCue(phrase):''
  const opening=phrase?.text.split(/\s+/)[0]||''

  return <div className="modal-backdrop chunk-backdrop"><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="chunk-workout-title" className="modal card chunk-workout">
    <div className="card-title-row"><div><span className="eyebrow">One chunk at a time · {Math.min(phase+1,5)} of 5</span><h2 id="chunk-workout-title" tabIndex={-1}>{steps[phase]}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close chunk practice"><X/></button></div>
    <ProgressBar value={phase+1} max={steps.length}/>
    {!phrase?<><p>This expression is no longer in your library.</p><Button onClick={onClose}>Back to library</Button></>:<>
      {phase===0&&<>
        <div className="chunk-model"><span className="eyebrow">Learn the words together</span><h3>{phrase.text}</h3><p>{phrase.meaning}</p></div>
        <p><strong>When to use:</strong> {phrase.whenToUse||'Choose a situation from your own day.'}</p>
        {phrase.example&&<Card className="chunk-example"><span className="eyebrow">Example in context</span><p>{phrase.example}</p></Card>}
        <p>Say it three times: slowly, at a comfortable pace, then as if you mean it. For a frame with a blank, use the complete example.</p>
        {supported?<div className="detail-actions"><Button variant="secondary" onClick={()=>speak(phrase.example||phrase.text,.8)}><AudioLines size={17}/> Listen slowly</Button><Button variant="secondary" onClick={()=>speak(phrase.example||phrase.text)}>Listen naturally</Button>{speaking&&<Button variant="ghost" onClick={stop}><Pause size={16}/> Stop voice</Button>}</div>:<p className="muted">Voice playback is unavailable here. Read the example aloud at your own pace.</p>}
        <p className="muted">The model uses your browser voice. There is no pronunciation score.</p>
        {phrase.source&&<p className="chunk-source">Source: {phrase.source}</p>}
        <Button onClick={()=>next(1)}>Next: make it yours</Button>
      </>}
      {phase===1&&<>
        <div className="chunk-model"><h3>{phrase.text}</h3><p>{phrase.chunkKind==='Sentence frame'||phrase.type==='Sentence frame'?'Keep the opening and change the ending.':'Keep the useful words together and change the surrounding sentence or situation.'}</p></div>
        {phrase.example&&<p className="muted">Example: {phrase.example}</p>}
        <label className="field"><span>My first sentence</span><textarea value={first} onChange={e=>setFirst(e.target.value)} placeholder="Use it for something real in your life."/></label>
        <label className="field"><span>Another situation</span><textarea value={second} onChange={e=>setSecond(e.target.value)} placeholder="Try the same chunk in another context."/></label>
        <p className="muted">For a fixed response, add a reason or describe when you would say it. These notes stay in your Library.</p>
        <Button disabled={!first.trim()||!second.trim()} onClick={()=>{
          setState(s=>({...s,phrases:s.phrases.map(p=>p.id===phraseId?{...p,personalExample:first.trim(),variations:[second.trim(),...(p.variations||[]).slice(1)]}:p)}))
          next(2)
        }}>Save sentences and recall</Button>
      </>}
      {phase===2&&<>
        <div className="chunk-model"><span className="eyebrow">Situation cue</span><p className="chunk-cue">{cue}</p></div>
        <p>Say the expression from memory, then use it in a sentence. A pause is fine. Help is here when you need it.</p>
        <div className="detail-actions"><Button variant="secondary" onClick={()=>setHint(true)}>Show a hint</Button><Button variant="ghost" onClick={()=>setRevealed(value=>!value)}>{revealed?'Hide chunk':'Show chunk'}</Button></div>
        {hint&&!revealed&&<p className="chunk-hint">{opening} …</p>}
        {revealed&&<Card className="chunk-example"><strong>{phrase.text}</strong><p>{first}</p></Card>}
        <Button onClick={()=>next(3)}>Next: speak freely</Button>
      </>}
      {phase===3&&<>
        <p className="chunk-cue">{cue}</p><p>Speak for about 30–60 seconds. Add a reason, a detail, or a follow-up question. Use the chunk if it fits and focus on getting your message across.</p>
        <div className="note-controls" aria-label="Speaking support">{(['Follow','Recall','Free'] as NoteStage[]).map(value=><button key={value} className={support===value?'active':''} aria-pressed={support===value} onClick={()=>setSupport(value)}>{value}</button>)}</div>
        {support==='Follow'&&<Card className="chunk-example"><strong>{phrase.text}</strong><p>{first}</p><p>{second}</p></Card>}
        {support==='Recall'&&<p className="chunk-hint">{opening} …</p>}
        {support==='Free'&&<p className="muted">Your expression and notes are hidden. Choose support whenever it helps.</p>}
        <Recorder phraseId={phraseId} recordingName={`Chunk practice · ${phrase.text}`} onBusyChange={setRecorderBusy} onStored={()=>{setAudioSaved(true);setRecordingRevision(value=>value+1)}}/>
        {audioSaved&&<p role="status">Audio saved to this chunk and your Recordings library.</p>}
        <Button disabled={recorderBusy} onClick={()=>next(4)}>I finished speaking</Button><p className="muted">{recorderBusy?'Finish microphone setup, then stop and save or delete your take before continuing.':'Recording is optional. Continue after practising aloud if you prefer.'}</p>
      </>}
      {phase===4&&<>
        <div className="chunk-model"><h3>{phrase.text}</h3><p>How did recalling this chunk feel today?</p></div>
        <label className="chunk-use"><input type="checkbox" checked={used} onChange={e=>setUsed(e.target.checked)}/><span>I used the chunk in my spoken answer.</span></label>
        <p className="muted">Only tick this if you used it. Practice does not automatically count as usage.</p>
        <div className="chunk-rating-grid">{chunkRatings.map(rating=><Button key={rating} variant={rating==='Again'?'coral':'secondary'} onClick={()=>finish(rating)}>{rating}</Button>)}</div>
        <p className="muted">Again: revisit tomorrow. With help: keep your current interval. On my own: leave a little more space before the next review.</p>
      </>}
      {phase===5&&<>
        <div className="chunk-model"><CheckCircle2 size={36}/><h3>A small piece of English, made yours.</h3><p>{phrase.text}</p></div>
        <p>Your personal sentences and recall check are saved.</p><p><strong>Suggested next review:</strong> {phrase.chunkReview?new Date(phrase.chunkReview.nextReviewAt).toLocaleDateString():''}</p>
        <p className="muted">This is your own reflection, not a fluency score. Come back whenever it is useful.</p>
        <div className="detail-actions"><Button onClick={onClose}>Back to library</Button><Button variant="secondary" onClick={pin}><Pin size={16}/> {state.pinnedPhraseIds.includes(phraseId)?'Unpin from mission':'Pin for my next mission'}</Button></div>
      </>}
      {(phase===0||phase===5)&&recordings.length>0&&<details className="chunk-recordings"><summary>Your recordings for this chunk ({recordings.length})</summary><RecordingList compact items={recordings}/></details>}
      {message&&<p className="notice" role="status">{message}</p>}
    </>}
  </div></div>
}
