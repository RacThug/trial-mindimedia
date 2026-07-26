# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

**Layout: single-context.** One `CONTEXT.md` and one `docs/adr/` at the repo root.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the glossary and ubiquitous language.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

Both `CONTEXT.md` and `docs/adr/` now exist. Read them.

## The current spec

See the **Current work** section of `AGENTS.md`, which is loaded into every session and is
the single source of truth for what is being built and which measured facts must not be
guessed at. It is deliberately not repeated here.

## File structure

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-some-decision.md
│   └── 0002-another-decision.md
└── ...
```

`docs/agents/` and `docs/adr/` are the only tracked paths under `docs/` — see
the `.gitignore` negations and the git rules in `AGENTS.md`. Everything else
under `docs/` is local reference material and must not be committed.

If this repo ever splits into multiple bounded contexts, switch to a
multi-context layout: a root `CONTEXT-MAP.md` pointing at one `CONTEXT.md` per
context, with context-scoped `src/<context>/docs/adr/` alongside the
system-wide `docs/adr/`. Update this file when that happens.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
