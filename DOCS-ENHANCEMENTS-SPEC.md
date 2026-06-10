# Obsrv Docs — Enhancement Spec

_Derived from the plugin brainstorming interview. Source of truth for the implementation work._

## 1. Goals

Improve the documentation experience by adopting a curated set of Starlight plugins, with the
headline change being **spec-driven API reference docs**. Keep the site **fully static** (GitHub
Pages), keep **Pagefind** search, and keep a **single "latest"** version of the docs.

## 2. Decisions (locked)

| Area | Decision |
|---|---|
| API docs | Generate from OpenAPI via **starlight-openapi** (native Starlight pages, **read-only**, no "try it") |
| API specs | **Multiple per-service specs**, **committed in the repo** |
| Existing API markdown | **Migrate the prose into the OpenAPI `description` fields**, then remove the markdown |
| Search | **Keep Pagefind** (no Algolia/AI search) |
| Versioning | **Single "latest"**; Release Notes remain the history |
| Diagrams | **Static images only** (no Mermaid/D2/PlantUML engine) |
| Reading UX | **scroll-to-top**, **copy-page-as-Markdown**, **image-zoom** |
| Link safety | **Broken-link validation at build** |
| AI/nav/engagement | None for now (no llms.txt, sidebar-topics, giscus, etc.) |

## 3. Plugin set (exact packages)

| Plugin | npm package | Purpose |
|---|---|---|
| OpenAPI docs | `starlight-openapi` | Generate API reference pages from committed specs |
| Link validation | `starlight-links-validator` | Fail the build on broken internal links/anchors |
| Scroll to top | `starlight-scroll-to-top` | Back-to-top button on long pages |
| Copy page as Markdown | `starlight-copy-button` | Copy whole page as Markdown (LLM-friendly) |
| Image zoom | `starlight-image-zoom` | Lightbox/enlarge for screenshots & diagrams |

All register under `starlight({ plugins: [...] })` in `astro.config.mjs`.

> **Compatibility check (do first):** current `@astrojs/starlight` is `^0.33.0`. Confirm each plugin
> supports that line; if `starlight-openapi` needs a newer Starlight, bump `@astrojs/starlight`
> (and re-test the custom component overrides in `src/components/`). Note Astro itself has a 6.x
> upgrade available — out of scope unless a plugin forces it.

## 4. API reference — detailed plan (the big piece)

**Target structure:** keep API docs under **Guides → API Specification**, one generated section per
service:
- Dataset Management
- Connector APIs
- Data In & Out APIs
- Alerts & Notification Channels APIs

**Spec files:** commit one OpenAPI file per service, e.g. `src/content/openapi/*.yaml`
(`dataset-management.yaml`, `connector-apis.yaml`, `data-in-and-out.yaml`, `alerts-notification.yaml`).

**Config sketch** (`astro.config.mjs`):
```js
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';

starlight({
  plugins: [
    starlightOpenAPI([
      { base: 'guides/api-specification/dataset-management', schema: './src/content/openapi/dataset-management.yaml' },
      { base: 'guides/api-specification/connector-apis',     schema: './src/content/openapi/connector-apis.yaml' },
      { base: 'guides/api-specification/data-in-and-out',    schema: './src/content/openapi/data-in-and-out.yaml' },
      { base: 'guides/api-specification/alerts-notification', schema: './src/content/openapi/alerts-notification.yaml' },
    ]),
    // ...other plugins
  ],
  sidebar: [
    // ...existing groups; replace the 4 manual "API Specification" links.
    // Either append ...openAPISidebarGroups at top level, or nest the generated
    // groups inside the existing "Guides" group (preferred for parity).
  ],
});
```

**Content migration:** for each of the 4 existing markdown files, fold the useful prose (auth,
conventions, examples, field notes) into the matching spec's `info.description` and per-operation
`description` fields so it renders in the generated pages. Then delete the markdown.

**Cleanup:**
- Remove the 4 hand-written files in `guides/api-specification/`.
- Remove the manual API sidebar entries in `astro.config.mjs`.
- Remove/retire `src/components/ApiReference.astro` (the client-side Swagger UI embed) and any pages
  using `<ApiReference url=... />`, so there is exactly one API system.

## 5. Other plugins — integration notes

- **starlight-links-validator:** expect failures on first run (heavy cross-linking + the
  `/documentation` base path). Triage real breakages; configure allowed exceptions only where
  justified. This becomes a build gate.
- **starlight-scroll-to-top / copy-button / image-zoom:** low-risk, mostly drop-in. Verify they
  inherit theme tokens and don't clash with the custom `src/components/` overrides or the right-hand
  "On this page" TOC. Image-zoom: default to all content images.

## 6. Open items needed from you (prerequisites / ambiguities)

1. **Where are the real OpenAPI specs?** The current `ApiReference.astro` points at a remote spec
   URL. I need either (a) those URLs, or (b) the actual spec files, to commit them. If no usable
   spec exists yet for a service, that service's reference can't be generated — we'd need to author
   the spec first (larger effort).
2. **Sidebar placement preference:** nest generated API groups *inside* the existing "Guides" group
   (parity with today) vs. append as top-level groups. Default assumption: **nest under Guides**.
3. **GitHub alerts syntax:** confirmed out (not selected); skip `starlight-github-alerts`.

## 7. Implementation phases

1. **Quick UX wins:** install + register `scroll-to-top`, `copy-button`, `image-zoom`; verify in
   browser (light/dark, desktop/mobile).
2. **Link validation:** add `starlight-links-validator`; run build; fix/triage failures; lock as gate.
3. **API reference:** confirm spec sources → commit specs → register `starlight-openapi` → wire
   sidebar → migrate prose → remove old markdown + Swagger component → validate all 4 sections render.

## 8. Validation / done criteria

- `pnpm build` passes with link validation enabled (no broken internal links).
- All 4 API services render as native, read-only reference pages under Guides → API Specification.
- Copy-as-Markdown, image zoom, and scroll-to-top work on desktop and mobile, both themes.
- No remaining references to the removed markdown files or the `ApiReference` component.
- Pagefind search still indexes content (including generated API pages).
