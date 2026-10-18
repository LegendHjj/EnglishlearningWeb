import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Search } from 'lucide-react'
import { Button, Card, EmptyState } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { practiceItemKey } from '../../services/practicePacks'
import PackExample from './PackExample'

export default function PackPractice(){
  const {state}=useApp(),[params]=useSearchParams()
  const [query,setQuery]=useState(''),[topic,setTopic]=useState('All topics'),[kind,setKind]=useState('All types'),[status,setStatus]=useState('All practice'),[packId,setPackId]=useState(params.get('pack')||'All packs')
  const [selected,setSelected]=useState(params.get('item')||''),[busy,setBusy]=useState(false),[limit,setLimit]=useState(24)
  const [resourceIndex,setResourceIndex]=useState(0)
  const all=state.practicePacks.flatMap(pack=>pack.items.filter(item=>item.kind!=='chunk').map(item=>({pack,item,key:practiceItemKey(pack,item)})))
  const chosen=all.find(i=>i.key===selected)
  const scoped=all.filter(i=>packId==='All packs'||i.pack.id===packId)
  const topics=[...new Set(scoped.map(i=>i.item.topic))].sort()
  const filtered=scoped.filter(({item,key})=>(topic==='All topics'||item.topic===topic)&&(kind==='All types'||item.kind===kind)&&(status==='All practice'||(status==='Practised')===Boolean(state.packPractice[key]?.attempts))&&[item.title,item.topic,item.cue,item.model,...item.expressions].join(' ').toLowerCase().includes(query.toLowerCase()))
  const resources=state.practicePacks.filter(p=>packId==='All packs'||p.id===packId).flatMap(p=>p.resources||[])
  const currentResource=resources[resourceIndex]||resources[0]
  const back=()=>{setSelected('');setBusy(false)}
  return <>
    <div className="topline"><div><span className="eyebrow">Your optional learning library</span><h1 className="page-title">Extra practice</h1><p className="muted">Read an example, make it yours, then try without the script.</p></div><Link className={`btn btn-secondary${busy?' pack-link-disabled':''}`} aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault()}} to="/app/practice">Guided Practice Room</Link></div>
    {!state.practicePacks.length?<EmptyState icon={<Search/>} heading="Choose a practice pack" body="Add any of the three optional packs in Settings. Your current practice remains available." action={<Link className="btn btn-primary" to="/app/settings">Choose optional packs</Link>}/>:chosen?<>
      <Button variant="ghost" disabled={busy} onClick={back}><ArrowLeft size={16}/> All extra practice</Button>
      <Card><span className="eyebrow">{chosen.item.topic} · {chosen.item.kind}</span><h2>{chosen.item.title}</h2><p className="muted">{chosen.pack.name}</p><PackExample key={chosen.key} pack={chosen.pack} item={chosen.item} record onBusyChange={setBusy}/></Card>
    </>:<>
      <div className="pack-library-tools">
        <label className="search"><Search size={18}/><input aria-label="Search extra practice" placeholder="Search situations or expressions" value={query} onChange={e=>{setQuery(e.target.value);setLimit(24)}}/></label>
        <label className="field"><span>Practice pack</span><select value={packId} onChange={e=>{setPackId(e.target.value);setTopic('All topics');setResourceIndex(0);setLimit(24)}}><option>All packs</option>{state.practicePacks.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <label className="field"><span>Topic</span><select value={topic} onChange={e=>{setTopic(e.target.value);setLimit(24)}}><option>All topics</option>{topics.map(t=><option key={t}>{t}</option>)}</select></label>
        <label className="field"><span>Example type</span><select value={kind} onChange={e=>{setKind(e.target.value);setLimit(24)}}>{['All types','conversation','answer','pattern','prompt'].map(k=><option key={k}>{k}</option>)}</select></label>
        <label className="field"><span>Practice progress</span><select value={status} onChange={e=>{setStatus(e.target.value);setLimit(24)}}>{['All practice','Not practised','Practised'].map(s=><option key={s}>{s}</option>)}</select></label>
      </div>
      <p className="muted">{filtered.length} examples match · {all.filter(i=>state.packPractice[i.key]?.attempts).length} practised. <Link to="/app/notebook?tab=chunks">Open Chunk Practice</Link> for your imported chunks.</p>
      <div className="pack-practice-list">{filtered.slice(0,limit).map(({pack,item,key})=><button key={key} onClick={()=>setSelected(key)}><span><small>{item.topic} · {item.kind}</small><strong>{item.title}</strong><small>{state.packPractice[key]?.attempts?`${state.packPractice[key].attempts} practices · Last stage: ${state.packPractice[key].stage}`:'Not practised yet'} · {pack.name}</small></span><ChevronRight size={20}/></button>)}</div>
      {!filtered.length&&<p>No examples match. Try another topic or search.</p>}
      {filtered.length>limit&&<Button variant="secondary" onClick={()=>setLimit(n=>n+24)}>Show more examples</Button>}
      {currentResource&&<Card className="pack-reference"><details><summary>Pack reference, practice plans and reusable prompts ({resources.length})</summary><label className="field"><span>Choose a reference</span><select value={resourceIndex} onChange={e=>setResourceIndex(Number(e.target.value))}>{resources.map((r,i)=><option key={i} value={i}>{r.title}</option>)}</select></label><p className="pack-text">{currentResource.body}</p></details></Card>}
      <p><Link to="/app/settings">Download or add another practice pack</Link></p>
    </>}
  </>
}
