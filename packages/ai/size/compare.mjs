#!/usr/bin/env node
// 下游典型导入的生产构建体积对比。
//
// 基线：本单位第一次改动 packages/ai 之前的提交（P1「移除无引用的公开导出」的父提交）。
// 精简后：当前工作树。
//
// 先 vp pack 打出 dist，再按 package.json 主入口的 import 条件做两组生产构建：
// 只导入 UAiMessageList；只导入 createOpenAITransport。
// 本目录不在 package.json 的 exports 与 files 里，不会随包发布。
//
// 用法：node packages/ai/size/compare.mjs

import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, parseAst } from 'vite'

const repoRoot = resolve(import.meta.dirname, '../../..')
const vpBin = join(repoRoot, 'node_modules/.bin/vp')

const scenarios = [
  {
    id: 'message-list',
    binding: 'UAiMessageList',
    entry: "import { UAiMessageList } from '@veltra/ai'\n\nexport default UAiMessageList\n"
  },
  {
    id: 'transport',
    binding: 'createOpenAITransport',
    entry:
      "import { createOpenAITransport } from '@veltra/ai'\n\nexport default createOpenAITransport\n"
  }
]

class CheckError extends Error {}

function fail(message) {
  throw new CheckError(message)
}

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) fail(`${cmd} ${args.join(' ')} 退出码 ${result.status}`)
}

function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (result.status !== 0) {
    fail((result.stderr || result.stdout || 'git 失败').trim())
  }
  return result.stdout.trim()
}

function baselineSha() {
  const listed = git(
    ['log', '--reverse', '--format=%H', '--grep=移除无引用的公开导出', '--', 'packages/ai'],
    repoRoot
  )
  const first = listed.split('\n').find((line) => line.length > 0)
  if (!first) fail('找不到本单位第一次改动 packages/ai 的提交')
  return git(['rev-parse', `${first}^`], repoRoot)
}

function linkDir(target, path) {
  if (existsSync(path)) return
  symlinkSync(target, path, 'dir')
}

function linkWorktreeDeps(worktree) {
  linkDir(join(repoRoot, 'node_modules'), join(worktree, 'node_modules'))
  const packagesDir = join(repoRoot, 'packages')
  for (const name of readdirSync(packagesDir)) {
    const target = join(packagesDir, name, 'node_modules')
    if (!existsSync(target)) continue
    linkDir(target, join(worktree, 'packages', name, 'node_modules'))
  }
}

function addWorktree(sha) {
  const dir = join(tmpdir(), `ultra-ui-ai-slim-${sha.slice(0, 12)}`)
  const listed = git(['worktree', 'list', '--porcelain'], repoRoot)
  if (listed.includes(`worktree ${dir}`)) {
    run('git', ['worktree', 'remove', '--force', dir], repoRoot)
  }
  rmSync(dir, { recursive: true, force: true })
  run('git', ['worktree', 'add', '--detach', dir, sha], repoRoot)
  linkWorktreeDeps(dir)
  return dir
}

function removeWorktree(dir) {
  if (!dir) return
  spawnSync('git', ['worktree', 'remove', '--force', dir], { cwd: repoRoot, stdio: 'ignore' })
  rmSync(dir, { recursive: true, force: true })
  spawnSync('git', ['worktree', 'prune'], { cwd: repoRoot, stdio: 'ignore' })
}

function pack(root) {
  // 在包目录执行。根目录 `vp pack -F @veltra/ai` 匹配不到该包的配置，不会写出 dist。
  run(vpBin, ['pack', '--logLevel', 'error'], join(root, 'packages/ai'))
}

function readPkg(root) {
  const file = join(root, 'packages/ai/package.json')
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  const keys = Object.keys(pkg.exports)
  const expected = ['.', './style', './*']
  if (keys.length !== expected.length || expected.some((key) => !keys.includes(key))) {
    fail(`exports 键应为 .、./style、./*，实际为 ${keys.join('、')}`)
  }
  const importSpec = pkg.exports['.'].import
  if (typeof importSpec !== 'string') fail('主入口 import 条件不是单个文件')
  const aiRoot = realpathSync(join(root, 'packages/ai'))
  const distIndex = realpathSync(resolve(aiRoot, importSpec))
  return { pkg, distIndex, distDir: dirname(distIndex), aiRoot }
}

function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(path, out)
    else out.push(path)
  }
  return out
}

function nameOf(node) {
  if (!node) return null
  if (node.type === 'Identifier') return node.name
  if (node.type === 'Literal') return String(node.value)
  return null
}

