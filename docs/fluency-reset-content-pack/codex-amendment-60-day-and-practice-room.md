# Codex Amendment — 60-Day Fluency Programme and Practice Room Redesign

Copy the requirement below into Codex together with these JSON files:

- `fluency-reset-60-day-program.json`
- `practice-room-content.json`
- `big-30-question-guides.json`

---

## REQUIREMENT START

Act as a senior React/TypeScript developer, product designer, and learning-experience engineer.

Extend the existing **Fluency Reset** application. Do not rebuild it from scratch.

The application already contains:

- Landing page
- Onboarding
- Dashboard
- Daily speaking missions
- Speaking Notebook / My English Library
- Speaking Packs
- Big 30 Questions
- Practice Room
- Browser microphone recording
- Recordings library
- Progress
- Settings
- LocalStorage state
- IndexedDB audio

Preserve all existing user data and the current adult wellness visual direction.

Read these project files before editing:

- `README.md`
- `PROJECT_CONTEXT.md`
- `AGENTS.md`
- `src/data/seed.ts`
- `src/pages/DashboardPage.tsx`
- `src/pages/MissionPage.tsx`
- `src/pages/PracticePage.tsx`
- AppContext, types, storage, recording service, and tests

Also inspect the vocabulary/library amendment already implemented or currently being implemented. The new programme must coexist with Vocabulary Bank, Speaking Phrases, Speaking Packs, recordings, and old backups.

## 1. IMPORT THE NEW CONTENT PACK

Add the supplied files to a suitable project location, preferably:

```text
src/content/
  fluency-reset-60-day-program.json
  practice-room-content.json
  big-30-question-guides.json
```

Do not manually paste hundreds of content entries into React components.

Create TypeScript types and runtime validation for the JSON structures.

The app must fail safely if a content file is malformed:

- log a useful development error;
- show a friendly fallback to the user;
- do not blank the application;
- do not delete progress.

Create a content service or repository that exposes:

- programme phases;
- programme missions;
- mission by day/id;
- next incomplete mission;
- Practice Room drill by ID;
- drills linked to a mission;
- Big 30 guide by question ID;
- content version.

## 2. REPLACE RANDOM MISSION ROTATION WITH PROGRAMME PROGRESSION

The current dashboard chooses a mission using the calendar day. Replace that logic.

A “programme day” means a completed practice day, not a calendar date.

Rules:

1. Start a new user at Day 1.
2. Show the next incomplete day.
3. Missing a calendar day must not skip content.
4. Replaying an old mission must not advance the programme.
5. Completing a mission should mark its programme day complete.
6. Let users browse completed and upcoming days.
7. Future days may be previewed, but clearly show that they are upcoming.
8. Checkpoint days should be visually distinct.
9. Store programme progress by stable mission/day IDs.
10. Provide a safe migration for existing completed mission IDs.

Add a dashboard indicator such as:

> Day 12 of 60 · Conversation Survival

Do not use guilt-inducing copy when the user returns after a break.

Use:

> Welcome back. Continue with Day 12 when you are ready.

## 3. USE THE 60-DAY PHASES

Render the phases supplied in the programme JSON:

1. Activation
2. Conversation Survival
3. Storytelling
4. Social Connection
5. Workplace Communication
6. Services and Travel
7. Opinions and Problem Solving
8. Pressure and Recovery
9. Integration

Add a programme overview page or panel that shows:

- phase name;
- day range;
- skill focus;
- completed days;
- next mission;
- checkpoint days.

Do not require 60 consecutive days.

## 4. MAKE SESSION LENGTH CHANGE THE ACTUAL FLOW

The existing dashboard offers 2, 5, and 10 minutes. The mission page must actually use the selected duration.

### Quick Win — approximately 2 minutes

Flow:

1. Situation and outcome
2. Optional keyword memo
3. One recording
4. Simple self-check
5. Complete

No mandatory retry.

### Normal Practice — approximately 5 minutes

Flow:

1. Situation and outcome
2. Key points and support items
3. Preparation
4. First recording
5. Mission-specific focused retry
6. Self-check
7. Complete

### Full Workout — approximately 10 minutes

Flow:

