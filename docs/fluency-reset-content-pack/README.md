# Fluency Reset Content Pack

This pack extends the existing Fluency Reset MVP with a progressive 60-practice-day speaking programme and a redesigned guided Practice Room.

## Files

### `fluency-reset-60-day-program.json`

Contains:

- 60 real-life speaking missions
- 9 progressive phases
- Easy, Practical, and Brave versions for every mission
- situation-specific key points
- communicative outcomes
- support phrases
- memo starters
- focused retry instructions
- follow-up questions
- reflection questions
- linked Practice Room drill IDs
- checkpoint markers

### `practice-room-content.json`

Contains 156 drills across seven modes:

| Mode | Drills |
|---|---:|
| Mouth Reps | 31 |
| Tight Build | 27 |
| Loose Story | 10 |
| Free Response | 38 |
| Echo & Shadow | 16 |
| Repair Lab | 18 |
| Fluency Sprint | 16 |
| **Total** | **156** |

All drill IDs referenced by the 60-day programme are present and unique.

### `big-30-question-guides.json`

Contains 30 question-specific speaking guides with:

- purpose
- key points
- support frames
- follow-up question
- common trap
- Follow, Recall, and Free instructions
- timed rounds

### `content-and-logic-review.md`

Explains:

- what is already strong in the current website
- weaknesses found in the current mission and Practice Room logic
- why the existing prompts can feel strange
- recommended progression, metrics, and content architecture

### `codex-amendment-60-day-and-practice-room.md`

A copy-ready implementation requirement for Codex.

## Recommended project location

Copy the three JSON files into:

```text
src/content/
```

Then give Codex the full path or attach the files and paste the amendment prompt.

## Suggested instruction to Codex

```text
Please implement the attached amendment in my existing Fluency Reset project.

Use these content files:
- src/content/fluency-reset-60-day-program.json
- src/content/practice-room-content.json
- src/content/big-30-question-guides.json

Do not rebuild the app. Preserve all current user data, Vocabulary Bank, Speaking Notebook, recordings, LocalStorage, IndexedDB, routes, and visual style.

Before editing, inspect README.md, PROJECT_CONTEXT.md, AGENTS.md, the existing AppContext, storage migration, DashboardPage, MissionPage, PracticePage, seed data, and tests.
```

## Important implementation notes

- “60 days” means 60 completed practice days, not a calendar streak.
- Today’s mission should be the next incomplete programme mission, not a day-of-month rotation.
- The 2-, 5-, and 10-minute choices should produce different flows.
- Easy, Practical, and Brave should change actual task conditions.
- Do not claim phrase use, pronunciation quality, or grammar accuracy without speech recognition.
- Ask users to self-confirm phrase use and confidence.
- Keep authored content in JSON and user state in LocalStorage/IndexedDB.
- Use runtime validation before rendering imported JSON.

## Validation completed

- 60 mission IDs loaded.
- 156 unique Practice Room drill IDs loaded.
- 30 Big 30 guides loaded.
- No duplicate drill IDs.
- No missing drill references from the 60-day programme.
- All JSON files parse successfully.
