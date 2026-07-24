/**
 * Generates the favicon raster sizes and the default Open Graph card.
 *
 *   node scripts/build-brand-assets.mjs
 */
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";
const SANS = "'Inter', 'DejaVu Sans', system-ui, sans-serif";

/* ---------- Favicons ---------- */
const favicon = await readFile('public/favicon.svg');

await sharp(favicon, { density: 384 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
// .ico is served as a PNG-encoded icon, which every current browser accepts.
await sharp(favicon, { density: 384 }).resize(32, 32).png().toFile('public/favicon.ico');
console.log('  ✓ favicons');

/* ---------- Open Graph card ---------- */
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#635bff"/>
      <stop offset="100%" stop-color="#80e9ff"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="24" y="24" width="1152" height="582" rx="18" fill="none" stroke="#e3e8ee" stroke-width="2"/>

  <text x="88" y="140" font-family="${MONO}" font-size="22" letter-spacing="3" fill="#635bff">HAMZA-SARASWAT.COM</text>

  <text x="88" y="272" font-family="${SANS}" font-size="66" font-weight="bold" fill="#30313d">I build AI systems that</text>
  <text x="88" y="352" font-family="${SANS}" font-size="66" font-weight="bold" fill="#635bff">survive production.</text>

  <text x="88" y="430" font-family="${SANS}" font-size="28" fill="#6b7280">Agents, evals, fail-closed guardrails.</text>

  <text x="88" y="536" font-family="${MONO}" font-size="24" fill="#30313d">Hamza Saraswat</text>
  <text x="88" y="572" font-family="${MONO}" font-size="20" fill="#6b7280">AI Engineer &#183; Dallas&#8211;Fort Worth</text>

  <rect x="24" y="588" width="1152" height="18" rx="0" fill="url(#bar)"/>
  <rect x="24" y="588" width="1152" height="18" fill="url(#bar)"/>
</svg>`;

await sharp(Buffer.from(og), { density: 96 }).png().toFile('public/og-default.png');
console.log('  ✓ og-default.png');
