#!/usr/bin/env node
// 校验 cooking spec.md 的「影响文件」章节。
// 用法：
//   node spec-files.mjs parse <文件.md> [--json]

import fs from 'node:fs';
import path from 'node:path';

const PATH_CHARS = /^[A-Za-z0-9@._+*?/-]+$/;
const ACTION_LINE = /^- (新增|删除|修改)：`([^`]+)`$/;
const ACTION_KEY = { 新增: 'added', 删除: 'removed', 修改: 'modified' };

process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0);
});

function usage() {
  process.stderr.write(`usage:
  node spec-files.mjs parse <文件.md> [--json]
`);
}

function specError(specPath, lineNo, msg) {
  const loc = lineNo != null ? `${specPath}:${lineNo}` : specPath;
  return new Error(`${loc}: ${msg}`);
}

function normalizeRel(file) {
  let rel = path.relative(process.cwd(), path.resolve(process.cwd(), file));
  if (rel === '') return '';
  return rel.split(path.sep).join('/').replace(/^\.\//, '');
}

function validatePathPattern(p, specPath, lineNo) {
  if (p.endsWith('/')) {
    throw specError(specPath, lineNo, '路径不要以 / 结尾，目录写成 glob，例如 foo/**');
  }
  if (p.includes('\\') || p.includes('//')) {
    throw specError(specPath, lineNo, '必须是仓库相对路径或 glob，禁止反斜杠、空段');
  }
  if (!PATH_CHARS.test(p)) {
    throw specError(specPath, lineNo, '路径含非法字符；禁止空白、未闭合反引号、注释');
  }
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.' || seg === '..') {
      throw specError(specPath, lineNo, '路径段不能是空、. 或 ..');
    }
  }
}

function normalizeSpecPath(raw, specPath, lineNo) {
  let p = raw.trim();
  if (p.startsWith('/')) p = p.slice(1);
  if (p.startsWith('/')) {
    throw specError(specPath, lineNo, '禁止绝对路径');
  }
  validatePathPattern(p, specPath, lineNo);
  return p;
}

function parseImpactFiles(markdown, specPath) {
  const lines = markdown.split(/\r?\n/);
  let headingAt = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('## ') && /^##\s+影响文件/.test(trimmed) && trimmed !== '## 影响文件') {
      throw specError(specPath, i + 1, '标题必须恰好是「## 影响文件」');
    }
    if (trimmed === '## 影响文件') {
      if (headingAt !== -1) throw specError(specPath, i + 1, '「影响文件」章节重复');
      headingAt = i;
    }
  }
  if (headingAt === -1) {
    throw specError(specPath, null, '缺少「## 影响文件」章节');
  }

  let end = lines.length;
  for (let i = headingAt + 1; i < lines.length; i += 1) {
    if (/^##\s/.test(lines[i])) {
      end = i;
      break;
    }
  }

  const body = [];
  for (let i = headingAt + 1; i < end; i += 1) {
    if (lines[i].trim() === '') continue;
    body.push({ lineNo: i + 1, text: lines[i] });
  }
  if (body.length === 0) {
    throw specError(specPath, headingAt + 1, '「影响文件」章节为空');
  }

  const added = [];
  const removed = [];
  const modified = [];
  const seen = new Map();
  const buckets = { added, removed, modified };

  for (const { lineNo, text } of body) {
    const match = text.match(ACTION_LINE);
    if (!match) {
      throw specError(specPath, lineNo, '每行必须是「- 新增|删除|修改：`路径`」，全角冒号，路径用反引号包裹');
    }
    const action = match[1];
    const file = normalizeSpecPath(match[2], specPath, lineNo);
    if (seen.has(file)) {
      throw specError(specPath, lineNo, `路径重复：${file}（已出现在「${seen.get(file)}」）`);
    }
    seen.set(file, action);
    buckets[ACTION_KEY[action]].push(file);
  }

  const files = [...added, ...modified];
  if (files.length === 0) {
    throw specError(specPath, headingAt + 1, '至少一条「新增」或「修改」');
  }
  return { added, removed, modified, files };
}

function parseSpecFile(file) {
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) throw new Error(`找不到 spec: ${abs}`);
  const label = normalizeRel(abs) || abs;
  return parseImpactFiles(fs.readFileSync(abs, 'utf8'), label);
}

function printParse(result, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  for (const [label, key] of [['added', 'added'], ['removed', 'removed'], ['modified', 'modified']]) {
    process.stdout.write(`${label}:\n`);
    if (result[key].length === 0) {
      process.stdout.write('  (none)\n');
      continue;
    }
    for (const file of result[key]) {
      process.stdout.write(`  ${file}\n`);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const [cmd, ...rest] = args;
  if (!cmd) {
    usage();
    process.exit(2);
  }

  try {
    if (cmd === 'parse') {
      const json = rest.includes('--json');
      const spec = rest.find((x) => x !== '--json');
      if (!spec) throw new Error('parse 需要 spec 路径');
      printParse(parseSpecFile(spec), json);
      return;
    }

    usage();
    process.exit(2);
  } catch (err) {
    process.stderr.write(`ERROR: ${err.message}\n`);
    process.exit(1);
  }
}

main();
