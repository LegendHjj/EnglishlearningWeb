# Fluency Reset — Project Context and Handoff

Last updated: 2026-10-18

## Optional workbook practice packs

Approved in chat on 2026-10-18 and implemented on the current `mainbranch` checkout. Settings now offers three optional JSON content packs, downloaded only on request: 600 chunks with 1,200 examples plus 60 speaking prompts and 180 plan references; 120 Big 30 answers with guide/prompt references; and 120 conversations with reply challenges plus 20 sentence-building patterns. The converter `scripts/convert-practice-workbooks.py` reads the original three Excel workbooks using Python's standard library. It excludes personal-answer/progress sheets and editable personal cells. Generated files are in `public/practice-packs/`; portable copies were also saved beside the user's workbooks in GeneratedOutput.

Pack upload has a separate, strict version-1 content envelope, with file/field/count limits and an import preview. It merges rather than restoring a backup. Stable pack/item IDs make repeated imports harmless, and matching chunk text is also skipped. Existing imported content, personal notes, edited phrases and completion data are retained. Import persists before changing in-memory state so storage-quota failure leaves the current library intact. No packs are auto-installed during onboarding or migration.

Chunks use the existing shared Phrase collection and workout. Matching existing phrases retain their original examples while additional imported samples are available in the workout. Big 30 exposes an imported-example selector alongside My Answer; it never fills or overwrites a user's personal answer. Practice Room links to Extra practice (`?library=packs`), which searches by topic/type/history and provides Follow/Recall/Free support, model reply reveal, personal notes/replies, explicit practice check-ins and optional linked recordings. Model answers, personal notes, expressions and challenge replies are hidden in Recall/Free as appropriate. The original Big 30 example is now hidden outside Follow too.

Saved state/backup schema is 8, with `practicePacks` and `packPractice` keyed by `packId/itemId`. Older backups 1–7 migrate in place without adding optional content. Imported example check-ins remain separate from programme days and Big 30 recording completion; Progress displays a separate summary. `Recording.practiceItemId` links optional audio to an example while keeping the same IndexedDB database/store. Both backup types include pack content and check-ins; complete backups preserve linked audio. No backend, login or AI connection was added. See `docs/practice-pack-format.md` for the shareable JSON format.

Verification: all 35 test files / 125 tests passed; typecheck, production build and diff whitespace checks passed. Desktop/mobile Chromium QA at 1440 × 1000 and 390 × 844 verified catalogue preview, real JSON download/upload, all three pack imports, idempotent reimport, invalid-file preservation, existing My Answer/memo preservation, model hiding, saved notes/check-ins after reload, progress summary, chunk workout access and a synthetic microphone recording linked in IndexedDB. No horizontal overflow, app console errors or external requests occurred in that tested flow. Real microphone hardware and browsers other than Chromium were not exercised. One earlier full test run hit the existing lazy dashboard route's default one-second test wait under concurrent build/browser load; the focused test and subsequent complete 125-test run passed without changing its assertions.

## Optional Heart natural voice

Repeat playback fix (2026-10-14): the Heart backend retains completed PCM in a session-only LRU cache bounded by 64 requests and 16 MiB, keyed by text items and rate. Matching requests across owners/pages bypass worker inference. Cancelled or incomplete requests are not cached, and Stop during a replay prevents subsequent chunks. Reload/dispose clears generated audio; unseen text still requires local inference. Status copy now distinguishes loading the model from creating speech and does not describe every asset progress event as a fresh download. All 106 tests, typecheck, production build and diff whitespace checks passed. Browser timing and desktop/mobile QA for this change could not be completed: Chrome automation detached during the first-play wait and reconnection returned an unattached debugger. No latency measurement is claimed.

Voice selection fix (2026-10-13): selecting Heart, a browser voice gender, or an advanced browser voice now saves that voice choice immediately for all app Listen controls. Previously Settings preview used an unsaved form choice while other pages kept the saved engine. Voice-only saves preserve unsaved practice settings, and selecting a voice clears session fallback. Regression tests cover navigation into vocabulary listening and persistence after remount.

Development runtime fix (2026-10-13): ONNX JavaScript/WASM URLs now come from explicit Vite `?url` imports in `src/services/heartRuntime.ts`, rather than dynamically importing JavaScript from `public/heart-runtime/`. The latter worked in production but Vite rejected it in development. The preparation script now copies licences only and removes its two obsolete generated runtime copies. A real Vite-server regression reproduces the old failure and passes with the asset imports. Chrome at `localhost:5173` reached Playing Heart with no console errors, and Stop returned to idle. All 102 tests, typecheck and production build passed.

