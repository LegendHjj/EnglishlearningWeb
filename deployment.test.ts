// @vitest-environment node

import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('deploys the production build to GitHub Pages', () => {
  const workflow = readFileSync('.github/workflows/deploy-pages.yml', 'utf8')

  expect(workflow).toMatch(/push:\s*branches:\s*- mainbranch\s/)
  expect(workflow).not.toContain('feature/fluency-reset-mvp')
  expect(workflow).toContain('workflow_dispatch:')
  expect(workflow).toContain('npm ci')
  expect(workflow).toContain('npm run build')
  expect(workflow).toContain('actions/upload-pages-artifact@v4')
  expect(workflow).toContain('path: ./dist')
  expect(workflow).toContain('actions/deploy-pages@v4')
})
