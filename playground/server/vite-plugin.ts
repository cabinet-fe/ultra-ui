import { serve } from '@hono/node-server'
import type { ServerType } from '@hono/node-server'
import type { Plugin } from 'vite'

import { reportApp } from './app'
import { REPORT_SERVER_PORT } from './port'

/**
 * dev-only vite 插件：`vp dev`（playground）启动时联动拉起契约参考服务（独立端口），
 * 前端经 vite proxy（/report-api → 本服务）访问；`vp build` 不生效（apply: 'serve'）。
 */
export function reportServerPlugin(): Plugin {
  let server: ServerType | undefined

  const stop = (): void => {
    server?.close()
    server = undefined
  }

  return {
    name: 'veltra:report-server',
    apply: 'serve',
    configureServer(viteServer) {
      if (server) return
      server = serve(
        { fetch: reportApp.fetch, port: REPORT_SERVER_PORT, hostname: '127.0.0.1' },
        (info) => {
          viteServer.config.logger.info(
            `[report-server] 契约参考服务已启动 http://localhost:${info.port}（前端经 /report-api 代理访问）`
          )
        }
      )
      server.on('error', (error) => {
        viteServer.config.logger.error(
          `[report-server] 启动失败：${error instanceof Error ? error.message : String(error)}（可用 REPORT_SERVER_PORT 换端口）`
        )
        process.exit(1)
      })
      // 开发服务器关闭时释放端口；closeBundle 作为兜底（部分 vite 版本 dev close 也会触发）
      viteServer.httpServer?.once('close', stop)
    },
    closeBundle: stop
  }
}
