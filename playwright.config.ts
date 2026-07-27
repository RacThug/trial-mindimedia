import { defineConfig, devices } from '@playwright/test'

/*
 * The E2E stage PRD section 9 asks for: mobile menu, placeholder routing, and an
 * axe scan, with the quiz modal and the pricing Options joining them as those
 * Sections land.
 *
 * It runs against a production build rather than `next dev`, because half of
 * what these tests claim is about the build: that `/api/templates` is a
 * prerendered file a browser can fetch, and that seven placeholder routes are
 * static pages rather than a dev server's on-demand compile.
 *
 * One project. The specs that care about width set their own viewport, and the
 * Breakpoints are the measured ones - running every test at two widths would
 * mostly assert that a hidden element stays hidden.
 *
 * Not a CI gate for the same reason nothing else here is: this repo has no
 * workflow, so the five checks in PRD section 9 plus this run happen locally
 * before a PR.
 */

const PORT = 3311

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
})
