import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

/**
 * Case studies.
 *
 * `status`, `statusLabel`, `attribution` and the per-stat `footnote` are
 * required-by-design rather than optional prose: every claim on this site has
 * to carry its own provenance. A project that is not in production cannot be
 * described as if it were, because the card and the page both render from
 * these fields.
 */
const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Shown on cards and used as the meta description.
      summary: z.string().max(220),
      // Short label for the card headline area.
      tagline: z.string(),
      company: z.string().default('FieldPulse'),
      timeframe: z.string(),
      status: z.enum(['production', 'pilot', 'internal', 'complete']),
      statusLabel: z.string(),
      attribution: z.string().optional(),
      featured: z.boolean().default(true),
      order: z.number(),
      cardImage: image(),
      cardImageAlt: z.string(),
      tags: z.array(z.string()).max(6),
      stats: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
            footnote: z.string().optional(),
          })
        )
        .max(4)
        .optional(),
      draft: z.boolean().default(false),
    }),
});

/**
 * Writing. `draft: true` entries render as planned pieces — titled and
 * summarised, but not linked, because they are not written yet.
 */
const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    sourceProject: z.string().optional(),
    order: z.number().default(99),
    draft: z.boolean().default(true),
  }),
});


/**
 * Job radar. Written twice a week by a scheduled cloud routine
 * (automation/job-radar/routine-prompt.md); `status` and `statusNote` are
 * edited by hand. Same provenance rule as everything else on this site:
 * every entry traces to a listing that was actually read, and the schema
 * fails the build rather than render a malformed claim.
 */
const jobStatus = z.enum(['new', 'reviewing', 'applied', 'passed', 'closed']);
const jobTrack = z.enum(['fde', 'ai-eng', 'ai-product', 'technical-gtm']);
const jobSource = z.enum([
  'nextplay-digest',
  'nextplay-talent-agent',
  'plank-fde-tracker',
  'hn-whos-hiring',
  'yc-waas',
  'ai-jobs-net',
  'company-site',
  'other',
]);

const jobSchema = z.object({
  // Kebab slug `company-role` — the dedupe key across jobs and archive.
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  company: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  source: jobSource,
  sourceDetail: z.string().optional(),
  location: z.string().min(1),
  stage: z.string().optional(),
  track: jobTrack,
  tags: z.array(z.string()).max(4).default([]),
  fitNotes: z.string().min(30).max(400),
  status: jobStatus.default('new'),
  statusNote: z.string().max(200).optional(),
  dateAdded: z.iso.date(),
  dateStatusChanged: z.iso.date().optional(),
});

/**
 * Duplicate ids are checked by scripts/validate-radar.mjs, which `npm run
 * build` runs before Astro. It cannot be enforced here: the file() loader
 * keys entries by id, so a duplicate silently overwrites the earlier entry,
 * and a parser that throws is caught by the loader and leaves the whole
 * collection empty — which publishes an empty page instead of failing.
 */
const jobs = defineCollection({
  loader: file('./src/data/jobs.json'),
  schema: jobSchema,
});

const jobsArchive = defineCollection({
  loader: file('./src/data/jobs-archive.json'),
  schema: jobSchema,
});

const marketPulse = defineCollection({
  loader: file('./src/data/market-pulse.json'),
  schema: z.object({
    id: z.string(),
    title: z.string().min(1),
    url: z.url(),
    source: z.string().min(1),
    takeaway: z.string().min(20).max(300),
    dateAdded: z.iso.date(),
    tags: z.array(z.string()).max(3).default([]),
  }),
});

export const collections = { caseStudies, writing, jobs, jobsArchive, marketPulse };
