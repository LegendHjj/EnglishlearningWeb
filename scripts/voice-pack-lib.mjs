import { createHash } from 'node:crypto'
import { readFile,writeFile,rename } from 'node:fs/promises'

export const MODEL='onnx-community/Kokoro-82M-v1.0-ONNX'
export const REVISION='1939ad2a8e416c0acfeecc08a694d14ef25f2231'
export const canonicalText = text => String(text??'').replace(/\s+/g,' ').trim()
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export const clipKey = (text,rate=1) => sha256(JSON.stringify(['af_heart',REVISION,rate,canonicalText(text)]))

export function collectRequests({seedPhrases=[],seedVocabulary=[],starterChunks=[],bigQuestions=[],programme={},drills={},guides={},packs=[]}) {
  const requests=new Map()
  const add=(value,source,rate=1)=>{
    const text=canonicalText(value);if(!text)return
    const key=clipKey(text,rate)
    if(!requests.has(key))requests.set(key,{key,text,rate,sources:[]})
    requests.get(key).sources.push(source)
  }
  for(const [group,phrases] of [['seed',seedPhrases],['starter',starterChunks]])for(const [i,p] of phrases.entries()){
    add(p.text,`${group}/${i}/text`);add(p.example,`${group}/${i}/example`);add(p.example||p.text,`${group}/${i}/slow`,.8)
  }
  for(const word of seedVocabulary){
    for(const field of ['english','simpleDefinition','example','personalSentence'])add(word[field],`vocabulary/${word.id}/${field}`)
    // Add to Speaking Phrases carries the vocabulary example into ChunkWorkout.
    for(const text of word.commonCollocations||[])add(text,`vocabulary/${word.id}/collocation`)
    if(word.commonCollocations?.length)add(word.example,`vocabulary/${word.id}/promoted-example-slow`,.8)
  }
  for(const q of bigQuestions){add(q.modelAnswer,`big30/${q.id}/model`);add(q.question,`big30/${q.id}/question`);for(const f of q.frames||[])add(f,`big30/${q.id}/frame`)}
  for(const mission of programme.missions||[])for(const text of mission.supportPhrases||[])add(text,`mission/${mission.id}`)
  for(const [mode,data] of Object.entries(drills.modes||{}))for(const d of data.items||[])add(d.phrase||d.transcript,`drill/${mode}/${d.id}`)
  for(const g of guides.items||[]){for(const f of g.supportFrames||[])add(f,`guide/${g.id}/frame`);add(g.followUpQuestion,`guide/${g.id}/followUp`)}
  for(const pack of packs)for(const item of pack.items){
    const source=`pack/${pack.id}/${item.id}`
    add([item.model,...(item.examples||[])].join('\n'),`${source}/listen`)
    add(item.model,`${source}/model`)
    for(const text of item.examples||[])add(text,`${source}/example`)
    if(item.kind==='chunk'){
      add(item.title,`${source}/title`)
      add([item.model,...(item.examples||[])].filter(Boolean).join('\n\n'),`${source}/slow`,.8)
    }
    if(item.challenge){add(item.challenge.model,`${source}/challenge`);add(item.challenge.followUp,`${source}/followUp`)}
    for(const text of item.followUps||[])add(text,`${source}/followUp`)
  }
  add('My weekend was pretty relaxed. I had lunch with my family, and the best part was having time to talk without rushing.','settings/heart-preview')
  add('Hello! This is how your chosen voice sounds when playing back phrases.','settings/browser-preview')
  return [...requests.values()]
}

export function encodeWav(samples) {
  if(!samples.length)throw new Error('Empty audio')
  const out=Buffer.alloc(44+samples.length*2)
  out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(24000,24);out.writeUInt32LE(48000,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(samples.length*2,40)
  samples.forEach((value,i)=>{if(!Number.isFinite(value))throw new Error('Nonfinite audio');out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*(value<0?32768:32767)),44+i*2)})
  return out
}
export function validateWav(bytes) {
  if(bytes.length<46||bytes.toString('ascii',0,4)!=='RIFF'||bytes.readUInt32LE(4)!==bytes.length-8||bytes.toString('ascii',8,16)!=='WAVEfmt '||bytes.readUInt16LE(20)!==1||bytes.readUInt16LE(22)!==1||bytes.readUInt32LE(24)!==24000||bytes.readUInt16LE(34)!==16||bytes.toString('ascii',36,40)!=='data'||bytes.readUInt32LE(40)!==bytes.length-44||(bytes.length-44)%2)throw new Error('Invalid PCM16 mono 24kHz WAV')
  return {samples:(bytes.length-44)/2,sampleRate:24000}
}
export function reusableClip(bytes,saved) {
  try{return bytes.length===saved.bytes&&validateWav(bytes).samples===saved.samples&&sha256(bytes)===saved.sha256}catch{return false}
}

export async function readSegmentCache(filename) {
  try{
    const [bytes,metadata]=await Promise.all([readFile(filename),readFile(filename+'.json','utf8').then(JSON.parse)])
    if(reusableClip(bytes,metadata))return bytes
  }catch{/* Missing, legacy or corrupt intermediates are regenerated. */}
}
export async function writeSegmentCache(filename,bytes) {
  const {samples}=validateWav(bytes)
  const metadata={samples,bytes:bytes.length,sha256:sha256(bytes)}
  await writeFile(filename+'.tmp',bytes);await rename(filename+'.tmp',filename)
  await writeFile(filename+'.json.tmp',JSON.stringify(metadata));await rename(filename+'.json.tmp',filename+'.json')
}
