import programmeJson from '../content/fluency-reset-60-day-program.json'
import practiceJson from '../content/practice-room-content.json'
import big30Json from '../content/big-30-question-guides.json'
import type { Big30Guide, ContentStatus, PracticeDrill, PracticeMode, ProgrammeContent, ProgrammeMission } from '../content/types'
import { validateContent } from '../content/validation'

export type ContentRepository = {
  status: ContentStatus
  programme: ProgrammeContent
  practiceDrills: PracticeDrill[]
  big30Guides: Big30Guide[]
  getMissionByDay(day: number): ProgrammeMission | undefined
  getMissionById(id: string): ProgrammeMission | undefined
  getDrillById(id: string): PracticeDrill | undefined
  getLinkedDrills(missionId: string): PracticeDrill[]
  getBig30Guide(questionId: string): Big30Guide | undefined
}

const EMPTY_PROGRAMME: ProgrammeContent = { schemaVersion: 0, programId: 'unavailable', title: 'Programme unavailable', description: '', phases: [], missions: [] }
const big30Id = (value: string) => value.startsWith('big-') ? value : `big-${String(Number(value.replace(/\D/g, ''))).padStart(2, '0')}`

export function createContentRepository(programmeValue: unknown, practiceValue: unknown, big30Value: unknown): ContentRepository {
  const validated = validateContent(programmeValue, practiceValue, big30Value)
  if (!validated.status.ok || !validated.programme || !validated.practice || !validated.big30) {
    console.error('Fluency Reset content validation failed:', validated.status.errors)
    return { status: validated.status, programme: EMPTY_PROGRAMME, practiceDrills: [], big30Guides: [], getMissionByDay: () => undefined, getMissionById: () => undefined, getDrillById: () => undefined, getLinkedDrills: () => [], getBig30Guide: () => undefined }
  }
  const programme = validated.programme
  const practiceDrills = validated.practice.modeOrder.flatMap(mode => validated.practice!.modes[mode].items.map(item => ({ ...item, mode: mode as PracticeMode } as PracticeDrill)))
  const big30Guides = validated.big30.items
  const missionById = new Map(programme.missions.map(item => [item.id, item]))
  const missionByDay = new Map(programme.missions.map(item => [item.day, item]))
  const drillById = new Map(practiceDrills.map(item => [item.id, item]))
  const guideById = new Map(big30Guides.map(item => [item.id, item]))
  return {
    status: validated.status, programme, practiceDrills, big30Guides,
    getMissionByDay: day => missionByDay.get(day),
    getMissionById: id => missionById.get(id),
    getDrillById: id => drillById.get(id),
    getLinkedDrills: missionId => (missionById.get(missionId)?.linkedPracticeIds || []).flatMap(id => { const drill = drillById.get(id); return drill ? [drill] : [] }),
    getBig30Guide: questionId => guideById.get(big30Id(questionId)),
  }
}

export const contentRepository = createContentRepository(programmeJson, practiceJson, big30Json)
