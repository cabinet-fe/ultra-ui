#!/usr/bin/env node
// cooking 阶段状态机。tasks/Pn.md 的「前置任务 / 状态」只经本脚本读写，
// 状态枚举与转移规则以本脚本为唯一定义，各技能不要手改状态行。
// 用法（以目标仓库根目录为工作目录）：
//   node .agents/scripts/cooking.mjs status <feature>
//     每个阶段一行：前置 / 实现 / 评审；再给出 可做（可并行 implement）、待评审、收尾、可归档
//   node .agents/scripts/cooking.mjs ready <feature>
//     只列现在可做的阶段 id，一行一个；没有则输出 无
//   node .agents/scripts/cooking.mjs set <feature> <Pn> 实现 <进行中|完成>
//   node .agents/scripts/cooking.mjs set <feature> <Pn> 评审 <通过|不通过>
// 转移：
//   实现  未开始→进行中（前置须全部 实现完成 且 评审通过）；进行中→完成（评审同时置回 未开始）；
//         完成→进行中 仅当 评审=不通过（返工）
//   评审  未开始|不通过→通过|不通过（须 实现=完成）；通过 之后不可再改（需求变了走 explore）
// 退出码：0 成功；1 文件 / 格式 / 转移错误；2 用法错误。

import fs from 'node:fs';
import path from 'node:path';

const IMPL_VALUES = ['未开始', '进行中', '完成'];
const REVIEW_VALUES = ['未开始', '通过', '不通过'];
const COOKING_DIR = path.join('.agents', 'cooking');

process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0);
});

function usage() {
  process.stderr.write(`usage:
  node cooking.mjs status <feature>
  node cooking.mjs ready <feature>
  node cooking.mjs set <feature> <Pn> 实现 <进行中|完成>
  node cooking.mjs set <feature> <Pn> 评审 <通过|不通过>
`);
}

function fail(msg) {
  throw new Error(msg);
}

function stageNumber(id) {
  return Number(id.slice(1));
}

function listFeatures() {
  if (!fs.existsSync(COOKING_DIR)) return [];
  return fs
    .readdirSync(COOKING_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function tasksDir(feature) {
  if (!feature || feature === '.' || feature === '..' || /[\\/]/.test(feature)) {
    fail('标识只能是 .agents/cooking/ 下的子目录名');
  }
  const dir = path.join(COOKING_DIR, feature, 'tasks');
  if (!fs.existsSync(dir)) {
    const features = listFeatures();
    const hint = features.length ? `；已有标识：${features.join('、')}` : '';
    fail(`找不到 ${dir}（先 to-tasks）${hint}`);
  }
  return dir;
}

// 按二级标题切段；保留行下标供报错与回写定位
function splitSections(lines) {
  const sections = new Map();
  let current = null;
  lines.forEach((text, index) => {
    const heading = text.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1];
      sections.set(current, []);
      return;
    }
    if (current) sections.get(current).push({ index, text });
  });
  return sections;
}

function parseStage(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const sections = splitSections(lines);
  const preLines = sections.get('前置任务');
  const statusLines = sections.get('状态');
  if (!preLines) fail(`${file}: 缺少「## 前置任务」`);
  if (!statusLines) fail(`${file}: 缺少「## 状态」`);

  const deps = new Set();
  for (const { index, text } of preLines) {
    const trimmed = text.trim();
    if (!trimmed) continue;
    if (!trimmed.startsWith('-')) fail(`${file}:${index + 1}: 「前置任务」每行须是「- 无」或「- P<n>」`);
    const body = trimmed.slice(1).trim();
    if (body === '无') continue;
    const ids = body.match(/P\d+/g);
    if (!ids) fail(`${file}:${index + 1}: 「前置任务」只能写阶段 id（P<n>）或 无`);
    ids.forEach((id) => deps.add(id));
  }

  const status = {};
  const statusIndex = {};
  for (const { index, text } of statusLines) {
    if (!text.trim()) continue;
    const match = text.match(/^\s*-\s*(实现|评审)\s*[：:]\s*(\S+)\s*$/);
    if (!match) fail(`${file}:${index + 1}: 「状态」每行须是「- 实现：<值>」或「- 评审：<值>」`);
    status[match[1]] = match[2];
    statusIndex[match[1]] = index;
  }
  if (!status.实现 || !status.评审) fail(`${file}: 「状态」须同时有「实现」和「评审」两行`);
  if (!IMPL_VALUES.includes(status.实现)) {
    fail(`${file}: 实现 只能是 ${IMPL_VALUES.join(' | ')}，现为「${status.实现}」`);
  }
  if (!REVIEW_VALUES.includes(status.评审)) {
    fail(`${file}: 评审 只能是 ${REVIEW_VALUES.join(' | ')}，现为「${status.评审}」`);
  }
  return { file, lines, deps: [...deps], status, statusIndex };
}

function assertAcyclic(stages) {
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'visiting') fail(`前置任务成环：${[...trail, id].join(' → ')}`);
    state.set(id, 'visiting');
    for (const dep of stages.get(id).deps) visit(dep, [...trail, id]);
    state.set(id, 'done');
  };
  for (const id of stages.keys()) visit(id, []);
}

