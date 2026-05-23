#!/usr/bin/env node
// jsx-doc-to-mdx.mjs
//
// Heuristic-based MDX skeleton emitter for legacy HotSeatersMVP `Doc*.jsx`
// pages. Reads one JSX file as TEXT (no JSX parser — no @babel dependency),
// extracts prose elements with regex, and emits an MDX document that a human
// then reviews against MVP behavior.
//
// CLI:
//   node scripts/jsx-doc-to-mdx.mjs <path-to-Doc*.jsx> > content/user-manual/<slug>.mdx
//
// Heuristics:
//   - <h1>…</h1> → `# `, <h2>/<h3> → `## ` / `### `.
//   - <p>…</p>  → paragraph.
//   - <li>…</li> inside <ul> → `- item`; inside <ol> → `1. item` (we keep all
//     numbers as `1.` and let the markdown renderer reflow; matches Prettier).
//   - <pre>…</pre> wrapping a <code> block → fenced ``` block.
//   - <code>…</code> inline → backticks.
//   - <strong>/<b> → **bold**, <em>/<i> → _italic_.
//   - <a href="…">…</a> → [text](href).
//   - <table> → very basic GFM table extraction; columns inferred from <th>/<td>
//     order; falls back to a TODO marker if the table is malformed.
//   - Drops React-component wrappers we don't understand (<Card>, <Tabs>,
//     <Accordion>, <Badge>, …) but keeps their text content via a final
//     stripTags pass.
//   - Anything wrapped in `{ … }` JSX expressions becomes `{/* TODO: review */}`.
//
// Known limits:
//   - Does NOT handle conditional rendering or `.map()` lists — those become a
//     TODO block. Manual review required for every emitted MDX.
//   - Inline JSX nested deeper than 3 levels may produce ragged whitespace.
//   - `lucide-react` icons silently vanish.
//   - Template literals inside attributes survive as raw text.
//
// Output:
//   - Frontmatter with `title`, `section: TODO`, `order: 999`, `legacyPageId`.
//   - A banner comment: <!-- AUTO-GENERATED from legacy Doc*.jsx. REVIEW REQUIRED. -->
//   - Body assembled from the heuristics above.
//
// HotSeatersMVP is the bible. After running this script, every emitted MDX
// MUST be reconciled against the matching MVP page before publishing.

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const decodeEntities = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

const stripTags = (s) =>
  decodeEntities(
    s
      .replace(/<\/?[A-Za-z][^>]*>/g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\{[^{}]*\}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );

const inlineTransform = (s) =>
  decodeEntities(s)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '_$1_')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '_$1_')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\{[^{}]*\}/g, ''); // drop expressions

const flattenInline = (s) => stripTags(inlineTransform(s));

const extractTable = (tableHtml) => {
  const rows = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = rowRe.exec(tableHtml))) {
    const cellRe = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
    const cells = [];
    let c;
    while ((c = cellRe.exec(m[1]))) {
      cells.push(flattenInline(c[2]).replace(/\|/g, '\\|'));
    }
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) return '{/* TODO: review malformed table */}\n';
  const header = rows[0];
  const sep = header.map(() => '---');
  const body = rows.slice(1);
  return [
    `| ${header.join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...body.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n') + '\n';
};

const extractList = (listHtml, ordered) => {
  const itemRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const lines = [];
  let m;
  while ((m = itemRe.exec(listHtml))) {
    const txt = flattenInline(m[1]);
    if (!txt) continue;
    lines.push(ordered ? `1. ${txt}` : `- ${txt}`);
  }
  return lines.join('\n') + '\n';
};

const extractPre = (preHtml) => {
  const codeMatch = preHtml.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
  const inner = codeMatch ? codeMatch[1] : preHtml.replace(/<\/?pre[^>]*>/gi, '');
  return '```\n' + decodeEntities(inner).trim() + '\n```\n';
};

const convert = (jsx) => {
  // Capture everything between the first `return (` and the matching last `);`
  // for the default-exported component. We grep across the whole file because
  // nested parens trip naive bracket matching.
  const returnIdx = jsx.indexOf('return (');
  const body = returnIdx >= 0 ? jsx.slice(returnIdx + 'return ('.length) : jsx;

  // Token-by-token replace of recognised block elements in source order.
  const blocks = [];
  const blockRe =
    /<h1[^>]*>([\s\S]*?)<\/h1>|<h2[^>]*>([\s\S]*?)<\/h2>|<h3[^>]*>([\s\S]*?)<\/h3>|<h4[^>]*>([\s\S]*?)<\/h4>|<p[^>]*>([\s\S]*?)<\/p>|<ul[^>]*>([\s\S]*?)<\/ul>|<ol[^>]*>([\s\S]*?)<\/ol>|<pre[^>]*>([\s\S]*?)<\/pre>|<table[^>]*>([\s\S]*?)<\/table>|<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;

  let m;
  let lastH1 = null;
  while ((m = blockRe.exec(body))) {
    if (m[1] !== undefined) {
      const h = flattenInline(m[1]);
      lastH1 = lastH1 || h;
      blocks.push(`# ${h}\n`);
    } else if (m[2] !== undefined) blocks.push(`## ${flattenInline(m[2])}\n`);
    else if (m[3] !== undefined) blocks.push(`### ${flattenInline(m[3])}\n`);
    else if (m[4] !== undefined) blocks.push(`#### ${flattenInline(m[4])}\n`);
    else if (m[5] !== undefined) {
      const t = flattenInline(m[5]);
      if (t) blocks.push(`${t}\n`);
    } else if (m[6] !== undefined) blocks.push(extractList(m[6], false));
    else if (m[7] !== undefined) blocks.push(extractList(m[7], true));
    else if (m[8] !== undefined) blocks.push(extractPre(m[8]));
    else if (m[9] !== undefined) blocks.push(extractTable(m[9]));
    else if (m[10] !== undefined) blocks.push(`> ${flattenInline(m[10])}\n`);
  }

  if (!blocks.length) blocks.push('{/* TODO: no recognisable prose extracted — review source JSX */}\n');

  return { lastH1, body: blocks.join('\n') };
};

const main = async () => {
  const [, , file] = process.argv;
  if (!file) {
    console.error('usage: node scripts/jsx-doc-to-mdx.mjs <path-to-Doc*.jsx>');
    process.exit(1);
  }
  const src = await readFile(file, 'utf8');
  const legacyPageId = basename(file).replace(/\.jsx$/, '');
  const { lastH1, body } = convert(src);
  const title = lastH1 || legacyPageId;

  const out = [
    '---',
    `title: ${JSON.stringify(title)}`,
    'section: TODO',
    'order: 999',
    `legacyPageId: ${legacyPageId}`,
    '---',
    '',
    '{/* AUTO-GENERATED from legacy Doc*.jsx. REVIEW REQUIRED. */}',
    '{/* HotSeatersMVP is the bible — reconcile against MVP behavior before shipping. */}',
    '',
    body,
  ].join('\n');

  process.stdout.write(out);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
