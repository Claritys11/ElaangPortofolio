<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Production and template synchronization

Whenever reusable Production website code changes (layout, components, styling, behavior, content contracts/configuration, accessibility, performance, or tests), make the equivalent generic change in `RevisionedPortfolioTemplate` in the same task. Keep personal content, assets, secrets, and environment-specific values out of the template; use reusable defaults or placeholders instead. Validate and merge both repositories together after each repository's CI passes. Purely personal content/data-only edits do not need to be copied.
