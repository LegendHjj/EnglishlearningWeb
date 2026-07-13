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
