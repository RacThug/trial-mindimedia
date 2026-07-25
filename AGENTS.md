# Repository rules for AI agents

These rules apply to every AI coding agent working in this repo (Claude Code,
Codex, Kimi, Cursor, and anything else). Follow them as written.

## Branching

```
feature/*  --PR-->  develop  --PR-->  main
```

| Branch      | Direct push | Incoming PRs        |
| ----------- | ----------- | ------------------- |
| `main`      | Never       | Only from `develop` |
| `develop`   | Never       | From any branch     |
| `feature/*` | Allowed     | -                   |

## Git rules

- **Never push directly to `main`.** No exceptions, including fast-forwards.
- **Never open a PR into `main` from anything other than `develop`.** If work
  needs to reach `main`, it goes into `develop` first.
- **Never push directly to `develop`.** Land work through a PR from a
  `feature/*` branch.
- **Never force-push to `main` or `develop`**, and never delete either branch.
- **Never merge a PR on your own initiative.** Open it, then give the user the
  link and let them merge. Merge only if the user explicitly asks you to.
- **Never use `git push --no-verify`.** That flag is the human's escape hatch,
  not yours. If the `pre-push` hook rejects your push, the push was wrong.
- **Never commit the `docs/` folder**, with two exceptions: `docs/agents/` and
  `docs/adr/` are tracked agent configuration and belong in git. Everything else
  under `docs/` is gitignored on purpose and is local reference material only.

## Backstop

`.githooks/pre-push` mechanically refuses direct pushes to `main` and
`develop`. Enable it once per clone:

```sh
git config core.hooksPath .githooks
```

The hook is a safety net, not the rule. The rules above hold whether or not the
hook happens to be installed in a given clone.

## Normal workflow

```sh
git checkout develop && git pull
git checkout -b feature/my-thing
# ... commit ...
git push -u origin feature/my-thing
gh pr create --base develop        # then hand the PR link to the user

# when develop is ready to release
gh pr create --base main --head develop
```

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues in `RacThug/trial-mindimedia`, driven by
the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and one `docs/adr/` at the repo root. See
`docs/agents/domain.md`.
