# Fluency Reset — Content and Learning Logic Review

## Executive conclusion

The current application has a strong visual direction and a useful recording/notebook foundation, but its learning content currently behaves more like a rotating prompt carousel than a progressive fluency programme.

The biggest improvement is not adding more random prompts. It is replacing generic content generation with a structured progression in which each mission has:

1. a real listener and situation;
2. a clear communicative outcome;
3. situation-specific key points;
4. phrases chosen by communicative function;
5. Easy, Practical, and Brave versions that genuinely differ;
6. one focused retry;
7. a follow-up question;
8. a reflection based on communication rather than grammar perfection.

This pack provides a 60-practice-day programme, 156 linked Practice Room drills, and 30 question-specific Big 30 guides.

---

## What is already good

- The product promise is clear: speaking practice for adults, not a traditional grammar course.
- The Follow → Recall → Free idea is strong.
- The app already has microphone recording, local storage, phrases, packs, missions, Big 30, progress, and responsive layouts.
- The calm visual style suits anxious adult learners.
- Quick Win, Normal Practice, and Full Workout are good retention concepts.
- The existing phrase bank includes many useful workplace and recovery chunks.

These should be preserved.

---

## Current content problems found in the code

### 1. Most missions use the same generic key points

Only the first seeded mission has custom points. Almost every other mission receives:

- Set the context
- Share the main point
- Give one detail
- End with a next step

Those points are not wrong, but they do not teach the structure of a customer complaint, small talk, a booking mismatch, an interview answer, a disagreement, or a story. Each situation needs its own message architecture.

### 2. Phrase suggestions are selected mechanically

Suggested phrase IDs rotate by array position. This can produce phrases that do not match the mission.

Phrases should be selected by explicit communicative functions such as:

- buy time
- clarify
- confirm understanding
- empathise
- report progress
- explain cause
- recommend
- disagree
- repair
- close a conversation

### 3. Difficulty currently changes only the label

Easy, Practical, and Brave show different descriptions, but the underlying task, timer, support, required points, and pressure do not materially change.

A real difficulty system should change:

- preparation time;
- speaking time;
- amount of visible support;
- number of required message elements;
- whether a follow-up is included;
- whether retry/restart is allowed;
- pressure conditions.

### 4. Quick, Normal, and Full duration choices are not implemented as different flows

The dashboard sends the duration in the query string, but the mission page does not use it to change the session.

Recommended flows:

- Quick Win: situation → one recording → self-check.
- Normal Practice: preparation → recording → focused retry → self-check.
- Full Workout: linked warm-up → mission → focused retry → follow-up question → self-check.

### 5. Today’s mission is selected by calendar date

The dashboard selects a mission using the day of the month. A learner who misses a day may jump around the content, and the app cannot build skills in a reliable sequence.

Use “next incomplete programme day” instead. A programme day means a completed practice session, not a calendar day. Missing Tuesday should not cause the learner to lose Day 12.

### 6. The Practice Room is under-guided

The current five tabs mostly show a prompt, general guidance, and a recorder. This can feel strange because the learner does not know:

- what skill is being trained;
- what a successful message should achieve;
- what to do on the first attempt;
- what specifically to improve on the second attempt;
- how the drill connects to real conversation;
- how it relates to today’s mission.

Every Practice Room drill should have:

setup → model or cues → first attempt → one focused retry → reflection → optional save/use in mission.

### 7. Tight practice is too terse

Tight practice should not only display grammar transformations. It should begin with one safe sentence, make three meaningful changes, then end with a short communicative task.

Example:

Base: “The project is going well.”

1. Add completed work.
2. Add current work.
3. Add a risk and next step.
4. Give a 60-second project update.

### 8. Loose practice needs a story or communication outcome

Random words alone can feel artificial. Loose practice works better when the user has:

- a scenario;
- four cue words;
- a beginning/ending frame;
- a required message outcome;
- a follow-up question;
- one focused retry.

### 9. Free practice needs a listener

“Talk about X” is weaker than:

“You are speaking to a new colleague who asks X. Give a useful answer that makes it easy for them to ask a follow-up.”

The listener and outcome make the task real.

### 10. Shadowing needs delivery targets

Browser text-to-speech is acceptable for an MVP, but shadowing should show:

- thought groups;
- focus words;
- rate options;
- one delivery focus;
- progression from reading to personal adaptation.

### 11. Missing communication-repair training

A fluency app should directly practise what happens when speech breaks down:

- buying time;
- asking for repetition;
- clarifying;
- explaining around a forgotten word;
- correcting oneself;
- returning after interruption;
- protecting a speaking turn;
- restating an unclear message.

This is why the new Practice Room includes Repair Lab.

### 12. Completion feedback is partly hard-coded

The mission page currently records a fixed confidence value and may imply progress that was not actually measured.

Until speech-to-text exists:

- do not claim that the learner used a phrase;
- ask the learner to tick which support items they used;
- ask for a 1–5 confidence rating;
- calculate duration from the recording;
- save whether the communicative outcome was completed;
- keep all evaluation clearly self-reported.

### 13. Big 30 uses a one-size-fits-all planner

“Tell me about yourself,” “Describe a difficult problem,” and “What does success mean to you?” need different structures. The included Big 30 JSON gives each question:

- a purpose;
- specific key points;
- useful frames;
- a follow-up;
- a common trap;
- Follow, Recall, and Free guidance.

---

## Research-informed design decisions

