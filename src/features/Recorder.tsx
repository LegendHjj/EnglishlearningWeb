import { CircleStop, Mic2, Pause, Play, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../components/ui'
import { useRecorder } from '../hooks/useRecorder'
import { saveRecording } from '../services/recordingDb'
import { formatDuration } from '../utils/practice'

type Props={missionId?:string;questionId?:string;recordingName?:string;onSaved?:(seconds:number)=>void;onStored?:()=>void;allowRetry?:boolean}

export default function Recorder({missionId,questionId,recordingName,onSaved,onStored,allowRetry=true}:Props){
  const r=useRecorder()
  const [saved,setSaved]=useState(false)
  const [error,setError]=useState('')
  const save=async()=>{
    if(!r.blob)return
    setSaved(true)
    onSaved?.(r.seconds)
    try{
      await saveRecording({id:crypto.randomUUID(),name:recordingName||(missionId?'Mission recording':'Speaking practice'),createdAt:new Date().toISOString(),duration:r.seconds,missionId,questionId,mimeType:r.blob.type,size:r.blob.size},r.blob)
      onStored?.()
    }catch{
      setSaved(false)
      setError('Your progress was saved, but the audio could not be stored. Please try saving the recording again.')
    }
  }
  if(r.status==='unsupported')return <Card className="recorder-error"><h3>Recording is not supported in this browser</h3><p className="muted">Try the latest Chrome, Edge, Firefox, or Safari. You can still use your memo and practise aloud.</p></Card>
  if(r.status==='denied')return <Card><h3>Microphone access is blocked</h3><p className="muted">Open your browser site settings, allow microphone access for this page, then try again.</p><Button variant="secondary" onClick={r.reset}>Try again</Button></Card>
  return <Card className="recorder"><div className="timer">{formatDuration(r.seconds)}</div>
    {r.status==='idle'&&<button className="mic" onClick={r.start} aria-label="Start recording"><Mic2 size={42}/></button>}
    {r.status==='requesting'&&<div className="mic loading"><Mic2/></div>}
    {(r.status==='recording'||r.status==='paused')&&<div className="record-actions"><button className="mic" onClick={r.pause} aria-label={r.status==='paused'?'Resume recording':'Pause recording'}>{r.status==='paused'?<Play/>:<Pause/>}</button><Button variant="coral" onClick={r.stop}><CircleStop size={18}/> Stop</Button></div>}
    {r.status==='ready'&&<div className="ready-recording"><audio controls src={r.url}/><div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',justifyContent:'center'}}>{allowRetry&&<Button variant="secondary" onClick={r.reset}><RotateCcw size={16}/> Try again</Button>}<Button onClick={save} disabled={saved}><Save size={16}/> {saved?'Saved':'Save recording'}</Button><Button variant="ghost" onClick={r.reset}><Trash2 size={16}/> Delete</Button></div>{error&&<p className="error-text" role="alert">{error}</p>}</div>}
    <p className="privacy"><ShieldCheck size={15}/> Your recordings are stored on this device and are not uploaded to a server.</p>
  </Card>
}
