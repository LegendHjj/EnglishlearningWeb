import { useEffect, useSyncExternalStore } from 'react'
import { speechController } from '../../services/speechController'

export default function VoiceStatus({ scope, hostId }: { scope: 'page' | 'modal'; hostId: string }) {
  const snapshot = useSyncExternalStore(speechController.subscribe, speechController.getSnapshot)
  useEffect(() => speechController.registerHost({ id: hostId, scope }), [hostId, scope])
  if (snapshot.hostId !== hostId || (snapshot.phase === 'idle' && !snapshot.browserFallback)) return null
  const active = snapshot.phase === 'preparing' || snapshot.phase === 'playing'
  const progress = snapshot.progress
  const percent = progress?.total && progress.total > 0 ? Math.floor(100 * progress.loaded / progress.total) : undefined
  return <div className={`voice-status voice-status-${scope}`} role="status" aria-live="polite">
    {snapshot.phase === 'preparing' && <span>{snapshot.preparation === 'generating' ? 'Creating speech on this device… Completed sentences replay without generating again.' : 'Loading Heart on this device…'}{progress && <> Loading {progress.file}{percent !== undefined ? ` · ${percent}%` : ''}</>}</span>}
    {snapshot.phase === 'playing' && <span>Playing {snapshot.engine === 'heart' ? 'Heart' : 'browser voice'}.</span>}
    {snapshot.phase === 'error' && <span>{snapshot.error || 'Voice playback could not start.'}</span>}
    {snapshot.browserFallback && <span>Using browser voice for now. Your saved Heart choice is unchanged.</span>}
    <div className="voice-status-actions">
      {active && <button type="button" onClick={() => speechController.stop()}>Stop</button>}
      {snapshot.phase === 'error' && <><button type="button" onClick={() => speechController.retry()}>Retry</button><button type="button" onClick={() => speechController.useBrowserForNow()}>Use browser voice for now</button></>}
    </div>
  </div>
}
