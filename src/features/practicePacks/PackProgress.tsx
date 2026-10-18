import { Link } from 'react-router-dom'
import { Card } from '../../components/ui'
import { useApp } from '../../context/AppContext'

export default function PackProgress(){
  const {state}=useApp()
  if(!state.practicePacks.length)return null
  const examples=state.practicePacks.flatMap(p=>p.items.filter(i=>i.kind!=='chunk').map(i=>`${p.id}/${i.id}`))
  const practiced=examples.filter(key=>state.packPractice[key]?.attempts)
  const attempts=practiced.reduce((n,key)=>n+state.packPractice[key].attempts,0)
  const chunks=state.phrases.filter(p=>p.id.startsWith('pack-'))
  return <Card className="pack-progress-summary"><span className="eyebrow">Optional practice packs</span><h2>Your extra practice</h2><p>{practiced.length} of {examples.length} examples practised · {attempts} saved check-ins</p><p>{chunks.filter(p=>p.practised>0).length} of {chunks.length} imported chunks practised</p><p className="muted">These are your saved practice check-ins and chunk reviews. They are separate from programme days.</p><Link to="/app/practice?library=packs">Continue extra practice</Link></Card>
}
