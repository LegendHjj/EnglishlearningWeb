# Heart Natural Female Voice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the optional, free Heart female voice to existing speech controls with local processing, explicit downloads, dependable Stop and microphone protection.

**Architecture:** Keep the existing React app and put its speech hook behind one shared coordinator. A browser adapter preserves SpeechSynthesis; a lazy worker adapter provides pinned Kokoro inference and progressive local playback. Engine selection migrates with saved preferences; microphone locks and request ownership protect every asynchronous path.

**Tech Stack:** Existing React 19/Vite/TypeScript/Vitest stack, browser Web Worker/WebAssembly/Web Audio/Cache APIs, `kokoro-js` 1.2.1, its Transformers.js and phonemizer dependencies.

**Spec:** `docs/superpowers/specs/2026-10-12-heart-natural-voice-design.md` — approved in chat on 2026-10-12.

**Plan status:** Implemented locally on `feature/fluency-reset-mvp` on 2026-10-12 using native execution and an independent read-only review. The implementation, docs, and focused regression tests are in the working tree. Final checks: 101 tests, typecheck, build, and production browser QA at desktop and mobile widths passed. The original checklist below is retained as the execution specification; `PROJECT_CONTEXT.md` records verified results and remaining browser/environment limitations. No push or deployment was performed.

## Global Constraints

- Voice: **`af_heart`**, American English female, from Kokoro 1.0.
- Model: **`onnx-community/Kokoro-82M-v1.0-ONNX`**, revision **`1939ad2a8e416c0acfeecc08a694d14ef25f2231`**.
- Use `kokoro-js` **1.2.1**, a pinned npm dependency with a committed lockfile.
- Initial runtime: **WebAssembly**, **q8** weights (`onnx/model_quantized.onnx`, 92,361,116 bytes). Use one inference thread; no WebGPU or cross-origin isolation requirement.
- Heart does not become the default for existing or new users. No downloads on app load, onboarding, Settings entry, imports, navigation or recording.
- Existing voices and data remain available; learner text/audio never enters a Heart network request. No backend, login, external AI inference API, speech-to-text, scoring, payments or social features.
- Warm offline playback means the already-open app after preparation; no service worker or offline app installation.
- Retain the current visual direction. Generated speech is ephemeral and does not enter recordings or learning metrics.

## Review Focus

1. A cancelled request resolves after a newer request: it must neither play nor reset the newer status — Task 2 tests.
2. A second recorder, pending permission or failed setup overlaps another capture: microphone locks must remain owned and prevent speech — Task 4 tests.
3. A long sentence exceeds the tokenizer window or contains one enormous word: preserve valid speech completely, and report unrepresentable input instead of truncating — Task 3 tests.
4. Imported Heart preferences, stale voice caches or a cleared cache: importing must not download, and explicit preparation must use the pinned revision — Tasks 1 and 3 tests.
5. Delayed playback loses audio permission or its status is hidden behind a modal: show actionable feedback in one visible host without exposing the answer — Tasks 3 and 5 tests.

## Execution baseline and scope

Execution checkout actually observed on 2026-10-12: `D:\Coding\EnglishlearningWeb`, branch `feature/fluency-reset-mvp`, clean at start, HEAD `7dfef9e` (`publish enhancement`). The earlier Chunk Practice and Big 30 enhancements were already committed in this checkout. Heart work was implemented in place, preserving them.

At execution start, reread AGENTS.md and its required files, inspect status/diff, and run the baseline tests/typecheck/build. Preserve earlier work. Do not include unknown user edits, reset, clean, discard changes, push or deploy. If selective commits are necessary, inspect their exact staged hunks. Plan preparation itself committed documents only.

## File boundaries and contracts

