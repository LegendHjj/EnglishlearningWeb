import { AudioLines, Dumbbell, Shuffle, Sparkles, Waves } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../components/ui'
import { practice } from '../data/seed'
import Recorder from '../features/Recorder'
import { useSpeech } from '../hooks/useSpeech'

const modes=[['Mouth Reps',Waves],['Tight Practice',Dumbbell],['Loose Practice',Shuffle],['Free Practice',Sparkles],['Shadowing',AudioLines]] as const

export default function PracticePage(){
  const [mode,setMode]=useState<(typeof modes)[number][0]>('Mouth Reps')
  const [index,setIndex]=useState(0)
  const {speak}=useSpeech()
  const source=mode==='Tight Practice'?practice.tight:mode==='Loose Practice'?practice.loose:mode==='Free Practice'?practice.free:mode==='Shadowing'?practice.shadow:practice.mouth
  const raw=source[index%source.length]
  const content=Array.isArray(raw)?raw.join(' · '):raw
  const guidance=mode==='Mouth Reps'?'Repeat it slowly, normally, quickly, warmly, and seriously. Then use it in one personal sentence.':mode==='Tight Practice'?'Keep the sentence short. Change only the requested part, then repeat your improved version three times.':mode==='Loose Practice'?'Use all four words in a short story. Repeat once and make the second version clearer.':mode==='Free Practice'?'Complete the message first. On your second attempt, add one useful phrase from your Notebook.':'Listen once for meaning, then repeat with the same rhythm and stress.'
  return <><div className="topline"><div><span className="eyebrow">Train from controlled to natural</span><h1 className="page-title">Practice Room</h1><p className="muted">Repeat, adjust, and try again. The second version should feel easier—not perfect.</p></div></div><div className="mode-tabs">{modes.map(([m,I])=><button key={m} className={m===mode?'active':''} onClick={()=>{setMode(m);setIndex(0)}}><I size={18}/>{m}</button>)}</div><div className="practice-layout"><Card className="practice-prompt"><span className="eyebrow">{mode}</span><h2>{content}</h2><p className="muted">{guidance}</p>{(mode==='Mouth Reps'||mode==='Shadowing')&&<Button variant="secondary" onClick={()=>speak(String(content))}><AudioLines size={17}/> Hear model line</Button>}<div style={{marginTop:'2rem'}}><Button variant="ghost" onClick={()=>setIndex(i=>i+1)}>Try another prompt →</Button></div></Card><Recorder recordingName={`${mode} practice`}/></div></>
}
