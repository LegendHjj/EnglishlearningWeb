# Optional practice pack format

Content packs add learning examples. They do not restore or replace user progress. Downloadable packs live in `public/practice-packs/` and load through the application's configured base URL.

```json
{
  "app": "fluency-reset-practice-pack",
  "version": 1,
  "id": "my-conversations",
  "name": "Conversations at work",
  "description": "Short dialogues and follow-up practice.",
  "items": [{
    "id": "introductions-1",
    "kind": "conversation",
    "title": "Meeting a colleague",
    "topic": "Work",
    "cue": "Introduce yourself and ask about the other person's role.",
    "model": "A: Hi, I'm Alex.\nB: Nice to meet you. I'm Sam.",
    "examples": [],
    "keywords": ["name", "team", "question"],
    "expressions": ["Nice to meet you"],
    "challenge": {
      "cue": "I didn't catch your name.",
      "model": "It's Alex, spelled A-L-E-X.",
      "followUp": "Which team are you on?"
    }
  }],
  "resources": [{"title": "A short practice session", "body": "Read, adapt, then practise without the script."}]
}
```

Required item fields are shown above except `challenge`, which is optional. `kind` is `chunk`, `answer`, `conversation`, `pattern`, or `prompt`. Answer items require `questionId` from `q1` through `q30`. Optional `meaning` and `note` are plain text. Optional `tasks` has three required strings: `tight`, `loose`, and `free`. Resources are optional plain-text references; HTML is displayed as text.

Pack and item IDs use letters, numbers, hyphens or underscores, start with a letter or number, and have at most 100 characters. Item IDs are unique within each pack. Keep IDs stable when sharing revised files: reimport preserves existing items with those IDs and adds new IDs. Chunks also compare saved expression text while ignoring case, whitespace and common punctuation. Removing a chunk from the personal library does not cause migration to add it again.

Limits: 5 MB per uploaded file, 2,500 items per pack, 500 resources, 100 entries per string array, 300 characters per item title, 150 per topic, 200 per pack name, 2,000 per description, and 20,000 per other text field. Available browser storage may impose a lower practical limit. The import preview saves before changing app state so a storage failure keeps existing data.

Progress uses `packId/itemId` keys and is saved separately in application state. Packs contain no personal progress or audio. Current application backups use version 8; imported content and progress are included in both backup kinds. Recording metadata optionally stores `practiceItemId`; audio remains in the existing IndexedDB store.
