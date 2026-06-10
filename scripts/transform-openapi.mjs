/**
 * Collapse the upstream Obsrv OpenAPI spec's many granular tags into a small
 * set of friendly sections, so starlight-openapi (which renders one sidebar
 * group per tag) produces our 4 + "Other APIs" sections instead of 11 groups.
 *
 * Reads:  openapi/openapi_v2.yml      (vendored / CI-synced source — untouched)
 * Writes: openapi/openapi.generated.yml (derived, git-ignored, consumed by build)
 *
 * Runs as part of the `dev` and `build` npm scripts so it executes locally and
 * in CI (right after the spec-sync step).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'openapi', 'openapi_v2.yml');
const OUT = join(ROOT, 'openapi', 'openapi.generated.yml');

// Granular upstream tag -> friendly section. Anything not listed falls back to
// DEFAULT_SECTION (and is logged below so new upstream tags never disappear).
const TAG_MAP = {
  "Dataset API's": 'Dataset Management',
  'Dataset metrics': 'Dataset Management',
  "Connector API's": 'Connectors',
  'Data Ingest': 'Data In & Out',
  'Data Query': 'Data In & Out',
  'Query Templates': 'Data In & Out',
  'Alert Notification Channels': 'Alerts & Notifications',
  'Alert Silence': 'Alerts & Notifications',
  'Alerts Wrapper': 'Alerts & Notifications',
  'Alert Metric Alias': 'Alerts & Notifications',
  'Data Analyze PII': 'Other APIs',
};

const DEFAULT_SECTION = 'Other APIs';

// Sidebar group order (starlight-openapi uses document order of root `tags:`).
const SECTION_ORDER = [
  'Dataset Management',
  'Connectors',
  'Data In & Out',
  'Alerts & Notifications',
  'Other APIs',
];

const SECTION_DESCRIPTIONS = {
  'Dataset Management': 'Create, configure, and manage datasets and their metrics.',
  Connectors: 'Register and manage data connectors.',
  'Data In & Out': 'Ingest, query, and template data.',
  'Alerts & Notifications': 'Alert rules, silences, metric aliases, and notification channels.',
  'Other APIs': 'Additional endpoints.',
};

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'];

if (!existsSync(SRC)) {
  console.error(`[transform-openapi] Source spec not found at ${SRC}`);
  process.exit(1);
}

const doc = parse(readFileSync(SRC, 'utf8'));

const usedSections = new Set();
const unmappedTags = new Set();

function sectionFor(tag) {
  const mapped = TAG_MAP[tag];
  if (mapped) return mapped;
  unmappedTags.add(tag);
  return DEFAULT_SECTION;
}

for (const pathItem of Object.values(doc.paths ?? {})) {
  if (!pathItem || typeof pathItem !== 'object') continue;
  for (const method of HTTP_METHODS) {
    const op = pathItem[method];
    if (!op || typeof op !== 'object') continue;
    const original = Array.isArray(op.tags) && op.tags.length > 0 ? op.tags : [DEFAULT_SECTION];
    // Map each tag to its section, dedupe, keep at most one section per op.
    const sections = [...new Set(original.map(sectionFor))];
    op.tags = [sections[0]];
    usedSections.add(sections[0]);
  }
}

// Rewrite the root tag list to just the sections we use, in our chosen order.
doc.tags = SECTION_ORDER.filter((s) => usedSections.has(s)).map((name) => ({
  name,
  description: SECTION_DESCRIPTIONS[name] ?? undefined,
}));

writeFileSync(OUT, stringify(doc), 'utf8');

console.log(
  `[transform-openapi] Wrote ${OUT} with ${doc.tags.length} sections: ${doc.tags
    .map((t) => t.name)
    .join(', ')}`
);
if (unmappedTags.size > 0) {
  console.warn(
    `[transform-openapi] Unmapped upstream tags routed to "${DEFAULT_SECTION}": ${[...unmappedTags].join(
      ', '
    )}. Add them to TAG_MAP to give them a dedicated section.`
  );
}
