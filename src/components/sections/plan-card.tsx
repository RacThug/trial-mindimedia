'use client'

import { useState } from 'react'
import { ButtonLink } from '@/components/ui/button.tsx'
import { PlanIcon } from '@/components/ui/plan-icon.tsx'
import { formatMoney, type Plan, type PlanOption } from '@/lib/content'

/*
 * One Plan card (PRD 6.9), measured in #12 at 1440, 810 and 390.
 *
 * The card is one column parted by `space-between`: everything above, the CTA at
 * the bottom, 52px apart at the minimum. At desktop the three cards stretch to
 * the tallest of them, so the CTAs line up across the row; at the two narrower
 * Breakpoints each card is its own content and the 52 is all there is.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | card    | 400 wide, 3 across | full width, stacked | full width, 16 apart |
 * | padding | 24 | 24 | 24 |
 * | copy    | 16/25.6 | 16/25.6 | 14/22.4 |
 *
 * Everything inside is the same at all three: 36 between the card's three
 * blocks, 32 from the eyebrow to the heading, 12 from the heading to the blurb,
 * 32 between the name and its price, 16 down the INCLUDED list.
 *
 * **The Options recalculate, and that is the build's one deliberate functional
 * Deviation** (PRD 6.9). On the Reference these rows are inert - clicking `Add
 * Figma designs` leaves the price at $129, verified - and here the price moves.
 * The default is the Reference's own, so an at-rest capture is identical and the
 * Deviation only shows once a reviewer clicks. See the README.
 *
 * They are radio, not additive checkboxes, in both Plans that have them: picking
 * `Add Done-for you` replaces `Add Figma designs` rather than adding to it. That
 * is measured, and it is why this is a `radiogroup` of native inputs - arrow
 * keys move the selection, which is the behaviour a group of radios owes a
 * keyboard visitor and which no amount of `role` on a `div` would provide.
 *
 * The 26x26 control is drawn rather than native: a 26px track in
 * `--color-surface-3` with an 18px white knob that fades in when the row is
 * chosen. The Reference draws the chosen row on the first card at half opacity -
 * Framer's `Disabled` variant, which is what an inert control looks like - and
 * on the third card at full. Ours is live, so it takes the third card's look on
 * every card; a control that responds to a click has no business rendering as
 * disabled. That is the one pixel the Deviation costs at rest.
 */

/*
 * The measured radii, borrowed rather than minted. The Options block is 12px,
 * which is `--radius-card`'s measurement to the pixel, and a `--radius-options`
 * holding another 12 would be a second name for one number - see the note in
 * `globals.css` where `--text-button` used to be. The 20px on the control's
 * track and the 16px on its knob both exceed half of the box they are on, so
 * they resolve to a pill and a circle; `rounded-full` says that, and an
 * arbitrary 20px would only invite the reader to check whether it matters.
 */
const OPTION_ROW =
  'flex w-full items-center gap-2 bg-surface-1 p-4 text-left rule-b ' +
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-text'

export function PlanCard({
  plan,
  featured,
}: {
  readonly plan: Plan
  readonly featured: boolean
}) {
  /* The schema already refused a Plan with Options but no default, and refused
   * two, so this is the one the Reference shows - index 0 in both cases, which
   * is what keeps an at-rest capture identical. */
  const [chosen, setChosen] = useState(() =>
    Math.max(
      0,
      plan.options.findIndex((option) => option.default),
    ),
  )
  const option: PlanOption | undefined = plan.options[chosen]
  const price = plan.price + (option?.priceDelta ?? 0)

  return (
    <div className="flex flex-1 flex-col justify-between gap-13 p-6">
      <div className="flex flex-col gap-9">
        <div className="flex flex-col gap-8">
          <p className="text-eyebrow text-text-muted uppercase">{plan.eyebrow}</p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-8">
              <h3 className="flex-1 text-h5">{plan.name}</h3>
              <p className="flex items-center gap-3">
                <span className="text-h5">{formatMoney(price, plan.currency)}</span>
                {plan.compareAt !== null && (
                  /* 24px on a 26.4px line rather than the H5 step's 33.6 - the
                   * one place on the page the two part company (#12). */
                  <span className="text-h5 text-text-muted leading-[26.4px] line-through">
                    {formatMoney(plan.compareAt, plan.currency)}
                  </span>
                )}
              </p>
            </div>

            {/* Balanced, which is where the break lands on the Reference: at
             * 352px `Pick a template best suited for you, customize` fits on
             * line one and the Reference breaks after `for`. */}
            <p className="text-body-sm text-balance text-text-muted tablet:text-body">
              {plan.blurb}
            </p>
          </div>
        </div>

        {plan.options.length > 0 && (
          <div
            role="radiogroup"
            /* The group's own name. A `fieldset` would be the tag for it and is
             * not used: its UA `min-inline-size: min-content` fights the 352px
             * column, and what makes these radios one group is the shared
             * `name`, not the element that holds them. */
            aria-label={`${plan.name} options`}
            className="overflow-clip rounded-card rule-ring"
          >
            {plan.options.map((entry, index) => (
              <label key={entry.label} className={OPTION_ROW}>
                <input
                  type="radio"
                  name={`plan-${plan.slug}`}
                  value={entry.label}
                  checked={index === chosen}
                  onChange={() => setChosen(index)}
                  className="sr-only"
                />
                <span className="flex flex-1 items-center gap-3">
                  <PlanIcon name={entry.icon} />
                  <span className="flex items-center gap-2">
                    <span className="text-body-sm tablet:text-body">{entry.label}</span>
                    {entry.priceDelta > 0 && (
                      <span className="text-eyebrow text-accent-orange uppercase">
                        (+{formatMoney(entry.priceDelta, plan.currency)})
                      </span>
                    )}
                  </span>
                </span>
                <Control on={index === chosen} />
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <p className="text-eyebrow text-text-muted uppercase">Included:</p>
          <ul className="flex flex-col gap-4">
            {plan.included.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <PlanIcon name={item.icon} />
                <span className="text-body-sm tablet:text-body">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ButtonLink href={plan.cta.href} variant={featured ? 'primary' : 'secondary'}>
        {plan.cta.label}
      </ButtonLink>
    </div>
  )
}

/**
 * The Option row's toggle: decorative, because the row's own radio carries the
 * state and the label names it. Drawn at every position rather than mounted and
 * unmounted, so nothing in the row's height moves when the choice does.
 */
function Control({ on }: { readonly on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-6.5 shrink-0 rounded-full bg-surface-3 p-1"
    >
      <span
        className={
          'size-full rounded-full bg-text shadow-[0_4px_5px_0_rgba(0,0,0,0.08)] ' +
          (on ? 'opacity-100' : 'opacity-0')
        }
      />
    </span>
  )
}
