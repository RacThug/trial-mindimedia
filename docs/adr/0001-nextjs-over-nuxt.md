# Next.js over Nuxt

The brief permitted either Nuxt or Next. We chose Next.js with the App Router because the
Reference is built in Framer, whose runtime animation engine is Motion, and Motion's React
package is the direct descendant of that same engine. Since the brief grades animation
fidelity explicitly and measurement showed the Reference's motion is entirely JS-driven
rather than CSS, aligning with the original's own animation lineage is the shortest path to
parity. Vercel being Next's first-party host was a secondary, smaller factor.

## Consequences

Motion for React is a required dependency rather than an optional one. The brief warns
against "overly complex external libraries without clear reasons", so the reason is recorded
here: it is the same engine the Reference runs on.
