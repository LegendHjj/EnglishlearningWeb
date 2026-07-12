import { Pause, Play } from 'lucide-react'
import { useRef, useState } from 'react'

export default function RecordingPlayer({src,label}:{src:string;label:string}){
  const audio=useRef<HTMLAudioElement>(null)
  const [playing,setPlaying]=useState(false)
  const toggle=()=>{const el=audio.current;if(!el)return;if(playing)el.pause();else void el.play()}
  return <div className="recording-player">
    <button className="play-btn" onClick={toggle} aria-label={`${playing?'Pause':'Play'} ${label}`}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button>
    <audio data-testid="recording-audio" ref={audio} controls src={src} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}/>
  </div>
}
