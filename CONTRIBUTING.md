# Contributing to TraceLens

Thanks for contributing! This guide describes how we work. It is also how our team satisfies the open-source practices expected of the project: **everything is tracked in issues and goes through reviewed pull requests.**

## Code of conduct

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ground rules

- **No direct pushes to `main`.** `main` is protected. All changes land via pull request.
- **Every PR is reviewed by at least one other person** before merging. Do **not** merge your own PR without a review — self-merged, unreviewed PRs are not meaningful review activity.
- **Every piece of work has an issue.** Open an issue first (or pick an existing one) and reference it from your PR.
- Keep PRs small and focused. One logical change per PR.

## Development setup

```bash
npm install          # from the repo root (installs all workspaces)
npm test             # run all tests
npm run lint         # lint
npm run build        # build all packages
```

Requires Node >= 20 and npm >= 10. See [README.md](README.md) for the Docker-based full run.

## Branching model

We use a simple trunk-based model with short-lived feature branches.

```text
main                 ← always releasable, protected
  feat/<area>-<short-description>
  fix/<area>-<short-description>
  docs/<short-description>
  chore/<short-description>
```

Examples: `feat/ingestion-trace-endpoint`, `fix/correlation-window-off-by-one`.

Prefix by area so it's clear who owns the change: `ingestion`, `demo`, `correlation`, `incident`, `graph`, `api`, `frontend`, `shared`, `ci`, `docs`.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <summary>

feat(correlation): add deployment change correlation
fix(api): reject ingestion requests without an API key
docs(readme): document docker compose ports
test(graph): cover impact analysis for cyclic dependencies
chore(ci): cache npm in GitHub Actions
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `perf`.

This keeps history readable and lets us generate the changelog.

## Pull request workflow

1. Create an issue describing the task (or claim an existing one).
2. Branch off `main` using the naming convention above.
3. Make your change **with tests**. New behavior needs a test; bug fixes need a regression test.
4. Run `npm run lint && npm test && npm run build` locally — these must pass (CI enforces them).
5. Open a PR using the template. Link the issue (`Closes #123`), describe what and why, and how you tested it.
6. Request a review from at least one teammate. Address feedback with follow-up commits.
7. A reviewer approves and merges (squash merge preferred). The author does not self-merge unreviewed.

## Tests & quality

- Tests use **Vitest**. Put tests next to the code as `*.test.ts`.
- Code is formatted with **Prettier** and linted with **ESLint**. Run `npm run format` before committing.
- CI (GitHub Actions) runs lint, typecheck, tests, and build on every PR. A PR must be green to merge.

## Releases & versioning

- We follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).
- User-facing changes are recorded in [CHANGELOG.md](CHANGELOG.md) under _Unreleased_.
- Releases are cut by tagging `vX.Y.Z` on `main` and moving the changelog entries under that version.

## Reporting bugs & requesting features

Use the issue templates under **New Issue**. Include reproduction steps for bugs and a clear problem statement for feature requests.

## License of contributions

By contributing, you agree that your contributions are licensed under the project's [Apache License 2.0](LICENSE).
