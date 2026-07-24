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

## Adding a headshot

Save an image at `src/assets/headshot.jpg` (`.png`, `.webp` and `.jpeg` also
work) and it appears at the top of `/about/`, resized and converted. With no
file there the page stays text-led — there is no placeholder box to remove.

## Deploying

`netlify.toml` holds the build command, Node version, the redirect map from the
previous hand-written `.html` site, and cache headers.

First deploy, in order:

1. **Link the repository** in the Netlify dashboard — Site configuration →
   Build & deploy → Link repository → `Hamza-Saraswat/portfolio`. Until the site
   is Git-linked, `netlify.toml` is never read, so neither the build command nor
   any of the redirects take effect. If the site was originally created by
   dragging a folder in, this step is required.
2. **Enable form detection** — Forms → enable. Netlify scans the built HTML at
   deploy time; without this the contact form posts into nothing.
3. **Push the branch.** A linked site builds a deploy preview automatically.
4. **Check the preview** before merging:

   ```bash
   # every old URL should answer 301 with the new location
   for p in work.html about.html writing.html contact.html \
            project.html project-juju.html project-onboarding.html \
            project-ai-adoption.html project-costbook.html; do
     curl -sI "$PREVIEW_URL/$p" | awk -v p="$p" '/^HTTP/{c=$2} /^location/{print p, c, $2}'
   done
   ```

   Then submit the contact form once and confirm it lands under Forms.
5. **Merge to `main`** to publish, and re-run the loop above against
   `https://hamza-saraswat.com`.

Rollback is one click — Deploys → the previous build → Publish deploy. The
pre-migration commit is also tagged `pre-astro-migration`.