Heart (`af_heart`) is an optional local speech engine behind the shared `speechController`; browser speech remains the default. Settings selection and save do not download the model. Explicit preview or Listen lazily loads a worker, fetches the q8 model and Heart voice from the pinned model revision, and plays generated PCM through Web Audio. Stop, request IDs, owner cleanup and recorder microphone locks prevent stale playback. Page and modal status hosts expose preparation, playback, errors, Retry and browser fallback without including learner text. The worker uses one WASM thread, a guarded tokenizer without truncation, and ordered segment acknowledgements. Runtime WebAssembly files and licences are copied locally during dev/build.

Current saved-state/backup schema is 7; imports 1–6 migrate to browser speech unless a valid Heart choice exists. The storage key and IndexedDB audio store are unchanged; model files and generated speech are excluded from backups. The npm dependencies are pinned to `kokoro-js` 1.2.1, `@huggingface/transformers` 3.5.1 and `phonemizer` 1.2.1.

On 2026-10-12, a real Chromium production preview at `/EnglishlearningWeb/` downloaded the q8 model, produced non-empty Heart audio, reached Playing Heart and returned to idle after the sample. A second warm preview reached playback and Stop returned to idle. A vocabulary Listen & Recap action used Heart; its modal displayed one active Stop control. Opening Review now cancelled speech before the covering modal appeared. At 1440 × 1000 and 390 × 844, the status remained visible and the page had no horizontal overflow; the Chrome app console had no errors. The final automated checks passed: 101 tests, typecheck, and production build. This was observed through browser UI and worker behavior; the agent did not make a human listening judgment about naturalness. Other browsers, real microphone hardware, cold-offline failure, warm-offline playback, cache eviction and blocked download were not exercised in that preview. Network requests were constrained to pinned public model resources by code, but individual request URLs were not captured during this browser QA.

## Big 30 personal answers and AI prompt helper

Approved in chat on 2026-10-12. Each existing Big 30 question now has Practice and My Answer tabs. `src/features/big30/AnswerBuilder.tsx` saves long user notes, a 30/60/90-second target, pasted spoken answer, recall keywords, and useful chunks. `src/utils/big30Prompt.ts` builds a copyable, tool-independent prompt from the actual question guide: purpose, key points, frames, common trap, and follow-up. It requests relevant facts from the notes, one memorable detail, natural everyday English, corrected grammar without invented facts, and three plain-text output sections. Clipboard failure selects the visible prompt for manual copying. Timing and word ranges are estimates.

`src/features/big30/PersonalAnswerSupport.tsx` shows a personal answer and optional browser voice in Follow, keywords in Recall, and no personal answer/keywords/chunks in Free. The old speaking memo is hidden outside Follow. Original guide support remains available. Personal answers are keyed by the existing q1–q30 IDs and do not count as completed speaking or programme work. Only existing recording completion updates question completion.

`AppState.big30Answers` stores optional-per-question `Big30Answer` records. Current state/backup schema is 6; versions 1–5 import and migrate without losing phrases, chunks, memos, progress, or audio. Malformed optional personal fields are normalised rather than discarding a valid library. LocalStorage key and IndexedDB remain unchanged. No backend, login, AI API, or automatic transmission was added; the user copies the prompt to their chosen tool. Recordings retain their existing questionId links. Recording locks workspace/question changes until the take is stopped and saved/deleted; voice playback is cancelled when capture starts and when its support view unmounts.

Verification on 2026-10-12: all 24 test files / 78 tests passed, TypeScript passed, and the production build passed. Playwright fallback (Browser plugin unavailable) passed at 1440 × 1000 and 390 × 844: actual clipboard copying, long Chinese notes, duration selection, pasted answers and reload, per-question isolation, original guide switching, Follow/Recall/Free support, keyboard tabs, recording navigation locks, synthetic microphone capture and IndexedDB replay, unchanged memos/library, no horizontal overflow, no error overlay, no console errors/warnings, and no external app requests. Human/real-device microphone capture and AI-tool-generated response quality were not exercised; the app only constructs the prompt.

Reopening recordings exposed a pre-existing StrictMode bug in `RecordingList`: render-time audio URL creation was followed by effect cleanup revoking the displayed URLs. Audio URL creation and cleanup now share one effect, with a regression test for valid URLs and complete release on exit. A reviewer checked this fix and the speech/capture protection.

## Personal Chunk Practice enhancement

