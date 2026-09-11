#!/usr/bin/env node
// 零依赖查询脚本：经 REST 发现库、搜索、取文档目录与内容。
// 仅使用 Node 内置能力（全局 fetch），Node >= 24 直接运行。
//
// 用法（服务地址读环境变量 DOCS_SERVER_URL，可写入 .env 后用 --env-file 加载；该参数为 Node 内置，全平台通用）：
//   node --env-file=.env query.mjs libraries
//   node --env-file=.env query.mjs search --q <关键词> [--library <slug>] [--limit 1~50]
//   node --env-file=.env query.mjs get --library <slug> --path <path> [--section <章节>]
//   node --env-file=.env query.mjs toc --library <slug> --path <path>
//
// 注意：--env-file 按当前工作目录解析相对路径，命令须在仓库根目录（.env 所在处）执行，
// 本脚本路径写成绝对路径或相对当前目录的路径，不要 cd 到技能目录再跑。

import { pathToFileURL } from 'node:url';

const USAGE = `用法：
  query.mjs libraries
  query.mjs search --q <关键词> [--library <slug>] [--limit 1~50]
  query.mjs get --library <slug> --path <path> [--section <章节>]
  query.mjs toc --library <slug> --path <path>`;

// 请求超时：服务端挂起时快速失败，避免 agent 工具调用被拖住。
const REQUEST_TIMEOUT_MS = 10_000;

// 输出错误并以非零码退出
function fail(message) {
  console.error(`错误：${message}`);
  process.exit(1);
}

// 服务地址只读 DOCS_SERVER_URL，去掉结尾斜杠，校验协议前缀
export function readServerUrl(env = process.env) {
  const raw = env.DOCS_SERVER_URL;
  if (!raw) {
    fail('缺少必填环境变量：DOCS_SERVER_URL');
  }
  const url = raw.replace(/\/+$/, '');
  if (!/^https?:\/\//.test(url)) {
    fail(`DOCS_SERVER_URL 须以 http:// 或 https:// 开头，实际值：${raw}`);
  }
  return url;
}

export function parseCli(argv) {
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

export function encodeDocPath(docPath) {
  return docPath.split('/').map(encodeURIComponent).join('/');
}

export function buildUrl(serverUrl, command, flags) {
  if (command === 'libraries') {
    rejectUnknownFlags(flags, new Set());
    return `${serverUrl}/api/v1/libraries`;
  }
  if (command === 'search') {
    rejectUnknownFlags(flags, new Set(['q', 'library', 'limit']));
    const params = new URLSearchParams();
    params.set('q', requireFlag(flags, 'q'));
    if (flags.library) {
      params.set('library', flags.library);
    }
    if (flags.limit !== undefined) {
      if (!/^[1-9]\d*$/.test(flags.limit)) {
        fail(`选项 --limit 须为正整数，实际值：${flags.limit}`);
      }
      params.set('limit', flags.limit);
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
  if (command === 'toc') {
    rejectUnknownFlags(flags, new Set(['library', 'path']));
    const library = requireFlag(flags, 'library');
    const docPath = requireFlag(flags, 'path');
    return `${serverUrl}/api/v1/libraries/${encodeURIComponent(library)}/documents/${encodeDocPath(docPath)}?toc=1`;
  }
  fail(`未知子命令：${command || '(空)'}\n${USAGE}`);
}

// describeError 展开 fetch 失败的 cause（如 ENOTFOUND / ECONNREFUSED），便于定位地址与网络问题。
function describeError(err) {
  const cause = err.cause?.code ?? err.cause?.message;
  return cause ? `${err.message}（${cause}）` : err.message;
}

export async function requestJson(url) {
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    if (err?.name === 'TimeoutError') {
      fail(`请求超时（${REQUEST_TIMEOUT_MS / 1000} 秒）：${url}。服务端无响应，勿盲目重试，先向用户或管理员反馈`);
    }
    fail(`请求失败：${describeError(err)}。核对 DOCS_SERVER_URL 与网络连通性`);
  }
  const body = await response.text();
  if (response.status < 200 || response.status >= 300) {
    fail(`请求失败（HTTP ${response.status}）：${body}`);
  }
  process.stdout.write(body.endsWith('\n') ? body : `${body}\n`);
}

async function main() {
  const { flags, positionals } = parseCli(process.argv.slice(2));
  if (positionals.length !== 1) {
    fail(USAGE);
  }
  await requestJson(buildUrl(readServerUrl(), positionals[0], flags));
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  await main();
}
