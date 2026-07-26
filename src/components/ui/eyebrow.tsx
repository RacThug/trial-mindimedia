/*
 * The Eyebrow: the small label above a Section heading, in its tinted pill.
 *
 * Measured in #10 on the hero and on the featured Templates, and identical on
 * both: 28px tall, `4px 12px` of padding, an 8px radius, an 8px gap, and a
 * radial-gradient wash rather than a flat fill (`--eyebrow-surface`).
 *
 * The casing is CSS. The Reference ships `Framer templates` and `Which template
 * is for me?` in sentence case and uppercases them with `text-transform`, so a
 * screen reader reads words where typing capitals would have it spell letters
 * out. Callers pass the sentence-case string; this uppercases it (PRD 6.2).
 */

type EyebrowProps = {
  readonly children: React.ReactNode
  /** The hero's Eyebrow carries a mark; the Section Eyebrows are text alone. */
  readonly icon?: React.ReactNode
}

export function Eyebrow({ children, icon }: EyebrowProps) {
  return (
    <p className="inline-flex items-center gap-2 rounded-eyebrow bg-[image:var(--eyebrow-surface)] px-3 py-1 text-eyebrow text-accent-blue uppercase">
      {icon}
      {children}
    </p>
  )
}
