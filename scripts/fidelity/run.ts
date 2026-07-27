/*
 * The Fidelity Harness (PRD section 8, ADR-0003).
 *
 *   npm run build && npm run start          # in one terminal
 *   npm run fidelity                        # in another
 *
 * Captures the Clone and the Reference at 1440/810/390, finds each Section on
 * both sides, and compares them band by band. What it prints is a Markdown table
 * for the README and the methodology that produced it.
 *
 * Deliberately **not** a CI gate. It depends on a live third-party site, so as a
 * merge gate it would fail for reasons that have nothing to do with this repo,
 * and a gate that cries wolf gets disabled. ADR-0003 has the argument in full.
 *
 * **Two numbers per cell, because one of them cannot answer the question alone.**
 * ADR-0003 specified a pixel diff and expected font rasterisation to be the
 * residual. It is, on the Sections that are type - but seven of the thirteen
 * carry video or screenshots, and there a strict pixel comparison measures the
 * re-encode instead of the layout: the Template Wall's tiles land on exactly the
 * right pixel and score in the sixties, because H.264 at a quarter of the
 * Reference's bitrate puts three levels of difference inside every one of them. So each cell
 * carries the strict pixel match **and** the luma SSIM that `assets:verify`
 * already gates the encode with (#7). Read together they separate the two
 * questions - is it in the right place, and does it look the same - and neither
 * is quietly dropped for reading badly.
 *
 * There is no page-wide total, and that is a decision rather than an omission. An
 * average is dominated by whichever band is tallest, so one number would say more
 * about the Template Wall's 1144px than about the page. Per Section is the honest
 * shape, and it is the shape that tells a reader where to go and look.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { meanSsim } from '../lib/ssim.ts'
import { capturePage, captureModal, launch, type Capture } from './capture.ts'
import {
  compareRegions,
  DEFAULT_TOLERANCE,
  formatPercent,
  pixelMatches,
  type Raster,
} from './diff.ts'
import type { Box } from './page-script.ts'
import { CAPTURE_WIDTHS, MODAL, SECTIONS } from './sections.ts'

const CLONE_URL = process.env.CLONE_URL ?? 'http://localhost:3000'
const REFERENCE_URL = process.env.REFERENCE_URL ?? 'https://browser.supply/'

/**
 * Where the captures land: gitignored per `AGENTS.md`, and local to whoever ran
 * it. The table is the durable output; the images are for going and looking when
 * a row reads low, which is how #9 found the footer's divider rule.
 */
const OUTPUT_DIR = path.join('docs', 'measure', 'fidelity')

/** The viewport height each Breakpoint is captured at. */
const HEIGHT_FOR: Readonly<Record<number, number>> = { 1440: 900, 810: 1080, 390: 844 }

type Cell = {
  readonly percent: number
  readonly ssim: number
  readonly cloneHeight: number
  readonly referenceHeight: number
  /** Fraction of the region covered by a travelling backdrop, and so not compared. */
  readonly excluded: number
}