1. One linked warm-up drill
2. Situation and preparation
3. First recording
4. Mission-specific focused retry
5. Follow-up question
6. Second response or extension
7. Reflection
8. Complete

Read the duration query parameter or store the selected duration in route state. Do not ignore it.

Show an approximate remaining-time indicator, but do not punish a learner who takes longer.

## 5. MAKE EASY, PRACTICAL, AND BRAVE GENUINELY DIFFERENT

Use the `levels` object supplied for every mission.

Difficulty must change:

- preparation seconds;
- speaking seconds;
- task wording;
- required elements;
- visible support;
- pressure rule;
- follow-up requirements;
- restart allowance where applicable.

Suggested support:

### Easy

- full notes;
- full phrases;
- longer preparation;
- fewer required elements;
- short answer;
- unlimited retry.

### Practical

- keywords;
- partial phrase hints;
- moderate preparation;
- all core message elements;
- one follow-up.

### Brave

- minimal notes;
- very short preparation;
- more complex outcome;
- listener objection or follow-up;
- no restart during the timed answer.

Display the actual selected requirements before recording.

## 6. REDESIGN THE MISSION SCREEN AROUND COMMUNICATION

Use this hierarchy:

1. **Situation** — who is speaking to whom?
2. **Outcome** — what should the listener understand or do?
3. **Required points** — specific to this mission and level
4. **Support** — phrase/word pins and linked practice
5. **Memo** — keywords, not a full essay
6. **First attempt**
7. **Focused retry** — use `retryFocus` from JSON
8. **Follow-up** — use `followUpQuestion`
9. **Reflection** — use `reflectionQuestion`
10. **Completion**

Replace generic mission key points with the mission-specific values from the JSON.

Do not use the same planner for all situations.

## 7. MATCH SUPPORT BY COMMUNICATIVE FUNCTION

Remove the current index-based phrase rotation.

Add explicit function tags or mapping such as:

- buying time
- clarifying
- confirming
- empathising
- agreeing
- disagreeing
- reporting progress
- explaining cause
- recommending
- requesting
- repairing
- turn-taking
- closing

Use mission support phrases as text fallbacks.

When a saved Speaking Phrase or Vocabulary item matches a support phrase/function, allow the user to pin it.

Respect the combined maximum of three support items across Vocabulary and Speaking Phrases.

If the user tries to pin a fourth item, show a clear message.

## 8. DO NOT CLAIM THINGS THE MVP CANNOT DETECT

The app does not have speech-to-text.

Therefore:

- do not automatically claim the user used a phrase;
- do not claim pronunciation accuracy;
- do not claim grammar accuracy;
- do not assign a hard-coded confidence score;
- do not fabricate uninterrupted-speaking duration if it was not measured.

After recording, ask the user to self-check:

- Did you complete the message? Yes / Partly / Not yet
- Which pinned items did you use?
- How confident did you feel? 1–5
- Did you answer the follow-up?
- Which support stage did you use? Follow / Recall / Free

Save these as self-reported values.

Recording duration may be measured automatically.

## 9. REBUILD THE PRACTICE ROOM AS GUIDED WORKOUTS

Replace the current shallow prompt tabs with seven guided modes loaded from `practice-room-content.json`.

### Mode 1 — Mouth Reps

Purpose: automate useful chunks physically.

Flow:

1. Hear the phrase
2. Slow build
3. Natural rhythm
4. Clear communicative intention
5. Personal adaptation
6. Record optional final version

Show thought groups and focus words when available.

### Mode 2 — Tight Build

Purpose: make controlled sentence changes, then communicate.

Flow:

1. Base sentence
2. Transformation 1
3. Transformation 2
4. Transformation 3
5. Hide models
6. Final speaking prompt
7. One retry

Do not make this a grammar quiz. End with a useful message.

### Mode 3 — Loose Story

Purpose: organise a complete story from limited cues.

Show:

- scenario;
- four cue words;
- must-use communication goal;
- support frames;
- first attempt;
- retry focus;
- follow-up question.

### Mode 4 — Free Response

Purpose: answer a real listener in a real situation.

Show:

- listener role/situation;
- communicative outcome;
- key points;
- support phrases;
- timer;
- follow-up;
- Brave extension.

