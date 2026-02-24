# FCR - Fast Confirmation Rule for Ethereum

Landing page for the Fast Confirmation Rule (FCR), a mechanism that provides single-slot confirmation for Ethereum transactions in ~12-13 seconds instead of waiting for full finality (~12-16 minutes).

## Live Site

https://fcr-ethereum.netlify.app/

## Tech Stack

- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework with custom theme
- **Vanilla JavaScript** - No framework dependencies
- **Netlify** - Hosting and deployment

## Features

- Responsive design (mobile, tablet, desktop)
- Sticky header with scroll-based state changes
- Scroll spy navigation with active section highlighting
- Animated hero number counter
- FAQ accordion
- Custom scrollbar styling

## Project Structure

```
final_html/
├── index.html          # Main HTML file
├── src/
│   ├── main.js         # JavaScript (scroll spy, sticky header, animations)
│   └── style.css       # Tailwind CSS with custom theme
├── netlify.toml        # Netlify build configuration
├── package.json        # Dependencies and scripts
└── vite.config.js      # Vite configuration
```

## Design Tokens

Defined in `src/style.css`:

```css
--color-primary: #f05f36;
--color-primary-dark: #ff3800;
--color-background: #f5f5e9;
--color-surface: #ffffff;
--color-text: #000000;
--color-text-muted: #6a6a6a;
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The site auto-deploys to Netlify on push to `main`. To manually deploy:

```bash
npx netlify-cli deploy --prod --dir=dist
```

## Sections

1. **Hero** - 13s headline with animated counter and key stats
2. **Overview** - Fast for users, high-degree assurance
3. **Trade-offs** - FCR vs Full Finality (Casper FFG) comparison
4. **Use Cases** - Exchanges, Bridges, L2s, Wallets, RPC providers
5. **Transaction Guidelines** - Small/Medium/Large transaction recommendations
6. **Implementation** - 3-step guide with code examples
7. **FAQ** - Expandable accordion with common questions
8. **CTA** - Ready to ship call-to-action
9. **Footer** - FCR logo, Initiative by Ethereum Foundation, resource links

## License

MIT
