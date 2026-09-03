#!/usr/bin/env node
// setup 完成判定。检查项以本脚本为唯一定义：
// 各类：根 AGENTS.md 与当前类别模板一致；PROJECT.md；.agents/scripts/ 下的脚本与模板齐全；
//       .agents/cooking/；.gitignore 忽略 cooking 且不忽略 docs/scripts
// 仅代码类：ARCHITECTURE.md、DEV-STANDARDS.md、CODE-MAP.md、SMELLS.md
// 用法（以目标仓库根目录为工作目录）：
//   node .agents/scripts/precheck.mjs
// 全部通过：输出 PASS 与项目类别，退出码 0；任一不满足：输出 FAIL、逐项缺失项与 setup 提示，退出码 1。
// 根 AGENTS.md 的类别模板 = 与本脚本同目录的 root-agents-code.md / root-agents-non-code.md，
// 由 setup 整目录复制而来，是唯一定义，不在脚本里另存一份。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));

const ROOT_AGENTS_TEMPLATE = {
  代码: 'root-agents-code.md',
  非代码: 'root-agents-non-code.md',
};

const REQUIRED_SCRIPTS = ['spec-files.mjs', 'cooking.mjs'];

const CODE_ONLY_DOCS = [
  '.agents/docs/ARCHITECTURE.md',
  '.agents/docs/DEV-STANDARDS.md',
  '.agents/docs/CODE-MAP.md',
  '.agents/docs/SMELLS.md',
];

process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0);
});

function readCategory() {
  const content = fs.readFileSync('.agents/docs/PROJECT.md', 'utf8');
  const match = content.match(/类别[：:]\s*(\S+)/);
  if (!match) return null;
  if (match[1].includes('非代码')) return '非代码';
  if (match[1].includes('代码')) return '代码';
  return null;
}

// 比较前归一化：去掉全部空白，3 个以上连字符折叠为 3 个。
// markdown formatter 会给表格补空格对齐列宽、把分隔行填成整列连字符，这些不算改动。
function normalizeLine(line) {
  return line.replace(/\s+/g, '').replace(/-{3,}/g, '---');
}

function normalizedLines(content) {
  return content.split(/\r?\n/).map(normalizeLine).filter(Boolean);
}

// 模板每行（归一化后）都出现在目标 AGENTS.md 中即视为一致；目标多出的行不影响判定
function agentsTemplateMissing(templateFile) {
  const template = normalizedLines(fs.readFileSync(templateFile, 'utf8'));
  const actual = new Set(normalizedLines(fs.readFileSync('AGENTS.md', 'utf8')));
  return template.filter((line) => !actual.has(line));
}

function gitignoreToRegex(pattern) {
  let out = '^';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') {
      if (pattern[i + 2] === '/') {
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
      out += /[\\^$.*+?()[\]{}|]/.test(c) ? `\\${c}` : c;
    }
  }
  return new RegExp(`${out}$`);
}

function parseGitignore(content) {
  const rules = [];
  for (const raw of content.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    let negated = false;
    if (line.startsWith('!')) {
      negated = true;
      line = line.slice(1).trim();
    }
    line = line.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!line) continue;
    rules.push({ negated, scoped: line.includes('/'), regex: gitignoreToRegex(line) });
  }
  return rules;
}

// 目录被忽略 = 其自身或任一祖先前缀被规则命中；按 gitignore 语义，后面的规则覆盖前面的
function ignores(rules, dir) {
  const prefixes = [];
  const segs = dir.split('/');
  for (let i = 1; i <= segs.length; i += 1) prefixes.push(segs.slice(0, i).join('/'));
  let ignored = false;
  for (const rule of rules) {
    for (const prefix of prefixes) {
      const candidate = rule.scoped ? prefix : prefix.split('/').pop();
      if (rule.regex.test(candidate)) {
        ignored = !rule.negated;
        break;
      }
    }
  }
  return ignored;
}

function main() {
  const failures = [];

  let category = null;
  if (!fs.existsSync('.agents/docs/PROJECT.md')) {
    failures.push('.agents/docs/PROJECT.md 不存在（仓库未 setup）');
  } else {
    category = readCategory();
    if (!category) {
      failures.push('.agents/docs/PROJECT.md 未写明有效类别（代码 / 非代码）');
    }
  }

  let templateFile = category ? path.join(SCRIPTS_DIR, ROOT_AGENTS_TEMPLATE[category]) : null;
  if (templateFile && !fs.existsSync(templateFile)) {
    failures.push(`${ROOT_AGENTS_TEMPLATE[category]} 不在脚本目录（setup 更新模式重新复制 .agents/scripts/）`);
    templateFile = null;
  }

  if (!fs.existsSync('AGENTS.md')) {
    failures.push('根 AGENTS.md 不存在');
  } else if (templateFile && agentsTemplateMissing(templateFile).length > 0) {
    failures.push(`根 AGENTS.md 与「${category}」类别模板不一致`);
  }

  for (const script of REQUIRED_SCRIPTS) {
    if (!fs.existsSync(`.agents/scripts/${script}`)) {
      failures.push(`.agents/scripts/${script} 不存在（setup 更新模式重新复制 .agents/scripts/）`);
    }
  }

  if (!fs.existsSync('.agents/cooking')) {
    failures.push('.agents/cooking/ 不存在');
  }

  if (!fs.existsSync('.gitignore')) {
    failures.push('.gitignore 不存在（需忽略 .agents/cooking/）');
  } else {
    const rules = parseGitignore(fs.readFileSync('.gitignore', 'utf8'));
    if (!ignores(rules, '.agents/cooking')) {
      failures.push('.gitignore 未忽略 .agents/cooking/');
    }
    for (const dir of ['.agents/docs', '.agents/scripts']) {
      if (ignores(rules, dir)) {
        failures.push(`.gitignore 不应忽略 ${dir}/`);
      }
    }
  }

  if (category === '代码') {
    for (const doc of CODE_ONLY_DOCS) {
      if (!fs.existsSync(doc)) failures.push(`${doc} 不存在（代码类必须有）`);
    }
  }

  if (failures.length === 0) {
    process.stdout.write(`PASS\n类别：${category}\n`);
    return;
  }
  process.stdout.write('FAIL\n缺失项：\n');
  for (const item of failures) {
    process.stdout.write(`- ${item}\n`);
  }
  process.stdout.write('提示：执行 setup 完成初始化或修复上述缺失项。\n');
  process.exit(1);
}

main();
