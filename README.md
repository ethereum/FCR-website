# FCR — Fast Confirmation Rule for Ethereum

Landing page for the Fast Confirmation Rule (FCR), a client-side rule for fast Ethereum confirmations in about 12–24 seconds under stated assumptions. Fast confirmation is complementary to finality; latency can increase or stall.

## Live Site

https://fastconfirm.it

## Tech Stack

- **[Vite 7.3.1](https://vite.dev)** — Build tool and dev server
- **[Tailwind CSS 4.1.18](https://tailwindcss.com)** — Utility-first CSS framework with custom theme
- **Vanilla JavaScript** — No framework dependencies
- **[Netlify](https://www.netlify.com)** — Hosting and deployment

## Development

```bash
# Install dependencies
npm install

# Start dev server (port 5172)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Dev server runs at `http://localhost:5172`.

## Project Structure

```
├── index.html              # Main landing page
├── design.html             # Design system reference (noindex)
├── src/
│   ├── main.js             # Scroll spy, sticky header, counters, FAQ
│   └── style.css           # Tailwind CSS with @theme design tokens
├── public/
│   ├── favicon.svg         # Site favicon
│   ├── iniciative.svg      # Ethereum Foundation initiative logo
│   ├── og-fcr.png        # Open Graph social image
│   ├── robots.txt          # Crawler rules + sitemap reference
│   ├── sitemap.xml         # XML sitemap
│   ├── llms.txt            # AI crawler summary
│   └── *.pdf               # One-pager PDFs (Exchanges, L2s, RPCs, Interop)
├── netlify.toml            # Build config, security headers, cache rules
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite + Tailwind plugin, multi-page build
└── CLAUDE.md               # AI assistant context
```

## Site Sections

1. **Hero** — "24 seconds" illustrative headline with animated counter and key stats
2. **Overview** — Feature intro with three-column layout
3. **Newsroom** — Dated primary-source links
4. **Use Cases** — Exchanges, Cross-Chain Bridges, L2s, RPC Providers, Asset Issuers, Solvers
5. **Trade-offs** — FCR vs k-deep vs Justification vs Finality comparison table
6. **Assumptions** — Synchrony and adversarial threshold and links to the production guide
7. **Implementation** — 2-step guide with code examples
8. **FAQ** — Expandable accordion
9. **CTA** — "Ready to get started?" call-to-action
10. **Footer** — FCR logo, Ethereum Foundation initiative, resource links

## Design Tokens

Defined in `src/style.css` via Tailwind CSS v4 `@theme`:

```css
--color-primary: #f05f36;
--color-primary-dark: #ff3800;
--color-background: #f5f5e9;
--color-surface: #ffffff;
--color-text: #000000;
--color-text-muted: #6a6a6a;
--color-green: #22c55e;
--color-red: #ef4444;
```


Border radii: 8px (sm/md), 16px (lg), 24px (xl), 50px (2xl), 9999px (full).

## Design System Page

Visit `/design.html` locally for a visual reference of all colors, typography, spacing, buttons, cards, badges, callouts, tables, and animations. This page is excluded from search engines via `noindex`.

## SEO & Crawlability

- Comprehensive meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- `robots.txt` — allows all crawlers including AI (GPTBot, ClaudeBot, CCBot)
- `sitemap.xml` — homepage and production-guide sitemap
- `llms.txt` — plain-text site summary for AI crawlers
- Security headers via Netlify (HSTS, CSP, Permissions-Policy)
- Cache headers for Vite hashed assets (`immutable`) and static files

## Deployment

Auto-deploys to Netlify on push to `main`.

## License

MIT

## Production guide

`/docs/production` is a native Vite multi-page entry (`docs/production/index.html`). Netlify rewrites the exact URL to the built HTML file; trailing-slash directory requests also resolve to it. Shared JS checks for page-specific elements. Diagrams are local under `public/docs/production/`.

The draft uses PR #23 (September 30, 2026) as its dated baseline. Before publication, Derek/Francesco must reconcile the current Notion guide, resolve its duplicated/incomplete validator-sampling passage, and confirm the 24-second headline and future-fork timing.
