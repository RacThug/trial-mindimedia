/*
 * Everything the harness runs *inside* the page, on both sides.
 *
 * These are serialised into the browser by `page.evaluate`, so each one is
 * closed over nothing: no imports, no module constants, every input an argument.
 * That constraint is why they live here rather than beside their callers - a
 * helper that quietly captured a module-level value would work under `tsc` and
 * throw `ReferenceError` in Chromium.
 *
 * The three preparations ADR-0003 requires of both sides are here: dismiss the
 * quiz modal, freeze video, settle Scroll-Appear. Without them the harness would
 * report video frames and animation timing rather than layout.
 */

export type Box = {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export type ResolvedBand = {
  readonly id: string
  readonly box: Box | null
  /** Why it is null, or a note worth printing beside a suspicious number. */
  readonly note: string | null
}

/** Serialisable twin of `SectionSpec`, small enough to cross into the page. */
export type BandRequest = {
  readonly id: string
  readonly anchor:
    | { readonly kind: 'selector'; readonly selector: string }
    | { readonly kind: 'heading'; readonly text: string }
    | { readonly kind: 'between'; readonly after: string; readonly before: string }
}

/**
 * Find every band's page-coordinate box.
 *
 * Anchor, then climb: the band is the outermost ancestor of the anchor that does
 * not also contain another Section's anchor. One rule, and it needs to know
 * nothing about either DOM - which is the only way a single implementation can
 * measure Framer's markup and ours.
 */
export function resolveBands({
  specs,
  bandAttribute,
}: {
  readonly specs: readonly BandRequest[]
  readonly bandAttribute: string
}): ResolvedBand[] {
  const norm = (value: string) => value.replace(/\s+/g, ' ').trim()

  const anchorOf = (spec: BandRequest): Element | null => {
    if (spec.anchor.kind === 'selector')
      return document.querySelector(spec.anchor.selector)
    if (spec.anchor.kind === 'between') return null

    const wanted = norm(spec.anchor.text)
    const hits = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(
      (element) => norm(element.textContent ?? '').startsWith(wanted),
    )
    /* Deepest wins: a heading nested in another matching node is the real one. */
    return (
      hits.find((hit) => !hits.some((other) => other !== hit && hit.contains(other))) ??
      null
    )
  }

  const anchors = new Map(specs.map((spec) => [spec.id, anchorOf(spec)]))

  const climb = (id: string, anchor: Element): Element => {
    const others = [...anchors.entries()]
      .filter(([otherId, element]) => otherId !== id && element !== null)
      .map(([, element]) => element as Element)

    const hasBox = (element: Element) => {
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }

    let node = anchor
    /*
     * The outermost ancestor that still has a box. Framer wraps bands in
     * `display: contents` divs, which lay out as if they were not there and
     * report an all-zero rect - measured on the Reference's footer, where the
     * climb landed on one and the harness reported a 0x0 band. Remembering the
     * last real box rather than trusting the last node is what makes the same
     * rule work on both sides.
     */
    let outermost = hasBox(node) ? node : null
    while (
      node.parentElement &&
      node.parentElement !== document.body &&
      node.parentElement !== document.documentElement &&
      !others.some((other) => node.parentElement?.contains(other))
    ) {
      node = node.parentElement
      if (hasBox(node)) outermost = node
    }
    return outermost ?? node
  }

  const boxOf = (element: Element): Box => {
    const rect = element.getBoundingClientRect()
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y + window.scrollY),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    }
  }

  const resolved = new Map<string, Box | null>()
  const notes = new Map<string, string | null>()

  for (const spec of specs) {
    if (spec.anchor.kind === 'between') continue
    const anchor = anchors.get(spec.id) ?? null
    if (!anchor) {
      resolved.set(spec.id, null)
      notes.set(spec.id, 'anchor not found')
      continue
    }
    const band = climb(spec.id, anchor)
    band.setAttribute(bandAttribute, spec.id)
    const box = boxOf(band)
    resolved.set(spec.id, box)
    notes.set(
      spec.id,
      box.w === document.documentElement.clientWidth
        ? null
        : `band is ${box.w}px, not full width`,
    )
  }

  /*
   * The bands with no anchor of their own. They stack flush against their
   * neighbours - measured, `main`'s children run edge to edge - so the gap
   * between two resolved bands is the band between them.
   */
  for (const spec of specs) {
    if (spec.anchor.kind !== 'between') continue
    const after = resolved.get(spec.anchor.after) ?? null
    const before = resolved.get(spec.anchor.before) ?? null
    if (!after || !before) {
      resolved.set(spec.id, null)
      notes.set(spec.id, 'neighbouring band not found')
      continue
    }
    const top = after.y + after.h
    resolved.set(spec.id, {
      x: 0,
      y: top,
      w: document.documentElement.clientWidth,
      h: before.y - top,
    })
    notes.set(spec.id, before.y > top ? null : 'neighbours overlap')
  }

  return specs.map((spec) => ({
    id: spec.id,
    box: resolved.get(spec.id) ?? null,
    note: notes.get(spec.id) ?? null,
  }))
}