Approved in chat on 2026-10-12 after reviewing all eight files in the user's learning-materials folder; see `docs/learning-materials-review.md`. The Library now includes Chunk Practice alongside its existing tabs. It shares the existing `Phrase` collection rather than introducing a duplicate notebook. Optional fields are `chunkKind`, `source`, `recallCue`, `variations`, and `chunkReview`; old phrases work without them.

The guided workout is listen/repeat → two personal sentences → hidden recall from a situation → optional short recording with Follow/Recall/Free support → self-check. Completion increments phrase practice once; usage increases only with the learner's explicit checkbox. Review suggestions use 1, 3, 7, 14, and 30 days: Again resets to one day, With help keeps the current interval, On my own advances one step. These are product defaults, not a fluency assessment. Chunk workouts do not fabricate completed programme days, authored drills, or speaking duration.

The 12 authored starter chunks are opt-in and skip matching text/IDs, preserving edited existing phrases. No transcripts or PDFs are shipped with the website. Existing mission pinning retains the combined three-item phrase/vocabulary limit.

`Recording.phraseId` links audio to a chunk. IndexedDB and the LocalStorage key remain unchanged; state/backup schema is 5 and versions 1–4 remain importable. Migration never adds deleted seed items. Recorder cleanup releases late permission streams and active capture; the chunk's next action stays disabled during capture, saving, or an unsaved take.

Implementation boundaries: `src/features/chunks/` contains the overview/workout, `src/data/chunks.ts` the opt-in collection, `src/utils/chunks.ts` the review/deduplication/cue helpers, and `src/chunks.css` the responsive styling. Dashboard and Practice Room link into the new Library tab.

Verification on 2026-10-12: all 20 test files / 69 tests passed, TypeScript passed, and the production build passed. Playwright fallback (Browser plugin unavailable) verified the app at 1440 × 1000 and 390 × 844: optional starter deduplication, personal chunk creation, variations, hidden recall/hints, synthetic microphone capture through MediaRecorder, local audio save/replay, explicit usage and review, persistence after reload, selected-tab visibility, search sizing, no horizontal overflow, dialog focus/Escape, and the existing dashboard entry. No browser console errors or warnings. A reviewer verified the microphone lifecycle and answer-concealment fixes. Real-device microphones and browsers other than Chromium remain untested in this enhancement.

## 60-practice-day programme upgrade

The application now uses the repository content pack as its learning source:

- `src/content/fluency-reset-60-day-program.json`: 60 missions and nine phases
- `src/content/practice-room-content.json`: 156 drills across seven guided modes
- `src/content/big-30-question-guides.json`: 30 question-specific guides

`src/services/contentRepository.ts` validates these packs at runtime and resolves phase, mission, drill, and Big 30 relationships. The dashboard selects the earliest incomplete programme day rather than rotating by calendar date. Programme completion is stored separately from preserved legacy mission history.

Mission duration now changes the actual flow: Quick Win uses one attempt and a self-check, Normal adds a focused retry, and Full Workout adds a linked warm-up, retry, follow-up, and reflection. Easy, Practical, and Brave use authored preparation time, speaking targets, required points, support visibility, and pressure rules.

The Practice Room now renders Mouth Reps, Tight Build, Loose Story, Free Response, Echo & Shadow, Repair Lab, and Fluency Sprint from JSON. Each follows setup, attempt, retry, reflection, and completion. Big 30 uses question-specific purposes, planners, frames, traps, follow-ups, and timed rounds.

Local state is schema version 6 with a separate programme content version. Migration preserves preferences, phrases, packs, vocabulary, memos, Big 30 progress, old activity, pins, practice results, and Library state. Backup versions 1–5 remain importable. IndexedDB remains on the existing database/store, so recordings stay accessible.

Progress metrics now derive from mission self-checks, completed drills, and recording metadata. Phrase/vocabulary usage and confidence are saved only when the learner explicitly reports them.

## What this project is

Fluency Reset is a responsive, local-first English speaking gym for adults who understand basic or intermediate English but freeze when they need to speak. It trains retrieval, mouth repetition, reusable phrases, and real-life speaking confidence rather than grammar scores or passive study.

Tagline: “Stop studying English. Start training your speaking reflex.”

The main product loop is:

1. Choose a Quick Win (2 minutes), Normal Practice (5 minutes), or Full Workout (10 minutes).
2. Choose Easy, Practical, or Brave mission difficulty.
3. Prepare a keyword memo rather than an essay.
4. Pin up to three phrases from the Speaking Notebook.
5. Record an answer locally.
6. Try one focused retry.
7. Receive positive, measurable completion feedback.

The gradual support system is Follow → Recall → Free, or Refer → Recall → Speak Naturally.

## Current implementation status

