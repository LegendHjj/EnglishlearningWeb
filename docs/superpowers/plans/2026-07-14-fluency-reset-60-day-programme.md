# Fluency Reset 60-Day Programme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing mission carousel into a progressive, JSON-backed 60-practice-day programme with meaningful session lengths, difficulty, guided Practice Room workouts, specific Big 30 guidance, safe migration, and real saved-activity metrics.

**Architecture:** Runtime-validated JSON feeds a typed content repository. Pure progression, flow, migration, and metrics utilities isolate domain logic from React pages; focused mission and practice components render the content while AppContext persists only learner state.

**Tech Stack:** React 19, TypeScript 5.8, Vite 7, React Router 7, Vitest, Testing Library, LocalStorage, IndexedDB, MediaRecorder, SpeechSynthesis.

## Global Constraints

- Preserve the existing backend-free, login-free, local-first architecture.
- Keep audio in the existing `fluency-reset-audio` IndexedDB database.
- Preserve all existing Library, vocabulary, phrase, pack, memo, Big 30, recording, and preference data.
- Do not add speech-to-text, scoring, external AI APIs, payments, or social features.
- Keep the approved calm adult wellness visual system and non-punitive copy.
- Do not infer phrase use, confidence, pronunciation, grammar, or message success.
- Keep every current route working and add new routes only where necessary.

---

### Task 1: Typed content repository and validation

**Files:**
- Create: `src/content/types.ts`
- Create: `src/content/validation.ts`
- Create: `src/services/contentRepository.ts`
- Create: `src/services/contentRepository.test.ts`

**Interfaces:**
- Produces `ProgrammeContent`, `ProgrammeMission`, `PracticeContent`, `PracticeDrill`, `Big30Guide`.
- Produces `getProgramme()`, `getMissionById()`, `getMissionByDay()`, `getDrillById()`, `getLinkedDrills()`, `getBig30Guide()`, and `getContentStatus()`.