/** The attribute `resolveBands` leaves behind, so the settle check can find bands. */
export const BAND_ATTRIBUTE = 'data-fidelity-band'

/**
 * Take the quiz modal out of the page, on whichever side this is.
 *
 * The Reference's reappears on every navigation and offers no visible control,
 * so it comes out of the DOM rather than being clicked away; ours is a
 * `<dialog>` and simply closes. Both leave the page underneath untouched, which
 * is the point - the modal covers the hero, and PRD 6.13 is measured separately.
 */
export function dismissQuizModal(): number {
  let removed = 0

  for (const dialog of document.querySelectorAll('dialog')) {
    if (dialog.open) dialog.close()
    dialog.remove()
    removed += 1
  }

  /* Framer's: a fixed overlay at a raised z-index, plus its scrim. */
  for (const element of document.querySelectorAll('body div')) {
    const style = getComputedStyle(element)
    if (style.position !== 'fixed') continue
    if (Number.parseInt(style.zIndex || '0', 10) < 9) continue
    element.remove()
    removed += 1
  }

  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  return removed
}

/**
 * Freeze every clip on its first frame.
 *
 * ADR-0003 says "poster frames", and measuring the Reference showed that is not
 * available: **not one of its thirteen `<video>` elements carries a `poster`
 * attribute or has an image behind it** - they autoplay at `preload="auto"` and
 * there is nothing else to show. Frame 0 is the one still both sides can be held
 * on, and it is what our own posters are cut from, so it is what the harness
 * freezes to. The Clone's clips have to be loaded first to get there: they ship
 * `preload="none"` by design (PRD section 8), so a bare `pause()` would leave a
 * transparent element over a poster while the Reference showed real video.
 *
 * `feature/hosting` is the reason this is frame 0 rather than our poster image.
 * Its first frame is black - it fades up - so its committed poster is
 * deliberately a later frame (PRD section 8). Comparing our poster against the
 * Reference's frame 0 would score a black rectangle against a screenshot and
 * blame the layout.
 */
export async function freezeVideo({
  timeoutMs,
  attempts,
}: {
  readonly timeoutMs: number
  readonly attempts: number
}): Promise<{ readonly total: number; readonly frozen: number }> {
  const videos = [...document.querySelectorAll('video')]
  const atFrameZero = (video: HTMLVideoElement) =>
    video.readyState >= 2 && video.currentTime === 0

  /*
   * Attempts, not one pass. The Reference autoplays all thirteen of its clips
   * and keeps doing so: a single pause-and-seek left 8 of 13 at some other frame
   * on one run and 12 of 13 on the next, which is where the Sections carrying
   * video were picking up several points of run-to-run noise. Each round pauses
   * whatever has started again and re-seeks whatever has not landed.
   */
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const pending = videos.filter((video) => !atFrameZero(video))
    if (pending.length === 0) break

    await Promise.all(
      pending.map(async (video) => {
        video.pause()
        video.loop = false
        video.autoplay = false

        if (video.readyState < 2) {
          video.preload = 'auto'
          video.load()
          await new Promise<void>((resolve) => {
            const done = () => resolve()
            video.addEventListener('loadeddata', done, { once: true })
            video.addEventListener('error', done, { once: true })
            setTimeout(done, timeoutMs)
          })
        }

        if (video.currentTime === 0) return
        await new Promise<void>((resolve) => {
          const done = () => resolve()
          video.addEventListener('seeked', done, { once: true })
          setTimeout(done, timeoutMs)
          video.currentTime = 0
        })
      }),
    )
  }

  /* One last pause for anything that resumed while the others were seeking. */
  for (const video of videos) video.pause()

  /* A clip that never decoded shows nothing, and on the Clone that means the
   * poster underneath where the Reference has a frame of video. It is a hole in
   * the measurement, so it is counted rather than assumed away. */
  return { total: videos.length, frozen: videos.filter(atFrameZero).length }
}

