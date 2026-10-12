import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { useRecorder } from './useRecorder'

afterEach(()=>vi.unstubAllGlobals())

test('leaving practice while permission is pending stops the arriving microphone stream',async()=>{
  let allow!:(value:MediaStream)=>void
  const permission=new Promise<MediaStream>(resolve=>{allow=resolve})
  const track={stop:vi.fn()}
  const stream={getTracks:()=>[track]} as unknown as MediaStream
  vi.stubGlobal('navigator',{mediaDevices:{getUserMedia:()=>permission}})
  vi.stubGlobal('MediaRecorder',class {mimeType='audio/webm';start(){};stop(){}})
  const {result,unmount}=renderHook(()=>useRecorder())
  let start!:Promise<void>
  act(()=>{start=result.current.start()})
  expect(result.current.status).toBe('requesting')
  unmount()
  await act(async()=>{allow(stream);await start})
  expect(track.stop).toHaveBeenCalledOnce()
})

test('leaving an active recording stops capture and releases the microphone',async()=>{
  const track={stop:vi.fn()}
  const stop=vi.fn()
  vi.stubGlobal('navigator',{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[track]})}})
  vi.stubGlobal('MediaRecorder',class {state='recording';mimeType='audio/webm';start(){};stop=stop})
  const {result,unmount}=renderHook(()=>useRecorder())
  await act(async()=>{await result.current.start()})
  expect(result.current.status).toBe('recording')
  unmount()
  expect(stop).toHaveBeenCalledOnce()
  expect(track.stop).toHaveBeenCalledOnce()
})

test('a recorder setup failure releases the granted microphone stream',async()=>{
  const track={stop:vi.fn()}
  vi.stubGlobal('navigator',{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[track]})}})
  vi.stubGlobal('MediaRecorder',class {constructor(){throw new Error('Unavailable codec')}})
  const {result,unmount}=renderHook(()=>useRecorder())
  await act(async()=>{await result.current.start()})
  expect(result.current.status).toBe('denied')
  expect(track.stop).toHaveBeenCalledOnce()
  unmount()
})
