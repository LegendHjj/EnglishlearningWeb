import { useEffect, useRef, useState } from 'react'

type Status='idle'|'requesting'|'recording'|'paused'|'ready'|'denied'|'unsupported'

export function useRecorder(){
  const supported=typeof MediaRecorder!=='undefined'&&!!navigator.mediaDevices?.getUserMedia
  const [status,setStatus]=useState<Status>(supported?'idle':'unsupported')
  const [seconds,setSeconds]=useState(0)
  const [url,setUrl]=useState('')
  const [blob,setBlob]=useState<Blob|null>(null)
  const recorder=useRef<MediaRecorder|null>(null)
  const stream=useRef<MediaStream|null>(null)
  const chunks=useRef<Blob[]>([])
  const mounted=useRef(true)

  useEffect(()=>{
    mounted.current=true
    return ()=>{
      mounted.current=false
      const active=recorder.current
      if(active){
        active.ondataavailable=null
        active.onstop=null
        if(active.state==='recording'||active.state==='paused')active.stop()
      }
      stream.current?.getTracks().forEach(track=>track.stop())
      stream.current=null
    }
  },[])
  useEffect(()=>()=>{if(url)URL.revokeObjectURL(url)},[url])
  useEffect(()=>{
    if(status!=='recording')return
    const timer=setInterval(()=>setSeconds(value=>{
      if(value>=599){recorder.current?.stop();return 600}
      return value+1
    }),1000)
    return ()=>clearInterval(timer)
  },[status])

  const start=async()=>{
    if(!supported){setStatus('unsupported');return}
    try{
      setStatus('requesting')
      const requestedStream=await navigator.mediaDevices.getUserMedia({audio:true})
      // A permission prompt may resolve after the user has left the recorder.
      if(!mounted.current){requestedStream.getTracks().forEach(track=>track.stop());return}
      stream.current=requestedStream
      const active=new MediaRecorder(requestedStream)
      recorder.current=active
      chunks.current=[]
      setSeconds(0);setBlob(null);setUrl('')
      active.ondataavailable=event=>{if(event.data.size)chunks.current.push(event.data)}
      active.onstop=()=>{
        requestedStream.getTracks().forEach(track=>track.stop())
        stream.current=null
        if(!mounted.current)return
        const audio=new Blob(chunks.current,{type:active.mimeType||'audio/webm'})
        setBlob(audio);setUrl(URL.createObjectURL(audio));setStatus('ready')
      }
      active.start(250)
      setStatus('recording')
    }catch{
      stream.current?.getTracks().forEach(track=>track.stop())
      stream.current=null
      if(mounted.current)setStatus('denied')
    }
  }
  const pause=()=>{
    if(status==='recording'){recorder.current?.pause();setStatus('paused')}
    else if(status==='paused'){recorder.current?.resume();setStatus('recording')}
  }
  const stop=()=>recorder.current?.stop()
  const reset=()=>{setUrl('');setBlob(null);setSeconds(0);setStatus(supported?'idle':'unsupported')}
  return{status,seconds,url,blob,start,pause,stop,reset}
}
