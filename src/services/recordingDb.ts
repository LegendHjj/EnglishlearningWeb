import type { Recording } from '../types'
const DB='fluency-reset-audio';const STORE='recordings'
type Stored=Recording&{blob:Blob}
function open(){return new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function tx<T>(mode:IDBTransactionMode,fn:(s:IDBObjectStore)=>IDBRequest<T>){const db=await open();return new Promise<T>((resolve,reject)=>{const req=fn(db.transaction(STORE,mode).objectStore(STORE));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
export async function saveRecording(meta:Recording,blob:Blob){await tx('readwrite',s=>s.put({...meta,blob}))}
export async function listRecordings():Promise<Stored[]>{return tx('readonly',s=>s.getAll())}
export async function deleteRecording(id:string){await tx('readwrite',s=>s.delete(id))}
export async function clearRecordings(){const db=await open();await new Promise<void>((resolve,reject)=>{const req=db.transaction(STORE,'readwrite').objectStore(STORE).clear();req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error)})}
