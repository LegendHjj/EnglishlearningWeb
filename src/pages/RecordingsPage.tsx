import { Mic2, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, EmptyState } from '../components/ui'
import RecordingList, { type RecordingItem } from '../features/RecordingList'
import { deleteRecording, listRecordings } from '../services/recordingDb'

export default function RecordingsPage(){
  const [items,setItems]=useState<RecordingItem[]>([])
  const [loading,setLoading]=useState(true)
  const load=()=>listRecordings().then(x=>setItems(x.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))).finally(()=>setLoading(false))
  useEffect(()=>{void load()},[])
  const remove=async(id:string)=>{if(!confirm('Delete this recording? This cannot be undone.'))return;await deleteRecording(id);await load()}
  return <><div className="topline"><div><span className="eyebrow">Your speaking history</span><h1 className="page-title">Your recordings</h1><p className="muted">Replay answers here, or open a Big 30 question to see recordings for that question.</p></div></div>
    <Card className="privacy-callout"><Mic2/><div><strong>Private by default</strong><p>Your recordings stay in this browser unless you create a complete backup in Settings.</p></div></Card>
    {loading?<p className="muted">Loading recordings…</p>:items.length===0?<EmptyState icon={<Mic2/>} heading="Your first recording will appear here" body="Complete a daily mission or practise in the Practice Room to save one."/>:<RecordingList items={items} onDelete={remove}/>}<Button variant="ghost" onClick={load}><RefreshCw size={16}/> Refresh</Button>
  </>
}
