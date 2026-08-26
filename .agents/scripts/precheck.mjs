#!/usr/bin/env node
// setup 完成判定。检查项以本脚本为唯一定义：
// 各类：根 AGENTS.md 与当前类别模板一致；PROJECT.md；CONTEXT/index.md；spec-files.mjs；
//       .agents/cooking/；.gitignore 忽略 cooking 且不忽略 docs/scripts
// 仅代码类：ARCHITECTURE.md、DEV-STANDARDS.md、CODE-MAP.md、SMELLS.md
// 用法（以目标仓库根目录为工作目录）：
//   node .agents/scripts/precheck.mjs
// 全部通过：输出 PASS 与项目类别，退出码 0；任一不满足：输出 FAIL、逐项缺失项与 setup 提示，退出码 1。
// 自包含：根 AGENTS.md 类别模板内嵌于此；references/root-agents-*.md 变更时需同步更新。

import fs from 'node:fs';

const ROOT_AGENTS_LINES = {
  代码: [
    '# AGENTS',
    'Agent 入口索引。详细内容在 `.agents/docs/`，**按需读取，禁止一次加载全部**。',
    '## 文档',
    '| 文件 | 何时读 | 何时更新 |',
    '| --- | --- | --- |',
    '| `.agents/docs/PROJECT.md` | 需要知道项目类别与仓库结构 | 仅 setup：类别、组织结构、全栈形态变了 |',
    '| `.agents/docs/ARCHITECTURE.md` | 业务/技术架构、技术栈 | 仅 setup：换栈、改分层、加/删应用边界。implement 禁止改 |',
    '| `.agents/docs/DEV-STANDARDS.md` | 写代码、做 review | 仅 setup：规范或偏好变了 |',
    '| `.agents/docs/SMELLS.md` | 写代码时按坏味道边写边收；review 对照 | 仅 setup：技能包模板变了 |',
    '| `.agents/docs/CODE-MAP.md` | 定位模块；按模块/路径检索，禁止全文加载 | implement / sync-context：模块表增删行，或某模块路径、入口、职责、依赖边变了。只改相关行。架构级变化先 setup 改 ARCHITECTURE，再由 setup 同步本文件。模块内部加文件不算。 |',
    '| `.agents/docs/CONTEXT/index.md` | 先读模块索引，再打开当前条目。禁止加载整个 CONTEXT。按变更路径定位：运行 `node .agents/scripts/spec-files.mjs query <路径...>` | archive：新模块入库；sync-context：改动推翻已有条目或新增未入库能力 |',
  ],
  非代码: [
    '# AGENTS',
    'Agent 入口索引。详细内容在 `.agents/docs/`，**按需读取，禁止一次加载全部**。',
    '## 文档',
    '| 文件 | 何时读 | 何时更新 |',
    '| --- | --- | --- |',
    '| `.agents/docs/PROJECT.md` | 需要知道项目类别与仓库结构 | 仅 setup：类别、组织结构变了 |',
    '| `.agents/docs/CONTEXT/index.md` | 先读模块索引，再打开当前条目。禁止加载整个 CONTEXT。按变更路径定位：运行 `node .agents/scripts/spec-files.mjs query <路径...>` | archive：新模块入库；sync-context：改动推翻已有条目或新增未入库能力 |',
  ],
};

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

// 模板每行（trim 后）都出现在目标 AGENTS.md 中即视为一致；目标多出的短注不影响判定
function agentsTemplateMissing(templateLines) {
  const actual = new Set(
    fs.readFileSync('AGENTS.md', 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
  return templateLines.filter((line) => !actual.has(line));
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

  if (!fs.existsSync('AGENTS.md')) {
    failures.push('根 AGENTS.md 不存在');
  } else if (category && agentsTemplateMissing(ROOT_AGENTS_LINES[category]).length > 0) {
    failures.push(`根 AGENTS.md 与「${category}」类别模板不一致`);
  }

  for (const file of ['.agents/docs/CONTEXT/index.md', '.agents/scripts/spec-files.mjs']) {
    if (!fs.existsSync(file)) failures.push(`${file} 不存在`);
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