### Mode 5 — Echo & Shadow

Purpose: practise thought groups, stress, rhythm, and delivery.

Show:

- normal transcript;
- chunked transcript;
- focus words;
- playback rate options;
- four-stage progression;
- final personal adaptation.

Use SpeechSynthesis for the MVP.

Clearly state that browser voices vary and this is rhythm/repetition support, not pronunciation scoring.

### Mode 6 — Repair Lab

Purpose: train communication breakdown recovery.

Show:

- breakdown scenario;
- rescue phrase choices;
- repair task;
- first attempt;
- model repair;
- personal version;
- reflection.

### Mode 7 — Fluency Sprint

Purpose: repeat familiar content under changing support/time conditions.

Show:

- planning bullets;
- round timers;
- focus for each round;
- follow-up;
- no-restart rule when relevant;
- comparison reflection.

## 10. USE A CONSISTENT PRACTICE WORKOUT FLOW

Every Practice Room mode should visibly answer:

- What skill am I training?
- Why does this matter in real conversation?
- What do I do first?
- What should I improve on the retry?
- How do I know I completed it?
- Where can I use it next?

Use:

> Setup → First attempt → One focused retry → Reflection → Save/use elsewhere

Do not show only a prompt plus recorder.

## 11. LINK DAILY MISSIONS TO PRACTICE ROOM DRILLS

Every mission contains `linkedPracticeIds`.

For Normal and Full sessions:

- suggest one drill that directly prepares the mission;
- mark drills completed separately from mission completion;
- allow the user to open the drill without losing mission preparation;
- return the user to the mission afterward.

For Full Workout:

- choose a short warm-up from the linked list;
- after the mission, offer another linked drill as optional continuation.

On the Practice Room page:

- show “Recommended for Day X”;
- show the skills and missions connected to each drill;
- allow filters by mode, phase, category, and communicative function.

## 12. IMPROVE TODAY’S MISSION CARD

The dashboard card should show:

- programme day and phase;
- mission title;
- real-life situation;
- communicative outcome;
- skill focus;
- approximate duration;
- Easy / Practical / Brave availability;
- optional “Why this matters” disclosure.

Example:

> Day 29 · Workplace Communication  
> Give a concise project update  
> Your manager asks for a quick update before another meeting.  
> Outcome: explain progress, risk, and the next action in under one minute.

The main action remains:

> Start Today’s Speaking Mission

Also show:

- Continue unfinished session, when applicable;
- Review previous checkpoint;
- Practice Room recommendation;
- Vocabulary due count, but keep it secondary.

## 13. IMPROVE THE BIG 30 PAGE

Load `big-30-question-guides.json`.

Replace the same generic planner with question-specific:

- purpose;
- key points;
- support frames;
- follow-up question;
- common trap;
- Follow / Recall / Free instructions;
- 30-, 60-, and 75-second rounds.

Allow the user to compare recordings across attempts.

Do not force a model answer to be copied word for word.

Model answers, where retained, should be collapsible and labelled as examples.

## 14. ADD CHECKPOINT EXPERIENCES

Checkpoint days are already marked in the programme JSON.

A checkpoint should:

1. choose or combine skills from the preceding phase;
2. use less support;
3. include at least one follow-up or repair moment;
4. save a comparison recording;
5. ask what felt easier and what still caused freezing;
6. recommend two Practice Room drills based on the learner’s self-report.

Do not block progression for a low self-rating.

Checkpoint feedback should be supportive and practical.

## 15. ADD A PERSONAL PRACTICE QUEUE

Allow the user to save:

- missions;
- Practice Room drills;
- Big 30 questions;
- vocabulary speaking exercises;
- phrases.

Create a small “Practice next” queue.

Keep it simple:

- maximum 10 items;
- reorder;
- remove;
- start next;
- show content type and estimated time.

This helps the learner return to personally relevant content rather than only receiving system-selected tasks.

## 16. CONTENT AND STATE VERSIONING

Add a content version separate from the user-state schema version.

Store:

- `programmeVersion`;
- completed programme day IDs;
- completed practice drill IDs;
- checkpoint recordings/references;
- mission self-checks;
- unfinished session state;
- optional practice queue.

