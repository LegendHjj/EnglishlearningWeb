import { Download, FileUp, Play, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, Card } from '../components/ui'
import { useApp } from '../context/AppContext'
import { defaultState } from '../data/seed'
import { useSpeech } from '../hooks/useSpeech'
import { speechController } from '../services/speechController'
import { clearRecordings } from '../services/recordingDb'
import PracticePackSettings from '../features/practicePacks/PracticePackSettings'
import { exportBackup, exportState, importBackup, importState, resetState } from '../services/storage'
import type { Goal, UserPreferences, VoiceGender } from '../types'

function downloadJson(raw: string, name: string) {
  const blob = new Blob([raw], { type: 'application/json' })
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob)
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(anchor.href)
}

const VOICE_GENDER_OPTIONS: { value: VoiceGender; label: string; description: string }[] = [
  { value: 'auto',   label: 'Auto',   description: "Browser's default English voice" },
  { value: 'female', label: 'Female', description: 'Prefer a female English voice' },
  { value: 'male',   label: 'Male',   description: 'Prefer a male English voice' },
]

export default function SettingsPage() {
  const { state, setState } = useApp()
  const [form, setForm] = useState(state.preferences)
  const [message, setMessage] = useState('')
  const [voices, setVoices] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [heartPreviewed, setHeartPreviewed] = useState(false)
  const progressFile = useRef<HTMLInputElement>(null)
  const completeFile = useRef<HTMLInputElement>(null)
  const voicePreferenceUpdate = useRef<UserPreferences | null>(null)

  // Voice selection is saved immediately; practice fields retain Save changes.
  const { speak, speaking } = useSpeech(form.voice, form.voiceGender, form.speechEngine ?? 'browser')
  useEffect(() => {
    // Imports/reset replace the draft; immediate voice saves retain practice edits.
    if (state.preferences !== voicePreferenceUpdate.current) setForm(state.preferences)
    voicePreferenceUpdate.current = null
  }, [state.preferences])

  const chooseVoice = (choice: Partial<Pick<UserPreferences, 'voice' | 'voiceGender' | 'speechEngine'>>) => {
    speechController.stop()
    speechController.clearBrowserFallback()
    const preferences = { ...state.preferences, ...choice }
    voicePreferenceUpdate.current = preferences
    setForm(current => ({ ...current, ...choice }))
    setState(current => ({ ...current, preferences }))
  }

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const refresh = () =>
      setVoices(
        window.speechSynthesis.getVoices()
          .filter(v => v.lang.toLowerCase().startsWith('en'))
          .map(v => v.name)
      )
    refresh()
    window.speechSynthesis.addEventListener('voiceschanged', refresh)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh)
  }, [])

  const exportComplete = async () => {
    setMessage('Preparing your complete backup...')
    try {
      downloadJson(
        await exportBackup(state),
        `fluency-reset-complete-${new Date().toISOString().slice(0, 10)}.json`
      )
      setMessage('Complete backup created with progress, library, and recording audio.')
    } catch { setMessage('The complete backup could not be created.') }
  }

  const uploadProgress = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      setState(importState(await file.text()))
      setMessage('Your progress and library were imported successfully. Existing recording audio was left unchanged.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The export could not be read.') }
    finally { event.target.value = '' }
  }

  const uploadComplete = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      setState(await importBackup(await file.text()))
      setMessage('Your complete backup, including recordings, was imported successfully.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The backup could not be read.') }
    finally { event.target.value = '' }
  }

  const currentGender: VoiceGender = form.voiceGender ?? 'auto'

  return <>
    <div className="topline">
      <div>
        <span className="eyebrow">Make practice fit your life</span>
        <h1 className="page-title">Settings</h1>
      </div>
      <Button onClick={() => { setState(current => ({ ...current, preferences: form })); setMessage('Settings saved.') }}>
        <Save size={17} /> Save changes
      </Button>
    </div>

    {message && <div className="notice" role="status">{message}</div>}

    <div className="settings-grid">
      <Card>
        <h2>Your practice</h2>
        <div className="settings-form">
          <label className="field">
            <span>Your name</span>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </label>

          <label className="field">
            <span>Goal track</span>
            <select value={form.goals[0]} onChange={e => setForm({ ...form, goals: [e.target.value as Goal] })}>
              {['Workplace English','Customer conversations','Job interview','Daily conversation','Travel','Presentations','Social confidence'].map(v => <option key={v}>{v}</option>)}
            </select>
          </label>

          <label className="field">
            <span>Preferred practice time</span>
            <select value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) as 2 | 5 | 10 })}>
              <option value="2">Quick Win · 2 minutes</option>
              <option value="5">Normal · 5 minutes</option>
              <option value="10">Full Workout · 10 minutes</option>
            </select>
          </label>

          {/* ── Voice gender picker ── */}
          <div className="field">
            <span>Text-to-speech voice</span>
            <div className="voice-gender-grid">
              {VOICE_GENDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`voice-gender-btn${form.speechEngine !== 'heart' && currentGender === opt.value ? ' selected' : ''}`}
                  aria-pressed={form.speechEngine !== 'heart' && currentGender === opt.value}
                  onClick={() => chooseVoice({ speechEngine: 'browser', voiceGender: opt.value })}
                >
                  <strong>{opt.label}</strong>
                  <span>{opt.description}</span>
                </button>
              ))}
              <button type="button" className={`voice-gender-btn voice-heart-btn${form.speechEngine === 'heart' ? ' selected' : ''}`} aria-pressed={form.speechEngine === 'heart'} onClick={() => chooseVoice({ speechEngine: 'heart' })}>
                <strong>Natural Female · Heart</strong><span>American English · free · runs on this device</span>
              </button>
            </div>
            <p className="muted">Voice choices save automatically and apply to all Listen buttons in this app.</p>
            {form.speechEngine === 'heart' && <div className="heart-preview">
              <p>Download the voice once to try it. The main model is about 92 MB, plus supporting files. Your text is processed on this device. Downloading and preparing the voice can take a while.</p>
              <p className="muted">Preview: “My weekend was pretty relaxed. I had lunch with my family, and the best part was having time to talk without rushing.”</p>
              <Button variant="secondary" disabled={speaking} onClick={() => { setHeartPreviewed(true); speak('My weekend was pretty relaxed. I had lunch with my family, and the best part was having time to talk without rushing.') }}>{heartPreviewed ? 'Preview Heart' : 'Download & preview Heart'}</Button>
            </div>}
            {form.speechEngine !== 'heart' && <>
            <Button
              variant="secondary"
              style={{ marginTop: '.6rem', alignSelf: 'flex-start' }}
              disabled={speaking}
              onClick={() => speak('Hello! This is how your chosen voice sounds when playing back phrases.')}
            >
              <Play size={14} /> {speaking ? 'Playing…' : 'Preview voice'}
            </Button>
            </>}
          </div>

          {/* ── Advanced: pick a specific voice name ── */}
          <details
            className="field voice-advanced"
            onToggle={e => setShowAdvanced((e.target as HTMLDetailsElement).open)}
          >
            <summary>Advanced: choose a specific browser voice {showAdvanced ? '▲' : '▼'}</summary>
            <select
              style={{ marginTop: '.5rem' }}
              disabled={form.speechEngine === 'heart'}
              value={form.voice || 'Browser default'}
              onChange={e => chooseVoice({ voice: e.target.value })}
            >
              <option>Browser default</option>
              {voices.map(v => <option key={v}>{v}</option>)}
            </select>
            <p className="muted" style={{ marginTop: '.35rem', fontSize: '.78rem', marginBottom: 0 }}>
              This applies to browser voices only. A specific browser voice overrides the gender choice above.
            </p>
          </details>
        </div>
      </Card>

      <div className="list">
        <PracticePackSettings/>
        <Card>
          <ShieldCheck color="var(--green)" />
          <h3>Export progress and library</h3>
          <p className="muted">Includes preferences, progress, phrases, Speaking Packs, vocabulary, and memos. Recording audio is not included.</p>
          <div className="detail-actions">
            <Button variant="secondary" onClick={() => { downloadJson(exportState(state), `fluency-reset-library-${new Date().toISOString().slice(0, 10)}.json`); setMessage('Progress and library export created without audio.') }}>
              <Download size={16} /> Export progress and library
            </Button>
            <Button variant="secondary" onClick={() => progressFile.current?.click()}>
              <FileUp size={16} /> Import progress and library
            </Button>
            <input hidden ref={progressFile} type="file" accept="application/json" onChange={uploadProgress} />
          </div>
        </Card>

        <Card>
          <ShieldCheck color="var(--coral)" />
          <h3>Export complete backup</h3>
          <p className="muted">Includes everything above plus IndexedDB recording audio encoded in the JSON file. This file may be large.</p>
          <div className="detail-actions">
            <Button variant="secondary" onClick={exportComplete}><Download size={16} /> Export complete backup</Button>
            <Button variant="secondary" onClick={() => completeFile.current?.click()}><FileUp size={16} /> Import complete backup</Button>
            <input hidden ref={completeFile} type="file" accept="application/json" onChange={uploadComplete} />
          </div>
        </Card>

        <Card>
          <h3>Reset and deletion</h3>
          <p className="muted">These actions cannot be undone.</p>
          <Button variant="coral" onClick={async () => { if (confirm('Delete all recordings from this device?')) { await clearRecordings(); setMessage('All recordings deleted.') } }}>
            <Trash2 size={16} /> Delete all recordings
          </Button>
          <Button variant="ghost" onClick={() => { if (confirm('Reset all Fluency Reset progress and preferences?')) { resetState(); setState(defaultState); setMessage('Local progress reset.') } }}>
            <RotateCcw size={16} /> Reset local data
          </Button>
        </Card>
      </div>
    </div>
  </>
}
