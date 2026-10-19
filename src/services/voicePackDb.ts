export interface InstalledVoicePack { id: string; installation: string; name: string; count: number; bytes: number; importedAt: string }
export interface StoredVoiceClip { id: string; installation: string; audio: ArrayBuffer }
const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const req = indexedDB.open('fluency-reset-voice-packs', 1)
  req.onupgradeneeded = () => { req.result.createObjectStore('metadata'); req.result.createObjectStore('clips', { keyPath: 'id' }).createIndex('installation', 'installation') }
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})
export async function voiceDbTransaction<T>(store: 'metadata' | 'clips', mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(store, mode)
      let request: IDBRequest<T> | undefined
      transaction.oncomplete = () => resolve(request!.result)
      transaction.onabort = () => reject(transaction.error || request?.error || new Error('Device storage could not be updated.'))
      transaction.onerror = () => reject(transaction.error || request?.error)
      try { request = work(transaction.objectStore(store)) }
      catch (error) { transaction.abort(); reject(error) }
    })
  } finally { db.close() }
}
export const getInstalledVoicePack = () => voiceDbTransaction<InstalledVoicePack | undefined>('metadata', 'readonly', store => store.get('active'))
// Only called while holding the cross-tab import lock: a live import must never be collected.
export async function recoverVoiceImports(): Promise<void> {
  const active = await getInstalledVoicePack()
  const rows = await voiceDbTransaction<{ staging?: boolean; installation?: string }[]>('metadata', 'readonly', store => store.getAll())
  for (const row of rows) if (row.staging && row.installation) {
    if (row.installation !== active?.installation) await deleteVoiceInstallation(row.installation)
    await voiceDbTransaction('metadata', 'readwrite', store => store.delete(`staging/${row.installation}`))
  }
}
export async function saveVoiceBatch(rows: StoredVoiceClip[]): Promise<void> {
  if (!rows.length) return
  await voiceDbTransaction('clips', 'readwrite', store => { let request!: IDBRequest; for (const row of rows) request = store.put(row); return request })
}
export async function deleteVoiceInstallation(installation: string): Promise<void> {
  const db = await open()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('clips', 'readwrite'), cursor = tx.objectStore('clips').index('installation').openCursor(IDBKeyRange.only(installation))
      cursor.onsuccess = () => { if (cursor.result) { cursor.result.delete(); cursor.result.continue() } }
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error)
    })
  } finally { db.close() }
}
