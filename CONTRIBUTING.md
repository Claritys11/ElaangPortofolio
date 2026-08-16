# Contributing

Thanks for improving Elaang Portfolio. Keep changes focused, documented, and validated.

## Workflow

1. Fork the repository.
2. Create a branch from `main` or the active development branch.
3. Make focused changes.
4. Run validation.
5. Commit with Conventional Commits.
6. Push your branch.
7. Open a Pull Request.

```bash
git checkout -b feat/short-description
pnpm install
pnpm check
git commit -m "feat: describe the change"
git push origin feat/short-description
```

## Commit Format

Use Conventional Commits:

- `feat: add portfolio loading state`
- `fix: handle expired admin sessions`
- `docs: clarify PostgreSQL setup`
- `chore: update CI configuration`

## Development

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

Do not commit real credentials, `.env.local`, production data, or generated build output.

## Pull Requests

Include:

- What changed.
- How it was validated.
- Screenshots or short recordings for meaningful UI changes.
- Any setup, migration, or security considerations.

Recommended repository settings for maintainers:

- Require PR review before merge.
- Require CI to pass before merge.
- Enable Dependabot security updates.
- Protect the default branch.