The core-complete MVP is implemented. It is not a static mockup.

Implemented routes and features:

- Landing page with product explanation and CTA
- Six-step onboarding stored locally
- Personalised dashboard and three session durations
- Daily Mission flow with difficulty, memo, phrase picker, pinned phrases, note stages, recorder, retry, and completion state
- Speaking Notebook with search, status filtering, add/edit/delete, favourites, TTS playback, phrase pinning, and four Speaking Packs
- Big 30 Questions with planners, sentence frames, memo, note stages, and recording
- Practice Room with Mouth Reps, Tight, Loose, Free, and Shadowing modes
- Recordings library using IndexedDB audio blobs
- Progress page using Recharts
- Settings for preferences, JSON export/import, reset, and recording deletion
- Responsive desktop sidebar and mobile bottom navigation
- Browser microphone permission, denial, and unsupported-browser handling
- Browser SpeechSynthesis phrase playback

Seed content includes 12 missions, 30 Big Questions, 30 phrase cards (including five rescue phrases and five sentence frames), four packs, six Tight exercises, six Loose exercises, six Free exercises, and five Mouth Reps.

## Technology and structure

- React 19
- Vite 7
- TypeScript
- Tailwind CSS 4 plus project CSS tokens
- React Router
- Lucide React icons
- Recharts, lazy-loaded with the Progress route
- Vitest and Testing Library
- Browser MediaRecorder and SpeechSynthesis APIs
- LocalStorage for versioned JSON application state
- IndexedDB for audio blobs and recording metadata

Important folders:

- `src/pages/` — route-level screens
- `src/features/` — recorder feature
- `src/components/` — app shell and shared UI
- `src/context/` — application state and mutations
- `src/data/` — seeded missions, phrases, questions, packs, and exercises
- `src/hooks/` — recorder and speech browser APIs
- `src/services/` — LocalStorage and IndexedDB persistence
- `src/types/` — shared domain interfaces
- `src/utils/` — note-stage and timer helpers

## Visual direction

The accepted design is an adult wellness/habit-building product rather than a school LMS. The implementation uses:

- Warm off-white background
- Deep forest/teal green primary colour
- Restrained coral accent
- Pale sage selected states
- Fine neutral borders and subtle shadows
- Large editorial headings and compact readable UI type
- Rounded cards without childish styling
- A strong circular microphone action
- Minimal distractions during speaking

The generated concept originally used a leaf logo. The implementation intentionally uses a simpler reset-arrow mark. The rest of the primary dashboard and mission visual language was matched closely.

## Verification already completed

The following passed immediately before the handoff:

```bash
npm test -- --run
npm run typecheck
npm run build
```

Result: 3 test files and 7 tests passed; TypeScript passed; the production build passed.

Playwright fallback QA was used because the Browser plugin was unavailable. Verified viewports:

- Desktop: 1536 × 1024
- Mobile: 390 × 844

Verified interaction paths:

- Landing → onboarding → dashboard
- Dashboard → mission difficulty → preparation → speaking screen → Recall mode
- Notebook → add phrase → save → search and display result
- All application routes render at mobile width
- Mobile navigation has five horizontal items
- No mobile horizontal overflow
- No console errors or warnings after final fixes

## Known MVP limitations

- There is no backend, account, or cross-device sync.
- Progress/library JSON excludes audio; complete backups include audio.
- Live recording format and pause support depend on the browser.
- Real microphone capture requires user permission and a supported device/browser.
- Phrase usage is user-directed rather than automatically detected because speech-to-text is excluded.
- No pronunciation scoring, live AI conversation, grammar correction, payment, community, or teacher features.
- Progress seed metrics such as 12 speaking days and 46 minutes are demonstration data until replaced by accumulated user activity.

## Safe next improvements

If the user asks for continued development, useful next steps are:

1. Add deeper component interaction tests for onboarding, notebook CRUD, mission progression, and IndexedDB recording operations.
2. Add explicit rename/link/compare implementation polish in the recordings library.
3. Improve progress calculations so every dashboard metric is derived only from saved activity.
4. Add a comeback-mode dashboard message based on last activity date.
5. Add more complete Big 30 “Then vs Now” comparison flows.
6. Test actual microphone capture manually in the user’s preferred browser.
7. Run accessibility auditing with axe and keyboard-only browser QA.

Do not add these automatically; confirm scope with the user first.

## Repository and location

User-facing project location:

`D:\Development\EnglishlearningWeb`

Current implementation branch at handoff:

`feature/fluency-reset-mvp`

Primary implementation commit before these handoff docs:

`75e850a feat: build Fluency Reset speaking MVP`
