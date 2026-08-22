#!/usr/bin/env node
// 扫描已归档 CONTEXT 条目的「影响文件」，按变更路径定位相关上下文。
// parse 也用于 cooking spec.md。
// 用法：
//   node spec-files.mjs parse <文件.md> [--json]
//   node spec-files.mjs query [--json] [--stdin] [--dir <CONTEXT目录>] <file...>
//   node spec-files.mjs list [--json] [--dir <CONTEXT目录>]

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_CONTEXT_DIR = '.agents/docs/CONTEXT';
const PATH_CHARS = /^[A-Za-z0-9@._+*?/-]+$/;
const ACTION_LINE = /^- (新增|删除|修改)：`([^`]+)`$/;
const ACTION_KEY = { 新增: 'added', 删除: 'removed', 修改: 'modified' };

process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0);
});

function usage() {
  process.stderr.write(`usage:
  node spec-files.mjs parse <文件.md> [--json]
  node spec-files.mjs query [--json] [--stdin] [--dir <CONTEXT目录>] <file...>
  node spec-files.mjs list [--json] [--dir <CONTEXT目录>]
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

function escapeRegex(ch) {
  return /[\\^$.*+?()[\]{}|]/.test(ch) ? `\\${ch}` : ch;
}

function globToRegex(pattern) {
  let p = String(pattern).split(path.sep).join('/').replace(/^\.\//, '').replace(/\/+$/, '');
  const hasWildcard = /[*?]/.test(p);
  let out = '^';
  for (let i = 0; i < p.length; i += 1) {
    const c = p[i];
    if (c === '*' && p[i + 1] === '*') {
      if (p[i + 2] === '/') {
        out += '(?:.*/)?';
        i += 2;
      } else {
        out += '.*';
        i += 1;
      }
    } else if (c === '*') {
      out += '[^/]*';
    } else if (c === '?') {
      out += '[^/]';
    } else {
      out += escapeRegex(c);
    }
  }
  out += '$';
  const re = new RegExp(out);
  if (hasWildcard) return re;
  const prefix = new RegExp(`^${p.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}/`);
  return { test: (file) => re.test(file) || prefix.test(file) };
}

function matchesPattern(file, pattern) {
  return globToRegex(pattern).test(file);
}

function matchesInput(file, pattern) {
  return matchesPattern(file, pattern) || matchesPattern(`${file}/__spec_probe__`, pattern);
}

function readSpecTitle(specAbs) {
  try {
    const head = fs.readFileSync(specAbs, 'utf8').slice(0, 1000);
    const match = head.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
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
    if (trimmed === '## 影响面') {
      throw specError(specPath, i + 1, '章节已改名为「影响文件」，不要再用「影响面」');
    }
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
    if (/^- (模块|新增模块|路径)：/.test(text)) {
      throw specError(specPath, lineNo, '不要写模块 / 新增模块 / 路径；只写「- 新增|删除|修改：`路径`」');
    }
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
    throw specError(specPath, headingAt + 1, '至少一条「新增」或「修改」；「删除」不参与 query 匹配');
  }
  return { added, removed, modified, files };
}

function parseSpecFile(file) {
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) throw new Error(`找不到 spec: ${abs}`);
  const label = normalizeRel(abs) || abs;
  return parseImpactFiles(fs.readFileSync(abs, 'utf8'), label);
}

function collectArchivedSpecs(specsDir) {
  const out = [];
  if (!fs.existsSync(specsDir)) return out;
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(abs);
      } else if (ent.isFile() && ent.name.endsWith('.md') && ent.name !== 'index.md') {
        out.push(abs);
      }
    }
  }
  walk(specsDir);
  return out.sort((a, b) => a.localeCompare(b));
}

function resolveSpecsDir(dir) {
  return path.resolve(process.cwd(), dir || DEFAULT_CONTEXT_DIR);
}

function loadArchivedSpecs(specsDir) {
  const dir = resolveSpecsDir(specsDir);
  if (!fs.existsSync(dir)) {
    throw new Error(`找不到 CONTEXT 目录: ${normalizeRel(dir) || dir}`);
  }
  const out = [];
  for (const abs of collectArchivedSpecs(dir)) {
    const rel = path.relative(dir, abs).split(path.sep).join('/');
    const parts = rel.split('/');
    if (parts.length !== 2) {
      throw new Error(`${rel}: 归档条目必须位于 CONTEXT/<模块>/<feature>.md`);
    }
    const parsed = parseSpecFile(abs);
    out.push({
      spec: rel,
      module: parts[0],
      files: parsed.files,
      title: readSpecTitle(abs),
    });
  }
  return out;
}

function takeFlags(args) {
  const flags = { json: false, stdin: false, dir: DEFAULT_CONTEXT_DIR };
  const rest = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--json') flags.json = true;
    else if (a === '--stdin') flags.stdin = true;
    else if (a === '--dir') {
      const dir = args[i + 1];
      if (!dir) throw new Error('--dir 需要目录');
      flags.dir = dir;
      i += 1;
    } else {
      rest.push(a);
    }
  }
  return { flags, rest };
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

function querySpecs(specsDir, files, { json = false } = {}) {
  const specs = loadArchivedSpecs(specsDir);
  const normalized = [...new Set(files.map(normalizeRel).filter(Boolean))];
  const matches = [];
  for (const entry of specs) {
    const patterns = Array.isArray(entry.files) ? entry.files : [];
    const hit = [];
    for (const changed of normalized) {
      for (const pattern of patterns) {
        if (matchesInput(changed, pattern)) {
          hit.push({ file: changed, pattern });
        }
      }
    }
    if (hit.length > 0) {
      matches.push({
        spec: entry.spec,
        module: entry.module,
        title: entry.title,
        hit,
      });
    }
  }
  if (json) {
    process.stdout.write(`${JSON.stringify({ files: normalized, matches }, null, 2)}\n`);
    return;
  }
  if (matches.length === 0) {
    process.stdout.write('NO_MATCH\n');
    return;
  }
  for (const match of matches) {
    process.stdout.write(`${match.spec}${match.title ? ` :: ${match.title}` : ''}\n`);
    for (const h of match.hit) {
      process.stdout.write(`  ${h.file} <= ${h.pattern}\n`);
    }
  }
}

function listSpecs(specsDir, { json = false } = {}) {
  const specs = loadArchivedSpecs(specsDir);
  if (json) {
    process.stdout.write(`${JSON.stringify(specs, null, 2)}\n`);
    return;
  }
  if (specs.length === 0) {
    process.stdout.write('EMPTY\n');
    return;
  }
  for (const entry of specs) {
    const files = Array.isArray(entry.files) ? entry.files.join(', ') : '';
    process.stdout.write(`${entry.spec}\t${entry.module}\t${files}\n`);
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

    if (cmd === 'list') {
      const { flags } = takeFlags(rest);
      listSpecs(flags.dir, { json: flags.json });
      return;
    }

    if (cmd === 'query') {
      const { flags, rest: files } = takeFlags(rest);
      if (flags.stdin) {
        const input = fs.readFileSync(0, 'utf8');
        files.push(...input.split(/\r?\n/).map((x) => x.trim()).filter(Boolean));
      }
      if (files.length === 0) throw new Error('query 需要至少一个文件路径，或用 --stdin 传入');
      querySpecs(flags.dir, files, { json: flags.json });
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
