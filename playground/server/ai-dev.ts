import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

/**
 * DeepSeek AI 代理服务（Node 入口）。
 * - 纯 Node 运行：`node server/ai-dev.ts`
 * - 先显式加载 playground/.env，再动态 import 会读取环境变量的模块
 * - Hono 应用本体在 deepseek.ts，与运行时无关，未来要合并进其它服务也可直接复用
 */
const serverDir = dirname(fileURLToPath(import.meta.url))
const envPath = join(serverDir, '..', '.env')
if (existsSync(envPath)) loadEnvFile(envPath)

const [{ serve }, { Hono }, { deepseekApp }, { AI_SERVER_PORT }] = await Promise.all([
  import('@hono/node-server'),
  import('hono'),
  import('./deepseek.ts'),
  import('./ai-port.ts')
])

const aiApp = new Hono()
aiApp.route('/ai', deepseekApp)

serve({ fetch: aiApp.fetch, port: AI_SERVER_PORT, hostname: '127.0.0.1' }, (info) => {
  console.log(
    `[ai-server] DeepSeek 代理服务已启动 http://localhost:${info.port}/ai/chat/completions`
  )
})
