/**
 * Generates the architecture diagrams for the case studies that did not have
 * one, in the same clean monospace style as the existing Excalidraw exports.
 *
 *   node scripts/build-diagrams.mjs
 *
 * Output lands in src/assets/diagrams/ as PNG so astro:assets treats the new
 * diagrams exactly like the hand-made ones.
 */
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const C = {
  ink: '#1f2430',
  muted: '#6b7280',
  purple: '#7c3aed',
  purpleFill: '#ddd6fe',
  green: '#059669',
  greenFill: '#a7f3d0',
  orange: '#ea580c',
  orangeFill: '#fed7aa',
  red: '#dc2626',
  redFill: '#fecaca',
  blue: '#2563eb',
  blueFill: '#dbeafe',
  grayFill: '#f1f5f9',
  gray: '#94a3b8',
};

const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";
const CHAR_W = 0.602; // monospace advance width ratio

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const textWidth = (s, size) => s.length * size * CHAR_W;

/** Multi-line centred text block. */
function label(lines, cx, cy, { size = 22, fill = C.ink, weight = 'normal' } = {}) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const lh = size * 1.42;
  const top = cy - ((arr.length - 1) * lh) / 2;
  return arr
    .map(
      (line, i) =>
        `<text x="${cx}" y="${top + i * lh + size * 0.35}" font-family="${MONO}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="middle">${esc(line)}</text>`
    )
    .join('\n');
}

/** Rounded box sized to its text. Returns {svg, x, y, w, h, cx, cy, left, right, top, bottom}. */
function box(lines, cx, cy, opts = {}) {
  const {
    size = 22,
    padX = 34,
    padY = 26,
    fill = C.purpleFill,
    stroke = C.purple,
    textFill = C.ink,
    minW = 0,
    dashed = false,
  } = opts;
  const arr = Array.isArray(lines) ? lines : [lines];
  const w = Math.max(minW, Math.max(...arr.map((l) => textWidth(l, size))) + padX * 2);
  const h = arr.length * size * 1.42 + padY * 2 - size * 0.42;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="3"${dashed ? ' stroke-dasharray="10 7"' : ''}/>
${label(arr, cx, cy, { size, fill: textFill })}`;
  return {
    svg,
    x,
    y,
    w,
    h,
    cx,
    cy,
    left: x,
    right: x + w,
    top: y,
    bottom: y + h,
  };
}

/** Ellipse node (used for start / end states, matching the existing diagrams). */
function ellipse(lines, cx, cy, opts = {}) {
  const { size = 22, fill = C.orangeFill, stroke = C.orange, padX = 40, padY = 30 } = opts;
  const arr = Array.isArray(lines) ? lines : [lines];
  const rx = Math.max(...arr.map((l) => textWidth(l, size))) / 2 + padX;
  const ry = (arr.length * size * 1.42) / 2 + padY;
  const svg = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
${label(arr, cx, cy, { size })}`;
  return { svg, cx, cy, left: cx - rx, right: cx + rx, top: cy - ry, bottom: cy + ry };
}

function arrow(x1, y1, x2, y2, opts = {}) {
  const { color = C.purple, dashed = false, width = 3 } = opts;
  const id = color.replace('#', '');
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${dashed ? ' stroke-dasharray="9 7"' : ''} marker-end="url(#arrow-${id})"/>`;
}

/** Elbow connector: horizontal, then vertical, then horizontal. */
function elbow(x1, y1, x2, y2, opts = {}) {
  const { color = C.purple, dashed = false, midX = null } = opts;
  const id = color.replace('#', '');
  const mx = midX ?? (x1 + x2) / 2;
  return `<path d="M ${x1} ${y1} H ${mx} V ${y2} H ${x2}" fill="none" stroke="${color}" stroke-width="3"${dashed ? ' stroke-dasharray="9 7"' : ''} marker-end="url(#arrow-${id})"/>`;
}

function note(text, x, y, { size = 19, fill = C.muted, anchor = 'middle' } = {}) {
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(text)}</text>`;
}

