/*
 * Money formatting, kept apart from `index.ts` so that a browser can have it.
 *
 * `/templates` is a Client Component - it fetches `/api/templates` over HTTP to
 * prove the endpoint is consumable (ADR-0002) - and it has to render `$129` from
 * the minor units the API returns. Importing that helper from `@/lib/content`
 * would drag eight JSON files, Zod and the whole asset index into the client
 * bundle to format one number. `index.ts` re-exports this, so server callers
 * still reach it through the one content module.
 */

/**
 * Minor units to the Reference's own display form: `$129`, `$1,881`. No cents,
 * because no price on the page has any - `maximumFractionDigits: 0` rather than
 * trimming a `.00` afterwards.
 */
export function formatMoney(minorUnits: number, currency: 'USD' = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minorUnits / 100)
}
