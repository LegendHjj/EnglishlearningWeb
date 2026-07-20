import { CheckCircle2, Circle, Flag, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, ProgressBar } from '../components/ui'
import { useApp } from '../context/AppContext'
import { contentRepository } from '../services/contentRepository'
import { addQueueItem, getNextIncompleteMission } from '../utils/programme'

export default function ProgrammePage(){
  const {state,setState}=useApp(); const {programme,status}=contentRepository
  if(!status.ok)return <EmptyState icon={<Flag/>} heading="The programme content is unavailable" body="Your saved progress is safe. Refresh the app after checking the content files."/>
  const completed=new Set(state.completedProgrammeMissionIds); const next=getNextIncompleteMission(programme.missions,state.completedProgrammeMissionIds)
  return <><div className="topline"><div><span className="eyebrow">60 practice days, at your pace</span><h1 className="page-title">Your Fluency Reset programme</h1><p className="muted">Missing a calendar day never skips a lesson. Continue when you are ready.</p></div><Card className="big-progress"><strong>{completed.size}/60</strong><span>practice days</span><ProgressBar value={completed.size} max={60}/></Card></div>
  {next&&<Card className="programme-next"><span className="eyebrow">Next · Day {next.day}</span><h2>{next.title}</h2><p>{next.communicativeOutcome}</p><Link to={`/app/mission?mission=${next.id}&duration=${state.preferences.duration}`}><Button><Play size={16}/> Continue programme</Button></Link><Button variant="ghost" onClick={()=>setState(s=>({...s,practiceQueue:addQueueItem(s.practiceQueue,{id:crypto.randomUUID(),type:'mission',contentId:next.id,title:`Day ${next.day} · ${next.title}`,estimatedMinutes:state.preferences.duration})}))}>Save to Practice next</Button></Card>}
  <div className="phase-list">{programme.phases.map(phase=>{const missions=programme.missions.filter(m=>m.phaseId===phase.id);const count=missions.filter(m=>completed.has(m.id)).length;return <Card key={phase.id}><div className="card-title-row"><div><span className="eyebrow">Days {phase.days}</span><h2>{phase.title}</h2><p className="muted">{phase.purpose}</p></div><strong>{count}/{missions.length}</strong></div><ProgressBar value={count} max={missions.length}/><div className="programme-days">{missions.map(m=><Link key={m.id} className={completed.has(m.id)?'done':next?.id===m.id?'next':''} to={`/app/mission?mission=${m.id}&duration=${state.preferences.duration}&replay=${completed.has(m.id)?'1':'0'}`} aria-label={`Day ${m.day}: ${m.title}`}>{completed.has(m.id)?<CheckCircle2/>:m.isCheckpoint?<Flag/>:<Circle/>}<span>{m.day}</span></Link>)}</div></Card>})}</div></>
}
