export const practicePackCatalogue=[
  {id:'everyday-600-chunks',name:'600 everyday chunks',description:'1,200 sentence examples, 60 speaking prompts and an optional practice plan.',destination:'/app/notebook?tab=chunks',action:'Open Chunk Practice'},
  {id:'big30-120-answers',name:'Big 30: 120 example answers',description:'Four examples per question, recall cues, useful chunks and follow-up replies.',destination:'/app/big-30',action:'Open Big 30'},
  {id:'everyday-120-conversations',name:'120 everyday conversations',description:'720 dialogue turns, 120 reply challenges and 60 sentence-building examples.',destination:'/app/practice?library=packs',action:'Open extra practice'},
]
export const practicePackUrl=(id:string)=>`${import.meta.env.BASE_URL}practice-packs/${id}.json`
