/**
 * Convert <div class="tabs-container"><details>...</details></div>
 * to clean markdown sections (bold label + content + horizontal rule).
 * This avoids MDX/JSX parsing issues with <details> containing markdown.
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

function convertTabsToMarkdown(content) {
  // Match the full tabs-container div
  return content.replace(
    /<div class="tabs-container">\n?([\s\S]*?)\n?<\/div>/g,
    (_, inner) => {
      let md = '';
      const detailsRe = /<details>\s*<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)\s*<\/details>/g;
      let m;
      let first = true;
      while ((m = detailsRe.exec(inner)) !== null) {
        const label = m[1].trim();
        const body = m[2].trim();
        if (!first) md += '\n\n---\n\n';
        md += `**${label}**\n\n${body}`;
        first = false;
      }
      return md || inner;
    }
  );
}

async function main() {
  const files = await walk(DOCS);
  let fixed = 0;
  for (const file of files) {
    const raw = await readFile(file, 'utf-8');
    if (!raw.includes('tabs-container')) continue;
    const updated = convertTabsToMarkdown(raw);
    if (updated !== raw) {
      await writeFile(file, updated, 'utf-8');
      fixed++;
    }
  }
  console.log(`✅ Converted tabs to markdown in ${fixed} files`);
}

main().catch(console.error);