New files: `src/services/speechTypes.ts` (shared request/status/backend contracts), `speechController.ts` (coordination), `browserSpeech.ts` (existing voice selection/native events), `audioPlayback.ts` (lazy Web Audio activation/segment playback), `heartVoice.ts` (worker bridge), `heartAssets.ts` (pinned public resource resolution), `heartSegments.ts` (safe input segmentation), `src/workers/heartVoice.worker.ts` (inference), `src/features/speech/VoiceStatus.tsx` (status controls), `src/speech.css`, `scripts/prepare-heart-assets.mjs` (local runtime asset packaging), `THIRD_PARTY_NOTICES.md`.

Modify only integration points: types/seeds/storage, `useSpeech`, `useRecorder`, Settings, AppShell, current speech consumers, package/lockfile/build asset configuration and the relevant tests/docs. Avoid route rewrites or unrelated extraction from existing large files.

Shared contracts, defined in Task 2:

- `SpeechRequest`: `{ownerId:string; engine:SpeechEngine; items:string[]; rate:number; browserVoice?:string; voiceGender?:VoiceGender}`.
- `SpeechSnapshot`: `{phase:'idle'|'preparing'|'playing'|'error'; engine?:SpeechEngine; ownerId?:string; hostId?:string; progress?:{file:string; loaded:number; total?:number}; error?:string; browserFallback:boolean; microphoneBlocked:boolean}`. Snapshots are immutable/stable between updates; errors/status contain no answer text.
- `SpeechBackend`: `supported():boolean`, `play(request:SpeechRequest, signal:AbortSignal, report:(patch:Partial<SpeechSnapshot>)=>void):Promise<void>`, `stop():void`, `dispose():void`.
- `AudioPlayback`: `activate():Promise<void>`, `play(pcm:Float32Array,sampleRate:number,signal:AbortSignal):Promise<void>`, `stop():void`, `dispose():void`. `createAudioPlayback():AudioPlayback` and production `audioPlayback` allocate no AudioContext until activation.
- `createSpeechController(browser:SpeechBackend, getHeart:()=>Promise<SpeechBackend>, audio:AudioPlayback)`: produces `speak(request):void`, `stop():void`, `stopOwner(ownerId):void`, `subscribe(listener):()=>void`, `getSnapshot():SpeechSnapshot`, `supports(engine:SpeechEngine):boolean`, `acquireMicrophone(ownerId):()=>void`, `registerHost(host:{id:string;scope:'page'|'modal'}):()=>void`, `retry():void`, `useBrowserForNow():void`, `clearBrowserFallback():void`, `dispose():void`.
- `speechController` is the singleton used by production. The Heart factory is a dynamic import; creating/subscribing to the singleton must not import or prepare Heart.
- `useSpeech(preferredVoice?:string, voiceGender?:VoiceGender, engine:SpeechEngine='browser')` preserves `speak(text,rate?)`, `speakAll(items)`, `stop`, `speaking`, `supported` and adds the snapshot. It owns a stable instance ID, subscribes with `useSyncExternalStore`, and calls `stopOwner` on unmount/configuration change. All application callers pass the engine explicitly; Settings passes its unsaved form choice.

### Task 1: Save the engine choice without starting the engine

**Files:** Modify `src/types/index.ts`, `src/data/seed.ts`, `src/services/storage.ts`, `src/services/storage.test.ts` and schema assertions in `src/pages/Big30Page.test.tsx` where needed.

**Interfaces:** Produces `SpeechEngine = 'browser'|'heart'`, optional `UserPreferences.speechEngine`, and migration/export schema 7. Missing/invalid engines become `browser`; named browser voice/gender remain separate fields.

- [ ] Write failing storage tests: version-6 data retains the complete library, chunks, Big 30 answers, memos, pins and progress with `speechEngine === 'browser'`; malformed engine values preserve the rest of the export; both version-7 backup types round-trip `heart`, browser name/gender and recorded blobs/links. Importing performs zero worker creation or Heart fetches.
  Named test `v6 import preserves personal answers and defaults to browser`: after importing the version-6 fixture, assert `expect(restored.schemaVersion).toBe(7)`, `expect(restored.preferences.speechEngine).toBe('browser')`, `expect(restored.big30Answers).toEqual(legacy.big30Answers)` and equality of its remaining saved collections.
