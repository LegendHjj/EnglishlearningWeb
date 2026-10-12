# Heart natural female voice — design for review

Date: 2026-10-12

Status: the user approved the Heart approach and preparation of this design. The written design is awaiting review; implementation has not started.

## Outcome

Add one optional **Natural Female · Heart** voice to Fluency Reset. The user wants English examples and personal answers to sound more conversational than their current browser voice, at no subscription or per-use cost. Heart is an American English female synthetic voice; its naturalness should be judged through a preview rather than advertised as indistinguishable from a person.

The extra voice works through the app's existing listening controls: Big 30, personal Big 30 answers, Chunk Practice, Library phrases, vocabulary and Practice Room models. Existing browser voices remain available. Learning progress, notes, recordings and other features are preserved.

## User experience

### Settings and first use

1. Settings keeps Auto, Female, Male and the advanced browser-voice selector. It adds a separate **Natural Female · Heart** option described as “American English · free · runs on this device.”
2. Selecting Heart changes the Settings form only. It does not begin a download or overwrite the saved choice.
3. The Heart panel explains: “Download the voice once to try it. The main model is about 92 MB, plus supporting files. Your text is processed on this device. Downloading and preparing the voice can take a while.”
4. **Download & preview Heart** is the explicit first-download action. Show preparation status, file download progress where measurable, and a working **Stop** action. Do not invent an overall percentage or a completion-time estimate.
5. The preview says: “My weekend was pretty relaxed. I had lunch with my family, and the best part was having time to talk without rushing.” Subsequent **Preview Heart** actions use the same sample. Stop remains available while preparing or playing.
6. **Save changes** stores the chosen voice engine. The preference can be saved before the download completes, but saving alone never downloads the model. A later explicit Listen action can download it and must show the same size/privacy information and progress if the voice is not ready.
7. Selecting a browser voice returns to browser speech. The existing browser voice name and gender values are retained while Heart is selected; the advanced selector is disabled during Heart selection and clearly labelled as applying to browser voices.

Heart does not become the default for existing or new users. There are no automatic downloads on app load, onboarding, Settings entry, imports, navigation or recording.

### Practice playback

- The same saved voice choice applies to all existing app-generated speech, including Big 30 personal answers and short vocabulary/chunk examples.
- Keep the current natural/slow listening actions. Heart uses its own speech-generation speed setting, matching the requested pace; do not slow prerecorded output with a pitch-changing playback trick.
- A small shared status area shows “Preparing Heart…” or “Playing Heart” when useful, with **Stop**. It must be visible in focused/modal practice views as well as normal pages, and must not expose hidden answer text.
- Long answers are spoken in order, with sentence-based segmentation within the model's supported input window. Do not silently truncate the answer. Empty input produces no download and no speech.
- Another Listen action replaces the previous utterance, including speech started from another component. Only one voice plays at a time.
- Leaving the originating screen, closing a practice view, hiding full support, changing voice, or starting recording stops its speech and discards queued playback. Hook cleanup cancels only the request owned by that hook; a deliberate user Stop cancels all app speech.

### Download, device and playback failures

Heart remains optional on devices that cannot prepare it or run it comfortably. Failed download, unavailable browser features, memory pressure or blocked audio playback produce a brief helpful message with **Retry** and **Use browser voice for now**. The app never silently substitutes another voice and calls it Heart.

“Use browser voice for now” is a session fallback, visibly labelled when active, and does not overwrite the saved Heart preference. Retry explicitly attempts Heart again. Auto/Female/Male in Settings remain the way to save a permanent browser-voice choice. If browser speech is also unavailable, the user can still read the example and practise aloud.

Model caching is best effort. A cleared or evicted browser cache, a different browser/device, or a changed model revision can require another download; avoid promising that downloading is permanently a one-time event. After preparation, verify warm offline playback in the already-open app before describing it as available on that browser. Offline app installation, offline reload/navigation and a new service worker are outside this enhancement.

## Selected technology and cost

