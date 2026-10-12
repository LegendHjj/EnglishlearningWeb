# Fluency Reset

A local-first speaking gym for adults who understand English but want a faster, more confident speaking reflex.

For development history, architectural decisions, completed verification, and continuation guidance, read `PROJECT_CONTEXT.md`. AI coding agents should also read `AGENTS.md` before making changes.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Publish with GitHub Pages

This repository includes an automatic GitHub Pages workflow. Complete this one-time setup on GitHub:

1. Open the `LegendHjj/EnglishlearningWeb` repository.
2. Select **Settings**, then **Pages** in the left sidebar.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push the latest `feature/fluency-reset-mvp` branch to GitHub.
5. Open **Actions** and wait for **Deploy to GitHub Pages** to finish with a green check.

The published website will be available at:

`https://legendhjj.github.io/EnglishlearningWeb/`

Every push to `feature/fluency-reset-mvp` rebuilds and republishes the website. To deploy again without a new commit, open **Actions > Deploy to GitHub Pages**, select **Run workflow**, choose `feature/fluency-reset-mvp`, and run it.

If deployment fails, open the failed run under **Actions > Deploy to GitHub Pages** and expand the failed step. Also confirm that GitHub Pages still uses **GitHub Actions** as its source. GitHub Pages is included for public repositories on GitHub Free; publishing a private repository requires a GitHub plan that supports private Pages sites.

## Verification

```bash
npm test -- --run
npm run typecheck
npm run build
```

## MVP features

- Progressive 60-practice-day programme across nine phases; missed calendar days never skip lessons
- JSON-backed content repository with runtime validation for 60 missions, 156 guided drills, and 30 Big 30 guides
- Meaningfully different Quick Win, Normal Practice, and Full Workout mission flows
- Authored Easy, Practical, and Brave requirements with different preparation, speaking time, support, and pressure
- Seven-mode guided Practice Room: Mouth Reps, Tight Build, Loose Story, Free Response, Echo & Shadow, Repair Lab, and Fluency Sprint
- Honest mission self-checks for message completion, support-item use, confidence, follow-up, and note stage
- Programme overview, checkpoint markers, linked mission drills, and a ten-item personal Practice next queue
- Six-step local onboarding and personalised dashboard
- Quick Win, Normal Practice, and Full Workout session choices
- Guided mission flow with memo, combined phrase/vocabulary pinning, Follow/Recall/Free note stages, recording, retry, and completion feedback
- My English Library at `/app/notebook`, with Vocabulary, Speaking Phrases, Chunk Practice, and Speaking Packs tabs
- Vocabulary quick add, ChatGPT paste-and-detect preview, manual entry, search and filters, browser text-to-speech, personal sentences, spaced review, and speaking support
- Personal chunk journal with optional source, context, and recall cue; 12 opt-in starter expressions; guided listen/personalise/recall/speak/self-check practice, local linked recordings, and suggested review dates
- Browser microphone recording with pause, replay, retry, save, permission guidance, and support fallback
- IndexedDB audio storage; versioned LocalStorage for other state
- Big 30 question planners, per-question My Answer prompt builder and personal answers, gradual support, and local recordings
- Recording library, saved-data progress metrics, preferences, and versioned JSON export/import
- Responsive desktop sidebar, five-item mobile navigation, and a mobile More menu for Recordings, Progress, and Settings

## Practise your own chunks

Open **Library → Chunk Practice** (also linked from Today and the Practice Room). Choose **Add starter collection** or **Add chunk**. An existing Speaking Phrase can also be practised as a chunk; both tabs share your saved expressions.

1. Listen to the complete example and repeat it aloud.
2. Write two personal versions or situations.
3. Recall the chunk from a situation cue; reveal a hint when needed.
4. Give a short spoken answer with Follow, Recall, or Free support. Recording is optional; stop and save or delete a take before continuing.
5. Choose **Again**, **With help**, or **On my own**. Tick usage only if you used the chunk in your answer.

The self-check saves a practice count and a suggested review date. **Only chunks ready to revisit** shows previously practised expressions whose suggested date has arrived. Pin a chunk to use it in a later mission. Saved audio appears both in the chunk workout and in Recordings. Progress/library exports preserve chunk notes and reviews; complete backups include the linked audio too.

The source-material review and selection rationale are in `docs/learning-materials-review.md`.

## Make your own Big 30 answer

Open **Big 30 → choose a question → My Answer**. Describe your story in **What I want to say**; long notes, Chinese, or imperfect English are welcome. Choose about 30, 60, or 90 seconds, then select **Copy AI prompt** and paste it into ChatGPT or another AI tool. The prompt includes the selected question's objective, planner, common trap, and follow-up; it asks for simple spoken English, relevant details, grammar correction, and no invented personal facts. If copying is blocked, the prompt is selected for manual copying.

Bring the AI's three sections back into **My spoken answer**, **Recall keywords**, and **Useful chunks**. Check the facts and adjust the wording, then select **Practise my answer**. Follow shows the full answer with optional browser voice playback; Recall shows your keywords; Free hides the personal answer, keywords, chunks, and speaking memo. **Original guide** switches back to the existing planner/example. Each question's notes and answer save as you edit and are included in both backup types; making an answer does not mark a question completed.

The app builds prompts locally and has no connection to an AI service. It sends no notes automatically; you choose what to copy into another tool. Voice playback stops during recording, and tabs/questions stay locked until you stop and save or delete your take. Audio stays in the existing local recording library.

## Privacy and browser support

Audio recordings are stored in IndexedDB on the current device and are not uploaded. **Export progress and library** includes preferences, progress, phrases, Speaking Packs, vocabulary, and memos, but no audio. **Export complete backup** includes the same data plus IndexedDB audio encoded in the JSON file, so it may be large. Recording requires a browser with `MediaRecorder` and microphone permission; current Chrome, Edge, Firefox, and Safari releases are recommended. Text-to-speech uses the browser's `SpeechSynthesis` support and the selected Settings voice when available.

## MVP limitations

The app has no backend or cross-device sync. Phrase and vocabulary usage, confidence, message completion, and follow-up completion are self-reported because speech-to-text and pronunciation scoring are intentionally excluded. Available recording formats, pause support, and speech voices depend on the browser. Checkpoint recommendations use authored mission links and learner reflection rather than automated speech analysis.

## Content and saved-data versions

The authored content pack currently uses content schema version `1`. Local application state uses schema version `6` while retaining the existing `fluency-reset-state-v1` storage key so current browsers migrate in place. Imports from backup versions 1–5 remain supported. Existing audio remains in the `fluency-reset-audio` IndexedDB database and is never deleted during migration.
