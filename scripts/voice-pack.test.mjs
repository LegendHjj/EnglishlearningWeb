// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { createHash } from 'node:crypto'
import { mkdtemp,readFile,writeFile,unlink,rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { collectRequests, encodeWav, validateWav, clipKey, canonicalText, reusableClip, readSegmentCache, writeSegmentCache } from './voice-pack-lib.mjs'

describe('portable Heart generation', () => {
  test('covers seeded vocabulary recap fields as individual playable clips', () => {
    const requests=collectRequests({seedVocabulary:[{id:'word',english:'helpful',simpleDefinition:'Useful to someone.',example:'That was helpful.',personalSentence:'My neighbour is helpful.'}]})
    expect(requests.map(x=>x.text)).toEqual(expect.arrayContaining(['helpful','Useful to someone.','That was helpful.','My neighbour is helpful.']))
  })
  test('covers vocabulary collocations promoted to phrases and their slow examples', () => {
    const requests=collectRequests({seedVocabulary:[{id:'word',english:'helpful',example:'That was helpful.',commonCollocations:['helpful advice','helpful suggestion']}]})
    expect(requests.some(x=>x.text==='helpful advice'&&x.rate===1)).toBe(true)
    expect(requests.some(x=>x.text==='helpful suggestion'&&x.rate===1)).toBe(true)
    expect(requests.some(x=>x.text==='That was helpful.'&&x.rate===.8)).toBe(true)
  })
  test('extracts exact Listen composites and slow chunk examples without duplicates', () => {
    const requests = collectRequests({ seedPhrases:[{text:'Hello',example:'Hello there.'}], starterChunks:[], bigQuestions:[], programme:{missions:[{supportPhrases:[' Hello ']}]}, drills:{modes:{mouthReps:{items:[{phrase:'Try again.'}]}}}, guides:{items:[]}, packs:[{id:'one',items:[{id:'a',kind:'chunk',title:'A phrase',model:'First sentence.',examples:['Second sentence.']},{id:'b',kind:'conversation',model:'Dialogue.',examples:[],challenge:{model:'Reply.',followUp:'And you?'}}]}] })
    expect(requests.some(x=>x.text==='First sentence. Second sentence.'&&x.rate===1)).toBe(true)
    expect(requests.some(x=>x.text==='First sentence. Second sentence.'&&x.rate===.8)).toBe(true)
    expect(requests.some(x=>x.text==='Second sentence.'&&x.rate===1)).toBe(true)
    expect(requests.some(x=>x.text==='Reply.')).toBe(true)
    expect(requests.filter(x=>x.text==='Hello'&&x.rate===1)).toHaveLength(1)
    expect(requests.find(x=>x.text==='Hello'&&x.rate===1).sources).toHaveLength(2)
  })
  test('uses the shared importer key and canonical text contract', () => {
    expect(canonicalText(' Hi\n there. ')).toBe('Hi there.')
    expect(clipKey(' Hi\n there. ',.8)).toBe(createHash('sha256').update(JSON.stringify(['af_heart','1939ad2a8e416c0acfeecc08a694d14ef25f2231',.8,'Hi there.'])).digest('hex'))
  })
  test('resumes only complete checksummed PCM16 mono WAV files', () => {
    const bytes=encodeWav(Float32Array.from([0,.5,-.5,1,-1]))
    expect(validateWav(bytes)).toMatchObject({samples:5,sampleRate:24000})
    const saved={bytes:bytes.length,samples:5,sha256:createHash('sha256').update(bytes).digest('hex')}
    expect(reusableClip(bytes,saved)).toBe(true)
    expect(reusableClip(bytes.subarray(0,-1),saved)).toBe(false)
    const corrupt=Buffer.from(bytes);corrupt[46]^=1
    expect(reusableClip(corrupt,saved)).toBe(false)
    expect(()=>validateWav(encodeWav(Float32Array.from([0,NaN])))).toThrow()
  })
  test('segment resume rejects a flipped PCM bit and legacy files without checksum sidecars',async()=>{
    const folder=await mkdtemp(path.join(tmpdir(),'heart-segment-'))
    const file=path.join(folder,'audio.wav'),wav=encodeWav(Float32Array.from([0,.5,-.5]))
    try{
      await writeFile(file,wav)
      expect(await readSegmentCache(file)).toBeUndefined()
      await writeSegmentCache(file,wav)
      expect(await readSegmentCache(file)).toEqual(wav)
      const corrupt=await readFile(file);corrupt[46]^=1;await writeFile(file,corrupt)
      expect(await readSegmentCache(file)).toBeUndefined()
    }finally{await unlink(file).catch(()=>{});await unlink(file+'.json').catch(()=>{});await rmdir(folder)}
  })
})