function canvas(w, h, title, subtitle, body) {
  const markers = [C.purple, C.green, C.orange, C.red, C.gray, C.blue]
    .map(
      (c) =>
        `<marker id="arrow-${c.replace('#', '')}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="${c}"/></marker>`
    )
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>${markers}</defs>
<rect width="${w}" height="${h}" fill="#ffffff"/>
<text x="56" y="74" font-family="${MONO}" font-size="40" font-weight="bold" fill="${C.purple}">${esc(title)}</text>
${subtitle ? `<text x="56" y="118" font-family="${MONO}" font-size="22" fill="${C.muted}">${esc(subtitle)}</text>` : ''}
${body}
</svg>`;
}

/* ============================================================
   1. Email Support Agent — intake funnel + confidence judge
   ============================================================ */
function emailAgentDiagram() {
  const W = 2400;
  const H = 1180;
  const rowY = 300;
  const parts = [];

  const start = ellipse(['Inbound', 'email'], 150, rowY);
  parts.push(start.svg);

  const stages = [
    { lines: ['Dedupe'], drop: 'duplicate' },
    { lines: ['Thread?', 'first reply only'], drop: '51% follow-ups' },
    { lines: ['Domain +', 'keyword rules'], drop: 'noise' },
    { lines: ['Recipient', 'classifier'], drop: 'not primary' },
    { lines: ['Triage', 'Haiku'], drop: 'no reply needed' },
  ];

  let x = 430;
  const gap = 62;
  let prevRight = start.right;
  const boxes = [];
  for (const stage of stages) {
    const b = box(stage.lines, x, rowY, { size: 21, minW: 300 });
    boxes.push(b);
    parts.push(b.svg);
    parts.push(arrow(prevRight + 8, rowY, b.left - 10, rowY));
    // drop-off arrow going down
    parts.push(
      `<line x1="${b.cx}" y1="${b.bottom + 4}" x2="${b.cx}" y2="${b.bottom + 60}" stroke="${C.gray}" stroke-width="2.5" stroke-dasharray="7 6" marker-end="url(#arrow-${C.gray.replace('#', '')})"/>`
    );
    parts.push(note(stage.drop, b.cx, b.bottom + 92, { size: 17, fill: C.gray }));
    prevRight = b.right;
    x = b.right + gap + 150;
  }

  parts.push(
    note('Four cheap layers protect the expensive one. 208 emails in, 38 drafted.', 56, 190, {
      size: 21,
      anchor: 'start',
      fill: C.muted,
    })
  );

  // ---- Second row: generation + judge ----
  const row2 = 700;
  const responder = box(['RAG responder', 'Mintlify MCP docs'], 460, row2, {
    size: 22,
    minW: 420,
  });

  // Survivors wrap around the right edge and re-enter the second row from the
  // left, so the connector never runs along the same line as the fork arrows.
  const wrapY = 490;
  parts.push(
    `<path d="M ${boxes[boxes.length - 1].right + 8} ${rowY} H ${W - 120} V ${wrapY} H 150 V ${row2}" fill="none" stroke="${C.purple}" stroke-width="3"/>`,
    arrow(150, row2, responder.left - 10, row2),
    note('survivors', W - 260, wrapY - 22, { size: 18, fill: C.purple })
  );

  parts.push(responder.svg);

  const judge = box(['CONFIDENCE JUDGE', 'separate model call'], 1080, row2, {
    size: 22,
    minW: 470,
    fill: C.blueFill,
    stroke: C.blue,
  });
  parts.push(judge.svg);
  parts.push(arrow(responder.right + 8, row2, judge.left - 10, row2));

  parts.push(
    note('faithfulness · coverage · fit', judge.cx, judge.bottom + 44, { size: 19, fill: C.blue }),
    note('aggregated in code — 0.6 / 0.2 / 0.2', judge.cx, judge.bottom + 76, {
      size: 19,
      fill: C.blue,
    }),
    note('1 unsupported claim caps it at 0.5', judge.cx, judge.bottom + 108, {
      size: 19,
      fill: C.red,
    })
  );

  const review = box(['Human review queue'], 1900, row2 - 130, {
    size: 22,
    minW: 480,
    fill: C.greenFill,
    stroke: C.green,
  });
  const delayed = box(['Delayed send +', 'Slack interception'], 1900, row2 + 140, {
    size: 22,
    minW: 480,
    fill: C.grayFill,
    stroke: C.gray,
    dashed: true,
  });
  parts.push(review.svg, delayed.svg);

  // The two outcomes leave the judge at different heights so their horizontal
  // runs never sit on top of each other.
  parts.push(
    elbow(judge.right + 8, row2 - 24, review.left - 10, review.cy, {
      color: C.green,
      midX: 1500,
    }),
    elbow(judge.right + 8, row2 + 24, delayed.left - 10, delayed.cy, {
      color: C.gray,
      midX: 1600,
      dashed: true,
    })
  );

  parts.push(
    note('low confidence', 1560, row2 - 150, { size: 18, fill: C.green }),
    note('high confidence', 1560, row2 + 196, { size: 18, fill: C.gray }),
    note('every draft, stage 1', review.cx, review.bottom + 38, { size: 18, fill: C.green }),
    note('built, held off in stage 1', delayed.cx, delayed.bottom + 38, {
      size: 18,
      fill: C.gray,
    })
  );

  parts.push(
    `<rect x="56" y="${H - 150}" width="${W - 112}" height="94" rx="12" fill="${C.grayFill}" stroke="${C.gray}" stroke-width="2" stroke-dasharray="9 7"/>`,
    note(
      'Stage 1 rollout: auto-send is off. A person reviews and sends every draft the agent writes.',
      W / 2,
      H - 96,
      { size: 22, fill: C.ink }
    )
  );

  return canvas(
    W,
    H,
    'Email Support Agent — intake funnel and confidence judge',
    'Live on the support inbox. The judge, not the model, decides what a draft is worth.',
    parts.join('\n')
  );
}

/* ============================================================
   2. Jarvis — template-first generation
   ============================================================ */
function jarvisDiagram() {
  const W = 2400;
  const H = 1000;
  const rowY = 420;
  const parts = [];

  const start = ellipse(['Payment', 'notice'], 160, rowY);
  parts.push(start.svg);

  const classifier = box(['Classifier + extractor', 'the only LLM call'], 620, rowY, {
    size: 22,
    minW: 520,
    fill: C.blueFill,
    stroke: C.blue,
  });
  parts.push(classifier.svg);
  parts.push(arrow(start.right + 8, rowY, classifier.left - 10, rowY));

  // structured output callout
  parts.push(
    `<rect x="${classifier.left}" y="${classifier.bottom + 50}" width="${classifier.w}" height="150" rx="12" fill="#ffffff" stroke="${C.blue}" stroke-width="2.5" stroke-dasharray="9 7"/>`,
    note('template_id', classifier.cx, classifier.bottom + 96, { size: 20, fill: C.blue }),
    note('extracted fields', classifier.cx, classifier.bottom + 130, { size: 20, fill: C.blue }),
    note('denylist_terms', classifier.cx, classifier.bottom + 164, { size: 20, fill: C.blue }),
    note('strict JSON — no prose', classifier.cx, classifier.bottom + 232, {
      size: 19,
      fill: C.muted,
    })
  );

  const registry = box(['Template registry', 'body copied verbatim'], 1360, rowY, {
    size: 22,
    minW: 520,
    fill: C.greenFill,
    stroke: C.green,
  });
  parts.push(registry.svg);
  parts.push(arrow(classifier.right + 8, rowY, registry.left - 10, rowY, { color: C.blue }));

  const guard = box(['PII / leak guard', 'deterministic'], 2060, rowY, {
    size: 22,
    minW: 440,
    fill: C.redFill,
    stroke: C.red,
  });
  parts.push(guard.svg);
  parts.push(arrow(registry.right + 8, rowY, guard.left - 10, guard.cy, { color: C.green }));

  parts.push(
    note('missing a required field?', registry.cx, registry.bottom + 60, {
      size: 19,
      fill: C.muted,
    }),
    note('no draft — never a guess', registry.cx, registry.bottom + 92, {
      size: 19,
      fill: C.red,
    })
  );

  parts.push(
    note('over-suspicious by design', guard.cx, guard.bottom + 60, { size: 19, fill: C.muted }),
    note('false positive = a human looks', guard.cx, guard.bottom + 92, {
      size: 19,
      fill: C.muted,
    })
  );

  const human = box(['Human enters recipient, reviews, sends'], W / 2, 830, {
    size: 24,
    minW: 900,
    fill: C.grayFill,
    stroke: C.gray,
  });
  parts.push(human.svg);
  parts.push(
    `<path d="M ${guard.cx} ${guard.bottom + 120} V ${human.cy} H ${human.right + 10}" fill="none" stroke="${C.red}" stroke-width="3"/>`,
    `<line x1="${human.right + 10}" y1="${human.cy}" x2="${human.right + 4}" y2="${human.cy}" stroke="${C.red}" stroke-width="3" marker-end="url(#arrow-${C.red.replace('#', '')})"/>`
  );

  // The headline constraint
  parts.push(
    `<rect x="56" y="176" width="${W - 112}" height="86" rx="12" fill="${C.purpleFill}" stroke="${C.purple}" stroke-width="3"/>`,
    note('The LLM never writes the customer-facing body.', W / 2, 230, {
      size: 28,
      fill: C.purple,
    })
  );

  return canvas(
    W,
    H,
    'Jarvis — template-first generation',
    'Money-adjacent email, where a hallucinated sentence is a different class of failure.',
    parts.join('\n')
  );
}

/* ============================================================
   3. Relay — three flows
   ============================================================ */
function relayDiagram() {
  const W = 2400;
  const H = 1120;
  const parts = [];

  const laneLabel = (text, y) =>
    note(text, 56, y, { size: 21, fill: C.purple, anchor: 'start' });

  // --- Flow 1: token minting ---
  parts.push(laneLabel('1 · A case is created', 250));
  const sf1 = box(['Salesforce', 'case created'], 460, 320, {
    size: 21,
    minW: 340,
    fill: C.orangeFill,
    stroke: C.orange,
  });
  const mint = box(['Mint permanent token', 'one per account'], 1180, 320, {
    size: 21,
    minW: 520,
  });
  const link = box(['/t/{token}'], 1900, 320, {
    size: 21,
    minW: 340,
    fill: C.greenFill,
    stroke: C.green,
  });
  parts.push(sf1.svg, mint.svg, link.svg);
  parts.push(
    arrow(sf1.right + 8, 320, mint.left - 10, 320, { color: C.orange }),
    arrow(mint.right + 8, 320, link.left - 10, 320)
  );
  parts.push(note('idempotent — the same account always gets the same link', 1180, 420, { size: 18, fill: C.muted }));

  // --- Flow 2: sync ---
  parts.push(laneLabel('2 · Every two hours', 560));
  const cron = box(['Vercel cron'], 400, 630, { size: 21, minW: 300 });
  const bulk = box(['Salesforce Bulk API 2.0', 'off the strained REST quota'], 1080, 630, {
    size: 21,
    minW: 620,
    fill: C.orangeFill,
    stroke: C.orange,
  });
  const cleaner = box(['5-stage cleaner', 'fail-closed'], 1780, 630, {
    size: 21,
    minW: 420,
    fill: C.redFill,
    stroke: C.red,
  });
  const db = box(['Supabase'], 2220, 630, {
    size: 21,
    minW: 260,
    fill: C.greenFill,
    stroke: C.green,
  });
  parts.push(cron.svg, bulk.svg, cleaner.svg, db.svg);
  parts.push(
    arrow(cron.right + 8, 630, bulk.left - 10, 630),
    arrow(bulk.right + 8, 630, cleaner.left - 10, 630, { color: C.orange }),
    arrow(cleaner.right + 8, 630, db.left - 10, 630, { color: C.red })
  );

  // cleaner stages
  const stages = [
    'strip quoted history',
    'generate',
    'scrub PII',
    'ban dead CTAs',
    'verify, then publish',
  ];
  let sx = 1140;
  parts.push(
    // Tie the stage detail to the cleaner box it expands on.
    `<path d="M ${cleaner.cx} ${cleaner.bottom + 6} V 790" fill="none" stroke="${C.red}" stroke-width="2.5" stroke-dasharray="8 6"/>`,
    note('every stage falls back to a safe line rather than guessing', 1740, 822, {
      size: 18,
      fill: C.muted,
    })
  );
  stages.forEach((s, i) => {
    const w = textWidth(s, 18) + 46;
    parts.push(
      `<rect x="${sx}" y="${846}" width="${w}" height="56" rx="10" fill="#ffffff" stroke="${C.red}" stroke-width="2.5"/>`,
      note(s, sx + w / 2, 880, { size: 18, fill: C.ink })
    );
    if (i < stages.length - 1) {
      parts.push(
        `<line x1="${sx + w + 6}" y1="874" x2="${sx + w + 40}" y2="874" stroke="${C.red}" stroke-width="2.5" marker-end="url(#arrow-${C.red.replace('#', '')})"/>`
      );
    }
    sx += w + 48;
  });

  // --- Flow 3: visit ---
  parts.push(laneLabel('3 · A customer opens the link', 990));
  const visitor = ellipse(['Customer'], 400, 1040, { size: 21, padY: 22 });
  const ssr = box(['Server-rendered from Supabase only'], 1300, 1040, { size: 21, minW: 760 });
  const never = box(['Salesforce never touched at page load'], 2080, 1040, {
    size: 20,
    minW: 620,
    fill: C.greenFill,
    stroke: C.green,
  });
  parts.push(visitor.svg, ssr.svg, never.svg);
  parts.push(
    arrow(visitor.right + 8, 1040, ssr.left - 10, 1040),
    arrow(ssr.right + 8, 1040, never.left - 10, 1040, { color: C.green })
  );

  return canvas(
    W,
    H,
    'Relay — three independent flows',
    'The link is the credential. Page loads never touch Salesforce.',
    parts.join('\n')
  );
}

/* ============================================================
   4. Onboarding — fail-soft orchestrator
   ============================================================ */
function onboardingDiagram() {
  const W = 2200;
  const H = 1180;
  const parts = [];

  const start = ellipse(['Customer hits', 'Complete Setup'], 250, 360, { size: 21 });
  parts.push(start.svg);

  const orchestrator = box(['Orchestrator', '9 actions, fixed order'], 800, 360, {
    size: 22,
    minW: 480,
  });
  parts.push(orchestrator.svg);
  parts.push(arrow(start.right + 8, 360, orchestrator.left - 10, 360));

  // Fan out to jobs
  const jobs = [
    { label: 'Team + users', ok: true },
    { label: 'Customers import', ok: true },
    { label: 'Invoice settings', ok: false },
    { label: 'Custom forms', ok: true },
  ];
  let jy = 190;
  const jobBoxes = [];
  for (const job of jobs) {
    const b = box([job.label], 1520, jy, {
      size: 20,
      minW: 420,
      fill: job.ok ? C.greenFill : C.redFill,
      stroke: job.ok ? C.green : C.red,
    });
    jobBoxes.push({ b, ok: job.ok });
    parts.push(b.svg);
    parts.push(
      elbow(orchestrator.right + 8, 360, b.left - 10, b.cy, {
        color: job.ok ? C.green : C.red,
        midX: 1180,
      })
    );
    parts.push(
      note(job.ok ? 'ok' : 'failed', b.right + 60, b.cy + 7, {
        size: 19,
        fill: job.ok ? C.green : C.red,
        anchor: 'start',
      })
    );
    jy += 150;
  }

  parts.push(
    note('each call writes an audit row keyed by (session, job type)', 1520, jy + 10, {
      size: 19,
      fill: C.muted,
    }),
    note('so a retry can never run the same job twice', 1520, jy + 42, {
      size: 19,
      fill: C.muted,
    })
  );

  const done = box(['Session completes', 'customer is handed off, logged in'], 700, 900, {
    size: 22,
    minW: 700,
    fill: C.greenFill,
    stroke: C.green,
  });
  parts.push(done.svg);
  parts.push(
    `<path d="M ${orchestrator.cx} ${orchestrator.bottom + 8} V ${done.top - 10}" fill="none" stroke="${C.green}" stroke-width="3" marker-end="url(#arrow-${C.green.replace('#', '')})"/>`
  );

  const queue = box(['Failed jobs wait in the audit table', 'for an operator'], 1560, 900, {
    size: 22,
    minW: 640,
    fill: C.redFill,
    stroke: C.red,
  });
  parts.push(queue.svg);
  parts.push(arrow(done.right + 10, 900, queue.left - 10, 900, { color: C.red }));

  parts.push(
    `<rect x="56" y="${H - 150}" width="${W - 112}" height="94" rx="12" fill="${C.purpleFill}" stroke="${C.purple}" stroke-width="3"/>`,
    note(
      'A downstream failure never blocks the customer. The session always finishes.',
      W / 2,
      H - 96,
      { size: 24, fill: C.purple }
    )
  );

  return canvas(
    W,
    H,
    'Onboarding — fail-soft orchestration',
    'Nine service calls, any of which can fail without stranding the person in the wizard.',
    parts.join('\n')
  );
}

/* ============================================================ */
const diagrams = [
  ['email-agent-pipeline', emailAgentDiagram()],
  ['jarvis-template-first', jarvisDiagram()],
  ['relay-architecture', relayDiagram()],
  ['onboarding-orchestrator', onboardingDiagram()],
];

for (const [name, svg] of diagrams) {
  const out = `src/assets/diagrams/${name}.png`;
  await sharp(Buffer.from(svg), { density: 96 })
    .png({ compressionLevel: 9 })
    .toFile(out);
  if (process.env.KEEP_SVG) await writeFile(`scripts/out/${name}.svg`, svg);
  console.log(`  ✓ ${out}`);
}
console.log('diagrams built');
