# Contributing

Thanks for helping out. Bug reports, ideas and pull requests are all welcome.

## Setup

```bash
npm install
npm run dev
```

## Before you open a pull request

```bash
npm run check   # type-check, lint, format check, tests
npm run build
```

- Keep pull requests focused on one change.
- Add or update tests for anything in `src/core` or `server`.
- New dot, eye or frame styles must pass the decode tests in `src/core/qr/render.test.ts`. They render each style and read it back with ZXing.
- Use [Conventional Commits](https://www.conventionalcommits.org) for messages, e.g. `feat(core): add hexagon dots`.

## Code style

- TypeScript strict mode, no `any`.
- Prettier and ESLint settings live in the repo; run `npm run format` and `npm run lint:fix`.
- `src/core` must stay free of DOM APIs so the API can reuse it.
- UI colours, spacing and radii come from `src/styles/tokens.css`. Don't hard-code new values in components.

## Reporting bugs

Open an issue with steps to reproduce, what you expected, and your browser. If a code doesn't scan, attach the exported SVG and say which scanner app you used.