type Row = {
  readonly label: string
  readonly prd: string
  readonly cells: readonly (Cell | null)[]
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true })
  const browser = await launch()

  const cells = new Map<string, (Cell | null)[]>()
  const cellsFor = (id: string) => cells.get(id) ?? cells.set(id, []).get(id)!
  const warnings: string[] = []

  try {
    for (const [column, width] of CAPTURE_WIDTHS.entries()) {
      const height = HEIGHT_FOR[width] ?? 900
      process.stderr.write(`capturing ${width}x${height}...\n`)

      const [clone, reference, cloneModal, referenceModal] = await Promise.all([
        capturePage(browser, CLONE_URL, width, height),
        capturePage(browser, REFERENCE_URL, width, height),
        captureModal(browser, 'clone', CLONE_URL, width, height),
        captureModal(browser, 'reference', REFERENCE_URL, width, height),
      ])
      for (const [side, pass] of [
        ['clone', cloneModal],
        ['reference', referenceModal],
      ] as const) {
        for (const warning of pass.warnings)
          warnings.push(`${width} ${side} modal: ${warning}`)
      }

      for (const [side, capture] of [
        ['clone', clone],
        ['reference', reference],
      ] as const) {
        for (const warning of capture.warnings)
          warnings.push(`${width} ${side}: ${warning}`)
        await writeFile(path.join(OUTPUT_DIR, `${side}-${width}.png`), capture.png)
        /* Where a session that has to re-derive an anchor starts: the boxes the
         * table is cut from, before any of them becomes a percentage. */
        if (process.env.FIDELITY_DEBUG) {
          for (const band of capture.bands) {
            process.stderr.write(
              `  ${side} ${band.id}: ${JSON.stringify(band.box)}${band.note ? ` (${band.note})` : ''}\n`,
            )
          }
          process.stderr.write(
            `  ${side} excluded: ${JSON.stringify(capture.excluded)}\n`,
          )
        }
      }

      for (const section of SECTIONS) {
        const compared = await compareSection(clone, reference, section.id, width)
        cellsFor(section.id)[column] = compared?.cell ?? null
        if (compared?.diff) {
          await writeFile(
            path.join(OUTPUT_DIR, `diff-${section.id}-${width}.png`),
            compared.diff,
          )
        }
      }

      cellsFor('modal')[column] = await compareModal(cloneModal.png, referenceModal.png)
    }
  } finally {
    await browser.close()
  }

  const table: Row[] = [
    ...SECTIONS.map((section) => ({
      label: section.label,
      prd: section.prd,
      cells: cellsFor(section.id),
    })),
    { label: MODAL.label, prd: MODAL.prd, cells: cellsFor('modal') },
  ]

  process.stdout.write(render(table, warnings))
}

async function compareSection(
  clone: Capture,
  reference: Capture,
  id: string,
  width: number,
): Promise<{ cell: Cell; diff: Buffer | null } | null> {
  const cloneBox = clone.bands.find((band) => band.id === id)?.box
  const referenceBox = reference.bands.find((band) => band.id === id)?.box
  if (!cloneBox || !referenceBox) return null
  /* A band that resolved to nothing is a broken anchor, not a 0% Section, and
   * saying so beats printing a zero that looks like a measurement. */
  if (cloneBox.h <= 0 || referenceBox.h <= 0) return null

  const [cloneRaster, referenceRaster] = await Promise.all([
    crop(clone.png, cloneBox.y, width, cloneBox.h),
    crop(reference.png, referenceBox.y, width, referenceBox.h),
  ])

  return {
    cell: await score(cloneRaster, referenceRaster, [
      coverage(cloneBox, clone.excluded),
      coverage(referenceBox, reference.excluded),
    ]),
    diff: await diffImage(cloneRaster, referenceRaster),
  }
}

async function compareModal(
  clone: Buffer | null,
  reference: Buffer | null,
): Promise<Cell | null> {
  if (!clone || !reference) return null

  const [cloneRaster, referenceRaster] = await Promise.all([
    decode(clone),
    decode(reference),
  ])
  /* Two panels of different width cannot be compared row by row, and PRD 6.13
   * measures that width per Breakpoint - so a mismatch here is the finding, not
   * an inconvenience to work around. */
  if (cloneRaster.width !== referenceRaster.width) {
    return {
      percent: 0,
      ssim: 0,
      cloneHeight: cloneRaster.height,
      referenceHeight: referenceRaster.height,
      excluded: 0,
    }
  }
  /* Its ticker is hidden inside the panel rather than around it, so the box the
   * capture reports covers the whole card; what it actually costs is measured
   * from the picture instead - see `flatFraction`. */
  return score(cloneRaster, referenceRaster, [
    flatFraction(cloneRaster),
    flatFraction(referenceRaster),
  ])
}

/**
 * How much of a band a travelling backdrop covered, as a fraction of its area.
 *
 * A union rather than a sum: the quiz CTA runs four columns side by side and one
 * inside another, so adding their boxes up would report more than the whole
 * band. Marked out on a 4px grid, which is finer than any answer this number is
 * read to.
 */
