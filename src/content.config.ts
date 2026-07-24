import { defineCollection, reference } from 'astro:content';
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
      related: z.array(reference('caseStudies')).optional(),
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

const supportingProjects = defineCollection({
  loader: file('./src/data/supporting-projects.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    blurb: z.string(),
    tags: z.array(z.string()).max(4),
    order: z.number(),
    link: z.url().optional(),
  }),
});

export const collections = { caseStudies, writing, supportingProjects };
