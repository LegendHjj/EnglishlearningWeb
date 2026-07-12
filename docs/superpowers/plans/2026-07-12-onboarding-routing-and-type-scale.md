# Onboarding Routing and Type Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the onboarding gate in navigation and rebalance oversized speaking prompts.

**Architecture:** Route guards read the existing application context and redirect according to `preferences.onboarded`. Landing CTAs use the same state to choose their destination. Scoped CSS adjusts only long task headings.

**Tech Stack:** React 19, React Router, TypeScript, CSS, Vitest, Testing Library.

## Global Constraints

- Keep the application backend-free and login-free.
- Continue storing application state in versioned LocalStorage.
- Preserve the existing calm adult wellness visual direction.
- Make surgical changes without new dependencies.

---

### Task 1: Persisted onboarding routing

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/LandingPage.tsx`

**Interfaces:**
- Consumes: `useApp().state.preferences.onboarded`
- Produces: guarded `/onboarding` and `/app` routes plus state-aware landing CTAs

- [ ] Add failing route tests for new and returning users.
- [ ] Run the focused test and confirm the expected failures.
- [ ] Add small route-guard components and state-aware CTA destinations.
- [ ] Run the focused test and confirm it passes.

### Task 2: Balanced task typography

**Files:**
- Modify: `src/features.css`
- Modify: `src/pages.css`

**Interfaces:**
- Consumes: existing `.speak-focus`, `.complete-screen`, `.practice-prompt`, and `.question-practice` selectors
- Produces: responsive heading sizes with improved wrapping and line height

- [ ] Narrow the responsive size ranges for long task headings.
- [ ] Run the full required checks.
- [ ] Verify desktop and mobile routing and visual hierarchy in a browser.
