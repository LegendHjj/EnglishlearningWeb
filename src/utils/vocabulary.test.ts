import { describe, expect, test } from 'vitest'
import type { VocabularyEntry } from '../types'
import { findVocabularyDuplicate, mergeVocabularyEntries, parseVocabularyText, scheduleVocabularyReview } from './vocabulary'

const entry=(overrides:Partial<VocabularyEntry>={}):VocabularyEntry=>({
  id:'v1',english:'achieve',commonForms:[],commonCollocations:[],tags:[],status:'New',favourite:false,
  needsDetails:true,reviewStep:0,timesReviewed:0,timesUsedInSpeaking:0,dateAdded:'2026-07-01T00:00:00.000Z',
  updatedAt:'2026-07-01T00:00:00.000Z',source:'manual',...overrides,
})

describe('parseVocabularyText',()=>{
  test('parses standard multiline content, lists, and multiline notes',()=>{
    const source=`English:\nachieve\nChinese:\n实现；达到\nPart of Speech:\nverb\nSimple Definition:\nTo reach a goal.\nExample:\nShe achieved her goal.\nCommon Forms:\nachieve, achieved\nachieving; achievement\nCommon Collocations:\nachieve a goal; achieve success\nNotes:\nUsed for goals.\nOften positive.`
    const result=parseVocabularyText(source)
    expect(result.fields).toMatchObject({english:'achieve',chinese:'实现；达到',partOfSpeech:'verb',simpleDefinition:'To reach a goal.',example:'She achieved her goal.',notes:'Used for goals.\nOften positive.'})
    expect(result.fields.commonForms).toEqual(['achieve','achieved','achieving','achievement'])
    expect(result.fields.commonCollocations).toEqual(['achieve a goal','achieve success'])
    expect(result.detectedCount).toBe(8)
  })

  test('accepts same-line markdown headings and aliases case-insensitively',()=>{
    const result=parseVocabularyText('**WORD:** clarify\n**Chinese Meaning:** 澄清\nWORD TYPE: verb\nDefinition: make something clear\nChinese Example: 我来澄清。\nWord Forms: clarify; clarified\nCollocations: clarify a point, clarify that\nUsage Notes: polite and useful')
    expect(result.fields).toMatchObject({english:'clarify',chinese:'澄清',partOfSpeech:'verb',simpleDefinition:'make something clear',exampleChinese:'我来澄清。',notes:'polite and useful'})
    expect(result.fields.commonForms).toEqual(['clarify','clarified'])
    expect(result.fields.commonCollocations).toEqual(['clarify a point','clarify that'])
  })

  test('allows missing optional fields and reports unmatched text',()=>{
    const result=parseVocabularyText('Some preface that is not a field\nEnglish: reliable\nextra trailing thought')
    expect(result.fields.english).toBe('reliable')
    expect(result.unmatchedText).toContain('Some preface')
    expect(result.unmatchedText).toContain('extra trailing thought')
    expect(result.sourceText).toContain('English: reliable')
  })

  test('returns no fields for empty input',()=>{
    expect(parseVocabularyText('  ')).toMatchObject({fields:{},detectedCount:0,unmatchedText:''})
  })
})

describe('duplicate vocabulary',()=>{
  test('matches spelling case-insensitively with repeated spaces',()=>{
    expect(findVocabularyDuplicate([entry({english:'  ACHIEVE  '})],{english:'achieve'} as VocabularyEntry)?.id).toBe('v1')
  })

  test('permits the same spelling with a different part of speech',()=>{
    expect(findVocabularyDuplicate([entry({english:'record',partOfSpeech:'noun'})],entry({english:'record',partOfSpeech:'verb'}))).toBeUndefined()
  })

  test('merges unique arrays while preserving progress and earliest date',()=>{
    const existing=entry({commonForms:['achieved'],commonCollocations:['achieve a goal'],tags:['work'],reviewStep:3,timesReviewed:5,dateAdded:'2026-06-01T00:00:00.000Z'})
    const merged=mergeVocabularyEntries(existing,entry({id:'new',chinese:'实现',commonForms:['Achieved','achieving'],commonCollocations:['achieve success'],tags:['Work','goals'],reviewStep:0,timesReviewed:0,dateAdded:'2026-07-01T00:00:00.000Z'}),'2026-07-13T00:00:00.000Z')
    expect(merged).toMatchObject({id:'v1',chinese:'实现',reviewStep:3,timesReviewed:5,dateAdded:'2026-06-01T00:00:00.000Z',updatedAt:'2026-07-13T00:00:00.000Z'})
    expect(merged.commonForms).toEqual(['achieved','achieving'])
    expect(merged.commonCollocations).toEqual(['achieve a goal','achieve success'])
    expect(merged.tags).toEqual(['work','goals'])
  })
})

describe('review scheduling',()=>{
  const now=new Date('2026-07-13T08:00:00.000Z')
  test.each([
    ['Again',0,1],['Difficult',2,7],['Good',3,14],['Easy',4,30],
  ] as const)('%s chooses step %i and interval %i days',(rating,step,days)=>{
    const updated=scheduleVocabularyReview(entry({reviewStep:2,timesReviewed:4}),rating,now)
    expect(updated.reviewStep).toBe(step)
    expect(updated.timesReviewed).toBe(5)
    expect(updated.nextReviewAt).toBe(new Date(now.getTime()+days*86400000).toISOString())
  })

  test('Easy never advances past the maximum interval',()=>{
    expect(scheduleVocabularyReview(entry({reviewStep:4}),'Easy',now).reviewStep).toBe(4)
  })
})
