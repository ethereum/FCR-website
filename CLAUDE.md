# CLAUDE.md

## Design Reference

This project includes design specifications exported from Figma:

- `design.png` — Visual reference of the target design
- `design.json` — Structured design data from Figma Raw plugin

**IMPORTANT:** Before writing any UI code, always:
1. Open and analyze `design.png` to understand the visual target
2. Read `design.json` to extract exact values for spacing, colors, typography, and layout

## How to Use Design Files

### From design.json, extract:
- **Colors**: Use exact hex/rgba values, add to Tailwind config
- **Typography**: Font family, size, weight, line-height, letter-spacing
- **Spacing**: Padding, margins, gaps (use the actual pixel values)
- **Border radius**: Corner radius values
- **Shadows**: Box-shadow values
- **Layout**: Flex/grid structure, alignment, dimensions

### From design.png, understand:
- Visual hierarchy and emphasis
- Component relationships and groupings
- Responsive behavior intent
- Overall aesthetic and feel

## Tech Stack

- **Build**: Vite
- **Styling**: Tailwind CSS v4
- **Deployment**: Netlify

## File Structure

```
/
├── CLAUDE.md
├── design.png          # Visual reference
├── design.json         # Figma Raw export
├── netlify.toml        # Netlify config
├── package.json
├── vite.config.js
├── index.html          # Entry point
├── src/
│   ├── main.js         # JS entry
│   └── style.css       # Tailwind imports + custom tokens
└── public/             # Static assets (fonts, images)
```

## Code Standards

### Tailwind Setup

In `src/style.css`, import Tailwind and define design tokens:

```css
@import "tailwindcss";

@theme {
  /* Colors - extract from design.json */
  --color-primary: #...;
  --color-secondary: #...;
  --color-background: #...;
  --color-surface: #...;
  --color-text: #...;
  --color-text-muted: #...;

  /* Typography */
  --font-sans: '...', sans-serif;
  --font-size-xs: ...px;
  --font-size-sm: ...px;
  --font-size-base: ...px;
  --font-size-lg: ...px;
  --font-size-xl: ...px;
  --font-size-2xl: ...px;

  /* Spacing - add custom values if needed */
  --spacing-18: 4.5rem;
  --spacing-88: 22rem;

  /* Border Radius */
  --radius-sm: ...px;
  --radius-md: ...px;
  --radius-lg: ...px;

  /* Shadows */
  --shadow-card: ...;
  --shadow-button: ...;
}
```

### Usage Pattern

Use Tailwind utilities with your custom tokens:

```html
<div class="bg-background text-text p-6 rounded-lg shadow-card">
  <h1 class="text-2xl font-semibold text-primary">Title</h1>
  <p class="text-base text-text-muted mt-2">Description</p>
</div>
```

### Quality Checklist

Before considering UI complete:
- [ ] Colors match design.json exactly
- [ ] Spacing matches design.json exactly
- [ ] Typography matches design.json exactly
- [ ] Visual result matches design.png
- [ ] Responsive behavior is sensible (use `sm:`, `md:`, `lg:`)
- [ ] Works on mobile

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server at localhost:5173
npm run build    # Production build to /dist
npm run preview  # Preview production build locally
```

## Netlify Configuration

`netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## Quick Start

```bash
# Create project
npm create vite@latest my-project -- --template vanilla
cd my-project

# Install Tailwind v4
npm install tailwindcss @tailwindcss/vite

# Add to vite.config.js
import tailwindcss from "@tailwindcss/vite"
export default {
  plugins: [tailwindcss()]
}

# Add to src/style.css
@import "tailwindcss";

# Add design files
# Copy design.png and design.json to root

# Run
npm run dev
```
