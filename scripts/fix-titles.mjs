/**
 * Post-migration fix: inject title into frontmatter for any .mdx files missing it.
 * Derives title from the first H1 heading in the file body.
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

async function main() {
  const files = await walk(DOCS);
  let fixed = 0;

  for (const file of files) {
    const raw = await readFile(file, 'utf-8');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const fm = fmMatch[1];
    if (/^title:/m.test(fm)) continue; // already has title

    // Derive title from first H1 in body
    const body = raw.slice(fmMatch[0].length);
    const h1 = body.match(/^#\s+(.+)$/m);
    if (!h1) continue;

    const title = h1[1].replace(/<[^>]+>/g, '').replace(/`/g, '').trim();
    const newFm = `title: "${title.replace(/"/g, '\\"')}"\n${fm}`;
    const updated = raw.replace(fmMatch[0], `---\n${newFm}\n---`);
    await writeFile(file, updated, 'utf-8');
    fixed++;
  }

  console.log(`✅ Added title to ${fixed} files`);
}

main().catch(console.error);
