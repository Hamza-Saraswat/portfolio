// Pre-flight structural check for the job-radar data files. The authoritative
// gate is the zod schema in src/content.config.ts at build time; this script
// exists so the radar routine (which cannot afford a full `astro build` per
// run) can validate cheaply before committing. Zero dependencies on purpose.
import { readFileSync } from 'node:fs';

const JOB_STATUS = ['new', 'reviewing', 'applied', 'passed', 'closed'];
const JOB_TRACK = ['fde', 'ai-eng', 'ai-product', 'technical-gtm'];
const JOB_SOURCE = [
  'nextplay-digest',
  'nextplay-talent-agent',
  'plank-fde-tracker',
  'hn-whos-hiring',
  'yc-waas',
  'ai-jobs-net',
  'company-site',
  'other',
];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];

function load(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    errors.push(`${path}: cannot read file`);
    return null;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    errors.push(`${path}: invalid JSON — ${e.message}`);
    return null;
  }
  if (!Array.isArray(data)) {
    errors.push(`${path}: top level must be an array`);
    return null;
  }
  return data;
}

function checkString(where, entry, field, { min = 1, max = Infinity, optional = false } = {}) {
  const value = entry[field];
  if (value === undefined) {
    if (!optional) errors.push(`${where}: missing "${field}"`);
    return;
  }
  if (typeof value !== 'string') {
    errors.push(`${where}: "${field}" must be a string`);
  } else if (value.length < min || value.length > max) {
    errors.push(`${where}: "${field}" length ${value.length} outside ${min}-${max}`);
  }
}

function checkJob(entry, index, path) {
  const where = `${path}[${index}] (${entry?.id ?? 'no id'})`;
  if (typeof entry !== 'object' || entry === null) {
    errors.push(`${where}: not an object`);
    return;
  }
  checkString(where, entry, 'id');
  if (typeof entry.id === 'string' && !SLUG.test(entry.id)) {
    errors.push(`${where}: id is not a kebab-case slug`);
  }
  checkString(where, entry, 'company');
  checkString(where, entry, 'title');
  checkString(where, entry, 'url');
  if (typeof entry.url === 'string' && !entry.url.startsWith('https://')) {
    errors.push(`${where}: url must start with https://`);
  }
  if (!JOB_SOURCE.includes(entry.source)) {
    errors.push(`${where}: source "${entry.source}" not in [${JOB_SOURCE.join(', ')}]`);
  }
  checkString(where, entry, 'location');
  if (!JOB_TRACK.includes(entry.track)) {
    errors.push(`${where}: track "${entry.track}" not in [${JOB_TRACK.join(', ')}]`);
  }
  checkString(where, entry, 'fitNotes', { min: 30, max: 400 });
  if (entry.status !== undefined && !JOB_STATUS.includes(entry.status)) {
    errors.push(`${where}: status "${entry.status}" not in [${JOB_STATUS.join(', ')}]`);
  }
  checkString(where, entry, 'statusNote', { max: 200, optional: true });
  if (typeof entry.dateAdded !== 'string' || !ISO_DATE.test(entry.dateAdded)) {
    errors.push(`${where}: dateAdded must be YYYY-MM-DD`);
  }
  if (entry.tags !== undefined && (!Array.isArray(entry.tags) || entry.tags.length > 4)) {
    errors.push(`${where}: tags must be an array of at most 4`);
  }
}

function checkPulse(entry, index, path) {
  const where = `${path}[${index}] (${entry?.id ?? 'no id'})`;
  if (typeof entry !== 'object' || entry === null) {
    errors.push(`${where}: not an object`);
    return;
  }
  checkString(where, entry, 'id');
  checkString(where, entry, 'title');
  checkString(where, entry, 'url');
  if (typeof entry.url === 'string' && !entry.url.startsWith('https://')) {
    errors.push(`${where}: url must start with https://`);
  }
  checkString(where, entry, 'source');
  checkString(where, entry, 'takeaway', { min: 20, max: 300 });
  if (typeof entry.dateAdded !== 'string' || !ISO_DATE.test(entry.dateAdded)) {
    errors.push(`${where}: dateAdded must be YYYY-MM-DD`);
  }
  if (entry.tags !== undefined && (!Array.isArray(entry.tags) || entry.tags.length > 3)) {
    errors.push(`${where}: tags must be an array of at most 3`);
  }
}

const jobs = load('src/data/jobs.json');
const archive = load('src/data/jobs-archive.json');
const pulse = load('src/data/market-pulse.json');

jobs?.forEach((entry, i) => checkJob(entry, i, 'jobs.json'));
archive?.forEach((entry, i) => checkJob(entry, i, 'jobs-archive.json'));
pulse?.forEach((entry, i) => checkPulse(entry, i, 'market-pulse.json'));

// Ids must be unique across active and archived jobs — the dedupe key.
if (jobs && archive) {
  const seen = new Map();
  for (const [name, list] of [['jobs.json', jobs], ['jobs-archive.json', archive]]) {
    for (const entry of list) {
      if (typeof entry?.id !== 'string') continue;
      if (seen.has(entry.id)) {
        errors.push(`duplicate id "${entry.id}" (${seen.get(entry.id)} and ${name})`);
      } else {
        seen.set(entry.id, name);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`validate-radar: ${errors.length} problem(s)\n`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const counts = `${jobs?.length ?? '?'} jobs, ${archive?.length ?? '?'} archived, ${pulse?.length ?? '?'} pulse`;
console.log(`validate-radar: OK (${counts})`);