function parseModule(code) {
  const ast = parseAst(code)
  const imports = []
  const localExports = new Map()
  const reexports = []
  const exportAll = []

  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value
      if (node.specifiers.length === 0) imports.push({ source, imported: null, local: null })
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          imports.push({ source, imported: nameOf(spec.imported), local: spec.local.name })
        } else if (spec.type === 'ImportDefaultSpecifier') {
          imports.push({ source, imported: 'default', local: spec.local.name })
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          imports.push({ source, imported: '*', local: spec.local.name })
        }
      }
    } else if (node.type === 'ExportAllDeclaration') {
      if (node.exported) {
        reexports.push({ source: node.source.value, imported: '*', exported: nameOf(node.exported) })
      } else {
        exportAll.push(node.source.value)
      }
    } else if (node.type === 'ExportDefaultDeclaration') {
      localExports.set('default', 'default')
    } else if (node.type === 'ExportNamedDeclaration') {
      if (node.source) {
        for (const spec of node.specifiers) {
          reexports.push({
            source: node.source.value,
            imported: nameOf(spec.local),
            exported: nameOf(spec.exported)
          })
        }
      } else if (node.declaration) {
        const decl = node.declaration
        if (decl.id?.name) localExports.set(decl.id.name, decl.id.name)
        if (decl.type === 'VariableDeclaration') {
          for (const item of decl.declarations) {
            if (item.id.type === 'Identifier') localExports.set(item.id.name, item.id.name)
          }
        }
      } else {
        for (const spec of node.specifiers) {
          localExports.set(nameOf(spec.exported), nameOf(spec.local))
        }
      }
    }
  }

  return { imports, localExports, reexports, exportAll }
}

function resolveSource(fromFile, source) {
  if (!source.startsWith('.')) return null
  const target = resolve(dirname(fromFile), source)
  if (!existsSync(target)) return null
  return realpathSync(target)
}

function loadGraph(distDir) {
  const modules = new Map()
  for (const file of walkFiles(distDir)) {
    if (!file.endsWith('.js')) continue
    modules.set(realpathSync(file), parseModule(readFileSync(file, 'utf8')))
  }
  return modules
}

function publicNames(modules, file, names = new Set(), seen = new Set()) {
  if (seen.has(file)) return [...names]
  seen.add(file)
  const mod = modules.get(file)
  if (!mod) return [...names]
  for (const name of mod.localExports.keys()) names.add(name)
  for (const item of mod.reexports) names.add(item.exported)
  for (const source of mod.exportAll) {
    const next = resolveSource(file, source)
    if (next) publicNames(modules, next, names, seen)
  }
  return [...names]
}

function resolveBinding(modules, file, name, seen = new Set()) {
  const key = `${file}#${name}`
  if (seen.has(key)) return null
  seen.add(key)
  const mod = modules.get(file)
  if (!mod) return null

  if (mod.localExports.has(name)) {
    const local = mod.localExports.get(name)
    const imported = mod.imports.find((item) => item.local === local)
    if (!imported || imported.imported == null) return { file, exportName: name }
    const next = resolveSource(file, imported.source)
    if (!next || !modules.has(next)) return { file, exportName: name }
    if (imported.imported === '*') return { file: next, exportName: '*' }
    return resolveBinding(modules, next, imported.imported, seen) ?? { file: next, exportName: imported.imported }
  }

  for (const item of mod.reexports) {
    if (item.exported !== name) continue
    const next = resolveSource(file, item.source)
    if (!next || !modules.has(next)) return null
    if (item.imported === '*') return { file: next, exportName: '*' }
    return resolveBinding(modules, next, item.imported, seen)
  }

  for (const source of mod.exportAll) {
    const next = resolveSource(file, source)
    if (!next || !modules.has(next)) continue
    const hit = resolveBinding(modules, next, name, seen)
    if (hit) return hit
  }
  return null
}

function reachableFiles(modules, startFile, seen = new Set()) {
  if (!startFile || seen.has(startFile)) return seen
  seen.add(startFile)
  const mod = modules.get(startFile)
  if (!mod) return seen
  const sources = new Set([
    ...mod.imports.map((item) => item.source),
    ...mod.reexports.map((item) => item.source),
    ...mod.exportAll
  ])
  for (const source of sources) {
    reachableFiles(modules, resolveSource(startFile, source), seen)
  }
  return seen
}

function isPeer(id) {
  return (
    id === 'vue' ||
    id.startsWith('vue/') ||
    id.startsWith('@vue/') ||
    id.startsWith('@cat-kit/') ||
    (id.startsWith('@veltra/') && !id.startsWith('@veltra/ai'))
  )
}

function isUnder(root, file) {
  const rel = relative(root, file)
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/'))
}

function stripQuery(id) {
  return id.split('?')[0].split('#')[0]
}

