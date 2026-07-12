# Instructions for AI coding agents

Before planning or changing this project, read these files in order:

1. `PROJECT_CONTEXT.md` — current product status, architecture, decisions, verification, and limitations.
2. `README.md` — setup commands, browser requirements, and user-facing feature summary.
3. `docs/superpowers/specs/2026-07-12-fluency-reset-design.md` — approved product/design specification.
4. `docs/superpowers/plans/2026-07-12-fluency-reset-mvp.md` — original implementation plan.

Do not scaffold a replacement application or restart the MVP from scratch. The core-complete MVP already exists and has been verified. Inspect the current code and Git status before editing, preserve existing functionality, and make surgical changes.

## Required checks

After code changes, run:

```bash
npm test -- --run
npm run typecheck
npm run build
```

For visible UI changes, also run browser QA at desktop and mobile widths. The prior visual direction is a calm adult wellness/habit product: warm off-white, deep green, restrained coral, fine borders, large readable typography, and minimal distractions during recording.

## Data and privacy constraints

- Keep the MVP backend-free and login-free unless the user explicitly expands scope.
- Audio recordings stay in IndexedDB on the current device.
- Other application state uses versioned LocalStorage.
- Do not introduce external AI APIs, speech-to-text, pronunciation scoring, Firebase, payments, or social features without explicit approval.
- Keep encouragement positive and non-punitive. Never shame users for missed days or imperfect grammar.

## Current branch

The implemented application is on `feature/fluency-reset-mvp`. Check `git branch --show-current` because the user may merge or rename it later.
