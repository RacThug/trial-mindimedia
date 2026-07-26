/*
 * The suite ran config-free until the data layer arrived. It needs two things:
 * the `@/*` alias that `tsconfig.json` already declares, so that app code - the
 * Route Handlers especially - can import `@/lib/content` the way every Next file
 * does, and a test can still import that same module; and a way past the
 * Playwright specs, which share Vitest's default `*.spec.ts` pattern but need a
 * browser and a running server rather than a Node process.
 */

import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
})