/**
 * Take every travelling backdrop out of both pictures, and say where it was.
 *
 * Three decorative backdrops travel for as long as the page is open (PRD 6.6,
 * 6.10, 6.13) and no amount of waiting settles them. Left in, they are the
 * largest distortion the harness can produce: the quiz CTA scored **9.6%** with
 * them running, not because anything was in the wrong place but because two
 * identical column stacks were photographed at two phases of the same loop.
 *
 * Parking them at their own cycle start was tried first and does not work. Both
 * sides stop, but "the start of the cycle" is a different frame on each - a
 * Framer ticker begins part-way in so it looks populated - and the band still
 * scored 18%. There is no shared frame to freeze a travelling backdrop to, in
 * the way there is for video: `currentTime = 0` names one frame of a clip, and
 * nothing names one frame of a loop that two independent implementations start
 * at two offsets. So a region with no canonical frame is not photographed at all,
 * and the area it covered is reported beside the score. A percentage measured
 * over 61% of a band is worth reading; the same percentage passed off as the
 * whole band is not.
 *
 * Detection is by observation rather than by selector, which is what lets one
 * routine do this to Framer's markup and to ours: sample every transform, wait,
 * and whatever moved is travelling. The rAF loop driving Framer's is replaced
 * before anything is written, because ours are CSS animations that stop for an
 * `!important` alone and theirs are rewritten into the inline style every frame.
 *
 * `visibility` rather than `display`, so the layout underneath does not shift -
 * the point is to remove pixels, not to reflow the Section around their absence.
 */
export async function hideTravelling({
  offsets,
  sampleMs,
  bandAttribute,
}: {
  readonly offsets: readonly number[]
  readonly sampleMs: number
  readonly bandAttribute: string
}): Promise<{ readonly boxes: Box[]; readonly count: number }> {
  /*
   * A Section is never a backdrop. Without that guard a Scroll-Appear island
   * that has not landed yet reads as travelling - measured: one run caught the
   * whole pricing band mid-spring and hid 1440x1088 of it - and the harness
   * would quietly stop measuring the very thing it exists to measure.
   */
  const elements = ([...document.querySelectorAll('body *')] as HTMLElement[]).filter(
    (element) =>
      !element.hasAttribute(bandAttribute) &&
      element.querySelector(`[${bandAttribute}]`) === null,
  )
  const moving = new Set<HTMLElement>()

  /*
   * Detected with each stretch of the page **in view**, which is the whole
   * difference between this working and not. A first attempt sampled once from
   * the top of the page and found every backdrop on the Clone and none on the
   * Reference, because Framer's tickers pause when they are off screen and ours
   * are CSS animations that do not. Hiding what only one side was running made
   * the quiz CTA's score worse than leaving both alone.
   */
  for (const offset of offsets) {
    window.scrollTo(0, Math.max(0, offset - window.innerHeight / 2))
    await new Promise((resolve) => setTimeout(resolve, 150))
    const before = elements.map((element) => getComputedStyle(element).transform)
    await new Promise((resolve) => setTimeout(resolve, sampleMs))
    elements.forEach((element, index) => {
      if (getComputedStyle(element).transform !== before[index]) moving.add(element)
    })
  }

  window.requestAnimationFrame = () => 0
  await new Promise((resolve) => setTimeout(resolve, 100))
  window.scrollTo(0, 0)
  await new Promise((resolve) => setTimeout(resolve, 200))

  const hidden: Box[] = []
  for (const element of moving) {
    /* A travelling child inside a travelling parent is one region, not two. */
    if ([...moving].some((other) => other !== element && other.contains(element)))
      continue
    const box = visibleBox(element)
    if (box) hidden.push(box)
    element.style.setProperty('visibility', 'hidden', 'important')
    element.style.setProperty('animation-play-state', 'paused', 'important')
  }
  /* `count` and `boxes.length` are different questions: one is how many regions
   * were taken out, the other how many of them the page still showed anything
   * of. A backdrop scrolled entirely out of its own clip has no visible box and
   * costs the comparison nothing. */
  return { boxes: hidden, count: moving.size }

  /**
   * An element's box clipped to every ancestor that crops it.
   *
   * Both sides run these columns tilted and much taller than the window they show
   * through, so the raw bounding box of one is several times the band it appears
   * in - one measured 1208x3367 inside a 390px-wide page. Reporting that as the
   * area a backdrop covered would say a Section was 97% unmeasured when the truth
   * was a fifth of it.
   */
  function visibleBox(element: Element): Box | null {
    const rect = element.getBoundingClientRect()
    let left = rect.left
    let right = rect.right
    let top = rect.top
    let bottom = rect.bottom

    for (
      let ancestor = element.parentElement;
      ancestor && ancestor !== document.body && ancestor !== document.documentElement;
      ancestor = ancestor.parentElement
    ) {
      const style = getComputedStyle(ancestor)
      if (
        style.overflow === 'visible' &&
        style.overflowX === 'visible' &&
        style.overflowY === 'visible'
      ) {
        continue
      }
      const clip = ancestor.getBoundingClientRect()
      /* An ancestor that clips but does not overlap its own descendant is not
       * clipping it in these coordinates - it is a scroll container, and on the
       * Reference every travelling column had one, which is why this returned
       * null for all ten of them and reported nothing excluded. */
      if (clip.right <= rect.left || clip.left >= rect.right) continue
      if (clip.bottom <= rect.top || clip.top >= rect.bottom) continue
      left = Math.max(left, clip.left)
      right = Math.min(right, clip.right)
      top = Math.max(top, clip.top)
      bottom = Math.min(bottom, clip.bottom)
    }

    if (right <= left || bottom <= top) return null
    return {
      x: Math.round(left),
      y: Math.round(top + window.scrollY),
      w: Math.round(right - left),
      h: Math.round(bottom - top),
    }
  }
}

