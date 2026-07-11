import { BarChart3, BookOpen, CircleUserRound, Headphones, Home, Library, Mic2, RotateCcw, Settings, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const items:[string,string,LucideIcon][]=[['/app','Today',Home],['/app/notebook','Notebook',BookOpen],['/app/practice','Practice',Headphones],['/app/big-30','Big 30',CircleUserRound],['/app/recordings','Recordings',Mic2],['/app/progress','Progress',BarChart3],['/app/settings','Settings',Settings]]
export function Brand(){return <div className="logo"><span className="logo-mark"><RotateCcw size={18}/></span><span>Fluency Reset</span></div>}
function Navigation({mobile=false}:{mobile?:boolean}){const shown=mobile?items.slice(0,5):items;return <nav aria-label={mobile?'Mobile navigation':'Primary navigation'}>{shown.map(([to,label,Icon])=><NavLink end={to==='/app'} key={to} to={to} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>}
export default function AppShell(){return <div className="app-shell"><aside className="sidebar"><Brand/><Navigation/><div className="privacy-mini"><Library size={16}/><strong> Local-first by design</strong><br/>Your recordings stay on this device.</div></aside><main className="main"><Outlet/></main><div className="mobile-nav"><Navigation mobile/></div></div>}
