#!/usr/bin/env node
// 零依赖查询脚本：经 REST 发现库、搜索、取文档。
// 仅使用 Node 内置能力（全局 fetch），Node >= 24 直接运行。
//
// 用法（服务地址读环境变量 DOCS_SERVER_URL，可写入 .env 后用 --env-file 加载；该参数为 Node 内置，全平台通用）：
//   node --env-file=.env query.mjs libraries
//   node --env-file=.env query.mjs search --q <关键词> [--library <slug>]
//   node --env-file=.env query.mjs get --library <slug> --path <path> [--section <章节>]

const USAGE = `用法：
  query.mjs libraries
  query.mjs search --q <关键词> [--library <slug>]
  query.mjs get --library <slug> --path <path> [--section <章节>]`;

// 输出错误并以非零码退出
function fail(message) {
  console.error(`错误：${message}`);
  process.exit(1);
}

// 服务地址只读 DOCS_SERVER_URL，去掉结尾斜杠
function readServerUrl() {
  const raw = process.env.DOCS_SERVER_URL;
  if (!raw) {
    fail('缺少必填环境变量：DOCS_SERVER_URL');
  }
  return raw.replace(/\/+$/, '');
}

function parseCli(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    let name;
    let value;
    if (eq !== -1) {
      name = arg.slice(2, eq);
      value = arg.slice(eq + 1);
    } else {
      name = arg.slice(2);
      value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        fail(`选项 --${name} 需要参数\n${USAGE}`);
      }
      i += 1;
    }
    if (!name) {
      fail(`无法识别的选项：${arg}\n${USAGE}`);
    }
    flags[name] = value;
  }
  return { flags, positionals };
}

function requireFlag(flags, name) {
  const value = flags[name];
  if (!value) {
    fail(`缺少必填选项 --${name}\n${USAGE}`);
  }
  return value;
}

function rejectUnknownFlags(flags, allowed) {
  for (const name of Object.keys(flags)) {
    if (!allowed.has(name)) {
      fail(`无法识别的选项：--${name}\n${USAGE}`);
    }
  }
}

function encodeDocPath(docPath) {
  return docPath.split('/').map(encodeURIComponent).join('/');
}

function buildUrl(serverUrl, command, flags) {
  if (command === 'libraries') {
    rejectUnknownFlags(flags, new Set());
    return `${serverUrl}/api/v1/libraries`;
  }
  if (command === 'search') {
    rejectUnknownFlags(flags, new Set(['q', 'library']));
    const params = new URLSearchParams();
    params.set('q', requireFlag(flags, 'q'));
    if (flags.library) {
      params.set('library', flags.library);
    }
    return `${serverUrl}/api/v1/search?${params}`;
  }
  if (command === 'get') {
    rejectUnknownFlags(flags, new Set(['library', 'path', 'section']));
    const library = requireFlag(flags, 'library');
    const docPath = requireFlag(flags, 'path');
    let url = `${serverUrl}/api/v1/libraries/${encodeURIComponent(library)}/documents/${encodeDocPath(docPath)}`;
    if (flags.section) {
      url += `?${new URLSearchParams({ section: flags.section })}`;
    }
    return url;
  }
  fail(`未知子命令：${command || '(空)'}\n${USAGE}`);
}

async function requestJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    fail(`请求失败：${err.message}`);
  }
  const body = await response.text();
  if (response.status < 200 || response.status >= 300) {
    fail(`请求失败（HTTP ${response.status}）：${body}`);
  }
  process.stdout.write(body.endsWith('\n') ? body : `${body}\n`);
}

const { flags, positionals } = parseCli(process.argv.slice(2));
if (positionals.length !== 1) {
  fail(USAGE);
}
await requestJson(buildUrl(readServerUrl(), positionals[0], flags));
