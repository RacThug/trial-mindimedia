import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
import { beforeAll, describe, expect, it } from 'vitest'

/*
 * The token layer is the one part of the scaffold that later work silently
 * depends on: a wrong breakpoint or a missing colour does not fail a build, it
 * just produces a page that is subtly not the Reference. So it gets compiled
 * for real - through the same PostCSS plugin Next uses - and asserted against
 * PRD.md section 4 and section 5.
 */

const FIXTURE = fileURLToPath(new URL('./fixtures/theme-probe.css', import.meta.url))

/*
 * Tailwind's stock breakpoints, which PRD section 5 replaces. The fixture has
 * to probe each one for the "no stock breakpoint" assertions to mean anything,
 * so the two lists are checked against each other below rather than trusted to
 * stay in step by hand.
 */
const STOCK_BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl']

let fixtureSource = ''
let css = ''
let themeBlock = ''

beforeAll(async () => {
  fixtureSource = await readFile(FIXTURE, 'utf8')
  const result = await postcss([tailwindcss()]).process(fixtureSource, { from: FIXTURE })
  css = result.css

  /*
   * Token values must be read from the `:root` block Tailwind emits for
   * `@theme`, not from the sheet at large - a declaration inside some utility
   * or media query would otherwise satisfy an assertion that reads as though it
   * were about the theme. The block contains no nested braces, so it runs to
   * the first `}`.
   */
  const start = css.indexOf(':root')
  expect(start, 'compiled CSS has no :root block').toBeGreaterThan(-1)
  themeBlock = css.slice(start, css.indexOf('}', start))
}, 60_000)

/** Reads one custom property from the `@theme` block, or undefined if unset. */
function themeVariable(name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  /* Anchored, so asking for `--text-sm` cannot be answered by `--x--text-sm`. */
  const match = themeBlock.match(new RegExp(`(?:^|[;{])\\s*${escaped}:\\s*([^;}]+)`))
  return match?.[1]?.trim()
}

describe('the probe fixture', () => {
  it.each(STOCK_BREAKPOINTS)('probes the stock `%s` breakpoint', (name) => {
    expect(fixtureSource).toContain(`@source inline("${name}:text-h2")`)
  })
})

describe('breakpoints (PRD section 5)', () => {
  it.each([
    ['--breakpoint-tablet', '810px'],
    ['--breakpoint-desktop', '1200px'],
  ])('defines %s as %s', (name, value) => {
    expect(themeVariable(name)).toBe(value)
  })

  it.each(STOCK_BREAKPOINTS)("drops Tailwind's stock `%s` breakpoint", (name) => {
    expect(themeVariable(`--breakpoint-${name}`)).toBeUndefined()
  })

  it.each(['640px', '768px', '1024px', '1280px', '1536px'])(
    'emits no media query at the stock width %s',
    (width) => {
      expect(css).not.toContain(width)
    },
  )

  it.each([
    ['tablet', '810px'],
    ['desktop', '1200px'],
  ])('compiles the `%s:` variant to a min-width of %s', (variant, width) => {
    expect(css).toContain(`@media (width >= ${width})`)
    expect(css).toContain(`.${variant}\\:text-h2`)
  })
})

describe('type scale (PRD section 4)', () => {
  /* size, line height, letter spacing - all measured, none derived. */
  it.each([
    ['display', '68px', '81.6px', '-1.36px'],
    ['h2', '56px', '67.2px', '-1.12px'],
    ['h3', '44px', '57.2px', '-0.88px'],
    ['h4', '32px', '41.6px', '-0.64px'],
    ['h5', '24px', '33.6px', '-0.48px'],
    ['body', '16px', '25.6px', 'normal'],
    ['eyebrow', '12px', '20.4px', 'normal'],
  ])('defines `%s` as %s/%s, tracking %s', (name, size, leading, tracking) => {
    expect(themeVariable(`--text-${name}`)).toBe(size)
    expect(themeVariable(`--text-${name}--line-height`)).toBe(leading)
    expect(themeVariable(`--text-${name}--letter-spacing`)).toBe(tracking)
  })

  it('defines the 12px button label', () => {
    expect(themeVariable('--text-button')).toBe('12px')
  })

  it('makes the Eyebrow the only heavier step', () => {
    expect(themeVariable('--text-eyebrow--font-weight')).toBe('600')
  })

  it.each(['xs', 'sm', 'base', 'lg', 'xl', '2xl'])(
    "drops Tailwind's stock `%s` type step",
    (name) => {
      expect(themeVariable(`--text-${name}`)).toBeUndefined()
    },
  )
})

describe('tracking and weight (PRD section 4)', () => {
  it('carries the uniform -0.02em tracking as the only tracking value', () => {
    expect(themeVariable('--tracking-tight')).toBe('-0.02em')
  })

  it("does not inherit Tailwind's -0.025em under the same name", () => {
    expect(themeVariable('--tracking-tight')).not.toBe('-0.025em')
    expect(themeVariable('--tracking-wide')).toBeUndefined()
  })

  it('offers only the two measured weights', () => {
    expect(themeVariable('--font-weight-normal')).toBe('400')
    expect(themeVariable('--font-weight-semibold')).toBe('600')
    expect(themeVariable('--font-weight-bold')).toBeUndefined()
  })

  it('drops the stock leading scale, since each step carries its own', () => {
    expect(themeVariable('--leading-loose')).toBeUndefined()
    expect(themeVariable('--leading-tight')).toBeUndefined()
  })
})

describe('colour (PRD section 4)', () => {
  it.each([
    ['bg', '#000000'],
    ['surface-1', '#141414'],
    ['surface-2', '#1c1c1c'],
    ['surface-3', '#2e2e2e'],
    ['text', '#ffffff'],
    ['text-muted', '#c9c9c9'],
    ['accent-blue', '#8ea9fa'],
    ['accent-orange', '#ff8800'],
    ['accent-green', '#33d478'],
  ])('defines `%s` as %s', (name, value) => {
    expect(themeVariable(`--color-${name}`)).toBe(value)
  })

  it('drops the stock palette so only the measured nine remain', () => {
    expect(themeVariable('--color-slate-500')).toBeUndefined()
    expect(themeVariable('--color-red-500')).toBeUndefined()
  })
})

describe('shape (PRD section 4)', () => {
  it.each([
    ['--container-page', '1360px'],
    ['--radius-button', '48px'],
    ['--button-height', '46px'],
    ['--button-padding-x', '20px'],
    ['--button-padding-y', '10px'],
    ['--nav-height', '86px'],
    ['--nav-z-index', '8'],
  ])('defines %s as %s', (name, value) => {
    expect(themeVariable(name)).toBe(value)
  })

  it('drops the stock radius scale, which is unmeasured guesswork here', () => {
    expect(themeVariable('--radius-lg')).toBeUndefined()
    expect(themeVariable('--radius-full')).toBeUndefined()
  })
})
