import type { AppState, Recording } from '../types'

export function calculateProgressMetrics(state:AppState,recordings:Recording[]){
  const checks=[...state.missionSelfChecks].sort((a,b)=>a.completedAt.localeCompare(b.completedAt))
  const recordedSeconds=recordings.length?recordings.reduce((sum,item)=>sum+item.duration,0):checks.reduce((sum,item)=>sum+item.duration,0)
  return {
    programmeDays:new Set(state.completedProgrammeMissionIds).size,
    recordedSeconds,
    firstAttempts:checks.length,
    retries:checks.filter(item=>item.retryCompleted).length,
    followUps:checks.filter(item=>item.answeredFollowUp).length,
    practiceDrills:new Set(state.completedPracticeDrillIds).size,
    repairDrills:new Set(state.completedPracticeDrillIds.filter(id=>id.startsWith('repair-'))).size,
    checkpointRecordings:Object.values(state.checkpointRecordingIds).reduce((sum,ids)=>sum+ids.length,0),
    usedVocabulary:new Set(checks.flatMap(item=>item.usedVocabularyIds)).size,
    noteStages:{Follow:checks.filter(item=>item.noteStage==='Follow').length,Recall:checks.filter(item=>item.noteStage==='Recall').length,Free:checks.filter(item=>item.noteStage==='Free').length},
    confidenceTrend:checks.map((item,index)=>({label:`Day ${index+1}`,confidence:item.confidence})),
    speakingDays:new Set([...checks.map(item=>item.completedAt.slice(0,10)),...recordings.map(item=>item.createdAt.slice(0,10)),...state.practiceResults.map(item=>item.date.slice(0,10))]).size,
  }
}
