import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { useApp } from './context/AppContext'
import LandingPage from './pages/LandingPage'
import OnboardingPage from './pages/OnboardingPage'

const MissionPage=lazy(()=>import('./pages/MissionPage'))
const DashboardPage=lazy(()=>import('./pages/DashboardPage'))
const NotebookPage=lazy(()=>import('./pages/NotebookPage'))
const PracticePage=lazy(()=>import('./pages/PracticePage'))
const Big30Page=lazy(()=>import('./pages/Big30Page'))
const RecordingsPage=lazy(()=>import('./pages/RecordingsPage'))
const ProgressPage=lazy(()=>import('./pages/ProgressPage'))
const SettingsPage=lazy(()=>import('./pages/SettingsPage'))
const ProgrammePage=lazy(()=>import('./pages/ProgrammePage'))
const load=(page:React.ReactNode)=><Suspense fallback={<p className="muted">Opening your practice…</p>}>{page}</Suspense>
const OnboardingRoute=()=>{const {state}=useApp();return state.preferences.onboarded?<Navigate to="/app" replace/>:<OnboardingPage/>}
const AppRoute=()=>{const {state}=useApp();return state.preferences.onboarded?<AppShell/>:<Navigate to="/onboarding" replace/>}

export default function App(){return <Routes><Route path="/" element={<LandingPage/>}/><Route path="/onboarding" element={<OnboardingRoute/>}/><Route path="/app" element={<AppRoute/>}><Route index element={load(<DashboardPage/>)}/><Route path="programme" element={load(<ProgrammePage/>)}/><Route path="mission" element={load(<MissionPage/>)}/><Route path="notebook" element={load(<NotebookPage/>)}/><Route path="practice" element={load(<PracticePage/>)}/><Route path="big-30" element={load(<Big30Page/>)}/><Route path="recordings" element={load(<RecordingsPage/>)}/><Route path="progress" element={load(<ProgressPage/>)}/><Route path="settings" element={load(<SettingsPage/>)}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
