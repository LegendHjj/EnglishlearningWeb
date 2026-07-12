import { Download, FileUp, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Card } from '../components/ui'
import { useApp } from '../context/AppContext'
import { defaultState } from '../data/seed'
import { clearRecordings } from '../services/recordingDb'
import { exportBackup, importBackup, resetState } from '../services/storage'
import type { Goal } from '../types'

export default function SettingsPage(){
  const {state,setState}=useApp()
  const [form,setForm]=useState(state.preferences)
  const [message,setMessage]=useState('')
  const file=useRef<HTMLInputElement>(null)
  const download=async()=>{setMessage('Preparing your complete backup…');try{const blob=new Blob([await exportBackup(state)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`fluency-reset-complete-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);setMessage('Complete backup created with progress and recordings.')}catch{setMessage('The complete backup could not be created.')}}
  const upload=async(e:React.ChangeEvent<HTMLInputElement>)=>{try{const f=e.target.files?.[0];if(!f)return;setState(await importBackup(await f.text()));setMessage('Your progress and recordings were imported successfully.')}catch(err){setMessage(err instanceof Error?err.message:'The backup could not be read.')}finally{e.target.value=''}}
  return <><div className="topline"><div><span className="eyebrow">Make practice fit your life</span><h1 className="page-title">Settings</h1></div><Button onClick={()=>{setState(s=>({...s,preferences:form}));setMessage('Settings saved.')}}><Save size={17}/> Save changes</Button></div>{message&&<div className="notice" role="status">{message}</div>}
    <div className="settings-grid"><Card><h2>Your practice</h2><div className="settings-form"><label className="field"><span>Your name</span><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="field"><span>Goal track</span><select value={form.goals[0]} onChange={e=>setForm({...form,goals:[e.target.value as Goal]})}>{['Workplace English','Customer conversations','Job interview','Daily conversation','Travel','Presentations','Social confidence'].map(x=><option key={x}>{x}</option>)}</select></label><label className="field"><span>Preferred practice time</span><select value={form.duration} onChange={e=>setForm({...form,duration:Number(e.target.value) as 2|5|10})}><option value="2">Quick Win · 2 minutes</option><option value="5">Normal · 5 minutes</option><option value="10">Full Workout · 10 minutes</option></select></label><label className="field"><span>Text-to-speech voice</span><select value={form.voice||'Browser default'} onChange={e=>setForm({...form,voice:e.target.value})}><option>Browser default</option></select></label></div></Card>
      <div className="list"><Card><ShieldCheck color="var(--green)"/><h3>Complete local backup</h3><p className="muted">Normal use keeps progress in LocalStorage and audio in IndexedDB. A complete backup bundles both into one JSON file. Audio can make the file large.</p><div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}><Button variant="secondary" onClick={download}><Download size={16}/> Export complete backup</Button><Button variant="secondary" onClick={()=>file.current?.click()}><FileUp size={16}/> Import backup</Button><input hidden ref={file} type="file" accept="application/json" onChange={upload}/></div></Card><Card><h3>Reset and deletion</h3><p className="muted">These actions cannot be undone.</p><Button variant="coral" onClick={async()=>{if(confirm('Delete all recordings from this device?')){await clearRecordings();setMessage('All recordings deleted.')}}}><Trash2 size={16}/> Delete all recordings</Button><Button variant="ghost" onClick={()=>{if(confirm('Reset all Fluency Reset progress and preferences?')){resetState();setState(defaultState);setMessage('Local progress reset.')}}}><RotateCcw size={16}/> Reset local data</Button></Card></div>
    </div>
  </>
}
