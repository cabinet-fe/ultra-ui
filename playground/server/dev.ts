import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

import { serve } from '@hono/node-server'

import { playgroundApp } from './app'
import { deepseekApp } from './deepseek'
import { REPORT_SERVER_PORT } from './port'

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')
if (existsSync(envPath)) loadEnvFile(envPath)

// 同一端口挂 DeepSeek 代理；API Key 只在此进程的环境变量里，不进前端产物
playgroundApp.route('/ai', deepseekApp)

serve({ fetch: playgroundApp.fetch, port: REPORT_SERVER_PORT, hostname: '127.0.0.1' }, (info) => {
  console.log(`[playground-server] 已启动 http://localhost:${info.port}（data-entry + /ai）`)
})
