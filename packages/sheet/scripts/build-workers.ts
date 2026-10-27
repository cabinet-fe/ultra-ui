/**
 * Worker 自包含构建（在 `vp pack` 主构建之后运行）：
 *
 * unbundle 主构建把 import.worker / export.worker 作为 entry 只做单文件转译，
 * 产物保留 `import('infinitable/sheet')` 裸说明符。宿主 Vite 生产构建无法静态
 * 识别 `new Worker(url)` 的变量形态，worker 文件被当作静态资源原样拷贝、不经
 * 依赖解析，浏览器原生执行时解析不了裸说明符 → 导入/导出必失败（dev 与 dist
 * 消费场景因 onerror 走主线程回退被长期掩盖）。
 *
 * 本脚本对两个 worker 入口各跑一次无 external 的打包，把 `infinitable` 与其
 * peer `@cat-kit/core` 全部 inline 进 worker 文件本体；文件名与相对位置不变
 * （`dist/components/sheet/popups/import.worker.js`、`dist/tools/export.worker.js`），
 * 主线程 `new URL('./xxx.worker.js', import.meta.url)` 引用照旧。主构建仍负责
 * 生成 worker 的 .d.ts（本脚本不重复生成）。
 *
 * worker 源码里的运行时动态 `import('infinitable/sheet')` 在 dev（vite dev 按
 * URL 直载源码）语义不变；此处 inlineDynamicImports 仅作用于库 dist 产物。
 */
import { resolve } from 'node:path'

import { build } from 'vite'

const pkgRoot = resolve(import.meta.dirname, '..')

async function bundleWorker(entry: string, outDir: string): Promise<void> {
  await build({
    configFile: false,
    root: pkgRoot,
    appType: 'custom',
    logLevel: 'warn',
    build: {
      emptyOutDir: false,
      outDir,
      minify: false,
      sourcemap: false,
      write: true,
      rollupOptions: {
        input: entry,
        output: {
          format: 'es',
          // worker 内部的运行时动态 import 一并内联：blob/裸文件场景下无相对 chunk 可载
          codeSplitting: false,
          entryFileNames: '[name].js'
        }
      }
    }
  })
}

await bundleWorker(
  resolve(pkgRoot, 'src/components/sheet/popups/import.worker.ts'),
  resolve(pkgRoot, 'dist/components/sheet/popups')
)
await bundleWorker(resolve(pkgRoot, 'src/tools/export.worker.ts'), resolve(pkgRoot, 'dist/tools'))
