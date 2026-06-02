/**
 * One-time migration: GitBook .md → Astro Starlight .mdx
 * Run: node scripts/migrate.mjs
 */

import { readFile, writeFile, mkdir, copyFile, readdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { existsSync } from 'fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DOCS_OUT = join(ROOT, 'src/content/docs');
const ASSETS_OUT = join(ROOT, 'public/assets');

const SOURCE_DIRS = [
  'introduction', 'core-concepts', 'explore',
  'guides', 'release-notes', 'previous-versions', 'use',
];
const ROOT_FILES = ['README.md', 'community.md'];

// ---------------------------------------------------------------------------
// Asset copy
// ---------------------------------------------------------------------------
async function copyAssets() {
  const assetsDir = join(ROOT, '.gitbook/assets');
  const entries = await readdir(assetsDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = join(assetsDir, entry.name);
    if (entry.isDirectory()) {
      await mkdir(join(ASSETS_OUT, entry.name), { recursive: true });
      const subs = await readdir(src, { withFileTypes: true });
      for (const sub of subs) {
        if (!sub.isDirectory()) {
          await copyFile(join(src, sub.name), join(ASSETS_OUT, entry.name, sub.name));
        }
      }
    } else {
      await copyFile(src, join(ASSETS_OUT, entry.name));
    }
  }
  console.log('✅ Assets copied → public/assets/');
}

// ---------------------------------------------------------------------------
// Transformers
// ---------------------------------------------------------------------------

/** Protect fenced code blocks so transforms don't alter them */
function protectFences(content) {
  const fences = [];
  const out = content.replace(/(`{3,}[\s\S]*?`{3,})/g, (m) => {
    fences.push(m);
    return `\x00FENCE${fences.length - 1}\x00`;
  });
  return { out, fences };
}
function restoreFences(content, fences) {
  return content.replace(/\x00FENCE(\d+)\x00/g, (_, i) => fences[Number(i)]);
}

function transformFrontmatter(content) {
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    const h1 = content.match(/^#\s+(.+)$/m);
    const title = h1 ? h1[1].replace(/<[^>]+>/g, '').trim() : 'Untitled';
    return `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n\n` + content;
  }
  let body = fm[1];
  body = body.replace(/^hidden:\s*true/m, 'draft: true');
  body = body.replace(/^icon:.*$/m, '');
  body = body.replace(/\n{3,}/g, '\n\n').trim();
  return content.replace(/^---\n[\s\S]*?\n---/, `---\n${body}\n---`);
}

function transformHints(content) {
  const map = { info: 'note', warning: 'caution', success: 'tip', danger: 'danger' };
  return content.replace(
    /\{%\s*hint\s+style="([^"]+)"\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/g,
    (_, s, body) => `:::${map[s.trim()] || 'note'}\n${body.trim()}\n:::`
  );
}

function transformTabs(content) {
  return content.replace(
    /\{%\s*tabs\s*%\}([\s\S]*?)\{%\s*endtabs\s*%\}/g,
    (_, body) => {
      let out = '<div class="tabs-container">\n';
      const re = /\{%\s*tab\s+title="([^"]+)"\s*%\}([\s\S]*?)\{%\s*endtab\s*%\}/g;
      let m;
      while ((m = re.exec(body))) {
        out += `<details><summary>${m[1]}</summary>\n\n${m[2].trim()}\n\n</details>\n`;
      }
      return out + '</div>';
    }
  );
}

function transformSwagger(content) {
  return content.replace(
    /\{%\s*swagger\s+src="[^"]+"\s+path="([^"]+)"\s+method="([^"]+)"[^%]*%\}[\s\S]*?\{%\s*endswagger\s*%\}/g,
    (_, path, method) =>
      `> **\`${method.toUpperCase()} ${path}\`** — [View full API reference →](/guides/api-specification/)`
  );
}

