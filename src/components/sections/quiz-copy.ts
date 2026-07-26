/*
 * The one paragraph the Quiz CTA (PRD 6.10) and the quiz modal (6.13) share,
 * with the destination both of them point at.
 *
 * The Reference writes the same sentence in both places, and the hero's
 * secondary CTA (6.2) goes to the same Typeform. It is prose in a single layout
 * either way, so it is markup rather than content (ADR-0004) - but it is markup
 * that appears twice, and two copies of a sentence is how one of them gets
 * edited. Kept as plain strings so a Server Component and a Client Component can
 * both have it without either pulling the other's module in.
 */

export const QUIZ_HREF = 'https://browsersupply.typeform.com/template-quiz'

export const QUIZ_BLURB =
  'Answer a few short questions and get matched with a website template perfect for your business, with 30% off.'
