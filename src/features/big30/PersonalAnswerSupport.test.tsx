import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { AppProvider } from '../../context/AppContext'
import { defaultState } from '../../data/seed'
import { emptyBig30Answer } from '../../utils/big30Prompt'
import PersonalAnswerSupport from './PersonalAnswerSupport'

afterEach(()=>{cleanup();vi.unstubAllGlobals();localStorage.clear()})
test('microphone capture stops the model voice and blocks listening until capture is finished',()=>{
  const speak=vi.fn(),cancel=vi.fn()
  vi.stubGlobal('speechSynthesis',{speak,cancel,getVoices:()=>[]})
  vi.stubGlobal('SpeechSynthesisUtterance',class {text:string;constructor(text:string){this.text=text}})
  localStorage.setItem('fluency-reset-state-v1',JSON.stringify({...defaultState,big30Answers:{q5:{...emptyBig30Answer(),answer:'I had a quiet weekend.'}}}))
  const view=(busy:boolean)=><AppProvider><PersonalAnswerSupport questionId="q5" stage="Follow" busy={busy} onEdit={()=>{}}/></AppProvider>
  const rendered=render(view(false))
  fireEvent.click(screen.getByRole('button',{name:'Hear my answer'}))
  expect(speak).toHaveBeenCalledOnce()
  cancel.mockClear()
  rendered.rerender(view(true))
  expect(cancel).toHaveBeenCalled()
  expect(screen.getByRole('button',{name:'Hear my answer'})).toBeDisabled()
  rendered.rerender(view(false))
  expect(screen.getByRole('button',{name:'Hear my answer'})).toBeEnabled()
  cancel.mockClear()
  rendered.unmount()
  expect(cancel).toHaveBeenCalled()
})