function transformCodeBlocks(content) {
  return content.replace(
    /\{%\s*code(?:\s+title="([^"]*)")?(?:\s+overflow="([^"]*)")?\s*%\}\s*(`{3,}[\s\S]*?`{3,})\s*\{%\s*endcode\s*%\}/g,
    (_, title, overflow, block) => {
      let meta = '';
      if (title) meta += ` title="${title}"`;
      if (overflow === 'wrap') meta += ' wrap';
      return block.replace(/^(`{3,}\w*)/, `$1${meta}`);
    }
  );
}

function transformFigures(content) {
  return content.replace(
    /<figure>\s*<img\s+src="([^"]+)"[^>]*>\s*(?:<figcaption>(?:<p>)?([\s\S]*?)(?:<\/p>)?<\/figcaption>)?\s*<\/figure>/g,
    (_, src, cap) => {
      const decoded = decodeURIComponent(src);
      const m = decoded.match(/\.gitbook\/assets\/(.+)/);
      if (!m) return `![${cap || ''}](${src})`;
      const alt = (cap || '').replace(/<[^>]+>/g, '').trim();
      return `![${alt}](/assets/${m[1]})`;
    }
  );
}

function transformMarkTags(content) {
  return content.replace(/<mark\s+style="color:([^"]+);">([\s\S]*?)<\/mark>/g, (_, color, text) => {
    const t = text.trim();
    if (color === 'purple') return `\`${t}\``;
    if (color === 'blue') return `_${t}_`;
    return t;
  });
}

function transformImagePaths(content) {
  return content.replace(
    /!\[([^\]]*)\]\(([^)]*\.gitbook\/assets\/[^)]+)\)/g,
    (_, alt, src) => {
      const m = decodeURIComponent(src).match(/\.gitbook\/assets\/(.+)/);
      return m ? `![${alt}](/assets/${m[1]})` : `![${alt}](${src})`;
    }
  );
}

function transformRelativeLinks(content) {
  return content
    .replace(/<a\s+href="#[^"]*"\s+id="[^"]*">\s*<\/a>/g, '') // strip anchor IDs
    .replace(/\]\((?!http)([^)]+)\.md\)/g, (_, p) => `](/${p.replace(/^\//, '')})`);
}

function cleanup(content) {
  return content
    .replace(/&#x20;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .replace(/<table\s+data-view="cards"[\s\S]*?<\/table>/g,
      '<!-- card grid — see the home page for the visual card layout -->');
}

function transform(raw) {
  const { out, fences } = protectFences(raw);
  let c = out;
  c = transformFrontmatter(c);
  c = transformHints(c);
  c = transformTabs(c);
  c = transformSwagger(c);
  c = transformCodeBlocks(c);
  c = transformFigures(c);
  c = transformMarkTags(c);
  c = transformImagePaths(c);
  c = transformRelativeLinks(c);
  c = cleanup(c);
  return restoreFences(c, fences);
}

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------
async function walk(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else if (e.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function destPath(src) {
  let rel = src.replace(ROOT + '/', '');
  rel = basename(rel) === 'README.md'
    ? rel.replace('README.md', 'index.mdx')
    : rel.replace(/\.md$/, '.mdx');
  return join(DOCS_OUT, rel);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('🚀 Starting migration…\n');
  await copyAssets();

  const files = [];
  for (const f of ROOT_FILES) {
    const p = join(ROOT, f);
    if (existsSync(p)) files.push(p);
  }
  for (const dir of SOURCE_DIRS) {
    const p = join(ROOT, dir);
    if (existsSync(p)) files.push(...(await walk(p)));
  }

  console.log(`📄 ${files.length} files to migrate\n`);
  let ok = 0, errs = 0;

  for (const src of files) {
    try {
      const dest = destPath(src);
      await mkdir(dirname(dest), { recursive: true });
      const raw = await readFile(src, 'utf-8');
      await writeFile(dest, transform(raw), 'utf-8');
      ok++;
    } catch (e) {
      console.error(`❌ ${src}: ${e.message}`);
      errs++;
    }
  }

  console.log(`\n✅ ${ok} files migrated${errs ? `  ⚠️  ${errs} errors` : ''}`);
  console.log('🎉 Done. Run: npm run dev');
}

main().catch(console.error);