- Use `kokoro-js` **1.2.1**, a pinned npm dependency with a committed lockfile. Its documented browser execution uses Transformers.js. It is Apache-2.0 licensed.
- Voice: **`af_heart`**, American English female, from Kokoro 1.0.
- Model: **`onnx-community/Kokoro-82M-v1.0-ONNX`**, revision **`1939ad2a8e416c0acfeecc08a694d14ef25f2231`**.
- Initial runtime: **WebAssembly**, **q8** weights (`onnx/model_quantized.onnx`, 92,361,116 bytes). Do not require WebGPU or a particular graphics card. Use one inference thread so GitHub Pages does not require cross-origin isolation headers.
- Keep inference and phonemisation in a lazily loaded module Web Worker. Browser voice users must not load the Heart engine, runtime or model.
- Bundle executable runtime/phonemisation assets through the pinned application build. Download model/configuration/Heart voice data from the pinned public Hugging Face model revision when needed. Preserve applicable dependency/model notices.
- Free means no account, API key, subscription, character quota or paid inference service. The user supplies bandwidth, storage and device processing. Public model hosting availability is outside the app's control.

The verified size above is the main model only, not total browser memory usage or total supporting downloads. Actual runtime compatibility, response latency and perceived voice quality must be checked with the real engine during implementation.

## Architecture and responsibilities

### Shared speech coordinator

Introduce a small speech coordinator behind `useSpeech`. It owns current request ID, request owner, playback queue, chosen engine, model readiness, status subscribers, audio resources and microphone locks. It dispatches to either the existing browser SpeechSynthesis adapter or the Heart worker adapter.

Preserve existing hook operations `speak`, `speakAll`, `stop`, `speaking` and `supported`; add readiness/error information for status UI. `speaking` covers active preparation and playback and always returns to false after completion, error or Stop. Settings preview uses the unsaved form engine; normal screens use the saved preference. The engine is passed explicitly or resolved consistently, so browser-only hook callers cannot accidentally ignore a saved Heart choice.

Request IDs guard every asynchronous completion. Stopped, replaced or unmounted requests must never play later or change another request's state. Stop pauses playback, clears pending segments and releases associated audio URLs. An in-flight model calculation may finish silently if the runtime cannot abort it; its result is discarded. No audio resources are created during render, and React StrictMode replay must not leak or invalidate audio URLs.

### Heart worker

One lazily created worker prepares one model session and reuses it while the app remains open. It supports preparation, speech requests, progress and failures. The coordinator keeps one active generation request and does not grow an unbounded queue. Use the library's sentence splitting and validate the input window; split oversized sentences at clause/word boundaries rather than truncating them. Generated audio is played progressively in order, without overlaps or duplicated text.

The worker owns the reusable model and releases it when disposed. Browser caches store downloaded public model files where available. Generated spoken answers are ephemeral: keep only the segments needed for the current request and release them after playback or cancellation. They are not learner recordings and must not enter the Recordings library or learning metrics.

### Recording and note hiding

The shared recorder acquires a microphone lock and cancels both speech engines **before** requesting microphone permission. New app speech is blocked during permission setup, active recording and pause. The lock is released when capture stops, fails or the recorder unmounts, including late permission responses. Multiple recorder instances use owned locks so one cleanup cannot release another active capture.

Update the existing stop paths, including ChunkWorkout's direct `window.speechSynthesis.cancel()` cleanup, to cancel Heart as well. Big 30, Chunk Practice and other support-stage changes cancel model playback before concealing sentences. Recording and route cleanup cannot leave late-generated speech playing off-screen.

### Integration boundaries

- `src/services/speechController.ts`: engine-neutral coordination, status, cancellation and recording locks.
- `src/services/heartVoice.ts` and `src/workers/heartVoice.worker.ts`: lazy worker bridge and local inference.
- `src/hooks/useSpeech.ts`: existing public hook backed by the coordinator.
- `src/features/speech/VoiceStatus.tsx`: accessible preparation/error/Stop UI shared by page and modal hosts; one visible host for the current request, not duplicate announcements behind a modal.
- Settings: optional Heart choice, honest first-download information and preview/stop controls.
- Recorder hook/feature and existing speech consumers: narrow integration changes for the saved engine, locks and stopping playback. No replacement app, rewritten learning flows or unrelated redesign.

