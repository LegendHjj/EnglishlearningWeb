import { BookOpen, Plus, Sprout } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { starterChunks } from '../../data/chunks'
import { addStarterChunks, isChunkDue } from '../../utils/chunks'
import type { Phrase } from '../../types'

export default function ChunkOverview({onPractise}:{onPractise:(phrase:Phrase)=>void}){
  const {state,setState}=useApp()
  const [message,setMessage]=useState('')
  const due=state.phrases.filter(p=>p.chunkReview&&isChunkDue(p))
  const next=due[0]||state.phrases.find(p=>!p.chunkReview)
  return <div className="chunk-overview">
    <Card className="chunk-intro">
      <div className="chunk-intro-icon"><Sprout size={26}/></div>
      <div><span className="eyebrow">Small pieces. Real conversations.</span><h2>Make a chunk your own.</h2><p className="muted">A chunk is a useful group of words you can reach for together. “Works for me” is a whole response; “I’m trying to…” is an opening you can adapt.</p><p className="chunk-journey">Listen & repeat <span>→</span> Make it yours <span>→</span> Recall <span>→</span> Speak</p><p className="muted">Choose one expression below. A few focused minutes are enough to begin.</p></div>
    </Card>
    <div className="chunk-overview-grid">
      <Card><span className="eyebrow">Return when it helps</span><h3>{due.length?`${due.length} ready to revisit`:'Start small, come back gently'}</h3><p className="muted">Review dates follow your own recall check. You can practise any chunk whenever you like.</p>{next&&<Button variant="secondary" onClick={()=>onPractise(next)}>Practise one chunk</Button>}</Card>
      <Card><span className="eyebrow">From your learning materials</span><h3>A starter collection</h3><p className="muted">12 everyday responses, frames, and social expressions. Matching phrases stay as you saved them.</p><Button variant="secondary" onClick={()=>{
        const added=addStarterChunks(state.phrases,starterChunks).length-state.phrases.length
        setState(s=>({...s,phrases:addStarterChunks(s.phrases,starterChunks)}))
        setMessage(added?`${added} starter chunks added. Your existing phrases were kept.`:'These starter chunks are already in your library.')
      }}><Plus size={16}/> Add starter collection</Button></Card>
    </div>
    {message&&<p className="notice" role="status">{message}</p>}
    <details className="chunk-guide"><summary><BookOpen size={17}/> How to collect and practise chunks</summary><p>Save a short expression you actually want to use. Keep the full example and the situation, then write your own version. One or two new chunks at a time is a useful starting point.</p><p>For a frame, keep the opening and change the ending. For a fixed response, keep the expression and change the situation. For a collocation, keep the word pair and change the surrounding sentence.</p><p>Try a short spoken diary: what happened, how you felt, and what you plan to do next. Use one familiar chunk if it fits, and keep your message simple.</p><p className="muted">Browser voices vary. Practice and self-checks do not score grammar or pronunciation. Translation can help you understand a chunk; aim to recall it from its situation when speaking.</p></details>
  </div>
}
