import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.md', '.scss', '.ts', '.tsx', '.txt', '.vue', '.webmanifest', '.yaml', '.yml']);
const ignored = new Set(['.git', 'dist', 'node_modules', 'test-results', 'coverage']);
const productionRoots = new Set(['_headers', '_redirects', 'index.html', 'manifest.json', 'manifest.webmanifest', 'styles.css', 'sw.js']);
const files = [];
const errors = [];

async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) await walk(path.join(directory, entry.name));
      continue;
    }
    const file = path.join(directory, entry.name);
    if (textExtensions.has(path.extname(entry.name).toLowerCase())) files.push(file);
  }
}

function skipQuoted(text, start) {
  const quote = text[start];
  for (let i = start + 1; i < text.length; i += 1) {
    if (text[i] === '\\') i += 1;
    else if (text[i] === quote) return i;
  }
  return text.length;
}

function skipExpression(text, start) {
  let depth = 1;
  for (let i = start; i < text.length; i += 1) {
    if (['\'', '"', '`'].includes(text[i])) {
      i = skipQuoted(text, i);
      continue;
    }
    if (text[i] === '{') depth += 1;
    if (text[i] === '}' && --depth === 0) return i;
  }
  return text.length;
}

function literals(text) {
  const values = [];
  for (let i = 0; i < text.length; i += 1) {
    if (!['\'', '"', '`'].includes(text[i])) continue;
    const quote = text[i++];
    let value = '';
    for (; i < text.length; i += 1) {
      if (text[i] === '\\') {
        value += text[i] + (text[i + 1] || '');
        i += 1;
      } else if (quote === '`' && text[i] === '$' && text[i + 1] === '{') {
        i = skipExpression(text, i + 2);
      } else if (text[i] === quote) {
        values.push(value);
        break;
      } else {
        value += text[i];
      }
    }
  }
  return values;
}

function report(file, message) {
  errors.push(`${path.relative(root, file).replaceAll('\\', '/')} ${message}`);
}

function isProductionInput(file) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  return productionRoots.has(relative) || relative.startsWith('src/') || relative.startsWith('data/') || relative.startsWith('assets/') || relative.startsWith('scripts/');
}

await walk(root);
for (const file of files) {
  const bytes = await fs.readFile(file);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    report(file, 'contains invalid UTF-8');
    continue;
  }
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) report(file, 'contains a UTF-8 BOM');
  if (text.includes('\uFFFD')) report(file, 'contains the Unicode replacement character');
  if (path.extname(file).toLowerCase() === '.json') {
    try { JSON.parse(text); } catch { report(file, 'contains invalid JSON'); }
  }
  if (isProductionInput(file)) {
    const isCode = ['.js', '.mjs', '.ts', '.tsx', '.vue'].includes(path.extname(file).toLowerCase());
    const values = isCode ? literals(text) : [text];
    for (const value of values) {
      if (/\?{2,}/u.test(value)) report(file, 'contains a repeated question-mark placeholder');
      if (/\[object Object\]/u.test(value) || (!isCode && /\b(?:undefined|NaN)\b/u.test(value))) report(file, 'contains a leaked runtime placeholder');
      if (/\\u003f(?:\\u003f|\?)/iu.test(value)) report(file, 'contains an escaped question-mark placeholder');
    }
  }
}

try {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  if (tracked.split(/\r?\n/u).some(file => file.startsWith('dist/'))) errors.push('dist/ is tracked by Git');
} catch {
  // The recursive scan remains useful in source archives without Git metadata.
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Text integrity PASS (${files.length} files)`);
}
