/*
 * The suite ran config-free until the data layer arrived. It needs one thing:
 * the `@/*` alias that `tsconfig.json` already declares, so that app code - the
 * Route Handlers especially - can import `@/lib/content` the way every Next file
 * does, and a test can still import that same module.
 */

import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
