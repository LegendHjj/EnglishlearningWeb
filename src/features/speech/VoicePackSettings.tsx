import { FileUp, Headphones } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, Card } from '../../components/ui'
import { getInstalledVoicePack, inspectVoicePack, installVoicePack, type InstalledVoicePack, type VoicePackPreview } from '../../services/voicePack'

const megabytes = (bytes: number) => `${(bytes / 1024 ** 2).toFixed(1)} MB`

export default function VoicePackSettings({ onUseHeart }: { onUseHeart: () => void }) {
  const input = useRef<HTMLInputElement>(null), controller = useRef<AbortController | undefined>(undefined)
  const mounted = useRef(true)
  const [installed, setInstalled] = useState<InstalledVoicePack>()
  const [preview, setPreview] = useState<VoicePackPreview>()
  const [busy, setBusy] = useState<'checking' | 'importing'>()
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState(''), [message, setMessage] = useState('')

  useEffect(() => {
    mounted.current = true
    void getInstalledVoicePack().then(value => { if (mounted.current) setInstalled(value) }).catch(() => {})
    return () => { mounted.current = false; controller.current?.abort() }
  }, [])

  const choose = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return
    setBusy('checking'); setPreview(undefined); setError(''); setMessage('')
    try { const next = await inspectVoicePack(file); if (mounted.current) setPreview(next) }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'The voice pack could not be read.') }
    finally { if (mounted.current) setBusy(undefined) }
  }

  const add = async () => {
    if (!preview || busy) return
    const abort = new AbortController(); controller.current = abort
    setBusy('importing'); setError(''); setMessage(''); setProgress({ done: 0, total: preview.manifest.clips.length })
    try {
      const next = await installVoicePack(preview, (done, total) => { if (mounted.current) setProgress({ done, total }) }, abort.signal)
      if (mounted.current) { setInstalled(next); setPreview(undefined); setMessage(`${next.count.toLocaleString()} audio clips ready on this device. Choose Heart to use them with Listen.`) }
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'The voice pack could not be imported. Your previous audio was kept.') }
    finally { if (mounted.current) setBusy(undefined); controller.current = undefined }
  }

  return <Card className="voice-pack-settings">
    <Headphones color="var(--green)" aria-hidden="true"/>
    <h3>Offline Heart audio</h3>
    <p className="muted">Import a prepared voice pack once. Matching samples play from saved audio, including after you reload, without preparing the Heart model.</p>
    {installed ? <div className="voice-pack-installed"><strong>{installed.name}</strong><span>{installed.count.toLocaleString()} clips · {megabytes(installed.bytes)} · stored on this device</span></div> : <p>No voice pack imported yet.</p>}
    <div className="detail-actions">
      <Button variant="secondary" disabled={!!busy} onClick={() => input.current?.click()}><FileUp size={16}/> Choose voice pack ZIP</Button>
      {installed && <Button variant="secondary" disabled={!!busy} onClick={onUseHeart}>Use Heart for Listen buttons</Button>}
    </div>
    <input hidden aria-label="Voice pack ZIP" ref={input} type="file" accept=".zip,application/zip" disabled={!!busy} onChange={choose}/>
    {busy === 'checking' && <p role="status">Checking the voice pack…</p>}
    {preview && busy !== 'importing' && <div className="voice-pack-preview">
      <strong>{preview.manifest.name}</strong>
      <p>{preview.manifest.clips.length.toLocaleString()} Heart clips · {megabytes(preview.bytes)}. Importing replaces only previously imported sample audio. Your recordings, progress and practice library are kept.</p>
      <div className="detail-actions"><Button onClick={add} disabled={!!busy}>Import these audio clips</Button><Button variant="ghost" disabled={!!busy} onClick={() => setPreview(undefined)}>Dismiss</Button></div>
    </div>}
    {busy === 'importing' && <div className="voice-pack-progress" role="status">
      <label htmlFor="voice-pack-progress">Importing audio · {progress.done.toLocaleString()} of {progress.total.toLocaleString()}</label>
      <progress id="voice-pack-progress" max={progress.total} value={progress.done}/>
      <Button variant="ghost" onClick={() => controller.current?.abort()}>Cancel import</Button>
    </div>}
    {message && <p className="notice" role="status">{message}</p>}
    {error && <p className="notice" role="alert">{error}</p>}
    <p className="muted">Add the matching content JSON files through Optional practice packs above. New or edited text still uses your selected voice. Audio packs are separate from recording backups; keep the ZIP to import on another device. Clearing this site’s data removes its imported audio.</p>
  </Card>
}
