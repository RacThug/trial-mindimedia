# Branching rules

```
feature/*  --PR-->  develop  --PR-->  main
```

| Branch      | Direct push | Incoming PRs                |
| ----------- | ----------- | --------------------------- |
| `main`      | Not allowed | Only from `develop`         |
| `develop`   | Not allowed | From any branch             |
| `feature/*` | Allowed     | -                           |

## One-time setup

After cloning, point git at the shared hooks:

```sh
git config core.hooksPath .githooks
```

This installs a `pre-push` hook that refuses direct pushes to `main` and
`develop`. It is per-clone, so every contributor must run it once.

## Enforcement

Two layers, both of which have limits worth knowing about:

- **`.githooks/pre-push`** - blocks direct pushes to `main` and `develop`
  locally. Bypassable with `--no-verify`, and only active in clones that ran
  the setup command above.
- **`.github/workflows/pr-source-guard.yml`** - fails any pull request into
  `main` whose source branch is not `develop`.

Server-side enforcement (GitHub rulesets / branch protection) is not available
on a private repository under a free personal account. If this repo is ever
made public, or the account upgrades to GitHub Pro, the same rules should be
re-applied as rulesets so they cannot be bypassed.

## Workflow

```sh
# start work
git checkout develop && git pull
git checkout -b feature/my-thing

# ... commit ...
git push -u origin feature/my-thing
gh pr create --base develop

# once develop is ready to release
gh pr create --base main --head develop
```
