# Obsrv Documentation

Source for the Obsrv documentation site published at **[docs.obsrv.ai](https://docs.obsrv.ai)**.

It is a static site built with [Astro](https://astro.build/) and the [Starlight](https://starlight.astro.build/) docs framework, with the API reference generated from the Obsrv OpenAPI spec. The site is deployed to GitHub Pages automatically on every push to `main`.

[Obsrv](https://obsrv.ai) is an open-source observability and data platform incubated within the [Sunbird](https://sunbird.org/) initiative.

## Prerequisites

- **Node.js 22+**
- **[pnpm](https://pnpm.io/)** (the repo pins `pnpm@11.2.2` via `packageManager`)

## Run locally

```bash
pnpm install
pnpm dev
```

This starts the Astro dev server (default at http://localhost:4321). The `dev` script first runs `scripts/transform-openapi.mjs` to generate the API reference spec.

## Available scripts

| Command | Description |
|---|---|
| `pnpm dev` | Generate the OpenAPI spec, then start the dev server with hot reload. |
| `pnpm build` | Generate the OpenAPI spec, then build the production site into `dist/`. Fails on broken internal links. |
| `pnpm preview` | Serve the production build locally for a final check. |

There is no separate test suite — a successful `pnpm build` is the validation gate (it type-checks and validates all internal links). Run it before pushing.

## Editing content

Documentation pages live as `.mdx` files under **`src/content/docs/`**. The file path maps directly to the URL — e.g. `src/content/docs/guides/installation/aws-installation-guide.mdx` → `/guides/installation/aws-installation-guide`. Images go in `public/assets/` and are referenced as `/assets/...`.

The sidebar navigation is defined manually in `astro.config.mjs`. When you add a new page, add a corresponding entry there (or confirm it lives under one of the `autogenerate` directory groups).

> The top-level directories (`introduction/`, `core-concepts/`, `guides/`, etc.) are the **frozen original GitBook source** kept for reference. Editing them does not affect the live site — edit the `.mdx` files under `src/content/docs/` instead.

## API reference

The pages under `/guides/api-specification` are **generated**, not hand-written:

1. CI syncs the upstream OpenAPI spec from [`Sanketika-Obsrv/obsrv-api-service`](https://github.com/Sanketika-Obsrv/obsrv-api-service) into `openapi/openapi_v2.yml` (a committed copy serves as fallback).
2. `scripts/transform-openapi.mjs` (run as part of `dev`/`build`) collapses the spec's granular tags into a small set of sections and writes the derived `openapi/openapi.generated.yml`.
3. The [`starlight-openapi`](https://starlight-openapi.vercel.app/) plugin renders the reference pages from that generated spec.

To change how API endpoints are grouped, edit the tag mapping in `scripts/transform-openapi.mjs`.

## Project structure

```
src/content/docs/   Documentation pages (.mdx) — the live content
src/components/      Starlight component overrides (sidebar, page title, etc.)
src/styles/          Global CSS
openapi/             OpenAPI source spec (the .generated.yml is built, git-ignored)
scripts/             Build-time scripts (OpenAPI transform, one-time migration)
public/              Static assets served at the site root
astro.config.mjs     Site config: Starlight options, plugins, sidebar, redirects
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which syncs the API spec, runs `pnpm build`, and publishes `dist/` to GitHub Pages.

## License

See [LICENSE](./LICENSE).
