#!/usr/bin/env node
// 零依赖推送脚本：扫描库内 Markdown，本地严格校验 frontmatter，整库全量推送到 docs-server 服务端。
// 仅使用 Node 内置能力（fs / path / 全局 fetch），Node >= 24 直接运行。
//
// 用法（环境变量写入 .env 后用 --env-file 加载，该参数为 Node 内置，全平台通用）：
//   node --env-file=.env scripts/push-docs.mjs [--verify] [文档根目录，默认 agent-docs/]
//   node --env-file=.env scripts/push-docs.mjs --clear   # 下架整库
// 必填环境变量：DOCS_SERVER_URL / DOCS_TOKEN / DOCS_LIBRARY
//
// 本地校验对齐服务端严格 YAML 的已知拒绝项（BOM、分隔线行尾空格、重复键、未引号的
//「: 」与「 #」、引号未闭合、title 缺失或为空），全部文件校验完一次性报全部错误，不发请求。

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const USAGE = `用法：
  node --env-file=.env scripts/push-docs.mjs [--verify] [文档根目录，默认 agent-docs/]
  node --env-file=.env scripts/push-docs.mjs --clear`;

const PUSH_TIMEOUT_MS = 60_000;
const VERIFY_TIMEOUT_MS = 10_000;

// 输出错误并以非零码退出
function fail(message) {
  console.error(`错误：${message}`);
  process.exit(1);
}

// describeError 展开 fetch 失败的 cause（如 ENOTFOUND / ECONNREFUSED），便于定位地址与网络问题。
function describeError(err) {
  const cause = err.cause?.code ?? err.cause?.message;
  return cause ? `${err.message}（${cause}）` : err.message;
}

// 校验必填环境变量
export function readEnv(env = process.env) {
  const required = ['DOCS_SERVER_URL', 'DOCS_TOKEN', 'DOCS_LIBRARY'];
  const missing = required.filter((name) => !env[name]);
  if (missing.length > 0) {
    fail(`缺少必填环境变量：${missing.join('、')}`);
  }
  return {
    serverUrl: env.DOCS_SERVER_URL.replace(/\/+$/, ''),
    token: env.DOCS_TOKEN,
    library: env.DOCS_LIBRARY,
  };
}

export function parseArgs(argv) {
  const flags = { clear: false, verify: false };
  const positionals = [];
  for (const arg of argv) {
    if (arg === '--clear') {
      flags.clear = true;
    } else if (arg === '--verify') {
      flags.verify = true;
    } else if (arg.startsWith('--')) {
      fail(`无法识别的选项：${arg}\n${USAGE}`);
    } else {
      positionals.push(arg);
    }
  }
  if (positionals.length > 1) {
    fail(USAGE);
  }
  return { flags, root: positionals[0] ?? 'agent-docs' };
}

// 递归收集目录下全部 .md 文件，返回相对 root 的路径（统一用 / 分隔）。
// 跳过隐藏目录/文件与 node_modules，避免误把依赖里的 README 推上服务端。
export async function collectMarkdownFiles(root) {
  const files = [];

  async function walk(dir, prefix) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      fail(`无法读取文档目录：${dir}`);
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name.startsWith('.') || (entry.isDirectory() && entry.name === 'node_modules')) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push({ fullPath, relPath });
      }
    }
  }

  await walk(root, '');
  return files;
}

// validateFrontmatter 严格校验 frontmatter 并提取 title，返回 { title, errors }。
// errors 为该文件全部问题（不带路径前缀），空数组即通过；校验规则对齐服务端实现：
// 开头必须是首字节起的 `---` 独占一行，结尾分隔线独占一行且行尾无空格，无 BOM；
// 顶层「键: 值」行的重复键、未引号值内的「: 」「 #」、引号未闭合均会被服务端拒绝或截断。
export function validateFrontmatter(content) {
  const errors = [];
  let title;

  if (content.charCodeAt(0) === 0xfeff) {
    errors.push('文件以 BOM 开头，服务端会拒绝；用无 BOM 的 UTF-8 重新保存');
    return { title, errors };
  }
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    errors.push('开头不是独占一行的 ---（不得有前导空行、BOM 或分隔线行尾空格），视为没有 frontmatter');
    return { title, errors };
  }

  const lines = content.split(/\r?\n/);
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) {
    errors.push('frontmatter 缺少独占一行的结尾分隔线 ---（行尾不能有空格）');
    return { title, errors };
  }

  const seen = new Set();
  for (const line of lines.slice(1, end)) {
    if (line.trim() === '' || line.trimStart().startsWith('#') || /^\s/.test(line)) {
      continue; // 空行、注释、嵌套行不校验（嵌套序列是合法 YAML，本地不解析）
    }
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) {
      errors.push(`无法解析的行：${line}`);
      continue;
    }
    const key = kv[1];
    if (seen.has(key)) {
      errors.push(`键 "${key}" 重复，服务端严格 YAML 会拒绝`);
      continue;
    }
    seen.add(key);

    let value = kv[2].trim();
    const quote = value[0];
    const quoted = (quote === '"' || quote === "'") && value.length >= 2 && value.endsWith(quote);
    if ((quote === '"' || quote === "'") && !quoted) {
      errors.push(`键 "${key}" 的值引号未闭合`);
      continue;
    }
    if (!quoted && value.includes(': ')) {
      errors.push(`键 "${key}" 的值含「: 」，须用双引号包裹整个值`);
      continue;
    }
    if (!quoted && value.includes(' #')) {
      errors.push(`键 "${key}" 的值含「 #」，之后的内容会被服务端当注释丢弃；须用双引号包裹整个值`);
      continue;
    }
    if (quoted) {
      value = value.slice(1, -1);
    }
    if (key === 'title' && title === undefined) {
      if (value.startsWith('[') || value.startsWith('{')) {
        errors.push('title 不能是列表或对象，须是字符串');
        continue;
      }
      title = value;
    }
  }

  if (title !== undefined && title === '') {
    errors.push('title 为空');
  }
  return { title, errors };
}

