// Local, resumable Heart generation. Run from the repository using Node 22+.
import { mkdir, readFile, writeFile, rename, copyFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { appendFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { KokoroTTS, TextSplitterStream } from 'kokoro-js'
import { StyleTextToSpeech2Model, AutoTokenizer, env } from '@huggingface/transformers'
import { MODEL, REVISION, collectRequests, encodeWav, validateWav, reusableClip, sha256,readSegmentCache,writeSegmentCache } from './voice-pack-lib.mjs'
import { createInferenceBridge } from './voice-pack-openvino.mjs'

const root=process.cwd()
const out=path.resolve(process.argv[2]||'D:/Coding/Others/EnglishVoicePack')
const dtype=process.env.HEART_DTYPE||'fp32'
const backend=process.argv.includes('--openvino')?'OpenVINO CPU':'native onnxruntime-node CPU'
if(backend==='OpenVINO CPU'&&dtype!=='fp32')throw new Error('--openvino requires HEART_DTYPE=fp32 because the adapter executes the pinned fp32 model')
const python=process.env.HEART_PYTHON||'C:/Users/lgdhj/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
const openvinoPython=process.env.HEART_OPENVINO_PYTHON||python
await mkdir(out,{recursive:true});await mkdir(path.join(out,'audio'),{recursive:true});await mkdir(path.join(out,'content'),{recursive:true});await mkdir(path.join(out,'segments'),{recursive:true})
const bundle=await build({stdin:{contents:"export { seedPhrases,seedVocabulary,bigQuestions } from './src/data/seed.ts';export { starterChunks } from './src/data/chunks.ts';export { splitHeartInput,splitHeartSegment } from './src/services/heartSegments.ts'",resolveDir:root},bundle:true,platform:'node',format:'esm',write:false})
await writeFile(path.join(out,'source-data.mjs'),bundle.outputFiles[0].contents)
const {seedPhrases,seedVocabulary,bigQuestions,starterChunks,splitHeartInput,splitHeartSegment}=await import(pathToFileURL(path.join(out,'source-data.mjs')))
const json=async name=>JSON.parse(await readFile(path.join(root,name),'utf8'))
const packFiles=(await readdir(path.join(root,'public/practice-packs'))).filter(x=>x.endsWith('.json'))
const packs=await Promise.all(packFiles.map(name=>json(`public/practice-packs/${name}`)))
for(const name of packFiles){await copyFile(path.join(root,'public/practice-packs',name),path.join(out,name));await copyFile(path.join(root,'public/practice-packs',name),path.join(out,'content',name))}
const requests=collectRequests({seedPhrases,seedVocabulary,bigQuestions,starterChunks,packs,programme:await json('src/content/fluency-reset-60-day-program.json'),drills:await json('src/content/practice-room-content.json'),guides:await json('src/content/big-30-question-guides.json')})
await writeFile(path.join(out,'coverage.json'),JSON.stringify({revision:REVISION,requests},null,2))
const manifestFile=path.join(out,'manifest.json')
let saved;try{saved=JSON.parse(await readFile(manifestFile,'utf8'))}catch{}
const manifest={app:'fluency-reset-voice-pack',version:1,id:'heart-full-2026-10-19',name:'Heart · complete practice library',voice:'af_heart',model:MODEL,revision:REVISION,createdAt:saved?.createdAt||new Date().toISOString(),clips:[]}
const existing=new Map((saved?.clips||[]).map(x=>[x.key,x]))
const atomic=async(file,bytes)=>{await writeFile(file+'.tmp',bytes);await rename(file+'.tmp',file)}
const checkpoint=()=>atomic(manifestFile,JSON.stringify(manifest,null,2))
let generated=0,completed=0,skipped=0
const log=message=>{const line=`${new Date().toISOString()} ${message}`;appendFileSync(path.join(out,'generation-progress.log'),line+'\n');console.log(line)}
log(`COVERAGE ${requests.length} unique text/rate clips; ${requests.reduce((s,x)=>s+x.text.length,0)} text characters`)
if(process.argv.includes('--inventory-only'))process.exit(0)
// Use native ONNX CPU, with bounded threads so the desktop remains usable.
env.cacheDir=path.join(out,'model-cache');env.remotePathTemplate=`{model}/resolve/${REVISION}/`
const threads=Number(process.env.HEART_THREADS||3)
log(`Loading pinned ${dtype} model with ${backend} (${threads} threads)`)
if(sha256(await readFile(path.join(root,'node_modules/kokoro-js/voices/af_heart.bin')))!=='d583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b')throw new Error('Installed Heart voice does not match pinned revision')
await atomic(path.join(out,'generation-provenance.json'),JSON.stringify({model:MODEL,revision:REVISION,voice:'af_heart',voiceSha256:'d583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b',backend,currentDtype:dtype,initialCalibrationDtype:'q8',initialCalibrationClips:saved?.clips?.filter(x=>x.dtype==='q8'||!x.dtype).length||0,threads,kokoroJs:'1.2.1',transformers:'3.5.1'},null,2))
await mkdir(path.join(out,'segments',dtype),{recursive:true})
const [model,tokenizer]=await Promise.all([backend==='OpenVINO CPU'?createInferenceBridge({command:openvinoPython,args:[path.join(root,'scripts/voice-pack-openvino.py'),out,String(threads)],onDiagnostic:message=>appendFileSync(path.join(out,'openvino-worker-error.log'),message)}):StyleTextToSpeech2Model.from_pretrained(MODEL,{dtype,device:'cpu',revision:REVISION,session_options:{intraOpNumThreads:threads,interOpNumThreads:1,graphOptimizationLevel:'all'},progress_callback:p=>{if(p.status==='done')log(`ASSET ${p.file} ready`)}}),AutoTokenizer.from_pretrained(MODEL,{revision:REVISION})])
const tts=new KokoroTTS(model,tokenizer)
const inferenceStarted=Date.now()
class OverWindow extends Error{}
tts.tokenizer=Object.assign((text,options)=>{const result=tokenizer(text,{...options,truncation:false});if(result.input_ids.dims.at(-1)>512)throw new OverWindow('Input exceeds model window');return result},tokenizer)
// Cache complete inferred segments separately; exact repeated sentences need no inference.
async function infer(text,rate){
  const cacheName=path.join(out,'segments',dtype,sha256(JSON.stringify([REVISION,'af_heart',rate,text]))+'.wav')
  const cached=await readSegmentCache(cacheName)
  if(cached)return cached.subarray(44)
  try{
    const audio=await tts.generate(text,{voice:'af_heart',speed:rate})
    const bytes=encodeWav(audio.audio);await writeSegmentCache(cacheName,bytes);generated++;return bytes.subarray(44)
  }catch(error){
    if(!(error instanceof OverWindow))throw error
    const parts=splitHeartSegment(text)
    const left=await infer(parts[0],rate),right=await infer(parts[1],rate)
    return Buffer.concat([left,right])
  }
}
for(const request of requests){
  const file=`audio/${request.key}.wav`,full=path.join(out,file)
  const prior=existing.get(request.key)
  if(prior){try{if(reusableClip(await readFile(full),prior)){manifest.clips.push(prior);completed++;skipped++;continue}}catch{}}
  const pcm=[]
  for(const piece of splitHeartInput(request.text)){
    const splitter=new TextSplitterStream();splitter.push(piece);splitter.close()
    for await(const sentence of splitter)pcm.push(await infer(sentence,request.rate))
  }
  const data=Buffer.concat(pcm),wav=Buffer.alloc(44+data.length)
  // Reuse the validated header, then append already quantised segments without round-trip loss.
  encodeWav(new Float32Array(data.length/2)).copy(wav,0,0,44);data.copy(wav,44)
  const {samples}=validateWav(wav);await atomic(full,wav)
  manifest.clips.push({key:request.key,text:request.text,rate:request.rate,file,bytes:wav.length,sha256:sha256(wav),samples,dtype,backend})
  completed++;await checkpoint()
  if(completed===1||completed%10===0||completed===requests.length){const elapsed=(Date.now()-inferenceStarted)/1000,newClips=completed-skipped;log(`PROGRESS ${completed}/${requests.length} clips; ${skipped} resumed; ${generated} inferred segments; new-run elapsed ${elapsed.toFixed(1)}s; approximate ETA ${newClips>=10?Math.round(elapsed/newClips*(requests.length-completed))+'s':'calibrating'}`)}
}
await checkpoint();await model.dispose()
log(`COMPLETE ${manifest.clips.length} clips; audio ${(manifest.clips.reduce((s,x)=>s+x.samples,0)/24000/3600).toFixed(2)} hours; ${(manifest.clips.reduce((s,x)=>s+x.bytes,0)/1024/1024).toFixed(1)} MiB`)
if(!process.argv.includes('--no-package')){
  execFileSync(python,[path.join(root,'scripts/voice-pack-package.py'),out],{stdio:'inherit'})
  log('ARCHIVE validated and packaged successfully')
}