// 与 package.json sideEffects 一致：只有样式入口保留副作用。
// 直接把 @veltra/ai 别名到 dist 文件会绕过这份声明，组件模块会因 import CSS 被整包保留。
function hasSideEffects(aiRoot, file) {
  const rel = relative(aiRoot, stripQuery(file)).replaceAll('\\', '/')
  return rel.endsWith('.css') || rel.endsWith('.scss') || rel.endsWith('/style.js') || rel === 'style.js'
}

function normalizeModuleId(id) {
  const clean = id.split('?')[0].split('#')[0]
  if (clean.startsWith('\0')) return null
  const path = clean.startsWith('file://') ? fileURLToPath(clean) : clean
  if (!path.startsWith('/')) return null
  if (!existsSync(path)) return null
  return realpathSync(path)
}

function reachableChunks(output) {
  const chunks = output.filter((item) => item.type === 'chunk')
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  const seen = new Set()
  const queue = chunks.filter((chunk) => chunk.isEntry).map((chunk) => chunk.fileName)
  while (queue.length > 0) {
    const name = queue.pop()
    if (!name || seen.has(name)) continue
    seen.add(name)
    const chunk = byName.get(name)
    if (!chunk) continue
    for (const dep of [...chunk.imports, ...chunk.dynamicImports]) queue.push(dep)
  }
  return chunks.filter((chunk) => seen.has(chunk.fileName))
}

function measureOutput(output) {
  const chunks = reachableChunks(output)
  let js = 0
  for (const chunk of chunks) js += Buffer.byteLength(chunk.code)
  let css = 0
  for (const item of output) {
    if (item.type !== 'asset' || !item.fileName.endsWith('.css')) continue
    if (typeof item.source === 'string') css += Buffer.byteLength(item.source)
  }
  return { js, css, other: 0, total: js + css }
}