function loadStages(feature) {
  const dir = tasksDir(feature);
  const files = fs.readdirSync(dir).filter((name) => /^P\d+\.md$/.test(name));
  if (files.length === 0) fail(`${dir} 下没有 P<n>.md`);
  const stages = new Map();
  for (const name of files) {
    const id = name.slice(0, -3);
    stages.set(id, { id, ...parseStage(path.join(dir, name)) });
  }
  for (const stage of stages.values()) {
    for (const dep of stage.deps) {
      if (dep === stage.id) fail(`${stage.file}: 前置不能是自己`);
      if (!stages.has(dep)) fail(`${stage.file}: 前置 ${dep} 不存在`);
    }
  }
  assertAcyclic(stages);
  return stages;
}

const isPassed = (stage) => stage.status.实现 === '完成' && stage.status.评审 === '通过';

function unmetDeps(stage, stages) {
  return stage.deps.filter((dep) => !isPassed(stages.get(dep)));
}

// 可做：前置全部通过，且本阶段未实现完成或评审不通过（返工）
// 待评审：实现完成、评审未开始；其中其它阶段都已通过的为收尾
function derive(stages) {
  const ordered = [...stages.values()].sort((a, b) => stageNumber(a.id) - stageNumber(b.id));
  const ready = [];
  const pending = [];
  const closing = [];
  for (const stage of ordered) {
    const needsWork = stage.status.实现 !== '完成' || stage.status.评审 === '不通过';
    if (needsWork && unmetDeps(stage, stages).length === 0) ready.push(stage.id);
    if (stage.status.实现 === '完成' && stage.status.评审 === '未开始') {
      pending.push(stage.id);
      if (ordered.every((other) => other === stage || isPassed(other))) closing.push(stage.id);
    }
  }
  return { ordered, ready, pending, closing, archivable: ordered.every(isPassed) };
}

const joinIds = (ids) => (ids.length ? ids.join('、') : '无');

function printStatus(feature) {
  const { ordered, ready, pending, closing, archivable } = derive(loadStages(feature));
  for (const stage of ordered) {
    process.stdout.write(
      `${stage.id}  前置：${joinIds(stage.deps)}  实现：${stage.status.实现}  评审：${stage.status.评审}\n`,
    );
  }
  process.stdout.write(`可做：${joinIds(ready)}\n`);
  process.stdout.write(`待评审：${joinIds(pending)}\n`);
  process.stdout.write(`收尾：${joinIds(closing)}\n`);
  process.stdout.write(`可归档：${archivable ? '是' : '否'}\n`);
}

function printReady(feature) {
  const { ready } = derive(loadStages(feature));
  process.stdout.write(ready.length ? `${ready.join('\n')}\n` : '无\n');
}

function nextImpl(stage, stages, value) {
  const { 实现: impl, 评审: review } = stage.status;
  if (!['进行中', '完成'].includes(value)) {
    fail('实现 只能置为 进行中 | 完成（未开始 是 to-tasks 的初始值，不可回退）');
  }
  if (value === impl) return {};
  if (value === '进行中') {
    if (impl === '完成' && review === '通过') fail(`${stage.id} 已评审通过，不可返工；需求变了请走 explore`);
    if (impl === '完成' && review === '未开始') fail(`${stage.id} 已实现完成、等待评审；返工须先评审为不通过`);
    const unmet = unmetDeps(stage, stages);
    if (unmet.length) fail(`${stage.id} 前置未满足：${unmet.join('、')} 须 实现完成 且 评审通过`);
    return { 实现: '进行中' };
  }
  if (impl !== '进行中') fail(`${stage.id} 实现 须先置为 进行中 再置 完成（现为 ${impl}）`);
  return review === '未开始' ? { 实现: '完成' } : { 实现: '完成', 评审: '未开始' };
}

function nextReview(stage, value) {
  const { 实现: impl, 评审: review } = stage.status;
  if (!['通过', '不通过'].includes(value)) {
    fail('评审 只能置为 通过 | 不通过（未开始 由 实现→完成 自动置回）');
  }
  if (value === review) return {};
  if (impl !== '完成') fail(`${stage.id} 实现 尚未完成（现为 ${impl}），不能评审`);
  if (review === '通过') fail(`${stage.id} 已评审通过，不可再改；需求变了请走 explore`);
  return { 评审: value };
}

function setStatus(feature, id, field, value) {
  const stages = loadStages(feature);
  const stage = stages.get(id);
  if (!stage) fail(`阶段 ${id} 不存在；已有：${[...stages.keys()].join('、')}`);

  let changes;
  if (field === '实现') changes = nextImpl(stage, stages, value);
  else if (field === '评审') changes = nextReview(stage, value);
  else fail('字段只能是 实现 | 评审');

  for (const [key, next] of Object.entries(changes)) {
    const index = stage.statusIndex[key];
    stage.lines[index] = stage.lines[index].replace(/^(\s*-\s*(?:实现|评审)\s*[：:]\s*)\S+/, `$1${next}`);
  }
  if (Object.keys(changes).length) fs.writeFileSync(stage.file, stage.lines.join('\n'));

  const status = { ...stage.status, ...changes };
  process.stdout.write(`${id}  实现：${status.实现}  评审：${status.评审}\n`);
}

function main() {
  const [cmd, feature, ...rest] = process.argv.slice(2);
  try {
    if (cmd === 'status' && feature && rest.length === 0) return printStatus(feature);
    if (cmd === 'ready' && feature && rest.length === 0) return printReady(feature);
    if (cmd === 'set' && feature && rest.length === 3 && /^P\d+$/.test(rest[0])) {
      return setStatus(feature, rest[0], rest[1], rest[2]);
    }
    usage();
    process.exit(2);
  } catch (err) {
    process.stderr.write(`ERROR: ${err.message}\n`);
    process.exit(1);
  }
}

main();
