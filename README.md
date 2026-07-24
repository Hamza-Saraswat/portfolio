# hamza-saraswat.com

Personal portfolio. Astro 7, Tailwind v4, static output, deployed on Netlify.

## Development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview
npm run check    # astro check (types + content schema)
```

## Structure

- `src/content/case-studies/*.mdx` — the six case studies. Frontmatter drives
  the cards, the work index, the next-project links, and the SEO metadata, so
  there is exactly one source of truth per project.
- `src/content/writing/*.md` — articles. `draft: true` entries render on
  `/writing/` as planned pieces without a link; setting `draft: false` and
  adding a `pubDate` publishes one.
- `src/data/supporting-projects.json` — the smaller "more work" cards.
- `src/styles/global.css` — design tokens (`@theme`), type scale, motion.
- `src/scripts/motion.ts` — the only site script: scroll reveals, the pinned
  capability section, stat count-ups, hero video play/pause.

## Content rules

The schema enforces the things that are easy to get wrong under pressure:
`status` and `statusLabel` are required, so a project in pilot cannot be
described as shipped; per-stat `footnote` exists so a number always carries its
provenance. Colleagues are credited by role rather than by name.

## Regenerating assets

```bash
node scripts/build-diagrams.mjs      # architecture diagrams -> src/assets/diagrams
node scripts/build-brand-assets.mjs  # favicons + OG card -> public/
```

The `.excalidraw` sources for the older diagrams stay local and are gitignored.

## Deploying

`netlify.toml` holds the build command, Node version, the redirect map from the
previous hand-written `.html` site, and cache headers. The contact form uses
Netlify Forms, which requires form detection to be enabled once in the Netlify
dashboard.
