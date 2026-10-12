import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import Recorder from '../Recorder'
import { clearRecordings, listRecordings } from '../../services/recordingDb'

vi.mock('../../hooks/useRecorder',()=>({useRecorder:()=>({blob:new Blob(['chunk audio'],{type:'audio/webm'}),pause:()=>{},reset:()=>{},seconds:8,start:()=>{},status:'ready',stop:()=>{},url:'blob:chunk-test'})}))
beforeEach(clearRecordings)
afterEach(cleanup)

test('a chunk recording keeps its phrase link in real local audio storage',async()=>{
  const busy=vi.fn()
  render(<Recorder phraseId="personal-chunk" recordingName="My chunk answer" onBusyChange={busy}/>)
  expect(busy).toHaveBeenLastCalledWith(true)
  fireEvent.click(screen.getByRole('button',{name:'Save recording'}))
  await waitFor(async()=>expect(await listRecordings()).toHaveLength(1))
  const [saved]=await listRecordings()
  expect(saved).toMatchObject({phraseId:'personal-chunk',name:'My chunk answer',duration:8,size:11})
  expect(saved.blob.size).toBe(11)
  await waitFor(()=>expect(busy).toHaveBeenLastCalledWith(false))
})

test('retrying a saved take permits saving the next recording',async()=>{
  render(<Recorder phraseId="personal-chunk"/>)
  fireEvent.click(screen.getByRole('button',{name:'Save recording'}))
  await waitFor(async()=>expect(await listRecordings()).toHaveLength(1))
  fireEvent.click(screen.getByRole('button',{name:'Try again'}))
  expect(screen.getByRole('button',{name:'Save recording'})).toBeEnabled()
  fireEvent.click(screen.getByRole('button',{name:'Save recording'}))
  await waitFor(async()=>expect(await listRecordings()).toHaveLength(2))
})