function coverage(band: Box, excluded: readonly Box[]): number {
  const CELL = 4
  const columns = Math.ceil(band.w / CELL)
  const rows = Math.ceil(band.h / CELL)
  if (columns === 0 || rows === 0) return 0

  const covered = new Uint8Array(columns * rows)
  for (const box of excluded) {
    const left = Math.max(0, Math.floor((box.x - band.x) / CELL))
    const right = Math.min(columns, Math.ceil((box.x + box.w - band.x) / CELL))
    const top = Math.max(0, Math.floor((box.y - band.y) / CELL))
    const bottom = Math.min(rows, Math.ceil((box.y + box.h - band.y) / CELL))
    for (let row = top; row < bottom; row += 1) {
      for (let column = left; column < right; column += 1)
        covered[row * columns + column] = 1
    }
  }
  return covered.reduce((total, cell) => total + cell, 0) / covered.length
}

/**
 * How much of a region is a single flat colour, which is what a hidden backdrop
 * leaves behind.
 *
 * Used only for the modal, where the excluded region is inside the captured
 * element rather than around it and its box says nothing useful.
 */
function flatFraction(raster: Raster): number {
  const counts = new Map<number, number>()
  for (let i = 0; i < raster.width * raster.height; i += 1) {
    const at = i * 3
    const key =
      ((raster.raw[at] ?? 0) << 16) |
      ((raster.raw[at + 1] ?? 0) << 8) |
      (raster.raw[at + 2] ?? 0)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const most = Math.max(...counts.values())
  return most / (raster.width * raster.height)
}

/**
 * Both numbers for one pair of regions.
 *
 * The pixel match is scored against the taller region, so a height difference
 * costs the percentage. SSIM is scored over the overlap instead, because a
 * windowed metric has nothing to say about rows that exist on one side only -
 * which is exactly why the two heights are printed beside it rather than left
 * for the percentage to imply.
 */
async function score(
  clone: Raster,
  reference: Raster,
  excludedPerSide: readonly number[],
): Promise<Cell> {
  const pixels = compareRegions(clone, reference)
  const overlap = Math.min(clone.height, reference.height)

  return {
    percent: pixels.percent,
    ssim:
      overlap >= 8 && clone.width >= 8
        ? meanSsim(luma(clone, overlap), luma(reference, overlap), clone.width, overlap)
        : 1,
    cloneHeight: pixels.cloneHeight,
    referenceHeight: pixels.referenceHeight,
    /* The larger of the two sides. Whichever page hid more is how much of this
     * band went unmeasured on both, because a pixel is only compared where both
     * sides drew one. */
    excluded: Math.max(...excludedPerSide),
  }
}

/**
 * The luma plane of a region's first `height` rows, Rec. 709.
 *
 * The same weights `sharp`'s `greyscale()` applies in `assets:verify`, so a
 * score printed here means what a score printed there means.
 */
function luma(raster: Raster, height: number): Uint8Array {
  const plane = new Uint8Array(raster.width * height)
  for (let i = 0; i < plane.length; i += 1) {
    const at = i * 3
    plane[i] = Math.round(
      0.2126 * (raster.raw[at] ?? 0) +
        0.7152 * (raster.raw[at + 1] ?? 0) +
        0.0722 * (raster.raw[at + 2] ?? 0),
    )
  }
  return plane
}

/**
 * One band out of a full-page capture, as raw RGB.
 *
 * Clamped to the image, because a band's measured bottom can round a pixel past
 * the page's own height and `sharp` treats that as an error rather than an edge.
 */
async function crop(
  png: Buffer,
  top: number,
  width: number,
  height: number,
): Promise<Raster> {
  const image = sharp(png)
  const meta = await image.metadata()
  const pageHeight = meta.height ?? 0
  const pageWidth = meta.width ?? 0

  const clampedTop = Math.max(0, Math.min(top, Math.max(0, pageHeight - 1)))
  const clampedHeight = Math.max(0, Math.min(height, pageHeight - clampedTop))
  const clampedWidth = Math.min(width, pageWidth)

  const { data } = await image
    .extract({ left: 0, top: clampedTop, width: clampedWidth, height: clampedHeight })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return { raw: new Uint8Array(data), width: clampedWidth, height: clampedHeight }
}

async function decode(png: Buffer): Promise<Raster> {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { raw: new Uint8Array(data), width: info.width, height: info.height }
}

/**
 * A black-on-white mask of every pixel that missed, over the overlap.
 *
 * The reason the harness writes images at all. A percentage says a Section is
 * 94%; this says whether that is a font edge on every glyph or a card in the
 * wrong place, and #9's 1px nav offset was found exactly this way.
 */
async function diffImage(clone: Raster, reference: Raster): Promise<Buffer | null> {
  const height = Math.min(clone.height, reference.height)
  if (height === 0 || clone.width === 0) return null

  const mask = Buffer.alloc(clone.width * height, 255)
  for (let i = 0; i < clone.width * height; i += 1) {
    if (!pixelMatches(clone, reference, i)) mask[i] = 0
  }

  return sharp(mask, { raw: { width: clone.width, height, channels: 1 } })
    .png()
    .toBuffer()
}

function render(rows: readonly Row[], warnings: readonly string[]): string {
  const lines: string[] = []
  lines.push(`| Section | PRD | ${CAPTURE_WIDTHS.join(' | ')} |`)
  lines.push(`| --- | --- | ${CAPTURE_WIDTHS.map(() => '---').join(' | ')} |`)

  for (const row of rows) {
    const cells = row.cells.length === 0 ? CAPTURE_WIDTHS.map(() => null) : row.cells
    const rendered = CAPTURE_WIDTHS.map((_, column) => {
      const cell = cells[column]
      if (!cell) return 'not found'
      const drift =
        cell.cloneHeight === cell.referenceHeight
          ? ''
          : ` **${cell.cloneHeight} vs ${cell.referenceHeight}px**`
      /* Under a twentieth of a band is rounding, and printing it on every row
       * would bury the two cells where it is most of the picture. */
      const excluded =
        cell.excluded >= 0.05 ? ` (-${Math.round(cell.excluded * 100)}%)` : ''
      return `${formatPercent(cell.percent)} / ${cell.ssim.toFixed(3)}${excluded}${drift}`
    })
    lines.push(`| ${row.label} | ${row.prd} | ${rendered.join(' | ')} |`)
  }

  lines.push('')
  lines.push(
    `Each cell is **pixel match / SSIM**. Pixel match counts pixels within a per-channel delta of`,
  )
  lines.push(
    `${DEFAULT_TOLERANCE} against the **taller** of the two Sections, so a height difference costs the`,
  )
  lines.push(
    'percentage instead of hiding in a footnote; where the heights differ, both are printed.',
  )
  lines.push(
    'SSIM is mean luma structural similarity over the overlap, the same metric and the same',
  )
  lines.push(
    'implementation `npm run assets:verify` gates the image encode with at 0.98.',
  )
  lines.push('')
  lines.push(
    'On both sides, before capture: the quiz modal is dismissed, every clip is frozen on',
  )
  lines.push(
    'frame 0, and Scroll-Appear is swept out. Captured at one image pixel per CSS pixel.',
  )
  lines.push('')
  lines.push(
    '`(-n%)` is how much of the band a travelling backdrop covered. A loop that two',
  )
  lines.push(
    'implementations start at two offsets has no shared frame to be frozen to, the way',
  )
  lines.push(
    '`currentTime = 0` names one frame of a clip, so those regions are hidden on both',
  )
  lines.push(
    'sides rather than compared - and how much went unmeasured is printed rather than',
  )
  lines.push('left to be assumed away.')

  if (warnings.length > 0) {
    lines.push('')
    lines.push(
      'Warnings from the run, which belong with the numbers rather than behind them:',
    )
    for (const warning of warnings) lines.push(`- ${warning}`)
  }

  return `${lines.join('\n')}\n`
}

await main()
