/**
 * 公式能力可达性（spec 第 4 项 / 下游 meta 报表合计场景）：
 * 写公式（setCellFormula / setCellValue '=' 前缀）、读公式（getCellData().f）、
 * 求值（getDisplayValue）、自定义函数注册（infinitable 主入口）、
 * 数据填充后自动重算——全部经 USheet 门面路径（getContext() 的 SheetContext）。
 */
import { registerFormulaFunction } from 'infinitable'
import { Workbook } from 'infinitable/sheet'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, type App } from 'vue'

import { USheet } from '../../../index'
import type { SheetContext } from '../../../tools/context'
import type { SheetExposed } from '../../../types'
import USheetFunctionsPopup from '../popups/functions-popup.vue'
import { filterFormulaSuggestions } from '../use-formula-suggest'

const apps: App[] = []
const containers: HTMLElement[] = []

/** 挂载 USheet（真实组件 + 内部自建工作簿），返回活动门面 SheetContext */
function mountSheet(): { getContext: () => SheetContext } {
  const exposed: { value: SheetExposed | undefined } = { value: undefined }
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({
    render: () =>
      h(USheet, {
        workbook: new Workbook(),
        rows: 10,
        cols: 6,
        ref: (value: unknown) => {
          exposed.value = value as SheetExposed | undefined
        }
      })
  })
  app.mount(el)
  apps.push(app)
  return { getContext: () => exposed.value!.getContext() }
}

/** 直接挂载函数弹框（与工具栏「函数」按钮 / fx 按钮同一组件） */
function mountFunctionsPopup(): HTMLElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({ render: () => h(USheetFunctionsPopup) })
  app.mount(el)
  apps.push(app)
  return el
}

/** 点击左侧分类导航项（等一帧渲染），与 functions-popup.test.ts 同一交互 */
async function clickCategory(el: HTMLElement, category: string): Promise<void> {
  const item = [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__functions-nav-item')].find(
    (button) => button.textContent?.trim() === category
  )
  item!.click()
  await nextTick()
}

/**
 * 宿主自定义函数（消费方经 `infinitable` 主入口注册，@veltra/sheet 不转售）：
 * 数值参数与区域数值求和——报表「合计」类函数的最小形态。
 */
function registerCustomTotal(): void {
  registerFormulaFunction('VELTRATOTAL', {
    meta: {
      params: [{ name: 'number1' }, { name: 'number2', optional: true }, { name: '...' }],
      description: '测试用自定义求和（公式能力可达性）',
      category: '数学'
    },
    impl(args) {
      let total = 0
      for (const arg of args) {
        if (Array.isArray(arg)) {
          for (const item of arg) if (typeof item === 'number') total += item
        } else if (typeof arg === 'number') {
          total += arg
        }
      }
      return total
    }
  })
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
})

describe('公式能力可达性（USheet 门面路径）', () => {
  it('setCellFormula 写入 SUM：getDisplayValue 得计算值；getCellData().f 读回公式（不含 = 前缀）', async () => {
    const { getContext } = mountSheet()
    await nextTick()
    const ctx = getContext()

    ctx.setCellValue({ row: 0, col: 1 }, 10)
    ctx.setCellValue({ row: 1, col: 1 }, 20)
    ctx.setCellValue({ row: 2, col: 1 }, 30)
    ctx.setCellFormula({ row: 0, col: 0 }, '=SUM(B1:B3)')

    expect(ctx.getDisplayValue({ row: 0, col: 0 })).toBe(60)
    expect(ctx.getCellData({ row: 0, col: 0 })?.f).toBe('SUM(B1:B3)')

    // setCellValue 的 '=' 前缀同样进公式通道（报表配置的另一种写法）
    ctx.setCellValue({ row: 1, col: 0 }, '=SUM(B1:B2)')
    expect(ctx.getDisplayValue({ row: 1, col: 0 })).toBe(30)
    expect(ctx.getCellData({ row: 1, col: 0 })?.f).toBe('SUM(B1:B2)')
  })

  it('批量 setCells 填充被引用区域后公式自动重算（命令执行后引擎增量重算，无需手动刷新）', async () => {
    const { getContext } = mountSheet()
    await nextTick()
    const ctx = getContext()

    // 先写公式：被引用区域为空 → SUM 空区域为 0
    ctx.setCellFormula({ row: 0, col: 0 }, '=SUM(B1:B3)')
    expect(ctx.getDisplayValue({ row: 0, col: 0 })).toBe(0)

    // 报表数据填充：一次 setCells = 一个 undo 单元，填充后合计自动得出
    ctx.setCells([
      { addr: { row: 0, col: 1 }, data: { v: 10, t: 'n' } },
      { addr: { row: 1, col: 1 }, data: { v: 20, t: 'n' } },
      { addr: { row: 2, col: 1 }, data: { v: 30, t: 'n' } }
    ])
    expect(ctx.getDisplayValue({ row: 0, col: 0 })).toBe(60)

    // 修改被引用单元格 → 依赖格重算
    ctx.setCellValue({ row: 1, col: 1 }, 25)
    expect(ctx.getDisplayValue({ row: 0, col: 0 })).toBe(65)
  })

  it('registerFormulaFunction（infinitable 主入口）注册的自定义函数：fx 补全与函数弹框可达、公式求值可用', async () => {
    registerCustomTotal()

    // fx 输入栏补全列表按前缀命中自定义函数
    expect(filterFormulaSuggestions('VELTRATOTA').map((item) => item.name)).toEqual(['VELTRATOTAL'])

    // 函数弹框「全部」列出其签名（与内置函数同一列表）
    const popup = mountFunctionsPopup()
    await clickCategory(popup, '全部')
    const signatures = [...popup.querySelectorAll('.u-sheet__functions-signature')].map(
      (node) => node.textContent
    )
    expect(signatures).toContain('VELTRATOTAL(number1, [number2], ...)')

    // 求值：区域参数 + 标量参数混合（args 收到 [数组, 数值]）
    const { getContext } = mountSheet()
    await nextTick()
    const ctx = getContext()
    ctx.setCellValue({ row: 0, col: 1 }, 10)
    ctx.setCellValue({ row: 1, col: 1 }, 20)
    ctx.setCellFormula({ row: 0, col: 0 }, '=VELTRATOTAL(B1:B2, 5)')
    expect(ctx.getDisplayValue({ row: 0, col: 0 })).toBe(35)
  })
})
