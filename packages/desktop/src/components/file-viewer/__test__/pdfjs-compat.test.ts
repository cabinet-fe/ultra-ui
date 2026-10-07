import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vite-plus/test'

/** Chrome 103 缺失且 pdfjs-dist 可能使用的 API 条目 */
export interface MissingApiEntry {
  /** API 名，用于失败信息 */
  name: string
  /** 产物文本中检测「是否使用」的模式 */
  usage: RegExp
  /** polyfill 源码中检测「是否已覆盖」的模式 */
  polyfill: RegExp
}

/**
 * 已知 Chrome 103 缺失的 API 清单（cooking spec 决策 4/7）。
 * 升级 pdfjs-dist 后重跑本扫描；追加新条目时须同步在 pdf-polyfill.ts 补 shim。
 */
export const CHROME103_MISSING_APIS: MissingApiEntry[] = [
  {
    name: 'Promise.withResolvers',
    usage: /Promise\.withResolvers\b/,
    polyfill: /Promise\.withResolvers\s*=/
  },
  { name: 'Promise.try', usage: /Promise\.try\b/, polyfill: /Promise\.try\s*=/ },
  {
    name: 'Set.prototype.intersection',
    usage: /\.intersection\s*\(/,
    polyfill: /Set\.prototype\.intersection\s*=/
  }
]

function readText(relative: string): string {
  const url = new URL(relative, import.meta.url)
  try {
    return readFileSync(url, 'utf8')
  } catch (error) {
    throw new Error(`兼容扫描无法读取 ${fileURLToPath(url)}，请确认 pdfjs-dist 安装完整`, {
      cause: error
    })
  }
}

// 扫描对象：pdfjs-dist 主线程与 worker 产物（含 min 版本）+ 自有 worker 入口
const wrapperSource = readText('../previewers/pdf-worker-wrapper.ts')
const artifacts = [
  ...['pdf.mjs', 'pdf.min.mjs', 'pdf.worker.mjs', 'pdf.worker.min.mjs'].map((file) => ({
    label: `pdfjs-dist/build/${file}`,
    text: readText(`../../../../node_modules/pdfjs-dist/build/${file}`)
  })),
  // 自有 worker 产物测试期未构建，按约定扫 wrapper 源码判 polyfill 痕迹
  { label: 'pdf-worker-wrapper.ts', text: wrapperSource }
]
const polyfillSource = readText('../previewers/pdf-polyfill.ts')

describe('pdfjs Chrome 103 API 兼容扫描', () => {
  it('清单中每个 API 均已被 pdf-polyfill 覆盖', () => {
    for (const api of CHROME103_MISSING_APIS) {
      expect(
        polyfillSource,
        `${api.name} 未被 pdf-polyfill 覆盖：清单条目须与 polyfill shim 同步维护`
      ).toMatch(api.polyfill)
    }
  })

  it('产物对清单 API 未使用，或使用已被 polyfill 覆盖', () => {
    for (const api of CHROME103_MISSING_APIS) {
      const usedIn = artifacts
        .filter((artifact) => api.usage.test(artifact.text))
        .map((artifact) => artifact.label)
      if (usedIn.length === 0) continue
      expect(
        polyfillSource,
        `${api.name} 被产物使用（${usedIn.join('、')}）但未被 polyfill 覆盖`
      ).toMatch(api.polyfill)
    }
  })

  it('自有 worker 入口首条 import 为 polyfill，保证先于 pdf.worker 求值', () => {
    const firstImport = /^import\s.+$/m.exec(wrapperSource)?.[0]
    expect(firstImport, 'wrapper 首条 import 必须是 pdf-polyfill').toContain('pdf-polyfill')
    expect(wrapperSource).toContain('pdf.worker')
  })
})
