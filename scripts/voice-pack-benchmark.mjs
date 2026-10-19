// Short native CPU calibration; uses the existing pinned local model cache.
import { KokoroTTS } from 'kokoro-js'
import { StyleTextToSpeech2Model,AutoTokenizer,env } from '@huggingface/transformers'
import { MODEL, REVISION } from './voice-pack-lib.mjs'
env.cacheDir='D:/Coding/Others/EnglishVoicePack/model-cache'
const tokenizer=await AutoTokenizer.from_pretrained(MODEL,{revision:REVISION})
const dtype=process.argv.includes('--fp32')?'fp32':'q8'
for(const device of process.argv.includes('--dml')?['dml']:['cpu'])for(const threads of process.argv.includes('--parallel')?[1]:process.argv.includes('--quick')||device==='dml'?[3]:[1,2,3,4]){
  const model=await StyleTextToSpeech2Model.from_pretrained(MODEL,{dtype,device,revision:REVISION,session_options:{intraOpNumThreads:threads,interOpNumThreads:1,graphOptimizationLevel:'all',...(device==='dml'?{enableMemPattern:false,executionMode:'sequential'}:{})}})
  const tts=new KokoroTTS(model,tokenizer)
  await tts.generate('Hello.',{voice:'af_heart'})
  const start=performance.now()
  let generationStart
  const original=tts.generate_from_ids.bind(tts)
  tts.generate_from_ids=async(...args)=>{generationStart=performance.now();return original(...args)}
  const parallel=process.argv.includes('--parallel')?3:1
  const audios=await Promise.all(Array.from({length:parallel},()=>tts.generate('The main issue is that we need a little more time to complete the project.',{voice:'af_heart'})))
  const audio=audios[0]
  const seconds=(performance.now()-start)/1000
  console.log(JSON.stringify({dtype,device,threads,parallel,seconds,phonemizerSeconds:(generationStart-start)/1000,modelSeconds:(performance.now()-generationStart)/1000,audioSeconds:audio.audio.length/24000*parallel,realtimeFactor:seconds/(audio.audio.length/24000*parallel)}))
  await model.dispose()
}
