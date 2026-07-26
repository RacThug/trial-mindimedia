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

let css = ''

beforeAll(async () => {
  const source = await readFile(FIXTURE, 'utf8')
  const result = await postcss([tailwindcss()]).process(source, { from: FIXTURE })
  css = result.css
}, 60_000)

/** The `:root` block Tailwind emits for `@theme`, where token values land. */
function themeVariable(name: string): string | undefined {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`))
  return match?.[1]?.trim()
}

describe('breakpoints (PRD section 5)', () => {
  it.each([
    ['--breakpoint-tablet', '810px'],
    ['--breakpoint-desktop', '1200px'],
  ])('defines %s as %s', (name, value) => {
    expect(themeVariable(name)).toBe(value)
  })

  it.each(['sm', 'md', 'lg', 'xl', '2xl'])(
    "drops Tailwind's stock `%s` breakpoint",
    (name) => {
      expect(themeVariable(`--breakpoint-${name}`)).toBeUndefined()
    },
  )

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

  it('makes the eyebrow the only heavier step', () => {
    expect(themeVariable('--text-eyebrow--font-weight')).toBe('600')
  })

  it('carries the uniform -0.02em tracking as a named token', () => {
    expect(themeVariable('--tracking-tight')).toBe('-0.02em')
  })

  it.each(['xs', 'sm', 'base', 'lg', 'xl', '2xl'])(
    "drops Tailwind's stock `%s` type step",
    (name) => {
      expect(themeVariable(`--text-${name}`)).toBeUndefined()
    },
  )
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
})