- [ ] Run `npm test -- --run src/services/storage.test.ts`; confirm failures are the new schema/migration assertions, not fixture failures.
- [ ] Implement the type/default/migration and version-7 envelopes with imports 1–6 retained. Leave the existing storage key, IndexedDB and deletion semantics intact. Do not import an engine implementation into storage or seeds.
- [ ] Run storage and existing Big 30/chunk backup tests; require all retained-data assertions and new exports to pass.
- [ ] Review staged changes and commit this deliverable as `feat: preserve optional speech engine preferences`.

### Task 2: Coordinate browser speech, ownership and cancellation

**Files:** Create `speechTypes.ts`, `speechController.ts`, `browserSpeech.ts`, `audioPlayback.ts` and their tests under `src/services/`; modify `src/hooks/useSpeech.ts`; add `src/hooks/useSpeech.test.tsx`. These paths refer to the `src/services/` files listed above.

**Interfaces:** Implements the contracts above. Task 3 supplies `createHeartVoice(audioPlayback)` through the lazy factory; until then, use a rejected lazy factory with a helpful unsupported error, not an eager engine import. Heart capability checks use Worker/WebAssembly/AudioContext presence, not a lazy factory call. Host registration selects the most recently registered modal, otherwise page host, and returns an idempotent unregister function.

- [ ] Write tests with deferred fake backends: A is stopped/replaced by B and A's late resolve/reject never plays or changes B; empty/whitespace items do not initialise Heart; `speakAll` preserves trimmed non-empty order; unmounting an unrelated owner does not stop the active owner; StrictMode cleanup leaves no active requests. Assert browser named voice overrides gender and current female/male fallbacks remain intact.
  Named test `late A completion cannot finish B`: start the two deferred backend requests in order, then resolve A; assert `expect(controller.getSnapshot().ownerId).toBe('B')` and `expect(controller.getSnapshot().phase).not.toBe('idle')` while B remains pending.
- [ ] Add microphone-lock tests: acquiring a lock immediately stops both possible engines; every speech/retry/fallback action is blocked while any owned lock remains; releasing one lock does not unlock another; releasing twice is harmless. Test explicit fallback labels browser playback without changing saved preferences, and retry clears fallback.
- [ ] Add audio tests: Heart actions synchronously invoke `audio.activate()` before awaiting the dynamic engine import; browser actions never allocate audio; segment play ends/releases resources; repeated Stop is safe; refused context resume creates a terminal error. These assertions cover loss of transient activation while downloading an engine.
- [ ] Run `npm test -- --run src/services/speechController.test.ts src/services/browserSpeech.test.ts src/services/audioPlayback.test.ts src/hooks/useSpeech.test.tsx`; confirm the new missing coordinator/behaviour fails.
- [ ] Implement stable snapshots, synchronous request invalidation, lazy Heart loading, native event cleanup and owned locks. Give every backend completion/report a request-ID check. Retain a failed request only while its owner still exists; Stop/navigation clears its retry payload. On explicit Heart speech, synchronously start AudioContext resume before awaiting engine/model work; pass the already-activated player to the Heart backend. No context allocation on import/subscription.
- [ ] Run the focused tests and `src/features/big30/PersonalAnswerSupport.test.tsx`; review/commit as `feat: coordinate speech playback and cancellation`.

### Task 3: Deliver real pinned Heart speech in a worker

**Files:** Create `src/services/heartVoice.ts`, `heartAssets.ts`, `heartSegments.ts`, their tests, `src/workers/heartVoice.worker.ts`, `scripts/prepare-heart-assets.mjs`, `THIRD_PARTY_NOTICES.md`; modify package/lockfile, `vite.config.ts` if asset handling requires it, and the singleton's lazy factory.

