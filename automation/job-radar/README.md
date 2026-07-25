# Job radar

A scheduled Claude routine that keeps `/jobs` on the site current. It runs
Wednesday and Sunday at 7:00 CT, reads the Next Play emails and a handful of
public job boards, and appends anything that fits to the radar data files.

## Files

| Path | What it is |
| --- | --- |
| `automation/job-radar/routine-prompt.md` | Source of truth for the routine's prompt. The cloud agent receives everything between the `BEGIN PROMPT` / `END PROMPT` markers. |
| `src/data/jobs.json` | Active roles. The routine appends; statuses are edited by hand. |
| `src/data/jobs-archive.json` | Rotated-out roles. The routine reads it for dedupe and never writes to it. |
| `src/data/market-pulse.json` | Reports and trackers worth reading. |
| `scripts/validate-radar.mjs` | Structural check over all three files. |

## How it works

The routine runs in Anthropic's cloud, attached to this repository. It cannot
see your machine, so everything it knows about the fit profile is written into
the prompt. Its runtime inputs are the Gmail connector (read-only) and public
web pages — it has no logged-in browser session, so LinkedIn and the Next Play
job board itself are out of reach. That is a real gap in coverage, not a
design preference.

Each run appends to the end of the arrays and commits to `main`, which triggers
a Netlify build. It never edits or reorders existing entries, so your status
edits and its appends do not collide; if you have local edits, `git pull
--rebase` after a run.

## Editing the prompt

Edit `routine-prompt.md`, then ask Claude Code:

> sync the job radar routine prompt from automation/job-radar/routine-prompt.md

The fit profile in Step 3 is the part worth revisiting. If the picks drift —
too many GTM roles, not enough deployment work — adjust the calibration
examples and anti-criteria there rather than correcting the output by hand.

## Updating statuses

Statuses are yours: `new`, `reviewing`, `applied`, `passed`, `closed`. Edit
`src/data/jobs.json` directly, or ask Claude Code to do it. Set
`dateStatusChanged` when you move something, and use `statusNote` for a short
reminder ("phone screen 8/4"). Keep in mind this repository is public.

When `jobs.json` passes roughly 60 entries, move `passed` and `closed` roles
older than about 60 days into `jobs-archive.json` verbatim. The page keeps
counting them, and the routine keeps deduping against them.

## Validation

```bash
npm run validate:radar
```

`npm run build` runs this first, so a malformed data file fails the build
rather than publishing a broken page — and Netlify keeps serving the last good
deploy until it is fixed. This is deliberate: the validator, not the content
schema, is what catches duplicate ids, because Astro's file loader silently
overwrites entries that share one.

An empty `jobs-archive.json` logs a `No items found` warning during builds.
That is expected until something is archived.
