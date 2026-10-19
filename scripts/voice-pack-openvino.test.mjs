// @vitest-environment node
import { expect,test } from 'vitest'
import { createInferenceBridge } from './voice-pack-openvino.mjs'

test('persistent local inference bridge preserves tensors and finite waveform frames',async()=>{
  const fixture=`const r=require('node:readline').createInterface({input:process.stdin});console.log(JSON.stringify({type:'ready'}));r.on('line',line=>{const x=JSON.parse(line);if(x.input_ids[0]===-1){process.exit(2);return}const samples=Float32Array.from([x.input_ids[0],x.style[0],x.speed[0]]);console.log(JSON.stringify({id:x.id,samples:3,audio:Buffer.from(samples.buffer).toString('base64')}))})`
  const model=await createInferenceBridge({command:process.execPath,args:['-e',fixture]})
  const inputs={input_ids:{data:BigInt64Array.from([4n])},style:{data:Float32Array.from([.5])},speed:{data:Float32Array.from([.8])}}
  expect(Array.from((await model(inputs)).waveform.data)).toEqual([4,.5,Math.fround(.8)])
  inputs.input_ids.data[0]=8n
  expect((await model(inputs)).waveform.data[0]).toBe(8)
  inputs.input_ids.data[0]=-1n
  await expect(model(inputs)).rejects.toThrow('exited')
  model.dispose()
})

test('malformed worker audio rejects the request instead of leaving generation pending',async()=>{
  const fixture=`console.log(JSON.stringify({type:'ready'}));require('node:readline').createInterface({input:process.stdin}).on('line',line=>console.log(JSON.stringify({id:JSON.parse(line).id,samples:4,audio:''})))`
  const model=await createInferenceBridge({command:process.execPath,args:['-e',fixture]})
  const tensor={data:Float32Array.from([1])}
  await expect(model({input_ids:tensor,style:tensor,speed:tensor})).rejects.toThrow('Invalid local audio')
  model.dispose()
},1000)