**Interfaces:** `createHeartVoice(audio:AudioPlayback):SpeechBackend`; `pinHeartResourceUrl(url:string):string`; `splitHeartInput(text:string):string[]`. Worker commands are `prepare`, `speak` (items/rate), `continue` (segment acknowledgement), `cancel`, `dispose`; events are `progress`, `ready`, `chunk` (sequence, transferred PCM ArrayBuffer, sample rate), `done`, `error`. All non-dispose messages carry the job ID; only one generation and one unacknowledged segment are allowed.

- [ ] Write failing bridge/resource tests: no worker until explicit Heart playback; one preparation per healthy worker; retry clears a rejected preparation promise; old-job chunks/progress/errors are discarded; failed downloads/worker messages yield a terminal helpful error and no audio. Assert all remote model/config/voice URLs and voice-cache keys use the exact approved revision and never `/resolve/main/`; learner text is present only in local worker messages, never network requests.
  Named test `Heart voice assets use the reviewed revision`: assert `expect(pinHeartResourceUrl('https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/af_heart.bin')).toBe('https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/voices/af_heart.bin')`; exercise the same mapping for cache match and put.
- [ ] Add segmentation/player tests: preserve every ordered word of an over-window sentence; tokenize with truncation disabled and cap encoded segments at 512 tokens including boundary tokens; recursively split at clause/word boundaries; report a single unrepresentable word. Assert one segment plays at a time, next generation waits for acknowledgement, Stop cancels current audio and outstanding acknowledgements, and autoplay/resume failure offers Retry/fallback. Use fake worker/audio boundaries, not mocked application internals.
- [ ] Run `npm test -- --run src/services/heartAssets.test.ts src/services/heartSegments.test.ts src/services/heartVoice.test.ts`; confirm the expected missing adapter/behaviour failures.
- [ ] Install `kokoro-js@1.2.1` with exact saving. Pin direct `@huggingface/transformers@3.5.1` and `phonemizer@1.2.1` so the adapters use the inspected compatible APIs; verify a single resolved Transformers/ONNX runtime and commit the lockfile. Add the asset-packaging script to development/build preparation, copying required ONNX and phonemizer executable/WASM assets from installed packages into a generated, ignored `public/heart-runtime/` directory, retaining licence notices. The script is local-only, checks versions and fails clearly on unexpected packaging.
- [ ] Implement the worker/bridge. The inspected Kokoro loader does **not** accept a revision parameter, its voice loader hardcodes a `main` URL/cache, and its stream tokenizer requests truncation. Use an isolated worker resource adapter: set the Transformers model-path template to the pinned revision; map the hardcoded Heart voice request and its cache reads/writes to revision-qualified resources; leave unrelated requests untouched. Add a tokenizer proxy that forces truncation off and reports over-window input for recursive segmentation before inference. No vendor source patch, global app fetch override or unversioned voice-cache reuse.
- [ ] Generate with WASM/q8, `af_heart`, requested model speed and one thread. Feed transferred PCM to Task 2's already-activated player. Stop during cold preparation terminates that worker and clears pending preparation; Stop during warm generation invalidates results and cancels scheduled audio. Release segment buffers after use; dispose the worker and let the coordinator dispose its player. Use the library sentence splitter/stream over validated segments and acknowledge each played segment before asking for another.
- [ ] Run focused tests and `npm run build`; serve the resulting `/EnglishlearningWeb/` production path and check executable/WASM URLs resolve locally. Exercise a real preview, a short phrase and a multi-sentence answer with the actual pinned model; measure first and warm latency, record actual requests and verify non-empty audio. Correct adapter/build failures before exposing Heart in Settings. Review/commit as `feat: add pinned local Heart speech generation`.

### Task 4: Connect recording locks and existing listening controls

**Files:** Modify `src/hooks/useRecorder.ts` and its tests; update `src/pages/{Settings,Big30,Practice,Dashboard,Notebook,Mission}Page.tsx`, `src/features/big30/PersonalAnswerSupport.tsx`, `src/features/chunks/ChunkWorkout.tsx`, `src/features/vocabulary/{VocabularyTab,VocabularyDetail}.tsx`. Add `src/features/speech/SpeechIntegration.test.tsx` and extend relevant existing interaction tests.

