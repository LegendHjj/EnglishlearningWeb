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

- Six-step local onboarding and personalised dashboard
- Quick Win, Normal Practice, and Full Workout session choices
- Guided mission flow with memo, phrase pinning, Follow/Recall/Free note stages, recording, retry, and completion feedback
- Speaking Notebook with search, status filters, phrase creation/editing/deletion, favourites, TTS playback, and Speaking Packs
- Browser microphone recording with pause, replay, retry, save, permission guidance, and support fallback
- IndexedDB audio storage; versioned LocalStorage for other state
- Big 30 question planners and five practice modes
- Recording library, progress charts, preferences, and JSON export/import
- Responsive desktop sidebar and mobile bottom navigation

## Privacy and browser support

Audio recordings are stored in IndexedDB on the current device and are not uploaded. Exported JSON contains non-audio progress only. Recording requires a browser with `MediaRecorder` and microphone permission; current Chrome, Edge, Firefox, and Safari releases are recommended. Text-to-speech uses the browser's `SpeechSynthesis` support.

## MVP limitations

The app has no backend or cross-device sync. Phrase usage is user-directed rather than automatically detected because speech-to-text and pronunciation scoring are intentionally excluded. Audio is not included in JSON exports, and available recording formats depend on the browser.
