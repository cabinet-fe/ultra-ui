/**
 * 本地开发：并行拉起契约参考服务（bun + SQLite）与 playground 前端。
 * 用法：`cd playground && bun run dev`（或根目录 `vp run -F playground dev`）
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const playgroundDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const children: ChildProcess[] = []
let exiting = false

function spawnProc(command: string, args: string[], label: string): ChildProcess {
  const child = spawn(command, args, { cwd: playgroundDir, stdio: 'inherit', env: process.env })
  child.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
    if (exiting) return
    if (signal) {
      console.log(`[${label}] 已终止 (${signal})`)
    } else if (code !== 0 && code !== null) {
      console.error(`[${label}] 异常退出（code ${code}）`)
    }
    shutdown(code ?? (signal ? 1 : 0))
  })
  children.push(child)
  return child
}

function shutdown(exitCode = 0): void {
  if (exiting) return
  exiting = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(exitCode), 100)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

console.log('[playground] 启动契约参考服务 + 前端（Ctrl+C 一并退出）')
spawnProc('bun', ['server/dev.ts'], 'report-server')
spawnProc('vp', ['dev'], 'playground')
