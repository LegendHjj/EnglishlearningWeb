import { readVoiceZip, type ZipEntry } from './voicePackZip'
import { decodeVoiceWav, inspectVoiceWav, validateVoiceManifest, voiceClipKey, voiceHash, type VoicePackManifest } from './voicePackFormat'
import { deleteVoiceInstallation, getInstalledVoicePack, recoverVoiceImports, saveVoiceBatch, voiceDbTransaction, type InstalledVoicePack, type StoredVoiceClip } from './voicePackDb'
export { voiceClipKey, getInstalledVoicePack }
export type { InstalledVoicePack }
export interface VoicePackPreview { manifest: VoicePackManifest; entries: Map<string, ZipEntry>; bytes: number }
export async function inspectVoicePack(file: Blob): Promise<VoicePackPreview> {
  const entries = await readVoiceZip(file), manifestFile = entries.get('manifest.json')
  if (!manifestFile || manifestFile.size > 32 * 1024 ** 2) throw new Error('This ZIP does not contain a valid voice pack manifest.')
  let manifest: VoicePackManifest
  try { manifest = await validateVoiceManifest(new TextDecoder('utf-8', { fatal: true }).decode(await manifestFile.read()), entries) }
  catch (error) { if (error instanceof SyntaxError) throw new Error('This voice pack manifest could not be read.'); throw error }
  return { manifest, entries, bytes: manifest.clips.reduce((sum, clip) => sum + clip.bytes, 0) }
}
let importing = false
export async function installVoicePack(preview: VoicePackPreview, progress?: (done: number, total: number) => void, signal?: AbortSignal): Promise<InstalledVoicePack> {
  if (importing) throw new Error('Another voice pack is being imported. Wait for it to finish.')
  if (!navigator.locks) throw new Error('Voice pack import needs Web Locks support. Open this website in a current Chrome, Edge, Firefox or Safari browser.')
  importing = true
  try {
    return await navigator.locks.request('fluency-reset-voice-pack-import', { ifAvailable: true }, async lock => {
      if (!lock) throw new Error('A voice pack is being imported in another tab. Wait for it to finish.')
      await recoverVoiceImports()
      return stageVoicePack(preview, progress, signal)
    })
  } finally { importing = false }
}

async function stageVoicePack(preview: VoicePackPreview, progress?: (done: number, total: number) => void, signal?: AbortSignal): Promise<InstalledVoicePack> {
  const installation = crypto.randomUUID(), cancelled = () => { if (signal?.aborted) throw new Error('Voice pack import cancelled. Your previous audio was kept.') }
  try {
    cancelled()
    const previous = await getInstalledVoicePack()
    const estimate = await navigator.storage?.estimate?.().catch(() => undefined)
    if (estimate?.quota !== undefined && estimate.usage !== undefined && preview.bytes > estimate.quota - estimate.usage) throw new Error('Not enough device storage for this voice pack. Free some space and try again.')
    await voiceDbTransaction('metadata', 'readwrite', store => store.put({ staging: true, installation }, `staging/${installation}`))
    let batch: StoredVoiceClip[] = [], batchBytes = 0
    for (let index = 0; index < preview.manifest.clips.length; index++) {
      cancelled()
      const clip = preview.manifest.clips[index], audio = await preview.entries.get(clip.file)!.read()
      if (await voiceHash(audio) !== clip.sha256) throw new Error('A voice clip failed its checksum. Choose the original voice pack ZIP.')
      if (inspectVoiceWav(audio).samples !== clip.samples) throw new Error('A voice clip has an incorrect sample count.')
      batch.push({ id: `${installation}/${clip.key}`, installation, audio })
      batchBytes += audio.byteLength
      if (batch.length === 16 || batchBytes >= 8 * 1024 ** 2 || index === preview.manifest.clips.length - 1) {
        cancelled(); await saveVoiceBatch(batch); batch = []; batchBytes = 0
        progress?.(index + 1, preview.manifest.clips.length)
      }
    }
    cancelled()
    const installed: InstalledVoicePack = { id: preview.manifest.id, installation, name: preview.manifest.name, count: preview.manifest.clips.length, bytes: preview.bytes, importedAt: new Date().toISOString() }
    await voiceDbTransaction('metadata', 'readwrite', store => {
      store.delete(`staging/${installation}`)
      // Journal old audio in the same commit as publication: a tab closure during cleanup must remain recoverable.
      if (previous) store.put({ staging: true, installation: previous.installation }, `staging/${previous.installation}`)
      return store.put(installed, 'active')
    })
    // Publication is atomic. Cleanup failure must not report a successful installation as failed.
    if (previous) await deleteVoiceInstallation(previous.installation)
      .then(() => voiceDbTransaction('metadata', 'readwrite', store => store.delete(`staging/${previous.installation}`)))
      .catch(() => {})
    void navigator.storage?.persist?.().catch(() => {})
    return installed
  } catch (error) {
    await deleteVoiceInstallation(installation).catch(() => {})
    await voiceDbTransaction('metadata', 'readwrite', store => store.delete(`staging/${installation}`)).catch(() => {})
    if (error instanceof DOMException && error.name === 'QuotaExceededError') throw new Error('Not enough device storage. Your previous voice pack was kept. Free some space and try again.')
    throw error
  }
}
export async function readVoiceClip(text: string, rate: number): Promise<{ pcm: Float32Array; sampleRate: number } | undefined> {
  if (typeof indexedDB === 'undefined' || !crypto.subtle) return undefined
  const key = await voiceClipKey(text, rate), installed = await getInstalledVoicePack()
  if (!installed) return undefined
  const row = await voiceDbTransaction<StoredVoiceClip | undefined>('clips', 'readonly', store => store.get(`${installed.installation}/${key}`))
  return row ? decodeVoiceWav(row.audio) : undefined
}