// fetchJson 发起带超时的请求，返回 { status, ok, body }。
async function fetchText(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    if (err?.name === 'TimeoutError') {
      fail(`请求超时：${url}。服务端无响应，勿盲目重试`);
    }
    fail(`请求推送接口失败：${describeError(err)}。核对 DOCS_SERVER_URL 与网络连通性`);
  }
  const body = await response.text();
  return { status: response.status, ok: response.ok, body };
}

// verifyDocuments 逐篇按 title 搜索，验证推送结果在服务端可检索；返回搜不到的文档列表。
async function verifyDocuments({ serverUrl, library }, docs) {
  const missing = [];
  for (const doc of docs) {
    const params = new URLSearchParams({ q: doc.title, library, limit: '20' });
    const { ok, status, body } = await fetchText(`${serverUrl}/api/v1/search?${params}`, {
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    if (!ok) {
      fail(`验证请求失败（HTTP ${status}）：${body}`);
    }
    let results;
    try {
      ({ results } = JSON.parse(body));
    } catch {
      fail(`验证响应不是合法 JSON：${body.slice(0, 200)}`);
    }
    if (!Array.isArray(results) || !results.some((r) => r.path === doc.path)) {
      missing.push(doc.relPath);
    }
  }
  return missing;
}

async function main() {
  const env = readEnv();
  const { flags, root } = parseArgs(process.argv.slice(2));

  if (flags.clear) {
    const { ok, status, body } = await fetchText(
      `${env.serverUrl}/api/v1/libraries/${encodeURIComponent(env.library)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${env.token}` },
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      },
    );
    if (!ok) {
      fail(`下架失败（HTTP ${status}）：${body}`);
    }
    console.log(`已下架：库 ${env.library}（该库全部文档与索引已从服务端删除）`);
    return;
  }

  const files = await collectMarkdownFiles(root);
  if (files.length === 0) {
    fail(`文档目录 ${root} 下没有任何 .md 文件`);
  }

  const documents = [];
  const invalid = [];
  for (const { fullPath, relPath } of files) {
    const content = await readFile(fullPath, 'utf8');
    const { title, errors } = validateFrontmatter(content);
    for (const message of errors) {
      invalid.push(`文档 ${relPath}：${message}`);
    }
    if (errors.length === 0 && title) {
      documents.push({ path: relPath, title, content });
    }
  }
  if (invalid.length > 0) {
    // 聚合全部文件的校验错误一次报完，避免修一篇推一次的循环。
    fail(`本地校验失败（未发出请求），共 ${invalid.length} 处：\n${invalid.join('\n')}\n（无 title 也在此列：frontmatter 必须有非空 title）`);
  }

  const { ok, status, body } = await fetchText(
    `${env.serverUrl}/api/v1/libraries/${encodeURIComponent(env.library)}/documents`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.token}`,
      },
      body: JSON.stringify(documents.map(({ path: p, content }) => ({ path: p, content }))),
      signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
    },
  );
  if (!ok) {
    fail(`推送失败（HTTP ${status}）：${body}`);
  }

  console.log(`推送成功：库 ${env.library} 共 ${documents.length} 篇文档`);
  if (!flags.verify) {
    return;
  }

  const missing = await verifyDocuments(env, documents);
  if (missing.length > 0) {
    fail(`验证失败，以下 ${missing.length} 篇推送后搜不到（服务端分词或索引可能异常，报给管理员）：\n${missing.join('\n')}`);
  }
  console.log(`验证通过：${documents.length}/${documents.length} 篇可检索`);
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  await main();
}
