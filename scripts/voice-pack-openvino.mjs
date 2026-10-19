import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

// No text crosses this bridge: only the same local Kokoro input tensors.
export async function createInferenceBridge({command,args,onDiagnostic=()=>{}}) {
  const child=spawn(command,args,{stdio:['pipe','pipe','pipe'],windowsHide:true})
  const pending=new Map();let nextId=1,ended=false,readyResolve,readyReject
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject})
  const fail=error=>{ended=true;readyReject(error);for(const item of pending.values())item.reject(error);pending.clear()}
  child.on('error',fail)
  child.on('exit',code=>fail(new Error(`Local inference worker exited (${code})`)))
  child.stderr.on('data',bytes=>onDiagnostic(bytes.toString()))
  createInterface({input:child.stdout}).on('line',line=>{
    try{
      const result=JSON.parse(line)
      if(result.type==='ready'){readyResolve(result);return}
      const item=pending.get(result.id);if(!item)return
      if(result.error){pending.delete(result.id);item.reject(new Error(result.error));return}
      const bytes=Buffer.from(result.audio,'base64')
      if(!Number.isSafeInteger(result.samples)||result.samples<1||bytes.length!==result.samples*4)throw new Error('Invalid local audio response')
      const waveform=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length))
      if(!waveform.every(Number.isFinite))throw new Error('Nonfinite local audio response')
      pending.delete(result.id);item.resolve({waveform:{data:waveform}})
    }catch(error){fail(error);child.kill()}
  })
  await ready
  const model=inputs=>new Promise((resolve,reject)=>{
    if(ended){reject(new Error('Local inference worker exited'));return}
    const id=nextId++;pending.set(id,{resolve,reject})
    const request={id,...Object.fromEntries(['input_ids','style','speed'].map(name=>[name,Array.from(inputs[name].data,Number)]))}
    child.stdin.write(JSON.stringify(request)+'\n',error=>{if(error){pending.delete(id);reject(error)}})
  })
  model.dispose=()=>{child.stdin.end()}
  return model
}
