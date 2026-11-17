# Security policy

## Reporting a vulnerability

Please don't open a public issue. Use GitHub's **Report a vulnerability** button on the Security tab of this repository to send a private report.

Include steps to reproduce and the impact you see. You should get a reply within a few days.

## Scope

- The web app runs fully in the browser and never uploads what you type or the logos you add.
- The `/api/qr` endpoint only accepts inline `data:image/...` logos and never fetches remote URLs.
- Rate limiting and the owner bypass live in `middleware.ts` and `server/rate-limit`.
