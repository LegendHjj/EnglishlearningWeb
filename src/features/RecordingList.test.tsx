import { cleanup, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import RecordingList, { type RecordingItem } from './RecordingList'

afterEach(()=>{cleanup();vi.unstubAllGlobals()})
test('reopening a recording in StrictMode keeps its audio URL alive and releases every URL on exit',()=>{
  const active=new Set<string>()
  let serial=0
  class BrowserURL extends URL {
    static createObjectURL(){const url=`blob:take-${++serial}`;active.add(url);return url}
    static revokeObjectURL(url:string){active.delete(url)}
  }
  vi.stubGlobal('URL',BrowserURL)
  const item:RecordingItem={id:'q5-answer',name:'My weekend',questionId:'q5',createdAt:'2026-10-12T00:00:00Z',duration:5,mimeType:'audio/webm',size:5,blob:new Blob(['audio'])}
  const view=render(<StrictMode><RecordingList items={[item]}/></StrictMode>)
  expect(active.has(screen.getByTestId('recording-audio').getAttribute('src')!)).toBe(true)
  expect(active.size).toBe(1)
  view.rerender(<StrictMode><RecordingList items={[{...item,blob:new Blob(['new audio'])}]}/></StrictMode>)
  expect(active.has(screen.getByTestId('recording-audio').getAttribute('src')!)).toBe(true)
  expect(active.size).toBe(1)
  view.unmount()
  expect(active.size).toBe(0)
})
