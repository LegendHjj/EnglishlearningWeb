import type { ChunkKind, Phrase } from '../types'

// Original examples and cues inspired by the reviewed learning materials.
const social='Social English transcript · Claire'
const journal='Speaking Naturally Without Translation · chunk journal'
const entries:[string,ChunkKind,string,string,string,string,string][]=[
  ["I'm trying to ...",'Sentence frame','Describe an effort you are making.','Talk about a current task or habit.',"I'm trying to explain the problem clearly.",'Tell a colleague what you are making an effort to do.',journal],
  ['It depends on ...','Sentence frame','The answer changes with a condition.','Explain why an answer is not always the same.','It depends on how much time we have.','Explain what would affect your choice of weekend plan.',journal],
  ['That makes sense.','Fixed expression','A reason or explanation seems logical.','Agree with the reasoning behind a plan.','That makes sense. We can avoid the morning traffic.','A friend suggests leaving early to avoid traffic. Respond to their reasoning.',social],
  ['Works for me.','Fixed expression','A plan is convenient or acceptable to you.','Accept a proposed time or arrangement.','Friday afternoon works for me.','A colleague suggests meeting on Friday afternoon. Accept the time.',social],
  ['Nice to see you again.','Fixed expression','A warm greeting for someone you have met before.','Greet a familiar person after some time apart.','Nice to see you again. How was your trip?','Greet someone you met at a previous event.',social],
  ['What got you into that?','Fixed expression','Ask how someone became interested in something.','Follow up after someone mentions a hobby.','You enjoy gardening? What got you into that?','Someone mentions a new hobby. Ask how their interest started.',social],
  ['What have you been up to lately?','Fixed expression','Ask about recent activities.','Catch up with a friend you have not seen for a while.','What have you been up to lately? Any new projects?','Catch up with a friend and ask about their recent activities.',social],
  ["I've been wanting to ...",'Sentence frame','Describe something you have wanted to try for a while.','Mention an interest or a plan you have not acted on yet.',"I've been wanting to try that new cafe.",'A friend recommends a place you have wanted to visit for some time.',social],
  ['Thank you for having me.','Fixed expression','Thank a host for inviting you.','Thank someone when visiting or joining an event.','Thank you for having me. I enjoyed our conversation.','Thank your host after being invited to dinner.',social],
  ['To be honest, ...','Conversation marker','Introduce a sincere opinion or feeling.','Share an honest view with a respectful tone.',"To be honest, I'd prefer a quieter place.",'Share your honest preference about where to meet.',journal],
  ['make a decision','Collocation','Choose what to do after considering options.','Talk about choosing between possibilities.','We need to make a decision before lunch.','Tell your team that you need to choose an option soon.',journal],
  ['Could you say that again more slowly?','Fixed expression','Ask for a slower repetition.','Use when speech was too fast to follow.','Could you say that again more slowly? I missed the address.','You missed an address because someone spoke quickly. Ask for help.',social],
]

export const starterChunks:Phrase[]=entries.map(([text,chunkKind,meaning,whenToUse,example,recallCue,source],index)=>({id:`chunk-starter-${index+1}`,text,chunkKind,meaning,whenToUse,example,recallCue,source,personalExample:'',variations:[],category:chunkKind==='Collocation'?'Everyday actions':chunkKind==='Sentence frame'?'Everyday frames':'Social connection',tags:['chunk','starter'],status:'New',type:chunkKind==='Sentence frame'?'Sentence frame':'Useful phrase',dateAdded:'2026-10-12',practised:0,used:0,favourite:false}))
