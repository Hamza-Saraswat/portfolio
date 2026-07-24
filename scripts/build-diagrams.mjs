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
   1. Support inbox agent — intake funnel + confidence judge
   ============================================================ */
function supportInboxDiagram() {
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
    'Support inbox agent — intake funnel and confidence judge',
    'Live on a production support inbox. The judge, not the model, decides what a draft is worth.',
    parts.join('\n')
  );
}

/* ============================================================
   2. Payments agent — template-first generation
   ============================================================ */
function paymentsAgentDiagram() {
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
    'Payments agent — template-first generation',
    'Money-adjacent email, where a hallucinated sentence is a different class of failure.',
    parts.join('\n')
  );
}

/* ============================================================
   3. Customer status pages — three flows
   ============================================================ */
function statusPagesDiagram() {
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
    'Customer status pages — three independent flows',
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

/* ============================================================
   5. Internal knowledge assistant — retrieval architecture
   Replaces the original hand-drawn export, whose title carried an
   internal codename.
   ============================================================ */
function knowledgeAssistantDiagram() {
  const W = 2400;
  const H = 760;
  const rowY = 400;
  const parts = [];

  const start = ellipse(['Slack', 'message'], 170, rowY);
  parts.push(start.svg);

  const app = box(['Slack Bolt app', 'Node.js on Railway'], 640, rowY, {
    size: 22,
    minW: 480,
  });
  parts.push(app.svg);
  parts.push(arrow(start.right + 8, rowY, app.left - 10, rowY));

  const model = box(['Model', '+ MCP tool calls'], 1250, rowY, { size: 22, minW: 420 });
  parts.push(model.svg);
  parts.push(arrow(app.right + 8, rowY, model.left - 10, rowY));

  const docs = box(['Help center', 'via MCP'], 1900, rowY - 140, {
    size: 21,
    minW: 400,
    fill: C.greenFill,
    stroke: C.green,
  });
  const wiki = box(['Internal wiki', 'scoped query'], 1900, rowY + 140, {
    size: 21,
    minW: 400,
    fill: C.greenFill,
    stroke: C.green,
  });
  parts.push(docs.svg, wiki.svg);
  parts.push(
    elbow(model.right + 8, rowY - 20, docs.left - 10, docs.cy, { color: C.green, midX: 1600 }),
    elbow(model.right + 8, rowY + 20, wiki.left - 10, wiki.cy, { color: C.green, midX: 1600 })
  );

  const reply = ellipse(['Threaded reply', '+ citations'], 2260, rowY, {
    size: 20,
    fill: C.greenFill,
    stroke: C.green,
    padX: 28,
  });
  parts.push(reply.svg);
  parts.push(
    `<path d="M ${docs.right + 8} ${docs.cy} H 2260 V ${reply.top - 8}" fill="none" stroke="${C.green}" stroke-width="3"/>`,
    `<path d="M ${wiki.right + 8} ${wiki.cy} H 2260 V ${reply.bottom + 8}" fill="none" stroke="${C.green}" stroke-width="3"/>`
  );

  parts.push(
    note('searched in parallel — either can fail without taking down the answer', 1250, 640, {
      size: 20,
      fill: C.muted,
    })
  );

  return canvas(
    W,
    H,
    'Internal knowledge assistant — retrieval architecture',
    'No embeddings. No vector store. No reranker. Documentation queried at its source.',
    parts.join('\n')
  );
}

/* ============================================================
   6. AI adoption — the three layers
   Replaces the original export, which still showed a retracted
   accuracy figure and a project no longer on the site.
   ============================================================ */
function aiAdoptionDiagram() {
  const W = 2400;
  const H = 1020;
  const parts = [];

  const colLabel = (text, x, color) =>
    note(text, x, 210, { size: 21, fill: color });

  parts.push(colLabel('INFRASTRUCTURE', 460, C.blue));
  parts.push(colLabel('WHAT IT MADE POSSIBLE', 1250, C.purple));
  parts.push(colLabel('WHERE IT LANDED', 2020, C.green));

  const infra = [
    ['Shared prompt library'],
    ['Machine-readable', 'internal docs'],
    ['Agent foundation', 'MCP retrieval'],
  ];
  let iy = 340;
  const infraBoxes = [];
  for (const lines of infra) {
    const b = box(lines, 460, iy, {
      size: 21,
      minW: 560,
      fill: C.blueFill,
      stroke: C.blue,
    });
    infraBoxes.push(b);
    parts.push(b.svg);
    iy += 200;
  }

  const middle = box(
    ['Support inbox agent', 'Internal knowledge assistant', 'Payments agent', 'Onboarding platform'],
    1250,
    540,
    { size: 22, minW: 620, padY: 40 }
  );
  parts.push(middle.svg);
  for (const b of infraBoxes) {
    parts.push(arrow(b.right + 8, b.cy, middle.left - 10, middle.cy, { color: C.blue }));
  }

  const outcome = box(
    ['2 agents in production', '4 internal tools shipped', 'Evaluation is routine'],
    2020,
    540,
    { size: 22, minW: 560, fill: C.greenFill, stroke: C.green, padY: 36 }
  );
  parts.push(outcome.svg);
  parts.push(arrow(middle.right + 8, 540, outcome.left - 10, 540, { color: C.green }));

  parts.push(
    `<rect x="56" y="${H - 150}" width="${W - 112}" height="94" rx="12" fill="${C.purpleFill}" stroke="${C.purple}" stroke-width="3"/>`,
    note(
      'Infrastructure first. The unglamorous layer is what made everything after it cheap.',
      W / 2,
      H - 96,
      { size: 24, fill: C.purple }
    )
  );

  return canvas(
    W,
    H,
    'Building an AI practice — three layers',
    'From private experiments to systems the company operates.',
    parts.join('\n')
  );
}

/* ============================================================
   7. Onboarding — product cycle
   ============================================================ */
function onboardingFlowDiagram() {
  const W = 2400;
  const H = 700;
  const rowY = 370;
  const parts = [];

  const start = ellipse(['Closed won', 'in Salesforce'], 190, rowY, {
    size: 20,
    padX: 32,
  });
  parts.push(start.svg);

  const steps = [
    { lines: ['Link generated', 'idempotent API'], fill: C.purpleFill, stroke: C.purple },
    { lines: ['Guided wizard', 'React + TypeScript'], fill: C.purpleFill, stroke: C.purple },
    { lines: ['Fail-soft', 'orchestrator'], fill: C.redFill, stroke: C.red },
    { lines: ['Account configured', 'customer logged in'], fill: C.greenFill, stroke: C.green },
  ];

  let x = 700;
  let prevRight = start.right;
  for (const step of steps) {
    const b = box(step.lines, x, rowY, {
      size: 21,
      minW: 420,
      fill: step.fill,
      stroke: step.stroke,
    });
    parts.push(b.svg);
    parts.push(arrow(prevRight + 8, rowY, b.left - 10, rowY));
    prevRight = b.right;
    x = b.right + 260;
  }

  parts.push(
    note(
      'Per-module checkpoints, so a closed tab is never a lost afternoon.',
      W / 2,
      580,
      { size: 21, fill: C.muted }
    )
  );

  return canvas(
    W,
    H,
    'Customer onboarding — the full cycle',
    'A closed deal becomes a configured account without an implementation call.',
    parts.join('\n')
  );
}

/* ============================================================ */
const diagrams = [
  ['support-inbox-pipeline', supportInboxDiagram()],
  ['payments-template-first', paymentsAgentDiagram()],
  ['status-pages-architecture', statusPagesDiagram()],
  ['onboarding-orchestrator', onboardingDiagram()],
  ['knowledge-assistant-architecture', knowledgeAssistantDiagram()],
  ['ai-adoption-layers', aiAdoptionDiagram()],
  ['onboarding-flow', onboardingFlowDiagram()],
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
