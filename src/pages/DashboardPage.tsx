import { ArrowRight, CalendarDays, Clock3, Flame, MessageCircle, Play, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, ProgressBar } from '../components/ui'
import { useApp } from '../context/AppContext'
import { missions } from '../data/seed'
import { useSpeech } from '../hooks/useSpeech'

export default function DashboardPage(){
  const {state}=useApp()
  const [session,setSession]=useState<2|5|10>(state.preferences.duration)
  const nav=useNavigate()
  const {speak}=useSpeech()
  const date=new Date()
  const today=new Intl.DateTimeFormat('en',{weekday:'long',month:'long',day:'numeric'}).format(date)
  const goalMissions=missions.filter(m=>m.goal===state.preferences.goals[0])
  const mission=(goalMissions.length?goalMissions:missions)[date.getDate()%(goalMissions.length||missions.length)]
  const totalMinutes=state.progress.reduce((sum,item)=>sum+item.minutes,0)
  const speakingDays=new Set(state.progress.map(item=>item.date)).size
  const currentPhrase=state.phrases.find(p=>state.pinnedPhraseIds.includes(p.id))||state.phrases[0]
  return <><div className="topline"><div><div className="muted">{today}</div><h1 className="page-title">Build your speaking reflex, one small win at a time.</h1><p className="muted">Good morning, {state.preferences.name}. Your next useful rep is ready.</p></div><span className="pill"><Sparkles size={14}/> {state.preferences.goals[0]}</span></div>
    <div className="dashboard-grid"><div><Card className="today-card"><div style={{display:'flex',justifyContent:'space-between',gap:'1rem'}}><div><span className="eyebrow">Today’s real-life mission · {mission.category}</span><h2 style={{margin:'1rem 0 .4rem'}}>{mission.title}</h2><p className="muted">{mission.situation}</p></div><div className="empty-icon" style={{margin:0,width:54,height:54}}><MessageCircle/></div></div><div className="session-grid">{[[2,'Quick Win','One clear answer'],[5,'Normal Practice','Answer + one retry'],[10,'Full Workout','Mission + extra reps']].map(([n,h,b])=><button className={`session ${session===n?'selected':''}`} key={n} onClick={()=>setSession(n as 2|5|10)}><strong>{h}</strong><div className="muted" style={{fontSize:'.8rem',margin:'.3rem 0'}}>{n} min</div><small>{b}</small></button>)}</div><Button style={{width:'100%'}} onClick={()=>nav(`/app/mission?duration=${session}&mission=${mission.id}`)}>Start Today’s Speaking Mission <ArrowRight size={18}/></Button></Card>
      <div className="stats">{[[Flame,String(speakingDays),'Speaking days'],[Clock3,String(totalMinutes),'Speaking minutes'],[CalendarDays,`${state.completedQuestions.length}/30`,'Big 30']].map(([I,n,l])=>{const Icon=I as typeof Flame;return <Card className="stat" key={String(l)}><Icon size={20} color={l==='Speaking days'?'var(--coral)':'var(--green)'}/><strong>{String(n)}</strong><div className="muted" style={{fontSize:'.78rem'}}>{String(l)}</div></Card>})}</div></div>
      <div className="list"><Card><h3>Current phrase</h3><p style={{fontSize:'1.25rem',fontWeight:800}}>“{currentPhrase.text}”</p><p className="muted">{currentPhrase.meaning}</p><Button variant="secondary" onClick={()=>speak(currentPhrase.text)}><Play size={16}/> Listen & repeat</Button></Card><Card><div style={{display:'flex',justifyContent:'space-between'}}><h3>Recent phrases</h3><button className="btn btn-ghost" onClick={()=>nav('/app/notebook')}>View all</button></div>{state.phrases.slice(0,3).map(p=><div className="list-row" key={p.id}><MessageCircle size={17}/><div><strong>{p.text}</strong><div className="muted" style={{fontSize:'.75rem'}}>Practised {p.practised} times</div></div></div>)}</Card><Card><h3>Big 30 progress</h3><p className="muted">{state.completedQuestions.length} {state.completedQuestions.length===1?'answer is':'answers are'} becoming automatic.</p><ProgressBar value={state.completedQuestions.length} max={30}/></Card></div>
    </div>
  </>
}