Migration must preserve:

- existing phrases;
- vocabulary;
- packs;
- recordings;
- Big 30 progress;
- existing completed missions;
- memos;
- preferences;
- progress;
- old backups.

Map old mission completion where possible. Do not silently mark all 60 days complete.

If mapping is uncertain, preserve old history as “legacy activity” and start programme progression at Day 1 or let the user choose.

## 17. REAL PROGRESS METRICS

Calculate from saved activity:

- programme days completed;
- phase progress;
- recorded speaking minutes;
- first attempts;
- retries;
- follow-ups answered;
- Practice Room drills completed;
- repair drills completed;
- Follow / Recall / Free usage;
- confidence trend based on user input;
- checkpoint recordings saved;
- vocabulary used in speaking based on self-confirmation.

Remove hard-coded demonstration metrics.

Use empty states when data does not exist.

## 18. USER EXPERIENCE AND MOTIVATION

Do not make the 60-day programme feel like a long compulsory course.

Use:

- “60 practice days,” not “60-day streak”;
- a two-minute minimum win;
- pause and resume;
- no lost-streak punishment;
- phase completion moments;
- unlocked skill labels;
- “Then vs Now” recording comparison;
- a clear next useful situation.

Allow a Busy Day Rescue:

- one 30-second answer;
- counts as speaking activity;
- does not automatically complete a full programme day unless the required minimum for that mission is met.

## 19. ACCESSIBILITY AND MOBILE

Ensure all redesigned flows work around 390px width.

Requirements:

- no horizontal overflow;
- recorder controls remain visible;
- long situation text wraps correctly;
- modal/dialog content scrolls;
- timer is screen-reader understandable;
- tabs are keyboard accessible;
- visible focus states;
- no reliance on colour alone;
- text-to-speech has a visible stop button;
- microphone denial has a recovery message.

## 20. TESTING

Add unit tests for:

### Content loading

- valid programme JSON;
- valid Practice Room JSON;
- valid Big 30 JSON;
- duplicate IDs;
- missing linked drill;
- malformed content fallback.

### Progression

- new user receives Day 1;
- next incomplete day is selected;
- missed calendar days do not skip content;
- replay does not advance;
- checkpoint handling;
- old mission migration.

### Session duration

- Quick uses short flow;
- Normal includes retry;
- Full includes linked drill and follow-up;
- query or route duration is respected.

### Difficulty

- Easy, Practical, and Brave change real requirements;
- support visibility changes;
- timer values change.

### Honest feedback

- no hard-coded confidence;
- phrase usage is self-reported;
- duration comes from recording metadata;
- completion self-check saves correctly.

### Practice Room

- all seven modes render;
- linked IDs resolve;
- guided stages advance;
- retry focus is shown;
- return-to-mission works.

### Big 30

- question-specific planners render;
- follow-up and common trap differ by question.

### Migration

- existing state is preserved;
- vocabulary remains;
- IndexedDB recordings remain;
- older backups import safely.

Run:

```bash
npm test -- --run
npm run typecheck
npm run build
```

Also perform rendered QA on desktop and mobile.

Confirm:

- no console errors;
- no blank states;
- no broken old routes;
- no horizontal overflow;
- microphone permission errors are understandable;
- LocalStorage migration works;
- IndexedDB recordings remain accessible.

## 21. IMPLEMENTATION ORDER

Work in these stages:

1. Inspect and summarise current architecture.
2. Add JSON content files, types, validation, and content service.
3. Add state migration and programme progress model.
4. Replace dashboard mission selection.
5. Implement duration and difficulty logic.
6. Redesign mission flow.
7. Redesign Practice Room with seven guided modes.
8. Link missions and drills.
9. Improve Big 30.
10. Add checkpoint and practice queue.
11. Replace hard-coded metrics.
12. Add tests.
13. Run rendered QA, typecheck, tests, and build.
14. Update README and PROJECT_CONTEXT.

Before changing code, list the exact files you expect to change.

After completion, report:

- what changed;
- data migration behaviour;
- tests run and results;
- remaining limitations;
- any browser-specific microphone or SpeechSynthesis limitations.

Do not return only a mockup or design. Implement the working feature.

## REQUIREMENT END
