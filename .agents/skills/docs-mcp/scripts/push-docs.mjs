#!/usr/bin/env node
// 零依赖推送脚本：扫描库内 Markdown，解析 frontmatter，整库全量推送到 docs-mcp 服务端。
// 仅使用 Node 内置能力（fs / path / 全局 fetch），Node >= 18 直接运行。
//
// 用法：
//   DOCS_MCP_SERVER_URL=http://localhost:8080 \
//   DOCS_MCP_TOKEN=<推送令牌> \
//   DOCS_MCP_LIBRARY=<库 slug> \
//   node scripts/push-docs.mjs [文档根目录，默认 docs/]

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

// 输出错误并以非零码退出
function fail(message) {
  console.error(`错误：${message}`)
  process.exit(1)
}

// 校验必填环境变量
function readEnv() {
  const required = ['DOCS_MCP_SERVER_URL', 'DOCS_MCP_TOKEN', 'DOCS_MCP_LIBRARY']
  const missing = required.filter((name) => !process.env[name])
  if (missing.length > 0) {
    fail(`缺少必填环境变量：${missing.join('、')}`)
  }
  return {
    serverUrl: process.env.DOCS_MCP_SERVER_URL.replace(/\/+$/, ''),
    token: process.env.DOCS_MCP_TOKEN,
    library: process.env.DOCS_MCP_LIBRARY
  }
}

// 递归收集目录下全部 .md 文件，返回相对 root 的路径（统一用 / 分隔）
async function collectMarkdownFiles(root) {
  const files = []

  async function walk(dir, prefix) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      fail(`无法读取文档目录：${dir}`)
    }
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        await walk(fullPath, relPath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push({ fullPath, relPath })
      }
    }
  }

  await walk(root, '')
  return files
}

// 解析 YAML frontmatter，提取 title（必填）/ description（可选），其余字段忽略。
// frontmatter 形如文件开头的 "---\n...\n---" 块，仅支持顶层「键: 值」行。
function parseFrontmatter(content, relPath) {
  const meta = { title: undefined, description: undefined }
  const match = content.match(/^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  if (!match) {
    return meta
  }
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s*(#|$)/.test(line) || /^\s/.test(line)) {
      continue // 注释、空行、嵌套行不解析
    }
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!kv) {
      continue
    }
    const key = kv[1]
    let value = kv[2].trim()
    const quote = value[0]
    if ((quote === '"' || quote === "'") && value.length >= 2 && value.endsWith(quote)) {
      value = value.slice(1, -1)
    }
    if (key === 'title' && !meta.title) {
      meta.title = value
    } else if (key === 'description' && !meta.description) {
      meta.description = value
    }
  }
  if (meta.title !== undefined && meta.title === '') {
    fail(`文档 ${relPath} 的 frontmatter 中 title 为空`)
  }
  return meta
}

async function main() {
  const { serverUrl, token, library } = readEnv()
  const root = process.argv[2] ?? 'docs'

  const files = await collectMarkdownFiles(root)
  if (files.length === 0) {
    fail(`文档目录 ${root} 下没有任何 .md 文件`)
  }

  const documents = []
  for (const { fullPath, relPath } of files) {
    const content = await readFile(fullPath, 'utf8')
    // 本地校验 title 存在，缺失直接失败，不发出请求
    if (!parseFrontmatter(content, relPath).title) {
      fail(`文档 ${relPath} 缺少 frontmatter 或其中没有 title 字段`)
    }
    documents.push({ path: relPath, content })
  }

  let response
  try {
    response = await fetch(`${serverUrl}/api/v1/libraries/${library}/documents`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(documents)
    })
  } catch (err) {
    fail(`请求推送接口失败：${err.message}`)
  }

  const body = await response.text()
  if (!response.ok) {
    fail(`推送失败（HTTP ${response.status}）：${body}`)
  }

  console.log(`推送成功：库 ${library} 共 ${documents.length} 篇文档`)
}

await main()
