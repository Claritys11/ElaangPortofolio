# Security Policy

## Reporting A Vulnerability

Please report suspected vulnerabilities privately to the repository owner. Do not open a public issue for security-sensitive findings.

Include:

- A concise description of the issue.
- Steps to reproduce.
- Affected route, component, or API endpoint.
- Potential impact.
- Suggested mitigation, if known.

Do not include real credentials, session cookies, tokens, or production personal data in reports.

## Supported Versions

This project does not currently publish stable releases. Security fixes are handled on the active maintained branch.

## Security Notes

- Admin access depends on `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a strong `ADMIN_SESSION_SECRET`.
- `ADMIN_SESSION_SECRET` must be at least 32 characters.
- Local uploads are stored under `public/uploads`; review deployment storage persistence and backup behavior before production use.
- PostgreSQL access is configured by `DATABASE_URL`; use least-privilege database credentials where possible.