### Action-oriented speaking

The programme organises practice around things a learner must do with language: explain, request, clarify, narrate, recommend, disagree, repair, summarise, and maintain conversation.

### Balanced practice

The app should not become output-only in the narrow sense. A Full Workout should contain a small balance of:

- model input;
- attention to one phrase, pattern, or delivery feature;
- meaningful output;
- fluency repetition using familiar language.

### Planning and fading support

Preparation is not cheating. Learners first plan with full support, then partial prompts, then keywords. The support should fade only after the user has produced a complete message.

### Communication strategies are teachable

Planning, compensating, monitoring, repair, turn-taking, cooperation, and clarification are explicit skills. They should appear as first-class practice modes rather than emergency tips hidden in notes.

### Fluency through repeated messages

The learner should repeat a familiar message with one changed condition: less support, less preparation, a follow-up question, or a shorter time. The goal is smoother retrieval, not memorising an exact script.

### Familiar language for fluency rounds

A fluency sprint should mostly use language the learner already knows. New vocabulary and phrase learning can happen before the sprint, but the sprint should prioritise rate, continuity, and flexibility.

---

## Proposed 60-practice-day structure

### Phase 1 — Activation, Days 1–7

Wake up the speaking system with introductions, present-moment narration, plans, routines, past events, and a baseline replay.

### Phase 2 — Conversation Survival, Days 8–14

Train buying time, repetition requests, clarification, confirmation, agreement, disagreement, and a mixed checkpoint.

### Phase 3 — Storytelling, Days 15–21

Practise first-job stories, achievements, solved problems, mistakes, memorable events, influential people, and fluent retelling.

### Phase 4 — Social Connection, Days 22–28

Start small talk, ask follow-ups, join a group, show empathy, compliment naturally, close warmly, and complete a social checkpoint.

### Phase 5 — Workplace Communication, Days 29–35

Give updates, ask for help, report delays, confirm requirements, summarise decisions, exchange feedback, and complete a meeting checkpoint.

### Phase 6 — Services and Travel, Days 36–42

Calm an unhappy customer, exchange an item, recommend, leave a voice message, resolve a booking mismatch, explain a process, and complete a service checkpoint.

### Phase 7 — Opinions and Problem Solving, Days 43–49

Give opinions, compare options, explain trade-offs, recommend solutions, challenge risk, describe trends, and deliver a mini-presentation.

### Phase 8 — Pressure and Recovery, Days 50–56

Answer unexpected questions, explain around forgotten words, recover from interruptions, self-correct, speak with no preparation, sprint, and complete a mixed simulation.

### Phase 9 — Integration, Days 57–60

Remix common questions, simulate a personal goal, compare Day 1 with Day 59, and complete a final showcase plus next plan.

The programme is not tied to 60 consecutive calendar days. It contains 60 completed practice days.

---

## New Practice Room structure

### 1. Mouth Reps — 31 drills

Useful chunks are repeated with slow build, natural rhythm, communicative intention, and personal adaptation.

### 2. Tight Build — 27 drills

Controlled sentence expansion leading to a useful message.

### 3. Loose Story — 10 drills

Cue-based stories with an outcome, support frames, retry focus, and follow-up.

### 4. Free Response — 38 drills

Real situations with a listener, outcome, key points, phrases, follow-up, and Brave extension.

### 5. Echo & Shadow — 16 drills

Thought groups, stress words, rate options, and adaptation.

### 6. Repair Lab — 18 drills

Direct training for freezes, missing words, misunderstanding, interruption, disagreement, and self-correction.

### 7. Fluency Sprint — 16 drills

Repeated familiar messages under changing time/support conditions.

Total: 156 drills.

---

## Recommended content architecture

Keep large learning content outside React components.

Suggested location:

```text
src/
  content/
    fluency-reset-60-day-program.json
    practice-room-content.json
    big-30-question-guides.json
```

Create typed loaders and validators. Avoid copying all content into `seed.ts`.

Recommended separation:

- JSON contains authored learning content.
- TypeScript contains schemas, validation, selection logic, and progress.
- React components render the content and manage interactions.
- LocalStorage contains user state only, not duplicated seed content.

---

## How Today’s Mission should work

1. Find the next incomplete programme day.
2. Filter or recommend based on the user’s selected goal, but do not destroy the sequence.
3. Show the day, phase, skill focus, and real-life outcome.
4. Let the user choose Easy, Practical, or Brave.
5. Let the user choose 2, 5, or 10 minutes.
6. Use the linked Practice Room IDs when extra practice is included.
7. Save completion by programme day.
8. Offer a missed-day comeback without guilt.
9. Allow replay of a completed day without advancing the programme.
10. Use checkpoints to compare recordings and choose the next focus.

---

## Recommended success metrics

Use measurable or honestly self-reported data:

- completed practice days;
- speaking seconds/minutes;
- missions completed;
- retries completed;
- follow-up questions answered;
- support stage used;
- repair strategies practised;
- confidence rating;
- “message completed” self-check;
- phrase/word selected and self-confirmed as used;
- saved baseline/comparison recordings.

Do not fabricate:

- pronunciation scores;
- phrase detection;
- grammar scores;
- fluency improvements not measured;
- confidence values not entered by the user.

---

## Included files

- `fluency-reset-60-day-program.json`
- `practice-room-content.json`
- `big-30-question-guides.json`
- `codex-amendment-60-day-and-practice-room.md`
- `README.md`