/**
 * Which Scroll-Appear islands have not landed yet, as page-coordinate tops.
 *
 * "Landed" is fully opaque and untransformed, which is `tests/e2e/settle.ts`'s
 * reading and the same one the E2E suite has been using since #13.
 *
 * What differs is the candidate set, and it has to, because only one side is
 * ours. On the Clone every island is marked `[data-appear]`. On the Reference
 * the harness watches the resolved band elements - which is where Framer puts
 * the transform (`scroll-appear.tsx`) - and cannot see a *nested* block the way
 * it sees a Section. Those are covered by the sweep and the settle wait rather
 * than by this check, which is a real limit of the check and not of the settle:
 * a nested block that never fired would show up in the Section's percentage as
 * a large, obvious miss rather than pass unnoticed.
 *
 * Scanning every element instead was tried and is wrong. Three backdrops travel
 * on a loop for as long as the page is open (PRD 6.6, 6.10, 6.13), so a check
 * that counts any transform as pending never converges.
 */
export function pendingIslands(extraSelectors: readonly string[]): number[] {
  const candidates = new Set<Element>(document.querySelectorAll('[data-appear]'))
  for (const selector of extraSelectors) {
    for (const element of document.querySelectorAll(selector)) candidates.add(element)
  }

  const pending: number[] = []
  for (const element of candidates) {
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const style = getComputedStyle(element)
    const opaque = Number(style.opacity) === 1
    const still =
      style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)'
    if (!opaque || !still) pending.push(Math.round(rect.y + window.scrollY))
  }
  return pending
}

/**
 * Wait for every image the capture will photograph to have pixels, not just a
 * response.
 *
 * A lazily loaded `next/image` decodes on a task of its own, and a screenshot
 * taken between the fetch and the decode photographs an empty box. Not
 * hypothetical: the featured Templates band swung between 84.7% and 72.4% at
 * 810px across two runs of an otherwise identical harness, which is one card of
 * three arriving late.
 *
 * "Will photograph" is doing work in that sentence. A page like this one carries
 * 48 images that never load at all and never should: a ticker renders its list
 * twice for a seamless loop, and the second copy sits outside its own
 * `overflow: hidden` window, where Chrome quite correctly declines to fetch a
 * lazy image. Counting those reported four dozen failures on a run where nothing
 * had failed. Anything with no box, or inside the backdrops this pass has
 * already hidden, is not in the picture and is not waited for.
 */
export async function awaitImages(timeoutMs: number): Promise<number> {
  const images = [...document.images].filter((image) => {
    const rect = image.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return false
    return getComputedStyle(image).visibility !== 'hidden'
  })

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, timeoutMs)
          if (image.complete) {
            image.decode().then(
              () => resolve(),
              () => resolve(),
            )
            return
          }
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  )

  return images.filter((image) => !image.complete || image.naturalWidth === 0).length
}

/**
 * Centre each of these page offsets in turn, so its observer fires.
 *
 * Centring rather than passing by: Scroll-Appear fires at half the element or
 * half the viewport (`appear.ts`), and a centred element satisfies whichever of
 * the two applies. The dwell is what makes it work at all - an
 * IntersectionObserver reports on a task of its own, so a sweep that scrolls on
 * the next frame moves past an island before it is ever told about it.
 */
export async function visitOffsets({
  offsets,
  dwellMs,
}: {
  readonly offsets: readonly number[]
  readonly dwellMs: number
}): Promise<void> {
  for (const offset of offsets) {
    window.scrollTo(0, Math.max(0, offset - window.innerHeight / 2))
    await new Promise((resolve) => setTimeout(resolve, dwellMs))
  }
}

/** Every half-viewport step down the page, so the sweep misses nothing. */
export function sweepOffsets(): number[] {
  const step = Math.max(200, Math.round(window.innerHeight / 2))
  const offsets: number[] = []
  for (let y = 0; y < document.documentElement.scrollHeight + step; y += step)
    offsets.push(y)
  return offsets
}
