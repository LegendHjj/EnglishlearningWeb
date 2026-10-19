import { Blob as NodeBlob } from 'node:buffer'
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { inspectVoicePack, installVoicePack, getInstalledVoicePack, readVoiceClip, voiceClipKey } from './voicePack'
import { decodeVoiceWav } from './voicePackFormat'
import { enableVoicePackLocks, makeMultiVoicePack, makeVoicePack, sampleWav, storedZip } from '../test/voicePackFixture'
import { saveVoiceBatch, voiceDbTransaction } from './voicePackDb'
import { readVoiceZip } from './voicePackZip'

beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto)
  enableVoicePackLocks()
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('fluency-reset-voice-packs')
    req.onsuccess = () => resolve(); req.onerror = () => reject(req.error)
  })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

test('an imported pack survives subsequent reads and matches canonical text and rate only', async () => {
  const preview = await inspectVoicePack(await makeVoicePack())
  expect(preview.manifest.clips).toHaveLength(1)
  await installVoicePack(preview)
  expect(await getInstalledVoicePack()).toMatchObject({ name: 'Test Heart', count: 1 })
  expect((await readVoiceClip('  Hello\nthere. ', 1))?.pcm.length).toBe(480)
  expect(await readVoiceClip('Hello there.', .8)).toBeUndefined()
  expect(await readVoiceClip('Changed text.', 1)).toBeUndefined()
  expect(await voiceClipKey(' Hello\nthere. ', 1)).toBe(await voiceClipKey('Hello there.', 1))
})

test('corrupt replacement preserves the previously installed clips', async () => {
  await installVoicePack(await inspectVoicePack(await makeVoicePack()))
  const corrupt = await inspectVoicePack(await makeVoicePack({ name: 'Corrupt replacement', corrupt: true }))
  await expect(installVoicePack(corrupt)).rejects.toThrow(/checksum/i)
  expect((await getInstalledVoicePack())?.name).toBe('Test Heart')
  expect(await readVoiceClip('Hello there.', 1)).toBeDefined()
})

test('cancelling after staging keeps the old pack and reimport does not duplicate audio', async () => {
  const pack = await inspectVoicePack(await makeVoicePack())
  await installVoicePack(pack)
  await installVoicePack(pack)
  expect((await getInstalledVoicePack())?.count).toBe(1)
  const cancel = new AbortController()
  const replacement = await inspectVoicePack(await makeVoicePack({ name: 'Replacement' }))
  await expect(installVoicePack(replacement, () => cancel.abort(), cancel.signal)).rejects.toThrow(/cancel/i)
  expect((await getInstalledVoicePack())?.name).toBe('Test Heart')
})

test('unsupported archives, duplicate paths and mismatched clip identities are rejected', async () => {
  await expect(inspectVoicePack(new NodeBlob(['not a zip']) as unknown as Blob)).rejects.toThrow(/ZIP/i)
  await expect(inspectVoicePack(await makeVoicePack({ duplicate: true }))).rejects.toThrow(/duplicate/i)
  await expect(inspectVoicePack(await makeVoicePack({ key: '0'.repeat(64) }))).rejects.toThrow(/match/i)
  await expect(inspectVoicePack(await makeVoicePack({ compressed: true }))).rejects.toThrow(/stored|compression/i)
})

test('WAV validation rejects truncation, wrong formats and empty audio', () => {
  expect(decodeVoiceWav(sampleWav()).pcm.length).toBe(480)
  expect(() => decodeVoiceWav(sampleWav().slice(0, 45))).toThrow(/WAV/i)
  const stereo = sampleWav(); new DataView(stereo).setUint16(22, 2, true)
  expect(() => decodeVoiceWav(stereo)).toThrow(/mono|WAV/i)
  const empty = sampleWav(); new Uint8Array(empty).fill(0, 44)
  expect(() => decodeVoiceWav(empty)).toThrow(/silent|empty/i)
})

