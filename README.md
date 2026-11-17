# Custom QR Generator

A free, open-source QR code generator that runs in your browser. Design the code to match your brand, then download it as SVG, PNG, JPG or WebP.

Codes are static. The content is written straight into the code: no short links, no redirects, no tracking, and they never expire.

## Features

- **12 content types**: link, text, email, phone, SMS, WhatsApp, Wi-Fi, contact card (vCard), calendar event, location, UPI payment, crypto wallet
- **Shapes**: 10 dot styles, 6 eye frame styles, 6 eye centre styles, adjustable dot size
- **Colours**: solid, linear or radial gradients for the dots, eye frames, eye centres and background; quick palettes; transparent or rounded backgrounds
- **Logos**: 36 built-in icons and brand marks you can recolour, or upload your own (PNG, JPEG, WebP, GIF, AVIF, SVG). Control size, padding and backdrop shape, and clear the dots behind it
- **Frames**: caption, box and badge frames with your own call to action
- **Export**: SVG, PNG, JPG or WebP at 256–4096 px, with or without background, or copy to the clipboard
- **Scan check**: live warnings for contrast, inverted colours, logo coverage, quiet zone, dot size and density
- **Smart suggestions**: paste a WhatsApp, Instagram, YouTube or other known link (or pick Wi-Fi, UPI, a contact…) and get a matching logo and colours, with a preview, to apply or skip
- **Undo and redo** for every change, plus a "Surprise me" style shuffle
- **Keyboard shortcuts**: ⌘/Ctrl+Z undo, ⇧⌘Z or Ctrl+Y redo, ⌘/Ctrl+S download
- **Themes**: light, dark or follow the system, on an animated gradient background
- **Fits the screen**: no page scrolling on laptops and desktops; phones get a sticky download bar
- **Public API**: `GET /api/qr` returns an SVG, handy for scripts and other apps
- **IP rate limiting** with a private bypass for the site owner

Everything you type stays in your browser. Settings are saved in local storage on your device only.

## Quick start

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

| Script             | What it does                                      |
| ------------------ | ------------------------------------------------- |
| `npm run dev`      | Start the dev server                              |
| `npm run build`    | Type-check and build to `dist/`                   |
| `npm run preview`  | Serve the production build                        |
| `npm run check`    | Type-check, lint, format check and run every test |
| `npm test`         | Run tests once                                    |
| `npm run lint:fix` | Fix lint issues                                   |
| `npm run format`   | Format with Prettier                              |

The Vite dev server doesn't run the rate-limit middleware or the API. Use `npx vercel dev` to run them locally.

## Deploy to Vercel

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repo. The settings come from `vercel.json` (Vite, `npm run build`, `dist`).
3. Add environment variables (all optional, see below) and deploy.

Or from the terminal:

```bash
npx vercel        # preview deployment
npx vercel --prod # production
```

### Environment variables

See [`.env.example`](.env.example) for the full list with comments.

| Variable                                                 | Default  | Purpose                                        |
| -------------------------------------------------------- | -------- | ---------------------------------------------- |
| `RATE_LIMIT_ENABLED`                                     | `true`   | Turn rate limiting on or off                   |
| `RATE_LIMIT_API_MAX` / `RATE_LIMIT_API_WINDOW_SECONDS`   | 30 / 60  | Requests per IP per window for `/api/*`        |
| `RATE_LIMIT_PAGE_MAX` / `RATE_LIMIT_PAGE_WINDOW_SECONDS` | 120 / 60 | Requests per IP per window for pages           |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`    | –        | Shared limit store (or `KV_REST_API_*`)        |
| `RATE_LIMIT_BYPASS_TOKEN`                                | –        | Owner secret that skips limits                 |
| `RATE_LIMIT_BYPASS_IPS`                                  | –        | Comma-separated IPs that are never limited     |
| `VITE_REPO_URL`                                          | –        | Shows a GitHub link in the header (build time) |

### Rate limiting

Pages and the API are limited per client IP in Vercel Routing Middleware ([`middleware.ts`](middleware.ts)). IPv6 clients are grouped by their /64 network. Static assets are never counted. Blocked requests get `429` with `Retry-After` and `RateLimit-*` headers.

Without Redis, each server instance counts on its own, so limits are approximate. For exact limits across regions, add the free Upstash Redis integration from the Vercel Marketplace. It sets the `KV_REST_API_*` variables for you.

### Owner bypass

Generate a long secret and set it as `RATE_LIMIT_BYPASS_TOKEN`:

```bash
openssl rand -hex 32
```

- **Browser**: open `https://your-domain/?bypass=<token>` once. You get an HttpOnly cookie for a year (it stores a hash, not the token). `?bypass=off` removes it.
- **Scripts**: send the header `x-ratelimit-bypass: <token>`.
- **Fixed IP**: add it to `RATE_LIMIT_BYPASS_IPS`.

Bypassed responses include `x-ratelimit-bypass: 1`. Keep the token private, and change it to revoke old cookies.

## API

`GET /api/qr` returns an SVG.

```bash
curl "https://your-domain/api/qr?data=https://example.com&size=512&dot=dots&eyeFrame=circle&fg=1f3d14&bg=transparent" -o qr.svg
```

| Param      | Values                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------- |
| `data`     | Text to encode (required, up to 2048 characters)                                                    |
| `size`     | 64–2048 px (default 512)                                                                            |
| `ecl`      | `L`, `M`, `Q`, `H`                                                                                  |
| `margin`   | 0–16 modules                                                                                        |
| `dot`      | `square`, `rounded`, `fluid`, `dots`, `classy`, `leaf`, `diamond`, `star`, `vertical`, `horizontal` |
| `eyeFrame` | `square`, `rounded`, `extra-rounded`, `circle`, `leaf`, `octagon`                                   |
| `eyeBall`  | `square`, `rounded`, `circle`, `diamond`, `leaf`, `octagon`                                         |
| `fg`       | Hex colour for the code                                                                             |
| `bg`       | Hex colour or `transparent`                                                                         |
| `download` | `1` to download as `qr.svg`                                                                         |

`POST /api/qr` accepts `{ "data": "...", "size": 512, "design": { ... } }`, where `design` is any part of the [`QrDesign`](src/core/qr/types.ts) object, logos included (as `data:image/...` URLs). Errors come back as JSON with a `400`, `413`, `422` or `429` status.

## Project structure

```
api/                 Vercel function entry points (thin wrappers)
middleware.ts        Rate limiting for pages and the API
server/
  api/               Request parsing and the QR API handler
  rate-limit/        Config, IP handling, bypass, stores, responses
src/
  core/qr/           Encoder, SVG renderer, shapes, schema, scan checks (no DOM, shared with the API)
  core/content/      Payload builders for each content type
  components/ui/     Design-system components (glass and clay)
  features/          Editor tabs, preview and export
  state/             App state, persistence
  styles/            Tokens and global styles
```

The renderer in `src/core/qr` is plain TypeScript, so the browser app and the API produce identical output. Tests render every style to a bitmap and decode it with ZXing to make sure it still scans.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

- QR encoding by [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT)
- Brand icons from [Simple Icons](https://simpleicons.org) (CC0). Brand names and logos belong to their owners; use them only in ways their guidelines allow.
- UI icons from [Lucide](https://lucide.dev) (ISC)
- QR Code is a registered trademark of DENSO WAVE INCORPORATED.

## License

[MIT](LICENSE)
