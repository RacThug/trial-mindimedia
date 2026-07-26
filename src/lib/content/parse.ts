/*
 * The one place content stops being untrusted.
 *
 * Every collection goes through `parseCollection`, so the quality of the error
 * message is written once rather than eight times. What a developer sees when a
 * content file is wrong is the whole point of the exercise: a bad edit has to
 * name its own file, path and expectation, because the alternative - a Section
 * rendering `undefined` - is the failure this layer exists to prevent.
 *
 * Every issue is reported, not just the first. Fixing content one error per run
 * is how a five-minute edit becomes an afternoon. One caveat worth knowing
 * before it surprises someone: Zod runs a schema's refinements only once the
 * shapes underneath them parse, so cross-reference problems - a Placement naming
 * a person who is not in `people` - surface on the run after the field errors are
 * fixed, rather than alongside them.
 */

import type { ZodType, ZodIssue } from 'zod'

/** Thrown when a content file does not match its schema. */
export class ContentError extends Error {
  constructor(
    readonly file: string,
    readonly issues: readonly ZodIssue[],
  ) {
    const count = issues.length
    const lines = issues.map((issue) => `  ${formatPath(issue.path)}: ${issue.message}`)
    super(`${count} problem${count === 1 ? '' : 's'} in ${file}\n${lines.join('\n')}`)
    this.name = 'ContentError'
  }
}

/**
 * `["people", "nic", "rating"]` reads `people.nic.rating`, and an array index
 * reads `grid[4]` rather than `grid.4` - the form you can paste into a search.
 */
function formatPath(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '(root)'
  return path
    .map((key) => (typeof key === 'number' ? `[${key}]` : key.toString()))
    .join('.')
    .replace(/\.\[/g, '[')
}

/**
 * Validate one content file. `file` is the name that appears in the error, so
 * pass the file the data came from rather than the collection it becomes.
 */
export function parseCollection<T>(file: string, schema: ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw)
  if (!result.success) throw new ContentError(file, result.error.issues)
  return result.data
}
