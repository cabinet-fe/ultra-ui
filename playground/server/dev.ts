import { serve } from '@hono/node-server'

import { reportApp } from './app'
import { REPORT_SERVER_PORT } from './port'

// 独立启动入口：`bun run server`（playground/server）。
// vite dev 由 reportServerPlugin 自动拉起，正常演示无需手动执行本入口。
serve({ fetch: reportApp.fetch, port: REPORT_SERVER_PORT, hostname: '127.0.0.1' }, (info) => {
  console.log(`[report-server] 契约参考服务已启动 http://localhost:${info.port}`)
})
