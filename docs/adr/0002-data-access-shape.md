# Homepage imports the data layer directly; /templates consumes the HTTP API

Content lives in JSON files read by a single typed data-access module. The homepage's Server
Components import that module directly, while the `/templates` page fetches the same data
over HTTP from our own Route Handlers at `/api/*`. This asymmetry is deliberate: the homepage
must stay statically generated at build time to win the performance criterion, and a page
cannot `fetch` its own origin during `next build` because no server is running yet. Routing
the homepage through HTTP would have forced it dynamic and cost the one criterion where we
can beat the Reference, which loads in 3040 ms.

## Consequences

The API at `/api/*` is real and callable, and `/templates` proves it is genuinely consumable
by a client, but the homepage never pays an HTTP round-trip to read files that ship in the
repo. Anyone adding a page should default to importing the data layer, and reach for `fetch`
only when demonstrating client-side consumption is the actual point.