test('a later-batch quota failure and failed publication keep the old pack and remove staged audio', async () => {
  await installVoicePack(await inspectVoicePack(await makeVoicePack()))
  const original = IDBObjectStore.prototype.put
  for (const failure of ['batch', 'publication']) {
    let rows = 0
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
      if ((failure === 'batch' && this.name === 'clips' && ++rows === 17) || (failure === 'publication' && this.name === 'metadata' && key === 'active')) throw new DOMException('disk full', 'QuotaExceededError')
      return original.call(this, value, key)
    })
    await expect(installVoicePack(await inspectVoicePack(makeMultiVoicePack(20)))).rejects.toThrow(/storage/i)
    put.mockRestore()
    expect((await getInstalledVoicePack())?.name).toBe('Test Heart')
    expect(await readVoiceClip('Hello there.', 1)).toBeDefined()
    expect(await voiceDbTransaction('clips', 'readonly', store => store.count())).toBe(1)
  }
})

test('an interrupted previous import is recovered before retrying', async () => {
  await installVoicePack(await inspectVoicePack(await makeVoicePack()))
  await saveVoiceBatch([{ id: 'abandoned/example', installation: 'abandoned', audio: sampleWav() }])
  await voiceDbTransaction('metadata', 'readwrite', store => store.put({ staging: true, installation: 'abandoned' }, 'staging/abandoned'))
  await installVoicePack(await inspectVoicePack(await makeVoicePack()))
  expect(await voiceDbTransaction('clips', 'readonly', store => store.count())).toBe(1)
  expect(await voiceDbTransaction('metadata', 'readonly', store => store.get('staging/abandoned'))).toBeUndefined()
})

test('cleanup interrupted after publication is recovered without deleting the active replacement', async () => {
  await installVoicePack(await inspectVoicePack(await makeVoicePack()))
  const cleanup = vi.spyOn(IDBIndex.prototype, 'openCursor').mockImplementationOnce(() => { throw new DOMException('Simulated tab closure', 'AbortError') })
  await installVoicePack(await inspectVoicePack(await makeVoicePack({ name: 'Replacement' })))
  cleanup.mockRestore()
  expect((await getInstalledVoicePack())?.name).toBe('Replacement')
  expect(await voiceDbTransaction('clips', 'readonly', store => store.count())).toBe(2)
  expect(await readVoiceClip('Hello there.', 1)).toBeDefined()
  await installVoicePack(await inspectVoicePack(await makeVoicePack({ name: 'Retry after interruption' })))
  expect(await voiceDbTransaction('clips', 'readonly', store => store.count())).toBe(1)
  expect(await voiceDbTransaction('metadata', 'readonly', store => store.count())).toBe(1)
})

test('import batches flush by bytes so large clips do not accumulate sixteen at once', async () => {
  const counts: number[] = []
  await installVoicePack(await inspectVoicePack(makeMultiVoicePack(3, 2_100_000)), done => counts.push(done))
  expect(counts).toEqual([2, 3])
})

test('ZIP entries cannot overlap or require ZIP64 readers', async () => {
  const zip = storedZip([['a', new Uint8Array([1])], ['b', new Uint8Array([2])]])
  const overlapping = await zip.arrayBuffer(), view = new DataView(overlapping)
  const directory = view.getUint32(overlapping.byteLength - 6, true)
  view.setUint32(directory + 20, 10, true); view.setUint32(directory + 24, 10, true)
  await expect(readVoiceZip(new NodeBlob([overlapping]) as unknown as Blob)).rejects.toThrow(/ZIP/)
  const zip64 = await zip.arrayBuffer(), v64 = new DataView(zip64)
  v64.setUint16(directory + 6, 45, true)
  await expect(readVoiceZip(new NodeBlob([zip64]) as unknown as Blob)).rejects.toThrow(/ZIP/)
})

test('an asynchronous database failure rejects cleanly even when a later request is pending', async () => {
  await installVoicePack(await inspectVoicePack(await makeVoicePack()))
  await expect(voiceDbTransaction('clips', 'readwrite', store => {
    const row = { id: 'duplicate', installation: 'failed-test', audio: sampleWav() }
    store.add(row); store.add(row)
    return store.get('later-request')
  })).rejects.toBeDefined()
  expect(await voiceDbTransaction('clips', 'readonly', store => store.count())).toBe(1)
  expect(await readVoiceClip('Hello there.', 1)).toBeDefined()
})
