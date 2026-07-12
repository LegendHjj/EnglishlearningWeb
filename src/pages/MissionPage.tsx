import { ArrowLeft, ArrowRight, AudioLines, Check, CheckCircle2, ChevronRight, Lightbulb, Pin, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Card, ProgressBar } from '../components/ui'
import { useApp } from '../context/AppContext'
import { missions } from '../data/seed'
import Recorder from '../features/Recorder'
import { useSpeech } from '../hooks/useSpeech'
import type { Difficulty, NoteStage } from '../types'
import { phraseHint } from '../utils/practice'

const flow=['Choose','Prepare','Speak','Retry','Complete']

export default function MissionPage(){
  const {state,setState,togglePin}=useApp()
  const [params]=useSearchParams()
  const mission=missions.find(x=>x.id===params.get('mission'))||missions[0]
  const {speak}=useSpeech()
  const [step,setStep]=useState(0)
  const [difficulty,setDifficulty]=useState<Difficulty>('Practical')
  const [memo,setMemo]=useState(state.memos[mission.id]||'Main point\nOne useful detail\nNext step')
  const [noteStage,setNoteStage]=useState<NoteStage>('Follow')
  const [firstSeconds,setFirstSeconds]=useState(0)
  const pinned=state.phrases.filter(p=>state.pinnedPhraseIds.includes(p.id))
  const available=state.phrases.filter(p=>mission.suggestedPhraseIds.includes(p.id)||p.category===mission.category).slice(0,10)
  const complete=(seconds:number)=>{setFirstSeconds(seconds);if(step===2)setStep(3)}
  const finish=()=>{const date=new Date().toISOString().slice(0,10);setState(s=>s.completedMissions.includes(mission.id)?s:{...s,completedMissions:[...s.completedMissions,mission.id],progress:[...s.progress,{date,minutes:Math.max(1,Math.ceil(firstSeconds/60)),missions:1,confidence:7}]});setStep(4)}
  const saveMemo=(value:string)=>{setMemo(value);setState(s=>({...s,memos:{...s.memos,[mission.id]:value}}))}
  return <><div className="mission-head"><Link to="/app" className="back"><ArrowLeft size={17}/> Back to today</Link><div className="flow-progress"><ProgressBar value={step+1} max={flow.length}/><span>{flow[step]} · {step+1} of {flow.length}</span></div></div>
    {step===0&&<div className="focus-wrap"><span className="eyebrow">{mission.category} · choose your level</span><h1 className="page-title">{mission.title}</h1><p className="muted">{mission.situation}</p><div className="difficulty-grid">{[['Easy','A comfortable 30-second task.'],['Practical','A useful 60-second real-life task.'],['Brave','A challenging 60–90 second task.']].map(([d,b])=><button className={`difficulty ${difficulty===d?'selected':''}`} key={d} onClick={()=>setDifficulty(d as Difficulty)}><span className="difficulty-icon">{d==='Easy'?'○':d==='Practical'?'◐':'●'}</span><strong>{d}</strong><span>{b}</span>{difficulty===d&&<Check size={18}/>}</button>)}</div><Button onClick={()=>setStep(1)}>Prepare my answer <ArrowRight size={17}/></Button></div>}
    {step===1&&<div className="mission-layout"><div><span className="eyebrow">Real-life situation</span><h1 className="page-title">{mission.situation}</h1><Card><h3>Communicative goal</h3><div className="key-grid">{mission.keyPoints.map((x,i)=><div className="key-point" key={x}><span>{i+1}</span>{x}</div>)}</div></Card><Card style={{marginTop:'1rem'} as never}><div className="card-title-row"><div><h3>Your speaking memo</h3><p className="muted">Use keywords or short sentences.</p></div>{memo.trim()&&<Button variant="ghost" onClick={()=>speak(memo)}><AudioLines size={16}/> Hear my memo</Button>}</div><textarea rows={6} value={memo} onChange={e=>saveMemo(e.target.value)}/></Card></div><div><Card><h3>Pin up to three useful phrases</h3><p className="muted">These phrases match the situation or today’s goal.</p><div className="phrase-picker">{available.map(p=><button key={p.id} className={`picker-row ${state.pinnedPhraseIds.includes(p.id)?'picked':''}`} onClick={()=>togglePin(p.id)}><span>{p.text}</span><Pin size={16}/></button>)}</div></Card><Button style={{width:'100%',marginTop:'1rem'}} onClick={()=>setStep(2)}>I’m ready to speak <ChevronRight size={17}/></Button></div></div>}
    {step===2&&<div className="speak-focus"><span className="eyebrow">{difficulty} · {mission.category}</span><h1>{mission.title}</h1><div className="stage-tabs">{(['Follow','Recall','Free'] as NoteStage[]).map(s=><button className={noteStage===s?'active':''} onClick={()=>setNoteStage(s)} key={s}>{s}</button>)}</div><Card className="speaking-support"><div><h3>Your memo</h3>{noteStage==='Free'?<ul>{mission.keyPoints.map(x=><li key={x}>{x}</li>)}</ul>:<ul>{memo.split('\n').filter(Boolean).map(x=><li key={x}>{noteStage==='Recall'?`${x.split(' ')[0]}…`:x}</li>)}</ul>}</div><div><h3>Pinned phrases</h3><div className="pinned-phrases">{pinned.map(p=><button className="pill listen-pill" key={p.id} onClick={()=>speak(p.text)}>{phraseHint(p.text,noteStage)}<AudioLines size={13}/></button>)}</div></div></Card><Recorder missionId={mission.id} recordingName={`Mission · ${mission.title}`} onSaved={complete}/><p className="muted" style={{textAlign:'center'}}>Save your first attempt to continue. Your answer does not need to be perfect.</p></div>}
    {step===3&&<div className="focus-wrap"><span className="eyebrow">One small upgrade</span><h1 className="page-title">Try it once more, with one useful phrase.</h1><p className="muted">Task repetition makes retrieval easier. Change one part rather than memorising the whole answer.</p><Card className="retry-tip"><Lightbulb/><div><strong>Try opening with:</strong><button className="btn btn-ghost" onClick={()=>speak(pinned[0]?.text||'Here is a quick update.')}>{pinned[0]?.text||'Here’s a quick update.'} <AudioLines size={15}/></button></div></Card><Recorder missionId={mission.id} recordingName={`Mission retry · ${mission.title}`} onSaved={()=>{}}/><div style={{display:'flex',gap:'.7rem',justifyContent:'center'}}><Button variant="secondary" onClick={finish}>Keep my first answer</Button><Button onClick={finish}>Finish mission <Check size={17}/></Button></div></div>}
    {step===4&&<div className="complete-screen"><div className="complete-icon"><CheckCircle2 size={44}/></div><span className="eyebrow">Mission completed</span><h1>You completed a real message.</h1><p className="muted">That is how a speaking reflex grows: one useful situation at a time.</p><div className="result-grid"><Card><strong>{firstSeconds||48}s</strong><span>You spoke</span></Card><Card><strong>{pinned.length}</strong><span>Phrases pinned</span></Card><Card><strong>+1</strong><span>Mission completed</span></Card></div><div style={{display:'flex',gap:'.7rem',justifyContent:'center',flexWrap:'wrap'}}><Link to="/app"><Button>Back to dashboard</Button></Link><Link to="/app/practice"><Button variant="secondary"><RotateCcw size={16}/> Continue for 3 minutes</Button></Link></div></div>}
  </>
}