**Interfaces:** Consumes `speechController.acquireMicrophone` and the third hook argument. Recorder release callbacks belong to its capture attempt, not a shared boolean. Existing recorder UI, completion and audio storage remain unchanged.

- [ ] Write failing integration tests: stop speech and acquire lock before deferred `getUserMedia`; denial/constructor failure/unmount release exactly their own lock; late permission stops tracks and cannot resume speech; pause keeps the lock; capture Stop releases it. Check overlapping capture owners and existing recorder tests.
  Named test `permission setup blocks speech before the prompt resolves`: while the first deferred permission is pending, assert `expect(speechController.getSnapshot().microphoneBlocked).toBe(true)` and that a new speech action makes zero backend play calls; keep that assertion true after a second owner's release.
- [ ] Write support/navigation tests: saved Heart reaches existing Big 30, chunk, vocabulary and Practice controls; Recall/Free changes cancel speech first; closing/navigating cancels only owned requests; ChunkWorkout cleanup cancels Heart as well as browser speech. Existing personal-answer and RecordingList regressions must remain covered.
- [ ] Run `npm test -- --run src/hooks/useRecorder.test.ts src/features/speech/SpeechIntegration.test.tsx src/features/big30/PersonalAnswerSupport.test.tsx`; confirm missing lock/engine wiring failures.
- [ ] Implement narrow call-site edits and synchronous capture-lock acquisition before permission. Remove direct page-level SpeechSynthesis cancellation in favour of coordinator cancellation. Keep support text hidden as currently required; voice/error state never contains the answer. Do not mark listening or generated speech as learning completion.
- [ ] Run these focused tests plus existing recorder/chunk/Library tests. Review/commit as `feat: use Heart safely across speaking practice`.

### Task 5: Add Settings preview and accessible status/fallback controls

**Files:** Create `src/features/speech/VoiceStatus.tsx`, `VoiceStatus.test.tsx`, `src/speech.css`; modify `src/pages/SettingsPage.tsx`, `src/components/AppShell.tsx`, `src/main.tsx`, `src/features/chunks/ChunkWorkout.tsx`, `src/features/vocabulary/VocabularyDetail.tsx`; add `src/pages/SettingsPage.test.tsx`.

**Interfaces:** `VoiceStatus({scope:'page'|'modal',hostId:string})` subscribes to the coordinator and exposes Stop/Retry/browser fallback. Visible hosts register on mount; a visible modal host takes precedence over the page host, and the others render nothing. Host registration remains idempotent under StrictMode and unregisters without cancelling another owner's speech.

- [ ] Write Settings tests: choosing/saving/importing Heart alone causes no preparation; preview uses the unsaved form choice; advanced browser name does not override Heart; browser name/gender survive toggling engines. Test the exact approved preview and download copy, Stop enabled during preparation, terminal error controls, Retry and labelled session fallback preserving the saved preference.
  Named test `saving Heart does not download it`: select Heart and Save changes, assert `expect(loadState().preferences.speechEngine).toBe('heart')` and zero worker/fetch calls; only clicking `Download & preview Heart` starts preparation.
- [ ] Write status/focus tests: one visible announcement/Stop control when a modal is open; no duplicate status behind an inert background; closing the modal restores the page host without stale speech. A rejected AudioContext resume produces an actionable error and leaves saved practice data untouched.
- [ ] Run `npm test -- --run src/pages/SettingsPage.test.tsx src/features/speech/VoiceStatus.test.tsx`; confirm new UI/host failures.
- [ ] Implement **Natural Female · Heart**, **Download & preview Heart**, **Preview Heart**, **Stop**, the exact sample/copy from the spec, and **Save changes** semantics. Selecting/explicitly retrying Heart clears session fallback without downloading. Keep browser choices available, disable the advanced selector only for Heart and show that it applies to browser voices. Sync the form when imports/reset replace `state.preferences`, without discarding edits on unrelated state updates. Progress names the current file and uses percentages only when loaded/total are measurable; no guessed total ETA.
- [ ] Add the page host in AppShell and modal hosts inside the chunk/vocabulary modal layouts. Use polite status/error announcements and labelled keyboard-operable controls; keep the current off-white/green/coral styling, readable text and mobile layout. Review focused checks/commit as `feat: preview and manage the Heart voice in Settings`.

