import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

/**
 * Hide the "On this page" table of contents when it would only contain the
 * auto-generated "Overview" entry — i.e. the page has no h2/h3 headings.
 *
 * Starlight always seeds `toc.items` with an "Overview" link to the top of the
 * page, so a heading-less page still renders an "ON THIS PAGE" panel with a
 * single, meaningless entry. Nulling `toc` here makes Starlight skip the right
 * sidebar entirely (see `TwoColumnContent.astro`) and drop the `data-has-toc`
 * attribute (see `Page.astro`), so the main content expands to full width.
 */
/** Total entries in the ToC tree, including nested children. */
function countEntries(items: Array<{ children?: unknown[] }>): number {
  return items.reduce(
    (total, item) => total + 1 + countEntries((item.children as typeof items) ?? []),
    0
  );
}

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  // The first entry is always the synthetic "Overview" link. Headings can nest
  // beneath it (e.g. a page of only h3s), so count the whole tree rather than
  // just the top-level length: <= 1 means "Overview" is the only entry.
  if (route.toc && countEntries(route.toc.items) <= 1) {
    route.toc = undefined;
  }
});
