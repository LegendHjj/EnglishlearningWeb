import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileUp } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { practicePackCatalogue, practicePackUrl } from '../../data/practicePacks'
import { mergePracticePack, parsePracticePack } from '../../services/practicePacks'
import { saveState } from '../../services/storage'
import type { PracticePack } from '../../types/practicePacks'

export default function PracticePackSettings(){
  const {state,setState}=useApp()
  const [preview,setPreview]=useState<PracticePack|null>(null)
  const [loading,setLoading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
  const input=useRef<HTMLInputElement>(null),review=useRef<HTMLDivElement>(null)
  const show=(raw:string)=>{setPreview(parsePracticePack(raw));setError('');setMessage('');requestAnimationFrame(()=>{review.current?.scrollIntoView?.({block:'nearest',behavior:'smooth'});review.current?.focus()})}
  const fetchPack=async(id:string)=>{
    setLoading(true);setError('');setPreview(null)
    try{const res=await fetch(practicePackUrl(id));if(!res.ok)throw new Error('The practice pack could not be downloaded. Please try again.');show(await res.text())}
    catch(e){setError(e instanceof Error?e.message:'The practice pack could not be read.')}
    finally{setLoading(false)}
  }
  const merged=preview?mergePracticePack(state,preview):state
  const oldCount=state.practicePacks.reduce((n,p)=>n+p.items.length,0)
  const newCount=merged.practicePacks.reduce((n,p)=>n+p.items.length,0)-oldCount
  const add=()=>{
    try{
      // Persist first: a quota failure must leave the current library and preview intact.
      saveState(merged);setState(merged)
      setMessage(newCount?`${newCount} examples added. Your existing work was kept.`:'These examples are already in your practice library. Your work was kept.')
      setPreview(null)
    }catch{setError('There is not enough device storage to add this pack. Export a backup and free some space, then try again.')}
  }
  return <Card className="optional-packs">
    <span className="eyebrow">Choose what you want to practise</span><h2>Optional practice packs</h2>
    <p className="muted">Add examples from the three workbooks whenever they are useful. Preview a pack or import its JSON file. Your saved answers and progress stay in place.</p>
    <div className="pack-catalogue">{practicePackCatalogue.map(p=>{
      const added=state.practicePacks.some(x=>x.id===p.id)
      return <section key={p.id} className="pack-catalogue-item"><h3>{p.name}</h3><p className="muted">{p.description}</p>{added&&<span className="pill">Added to this device</span>}
        <div className="detail-actions"><Button variant="secondary" disabled={loading} aria-label={`Preview ${p.name}`} onClick={()=>void fetchPack(p.id)}>Preview pack</Button><a className="btn btn-ghost" href={practicePackUrl(p.id)} download={`${p.id}.json`}><Download size={16}/> Download JSON</a></div>
        {added&&<Link to={p.destination}>{p.action}</Link>}
      </section>
    })}</div>
    <div className="detail-actions"><Button variant="secondary" disabled={loading} onClick={()=>input.current?.click()}><FileUp size={16}/> Import practice pack</Button><Link to="/app/practice?library=packs">Browse my extra practice</Link></div>
    <input ref={input} hidden type="file" accept=".json,application/json" aria-label="Import a practice pack JSON file" disabled={loading} onChange={async e=>{
      const file=e.target.files?.[0];e.target.value='';if(!file)return
      setError('');setPreview(null);setLoading(true)
      try{if(file.size>5_000_000)throw new Error('Choose a practice pack smaller than 5 MB.');show(await file.text())}
      catch(err){setError(err instanceof Error?err.message:'This practice pack could not be read.')}
      finally{setLoading(false)}
    }}/>
    {loading&&<p role="status">Reading practice pack…</p>}
    {preview&&<div className="pack-import-preview" ref={review} tabIndex={-1}>
      <h3>Review {preview.name}</h3><p>{preview.description}</p><p><strong>{newCount} new examples</strong> · {preview.items.length-newCount} already added</p>
      <p>{merged.phrases.length-state.phrases.length} new chunks will also appear in Chunk Practice. Matching saved phrases are kept.</p>
      <ul>{Object.entries(preview.items.reduce<Record<string,number>>((counts,i)=>({...counts,[i.kind]:(counts[i.kind]||0)+1}),{})).map(([kind,count])=><li key={kind}>{count} {kind} examples</li>)}</ul>
      <p className="muted">Importing adds material. Practice is counted only after you practise and save a check-in.</p>
      <div className="detail-actions"><Button onClick={add}>Add to my practice</Button><Button variant="ghost" onClick={()=>setPreview(null)}>Cancel import</Button></div>
    </div>}
    {error&&<p className="error-text" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
  </Card>
}