### Task 6: Verify the complete feature, document actual results and review

**Files:** Modify `README.md`, `PROJECT_CONTEXT.md`, `THIRD_PARTY_NOTICES.md` as needed; keep temporary browser scripts, screenshots and timing logs outside the repo. Update this plan's checkboxes only for finished tasks.

**Interfaces:** Uses the completed UI and production build. QA output must distinguish real Heart synthesis from simulated microphone capture and boundary-mocked tests.

- [ ] Run `npm test -- --run`, `npm run typecheck`, `npm run build` and `git diff --check`, inspect exit codes and resolve every failure. Baseline before Heart is 78 tests; report the actual final count. Do not loosen unrelated assertions to obtain a green run; investigate timeouts before changing test scope.
- [ ] Browser QA at 1440 × 1000 and 390 × 844: select Heart without fetching assets, preview a real cold download, Stop during download/generation/playback, retry, save/reload, compare Zira/Heart, listen to a short chunk and Big 30 answer, switch Recall/Free, close modals, change routes and record while generation is pending. Verify full answer order, safe cancellation, navigation, one visible status host, no overflow/overlay and clean app console.
- [ ] Test explicit failure states: cold offline, cleared cache, blocked downloads, worker failure and refused audio permission. Test warm playback offline in the open app. Inspect requests to prove pinned model/voice URLs, no remote executable runtime, no private text/audio uploads and no Heart assets for browser-only users. Test the `/EnglishlearningWeb/` production path, not just Vite's root development URL.
  Named browser case `Stop prevents a delayed answer`: with a pending real generation or controlled delayed worker delivery, click Stop and assert idle status, no active audio source and no subsequent playback; repeat while switching to Recall/Free and while starting recording. Use authored test answers for network inspection rather than the user's private notes.
- [ ] Document licence/source, real download totals, device/browser, cold/warm latency, practical voice-quality listening observations, cache limitations and any untested devices. Update saved-data schema documentation to 7, imports to versions 1–6 and explain model files are excluded from backups. Do not claim human-like quality or universal offline/speed support without evidence.
- [ ] Request a fresh whole-change reviewer via the requesting-code-review skill, supplying the approved spec/plan, actual baseline commit, diff, tests and browser evidence. Fix actionable findings and rerun only checks justified by each fix. Stage only intended changes, commit the verified feature/docs and show the user how to enable and preview Heart locally. Do not push or deploy unless requested.

## Self-review and handoff

Coverage: settings/download/preview/fallback and visible hosts → Task 5; pinned local engine, safe input, caching and asset hosting → Task 3; request ownership and cancellation → Task 2; microphone/support/navigation safety and every current consumer → Task 4; saved data/backups → Task 1; real browser/privacy/quality checks and documentation → Task 6. Each Review Focus item has a specific test owner. Interfaces and message names are shared above; no task assumes a revision option that the inspected loader lacks.

Recommended execution: **Native**, with the parent implementing these closely connected tasks in this chat and one fresh reviewer at the end. This avoids repeated handoffs of the controller/worker/recording contracts while retaining independent final review. If the user prefers **Subagent-driven**, execute tasks sequentially with the same preserved baseline and fresh per-task reviewers; avoid concurrent shared-file/index changes.

After user approval of this plan and selection of execution method, use the required execution skill. Preparation of this document does not authorise installing dependencies or changing Heart product code yet.
