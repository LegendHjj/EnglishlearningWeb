# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Fluency Reset automatically to the `EnglishlearningWeb` GitHub Pages project URL after every push to `feature/fluency-reset-mvp`.

**Architecture:** Vite emits assets beneath `/EnglishlearningWeb/`, while a small `AppRouter` wrapper uses `HashRouter` so all client routes remain resolvable by the static Pages host. A least-privilege GitHub Actions workflow builds `dist` and deploys it with GitHub's official Pages actions.

**Tech Stack:** React 19, React Router 7, Vite 7, TypeScript, Vitest, GitHub Actions, GitHub Pages

## Global Constraints

- Keep the application backend-free and login-free.
- Keep recordings in IndexedDB and other application state in versioned LocalStorage.
- Deploy only the static `dist` output.
- Preserve local Vite development behavior.
- Trigger automatic deployment from `feature/fluency-reset-mvp` and allow manual dispatch.

---

### Task 1: GitHub Pages paths and routing

**Files:**
- Create: `src/components/AppRouter.tsx`
- Create: `src/components/AppRouter.test.tsx`
- Create: `src/config/pagesBuild.test.ts`
- Modify: `src/main.tsx`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: React `children` and React Router's `HashRouter`.
- Produces: `AppRouter({ children }: PropsWithChildren)` and a Vite build whose base is `/EnglishlearningWeb/`.

- [ ] **Step 1: Write failing configuration and router tests**

```tsx
// src/components/AppRouter.test.tsx
import { render, screen } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { expect, test } from 'vitest'
import AppRouter from './AppRouter'

function LocationProbe() {
  return <p>{useLocation().pathname}</p>
}

test('reads application routes from the URL hash', () => {
  window.location.hash = '#/app/notebook'
  render(<AppRouter><LocationProbe /></AppRouter>)
  expect(screen.getByText('/app/notebook')).toBeInTheDocument()
})
```

```ts
// src/config/pagesBuild.test.ts
// @vitest-environment node

import { expect, test } from 'vitest'
import config from '../../vite.config'

test('builds assets beneath the GitHub Pages repository path', () => {
  expect(config).toBeTypeOf('function')

  if (typeof config !== 'function') {
    throw new Error('Expected Vite configuration to depend on the command')
  }

  const buildConfig = config({ command: 'build', mode: 'production', isSsrBuild: false, isPreview: false })
  const developmentConfig = config({ command: 'serve', mode: 'development', isSsrBuild: false, isPreview: false })

  expect(buildConfig).toHaveProperty('base', '/EnglishlearningWeb/')
  expect(developmentConfig).toHaveProperty('base', '/')
})
```

- [ ] **Step 2: Run the focused tests and verify the expected failures**

Run: `npm test -- --run src/components/AppRouter.test.tsx src/config/pagesBuild.test.ts`

Expected: FAIL because `AppRouter.tsx` does not exist and the Vite config has no `base`.

- [ ] **Step 3: Add the hash router wrapper and Pages base path**

```tsx
// src/components/AppRouter.tsx
import type { PropsWithChildren } from 'react'
import { HashRouter } from 'react-router-dom'

export default function AppRouter({ children }: PropsWithChildren) {
  return <HashRouter>{children}</HashRouter>
}
```

Update `src/main.tsx` to import `AppRouter` and wrap the existing provider/application tree with it instead of `BrowserRouter`.

Update `vite.config.ts` to use `/EnglishlearningWeb/` for the `build` command and `/` for local development, alongside the existing plugins and test settings.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm test -- --run src/components/AppRouter.test.tsx src/config/pagesBuild.test.ts`

Expected: 2 test files pass.

### Task 2: Automatic Pages deployment

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `deployment.test.ts`

**Interfaces:**
- Consumes: pushes to `feature/fluency-reset-mvp`, manual `workflow_dispatch`, `package-lock.json`, and `npm run build`.
- Produces: a Pages artifact named by `actions/upload-pages-artifact` from `./dist`, deployed by `actions/deploy-pages`.

- [ ] **Step 1: Write a failing workflow contract test**

```ts
// @vitest-environment node

import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('deploys the production build to GitHub Pages', () => {
  const workflow = readFileSync('.github/workflows/deploy-pages.yml', 'utf8')
  expect(workflow).toContain('feature/fluency-reset-mvp')
  expect(workflow).toContain('workflow_dispatch:')
  expect(workflow).toContain('npm ci')
  expect(workflow).toContain('npm run build')
  expect(workflow).toContain('actions/upload-pages-artifact@v4')
  expect(workflow).toContain('path: ./dist')
  expect(workflow).toContain('actions/deploy-pages@v4')
})
```

- [ ] **Step 2: Run the workflow test and verify it fails**

Run: `npm test -- --run deployment.test.ts`

Expected: FAIL with `ENOENT` because the workflow does not exist.

- [ ] **Step 3: Add the Pages workflow**

Create a workflow with `contents: read`, `pages: write`, and `id-token: write`; checkout, configure Pages, set up Node 20 with npm cache, run `npm ci` and `npm run build`, upload `./dist`, and deploy it in a separate `deploy` job using the `github-pages` environment.

- [ ] **Step 4: Run the workflow contract test and verify it passes**

Run: `npm test -- --run deployment.test.ts`

Expected: 1 test passes.

### Task 3: Publishing documentation and complete verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: GitHub repository settings and the completed workflow.
- Produces: exact one-time enablement instructions, the public URL, automatic/manual deployment guidance, and failure inspection guidance.

- [ ] **Step 1: Document the user's one-time GitHub setup**

Add a `Publish with GitHub Pages` section describing **Settings > Pages > Build and deployment > Source > GitHub Actions**, the URL `https://legendhjj.github.io/EnglishlearningWeb/`, automatic deployment from `feature/fluency-reset-mvp`, manual runs from **Actions > Deploy to GitHub Pages > Run workflow**, and workflow-log troubleshooting.

- [ ] **Step 2: Run all required project checks**

Run: `npm test -- --run`

Expected: all test files pass with zero failures.

Run: `npm run typecheck`

Expected: exit code 0 with no TypeScript errors.

Run: `npm run build`

Expected: exit code 0 and a generated `dist/index.html`.

- [ ] **Step 3: Verify the production artifact and diff**

Run: `Select-String -Path dist/index.html -Pattern '/EnglishlearningWeb/assets/'`

Expected: the generated script and stylesheet URLs use `/EnglishlearningWeb/assets/`.

Run: `git diff --check` and `git status --short`

Expected: no whitespace errors; only the planned deployment files are modified or untracked.

- [ ] **Step 4: Commit the implementation**

```bash
git add .github/workflows/deploy-pages.yml deployment.test.ts src/components/AppRouter.tsx src/components/AppRouter.test.tsx src/config/pagesBuild.test.ts src/main.tsx vite.config.ts README.md docs/superpowers/plans/2026-07-13-github-pages-deployment.md
git commit -m "ci: deploy Fluency Reset to GitHub Pages"
```
