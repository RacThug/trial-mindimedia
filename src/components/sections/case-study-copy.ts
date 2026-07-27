/*
 * The Template the case study (PRD 6.8) is about, and the one link on the page
 * that points at a Template the Reference does not feature.
 *
 * It sits here rather than in `templates.json` because the featured Section
 * (6.4) renders every entry of that Collection, so a fourth record would draw a
 * fourth card in a three-card Section. Matt's template is prose in a single
 * layout - markup, not content (ADR-0004) - and this is the smallest thing the
 * case study and its route can both hold.
 *
 * The point of the export is that they *do* both hold it. Nothing in this build
 * type-checks an internal `href` against the routes that exist, which is how
 * this link 404ed from #11 to #34, so the link and the route it needs are
 * generated from one value instead of written twice and hoped over.
 * `quiz-copy.ts` is the same shape for the same reason.
 */

export const CASE_STUDY_TEMPLATE = {
  slug: 'reformr',
  name: 'Reformr',
  /* The Reference gives it no category anywhere on the page, so the detail
   * route's eyebrow says what the visitor followed rather than inventing one. */
  eyebrow: 'Case study',
}

export const CASE_STUDY_TEMPLATE_HREF = `/templates/${CASE_STUDY_TEMPLATE.slug}`