## Saved data and privacy

Add `UserPreferences.speechEngine` with allowed values **`browser`** and **`heart`**. Missing or invalid values migrate to `browser`. Keep `voice` and `voiceGender` for the existing browser choices; an explicit browser voice must not override a selected Heart engine.

Upgrade local state and both JSON export formats from schema/version **6 to 7**. Imports from versions **1–6** remain supported. Preserve every existing phrase, chunk, vocabulary item, Big 30 answer, memo, pin, programme result and recording link. Retain the `fluency-reset-state-v1` LocalStorage key and the current audio IndexedDB database.

Backups contain the selected engine and existing preferences, not downloaded model files, generated preview audio or temporary speech queues. Restoring a Heart choice never starts a download by itself. Each device/browser obtains its own model cache through an explicit preview/listen action.

No learner text, notes, recordings or generated speech is sent to Hugging Face or any inference service. Network requests for Heart are for public model/support files only. No backend, login, external AI inference API, speech-to-text, pronunciation scoring, payments or social features are added.

## Verification and acceptance

Implementation is accepted when:

1. Settings shows the extra Heart choice alongside usable browser choices, saves it correctly and restores it after reload/import. Selecting Heart, saving it or reopening the app without listening causes no model download.
2. A real first-use preview downloads the pinned files with visible preparation state and produces non-empty, intelligible Heart audio in the current in-app browser. The user can compare it with Zira. Do not claim improved perceived naturalness without listening to representative samples and inviting the user's judgment.
3. Warm playback works for a very short phrase, a normal chunk example, a Big 30 personal answer and a longer multi-sentence answer. Punctuation, contractions and names receive a practical listening check. Long input is complete and correctly ordered.
4. Tests cover Stop during preparation, generation and playback; replacing a request; owner unmount; StrictMode cleanup; and delayed results arriving after cancellation. No stale result plays or corrupts current status.
5. Starting recording cancels pending/playing Heart and browser speech before microphone permission; pause keeps speech blocked; denial, Stop and unmount release only their own lock. The model voice cannot be captured accidentally through an app Listen action.
6. Follow-to-Recall/Free changes and modal/route exit stop playback. Shared status UI remains visible and keyboard-accessible without revealing hidden answer text.
7. Failed/aborted downloads, offline cold cache, cache eviction, memory/worker failure and autoplay rejection leave practice usable and offer honest Retry/browser fallback. Verify warm offline playback; report its actual result.
8. Both backup formats preserve the engine and all existing saved data; legacy imports do not create downloads, delete audio or revive deleted seed content.
9. Network inspection verifies learner text/audio is never submitted externally; browser-only use does not fetch Heart assets. Initial app loading remains light through lazy engine/worker loading.
10. Run `npm test -- --run`, `npm run typecheck` and `npm run build`. Check desktop 1440 × 1000 and mobile 390 × 844 layouts, controls, focus, progress, errors and recording/playback interactions. Check GitHub Pages asset paths with the actual production build. Report tested devices and latency rather than promising universal speed.

This document defines the design, not an implementation or proof of working Heart playback. The existing app and its previously verified features have not been changed for this voice yet.

## References checked for this design

- [Kokoro model card and Apache licence](https://huggingface.co/hexgrad/Kokoro-82M).
- [Official voice guide: `af_heart`, voice quality and input-length caveats](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md).
- [Kokoro JavaScript package: local browser execution, WASM/q8 usage and streaming](https://www.npmjs.com/package/kokoro-js). Package metadata and README were retrieved directly from npm; version checked: 1.2.1.
- [Pinned ONNX model files](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/tree/1939ad2a8e416c0acfeecc08a694d14ef25f2231/onnx). Model revision, licence and file size were checked through the public Hugging Face metadata API on 2026-10-12.
