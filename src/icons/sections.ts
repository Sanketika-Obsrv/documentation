/**
 * Single source of truth for section icons.
 *
 * Inner SVG markup for each icon is taken verbatim from Lucide
 * (https://lucide.dev/icons/, ISC-licensed). Render inside an
 * `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
 * stroke-linecap="round" stroke-linejoin="round">`.
 *
 * Both the left sidebar (keyed by group label) and the page-title (keyed by
 * the top-level slug) pull from here so the two can never drift.
 */

const EYE = `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`;
const LIGHTBULB = `<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>`;
const COMPASS = `<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>`;
const MONITOR = `<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>`;
const USERS = `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>`;
const ROCKET = `<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/><path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/>`;
const CIRCLE_HELP = `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>`;
const ARCHIVE = `<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>`;

/** Keyed by top-level slug (used by PageTitle). '' === site index. */
export const SECTION_ICONS: Record<string, string> = {
  '': EYE,
  'core-concepts': LIGHTBULB,
  explore: COMPASS,
  guides: MONITOR,
  community: USERS,
  'release-notes': ROCKET,
  'how-tos': CIRCLE_HELP,
  'previous-versions': ARCHIVE,
};

/** Keyed by sidebar group label (used by SidebarSublist). Same icons as above. */
export const SECTION_ICONS_BY_LABEL: Record<string, string> = {
  'Welcome to Obsrv': SECTION_ICONS[''],
  'Core Concepts': SECTION_ICONS['core-concepts'],
  Explore: SECTION_ICONS.explore,
  Guides: SECTION_ICONS.guides,
  Community: SECTION_ICONS.community,
  Releases: SECTION_ICONS['release-notes'],
  'How-Tos': SECTION_ICONS['how-tos'],
  'Previous Versions': SECTION_ICONS['previous-versions'],
};

// ── Badge icons (Lucide) ─────────────────────────────────────────────────────
// Render in place of text badges in the sidebar. Keyed by lower-cased badge text.
const SPARKLES = `<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>`;
const CROWN = `<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>`;

/** Keyed by lower-cased badge text → Lucide icon inner markup. */
export const BADGE_ICONS: Record<string, string> = {
  latest: SPARKLES,
  'pro feature': CROWN,
};
