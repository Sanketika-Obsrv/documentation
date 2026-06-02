/**
 * Fix MDX-incompatible HTML across all migrated .mdx files:
 * - <br> → <br />
 * - <hr> → <hr />
 * - <img ...> → <img ... /> (non-self-closing)
 * - Strip remaining stray {# ...} or similar GitBook artifacts
 */
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

const DOCS = new URL('../src/content/docs', import.meta.url).pathname;

async function walk(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (e.name.endsWith('.mdx')) files.push(p);
  }
  return files;
}

function fix(content) {
  // Protect code fences
  const fences = [];
  let c = content.replace(/(`{3,}[\s\S]*?`{3,})/g, (m) => {
    fences.push(m); return `\x00F${fences.length - 1}\x00`;
  });

  // Fix void HTML elements to self-closing (required by MDX/JSX)
  c = c.replace(/<br>/gi, '<br />');
  c = c.replace(/<hr>/gi, '<hr />');
  // <img src="..."> (without self-close) inside table cells
  c = c.replace(/<img([^>]*[^/])>/g, '<img$1 />');
  // Strip any remaining {% %} gitbook tags that survived (unlikely but safe)
  c = c.replace(/\{%[\s\S]*?%\}/g, '');
  // Fix stray anchor tags from heading IDs left after migration
  c = c.replace(/<a\s+href="#[^"]*"\s+id="[^"]*">\s*<\/a>/g, '');

  // Restore fences
  c = c.replace(/\x00F(\d+)\x00/g, (_, i) => fences[Number(i)]);
  return c;
}

async function main() {
  const files = await walk(DOCS);
  let fixed = 0;
  for (const file of files) {
    const raw = await readFile(file, 'utf-8');
    const updated = fix(raw);
    if (updated !== raw) {
      await writeFile(file, updated, 'utf-8');
      fixed++;
    }
  }
  console.log(`✅ Fixed HTML in ${fixed} files`);
}

main().catch(console.error);