- [ ] Write tests proving all three packs load, counts are 60/156/30, IDs are unique, phase and drill references resolve, malformed packs return an error result, and missing linked drills are rejected.
- [ ] Run `npm test -- --run src/services/contentRepository.test.ts` and confirm failures before implementation.
- [ ] Implement discriminated drill types, strict required-field validators, cross-pack reference validation, safe repository fallbacks, and development error logging.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Version-4 state and safe migration

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/seed.ts`
- Modify: `src/services/storage.ts`
- Modify: `src/services/storage.test.ts`
- Create: `src/utils/programme.ts`
- Create: `src/utils/programme.test.ts`

**Interfaces:**
- Produces `ProgrammeProgress`, `MissionSelfCheck`, `UnfinishedMissionSession`, `PracticeQueueItem`, and expanded `Recording` metadata.
- Produces `getNextIncompleteMission(missions, completedIds)`, `isProgrammeReplay()`, `migrateLegacyMissionIds()`, queue mutation helpers, and schema-v4 import/export.

- [ ] Add failing tests for new-user Day 1, earliest incomplete selection, calendar independence, replay safety, checkpoint recognition, ten-item queue cap, legacy preservation, curated legacy credit, and backup versions 1-3.
- [ ] Run the focused tests and verify the new expectations fail.
- [ ] Add schema-v4 defaults and additive migration while retaining `fluency-reset-state-v1` as the storage key.
- [ ] Keep legacy completed IDs in history; credit only curated equivalents and never derive sequence from calendar time.
- [ ] Extend complete/progress backups to version 4 while continuing to import versions 1-3.
- [ ] Run storage and programme tests.

### Task 3: Programme overview and dashboard progression

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Create: `src/pages/ProgrammePage.tsx`
- Create: `src/pages/ProgrammePage.test.tsx`
- Modify: `src/pages/LibraryIntegration.test.tsx`

**Interfaces:**
- Consumes the content repository and programme utilities.
- Produces `/app/programme`, next-mission dashboard navigation, phase cards, checkpoint markers, completed/upcoming states, and replay links.

- [ ] Add failing route and interaction tests for Day 1, earliest incomplete day, phase progress, checkpoint labels, and session query parameters.
- [ ] Implement the programme route without removing existing routes or primary navigation access.
- [ ] Replace calendar mission rotation with repository progression and show day, phase, situation, outcome, skill focus, duration, and a linked recommendation.
- [ ] Add neutral welcome-back and empty-content states.
- [ ] Run the focused dashboard/programme tests.

### Task 4: Mission flow engine and honest completion

**Files:**
- Create: `src/features/missions/missionFlow.ts`
- Create: `src/features/missions/missionFlow.test.ts`
- Create: `src/features/missions/MissionOverview.tsx`
- Create: `src/features/missions/MissionPreparation.tsx`
- Create: `src/features/missions/MissionAttempt.tsx`
- Create: `src/features/missions/MissionSelfCheck.tsx`
- Create: `src/features/missions/MissionComplete.tsx`
- Modify: `src/pages/MissionPage.tsx`
- Modify: `src/features/Recorder.tsx`
- Modify: `src/features/Recorder.test.tsx`

**Interfaces:**
- Produces `getSessionStages(2|5|10)`, `getDifficultySupport(level)`, resumable mission state, and saved self-checks.
- Extends `Recorder` callbacks with successfully stored recording metadata rather than only elapsed seconds.

- [ ] Write failing tests proving Quick omits mandatory retry, Normal includes retry, Full includes warm-up and follow-up, query duration is respected, and Easy/Practical/Brave change prep, speaking time, support, requirements, and restart rules.
- [ ] Add tests that confidence and phrase usage remain unset until user input and that completion stores the user’s exact self-check.
- [ ] Implement the flow engine and focused mission components using JSON mission content.
- [ ] Persist unfinished stage, memo, difficulty, duration, recording references, and return target after linked practice.
- [ ] Mark programme completion only after the self-check; keep replay completion idempotent.
- [ ] Run all mission and recorder tests.

### Task 5: Seven guided Practice Room modes

**Files:**
- Create: `src/features/practice/PracticeWorkout.tsx`
- Create: `src/features/practice/MouthRepsWorkout.tsx`
- Create: `src/features/practice/TightBuildWorkout.tsx`
- Create: `src/features/practice/LooseStoryWorkout.tsx`
- Create: `src/features/practice/FreeResponseWorkout.tsx`
- Create: `src/features/practice/EchoShadowWorkout.tsx`
- Create: `src/features/practice/RepairLabWorkout.tsx`
- Create: `src/features/practice/FluencySprintWorkout.tsx`
- Create: `src/features/practice/PracticeWorkout.test.tsx`
- Modify: `src/pages/PracticePage.tsx`
- Modify: `src/hooks/useSpeech.ts`

**Interfaces:**
- Consumes typed `PracticeDrill` variants.
- Produces guided Setup → Attempt → Retry → Reflection → Complete state, drill filters, completion records, mission return navigation, playback rate, and visible TTS stop.

- [ ] Write failing tests that all seven modes render their mode-specific fields and advance through guided stages.
- [ ] Test retry focus, completion persistence, mission recommendation labels, filters, missing drill fallback, and return-to-mission behavior.
- [ ] Implement the shared workout shell and seven small mode renderers.
- [ ] Extend SpeechSynthesis support with selected playback rate and visible stop state.
- [ ] Store drill completion separately from mission completion and record repair/sprint-specific metrics.
- [ ] Run Practice Room and speech tests.

### Task 6: Mission links, support matching, and practice queue

**Files:**
- Create: `src/utils/supportMatching.ts`
- Create: `src/utils/supportMatching.test.ts`
- Create: `src/features/programme/PracticeQueue.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/pages/MissionPage.tsx`
- Modify: `src/pages/PracticePage.tsx`
- Modify: `src/pages/NotebookPage.tsx`
- Modify: `src/pages/Big30Page.tsx`

**Interfaces:**
- Produces communicative-function matching across mission fallbacks, phrases, and vocabulary.
- Produces queue add/remove/move/start actions for missions, drills, Big 30 questions, phrases, and vocabulary exercises.

- [ ] Add failing tests for function-aware support matches, combined three-item pin cap, ten-item queue cap, reorder/remove/start, and preserved mission preparation after linked practice.
- [ ] Implement normalized text/tag matching with mission support phrases as guaranteed fallback content.
- [ ] Add queue actions without making the queue dominate the dashboard or Library.
- [ ] Run matching, queue, Library, and mission integration tests.

### Task 7: Big 30 guide integration and comparisons

**Files:**
- Create: `src/utils/big30.ts`
- Create: `src/utils/big30.test.ts`
- Modify: `src/pages/Big30Page.tsx`
- Modify: `src/features/RecordingList.tsx`
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces stable `qN` to `big-NN` guide mapping and timed round metadata.
- Adds attempt labels and comparison selection without changing stored audio.

- [ ] Write failing tests showing two different questions receive different purpose, points, trap, follow-up, stages, and rounds.
- [ ] Test that existing `qN` memos, completion IDs, and recordings remain visible.
- [ ] Implement question-specific guides, collapsible example answers, timed rounds, follow-up recording, and two-attempt comparison.
- [ ] Run Big 30 and recording-list tests.

### Task 8: Checkpoints and derived progress metrics

**Files:**
- Create: `src/services/progressMetrics.ts`
- Create: `src/services/progressMetrics.test.ts`
- Create: `src/features/missions/CheckpointReflection.tsx`
- Modify: `src/pages/MissionPage.tsx`
- Modify: `src/pages/ProgressPage.tsx`
- Modify: `src/pages/DashboardPage.tsx`

**Interfaces:**
- Produces saved-activity metrics for programme days, phase progress, recorded minutes, attempts, retries, follow-ups, drills, repair work, note stages, confidence trend, checkpoints, and self-confirmed vocabulary use.

- [ ] Write failing tests for empty metrics, no double counting, measured recording durations, confidence from self-checks only, and checkpoint recommendations based on reflection.
- [ ] Implement checkpoint comparison references, supportive reflection, and two linked drill recommendations.
- [ ] Replace dashboard/progress calculations and hard-coded confidence writes with the metrics service.
- [ ] Add honest empty states where no activity exists.
- [ ] Run metric, mission, dashboard, and progress tests.

### Task 9: Responsive styling, documentation, and final verification

**Files:**
- Modify: `src/features.css`
- Modify: `src/pages.css`
- Modify: `src/library.css` only where integration requires it
- Modify: `README.md`
- Modify: `PROJECT_CONTEXT.md`
- Modify: relevant route and integration tests

**Interfaces:**
- Produces responsive programme, mission, Practice Room, Big 30, queue, and checkpoint layouts using existing tokens.

- [ ] Run `npm test -- --run`, `npm run typecheck`, and `npm run build`; repair every relevant failure.
- [ ] Run browser QA at desktop and 390px mobile widths for landing, onboarding, dashboard, programme, each mission duration/difficulty, all seven practice modes, Big 30, Library, recordings, progress, and settings.
- [ ] Verify no horizontal overflow, no relevant console errors, visible microphone recovery, visible TTS stop, keyboard-accessible controls, and preserved saved data.
- [ ] Test a version-3 LocalStorage fixture and existing IndexedDB recording fixture through the rendered app.
- [ ] Update README and project context with schema/content versions, programme behavior, migration, privacy, verification, and remaining browser limitations.