async function buildScenario(aiRoot, distIndex, scenario) {
  const root = join(tmpdir(), `ai-slim-build-${scenario.id}-${Math.random().toString(36).slice(2)}`)
  const outDir = join(root, 'out')
  mkdirSync(root, { recursive: true })
  const entry = join(root, 'entry.js')
  writeFileSync(entry, scenario.entry)
  try {
    const result = await build({
      configFile: false,
      root,
      mode: 'production',
      logLevel: 'warn',
      resolve: {
        conditions: ['import', 'module', 'browser', 'default']
      },
      plugins: [
        {
          name: 'ai-package-entry',
          enforce: 'pre',
          resolveId(id) {
            if (isPeer(id)) return { id, external: true }
            if (id === '@veltra/ai') return { id: distIndex, moduleSideEffects: false }
          }
        }
      ],
      build: {
        outDir,
        emptyOutDir: true,
        sourcemap: false,
        minify: true,
        cssCodeSplit: false,
        lib: {
          entry,
          formats: ['es'],
          fileName: 'bundle',
          name: 'AiSizeEntry'
        },
        rolldownOptions: {
          treeshake: {
            moduleSideEffects(id) {
              const file = normalizeModuleId(id)
              if (!file || !isUnder(aiRoot, file)) return undefined
              return hasSideEffects(aiRoot, file)
            }
          }
        }
      }
    })
    const outputs = Array.isArray(result) ? result : [result]
    const included = new Map()
    let sizes = { js: 0, css: 0, other: 0, total: 0 }
    for (const output of outputs) {
      const measured = measureOutput(output.output)
      sizes = {
        js: sizes.js + measured.js,
        css: sizes.css + measured.css,
        other: sizes.other + measured.other,
        total: sizes.total + measured.total
      }
      for (const chunk of reachableChunks(output.output)) {
        for (const [id, info] of Object.entries(chunk.modules)) {
          if (!info || info.renderedLength <= 0) continue
          const file = normalizeModuleId(id)
          if (!file || !isUnder(aiRoot, file)) continue
          included.set(file, (included.get(file) ?? 0) + info.renderedLength)
        }
      }
    }
    return { sizes, included }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function liveFiles(modules, entry) {
  const live = new Set([entry])
  const mod = modules.get(entry)
  if (!mod) return live
  for (const name of publicNames(modules, entry)) {
    const defined = resolveBinding(modules, entry, name)
    if (!defined) continue
    for (const file of reachableFiles(modules, defined.file)) live.add(file)
  }
  return live
}

function deadLogicFiles(modules, distDir, entry) {
  const live = liveFiles(modules, entry)
  const stylePath = join(distDir, 'style.js')
  if (existsSync(stylePath)) {
    for (const file of reachableFiles(modules, realpathSync(stylePath))) live.add(file)
  }
  const dead = []
  for (const file of modules.keys()) {
    if (live.has(file)) continue
    if (file.endsWith('/style.js')) continue
    dead.push(file)
  }
  return dead
}

function leakedExports(modules, entry, scenario, built) {
  const defined = resolveBinding(modules, entry, scenario.binding)
  if (!defined) fail(`${scenario.binding} 不在主入口的运行时导出里`)
  const allowed = reachableFiles(modules, defined.file)
  allowed.add(entry)
  const leaked = []
  for (const name of publicNames(modules, entry)) {
    if (name === scenario.binding) continue
    const target = resolveBinding(modules, entry, name)
    if (!target) continue
    if (allowed.has(target.file)) continue
    if (!built.included.has(target.file)) continue
    leaked.push(name)
  }
  if (!built.included.has(defined.file)) fail(`${scenario.binding} 的实现没有进入产物`)
  return leaked
}

function formatSizes(sizes) {
  return `总计 ${sizes.total} B（js ${sizes.js} B，css ${sizes.css} B${sizes.other ? `，其它 ${sizes.other} B` : ''}）`
}

function reportLine(title, row) {
  const leaked = row.leaked.length === 0 ? '无' : row.leaked.join('、')
  console.log(`  ${title}  ${formatSizes(row.sizes)}  不可达公开导出：${leaked}`)
}

function assertScenario(scenario, baseline, slim) {
  const problems = []
  if (slim.leaked.length > 0) {
    problems.push(`精简后仍含不可达公开导出：${slim.leaked.join('、')}`)
  }
  if (slim.sizes.total > baseline.sizes.total) {
    problems.push(`精简后字节数 ${slim.sizes.total} 大于基线 ${baseline.sizes.total}`)
  }
  if (baseline.leaked.length > 0 && slim.sizes.total >= baseline.sizes.total) {
    problems.push(
      `基线含不可达实现（${baseline.leaked.join('、')}），精简后字节数 ${slim.sizes.total} 未小于基线 ${baseline.sizes.total}`
    )
  }
  if (problems.length === 0) return
  fail(`${scenario.binding}：\n- ${problems.join('\n- ')}`)
}

async function main() {
  if (!existsSync(vpBin)) fail(`找不到 vp：${vpBin}`)
  const sha = baselineSha()
  console.log(`基线 ${sha}`)
  console.log('打包当前 @veltra/ai')
  pack(repoRoot)
  const worktree = addWorktree(sha)
  try {
    console.log('打包基线 @veltra/ai')
    pack(worktree)
    const slim = readPkg(repoRoot)
    const baseline = readPkg(worktree)
    const slimGraph = loadGraph(slim.distDir)
    const baselineGraph = loadGraph(baseline.distDir)
    const baselineList = await buildScenario(baseline.aiRoot, baseline.distIndex, scenarios[0])
    const baselineTransport = await buildScenario(baseline.aiRoot, baseline.distIndex, scenarios[1])
    const slimList = await buildScenario(slim.aiRoot, slim.distIndex, scenarios[0])
    const slimTransport = await buildScenario(slim.aiRoot, slim.distIndex, scenarios[1])
    const rows = [
      {
        scenario: scenarios[0],
        baseline: {
          sizes: baselineList.sizes,
          leaked: leakedExports(baselineGraph, baseline.distIndex, scenarios[0], baselineList)
        },
        slim: {
          sizes: slimList.sizes,
          leaked: leakedExports(slimGraph, slim.distIndex, scenarios[0], slimList)
        }
      },
      {
        scenario: scenarios[1],
        baseline: {
          sizes: baselineTransport.sizes,
          leaked: leakedExports(baselineGraph, baseline.distIndex, scenarios[1], baselineTransport)
        },
        slim: {
          sizes: slimTransport.sizes,
          leaked: leakedExports(slimGraph, slim.distIndex, scenarios[1], slimTransport)
        }
      }
    ]
    const dead = deadLogicFiles(slimGraph, slim.distDir, slim.distIndex).map((file) =>
      relative(slim.aiRoot, file)
    )
    console.log('')
    for (const row of rows) {
      console.log(row.scenario.binding)
      reportLine('基线  ', row.baseline)
      reportLine('精简后', row.slim)
    }
    if (dead.length > 0) {
      console.log('')
      console.log(`未从公开导出或样式入口到达的 dist 文件：\n${dead.join('\n')}`)
      fail('精简后 dist 仍有对比确认的死代码')
    }
    for (const row of rows) assertScenario(row.scenario, row.baseline, row.slim)
    console.log('')
    console.log('对比通过')
  } finally {
    removeWorktree(worktree)
  }
}

main().catch((error) => {
  if (error instanceof CheckError) console.error(error.message)
  else console.error(error)
  process.exitCode = 1
})
