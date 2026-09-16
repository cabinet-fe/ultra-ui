import { parseRange } from '@veltra/sheet-core/core/address.js'
import { Workbook } from '@veltra/sheet-core/core/workbook.js'
import type { SheetGrid } from '@veltra/sheet-core/grid'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'

import { USheet } from '../../../index'
import { createSheetContext } from '../../../tools/context'
import type { SheetExposed } from '../../../types'
import UFormulaBar from '../formula-bar.vue'

const apps: App[] = []
const containers: HTMLElement[] = []

function mount(
  props: () => Record<string, unknown> = () => ({}),
  exposedRef?: { value: SheetExposed | undefined }
) {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({
    render: () =>
      h(USheet, {
        ...props(),
        ref: (value: unknown) => {
          if (exposedRef) exposedRef.value = value as SheetExposed | undefined
        }
      })
  })
  app.mount(el)
  apps.push(app)
  return { app, el }
}

function mountFormulaBar(sheet: Workbook['activeSheet']) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  containers.push(el)
  const exposed: { value: InstanceType<typeof UFormulaBar> | undefined } = { value: undefined }
  const app = createApp({
    render: () =>
      h(UFormulaBar, {
        sheet,
        context: createSheetContext(sheet),
        ref: (value: unknown) => {
          exposed.value = value as InstanceType<typeof UFormulaBar> | undefined
        }
      })
  })
  app.mount(el)
  apps.push(app)
  return { el, exposed }
}

function createWorkbook() {
  const workbook = new Workbook()
  workbook.addSheet('Sheet2')
  return workbook
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
})

function nameBox(el: HTMLElement): HTMLInputElement {
  return el.querySelector<HTMLInputElement>('.u-sheet__name-box')!
}

function fxInput(el: HTMLElement): HTMLTextAreaElement {
  return el.querySelector<HTMLTextAreaElement>('.u-sheet__fx-input')!
}

/** 名称框输入并按键（默认 Enter） */
function typeName(el: HTMLElement, text: string, key = 'Enter'): void {
  const input = nameBox(el)
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  if (key) input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

/** fx 输入栏聚焦 → 输入 → 按键（key = null 时不按键，保持编辑态） */
function typeFx(el: HTMLElement, text: string, key: string | null = null): void {
  const input = fxInput(el)
  input.dispatchEvent(new FocusEvent('focus'))
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  if (key) input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

describe('USheet 公式栏（名称框 + fx 输入栏）', () => {
  it('选区变化 → 名称框 / 输入栏内容正确（普通值 / 公式原文 / 空 / 合并格锚点）', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }))
    await nextTick()

    // 默认选区 A1：名称框显示 A1，fx 输入栏可用
    expect(nameBox(el).value).toBe('A1')
    expect(fxInput(el).disabled).toBe(false)
    expect(fxInput(el).value).toBe('')

    // 普通值 → 原始值文本
    sheet.setCellValue({ row: 0, col: 0 }, 'hello')
    await nextTick()
    expect(fxInput(el).value).toBe('hello')

    // 公式格 → '=' + f 原文
    sheet.setCellFormula({ row: 0, col: 0 }, '=SUM(1,2)')
    await nextTick()
    expect(fxInput(el).value).toBe('=SUM(1,2)')

    // 区域选区 → A1:B2 序列化；活动格（区域起点）为空 → 输入栏空
    sheet.selectRange({ start: { row: 1, col: 1 }, end: { row: 3, col: 3 } })
    await nextTick()
    expect(nameBox(el).value).toBe('B2:D4')
    expect(fxInput(el).value).toBe('')

    // 合并格锚点：点被覆盖格 → 名称框显示锚点地址（B2）
    sheet.mergeCells({ start: { row: 1, col: 1 }, end: { row: 2, col: 2 } })
    sheet.selectCell({ row: 2, col: 2 })
    await nextTick()
    expect(sheet.getSelection().activeCell).toEqual({ row: 1, col: 1 })
    expect(nameBox(el).value).toBe('B2')
  })

  it('输入 =SUM(A1:A2) 提交 → 模型公式与计算值正确；普通文本原样存储；Esc 不改模型', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    sheet.setCellValue({ row: 1, col: 0 }, 2)
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }))
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    // 公式提交：'=' 前缀自动公式路径；计算值正确；提交后显示公式原文；选区保持
    typeFx(el, '=SUM(A1:A2)', 'Enter')
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ f: 'SUM(A1:A2)', v: 3, t: 'n' })
    expect(sheet.getDisplayValue({ row: 2, col: 0 })).toBe(3)
    expect(fxInput(el).value).toBe('=SUM(A1:A2)')
    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 0 })

    // 普通文本原样存储（首尾空格不 trim）
    typeFx(el, '  hello  ', 'Enter')
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ v: '  hello  ', t: 's' })

    // Esc 取消：不改模型，输入栏还原为模型内容
    typeFx(el, 'zzz', 'Escape')
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ v: '  hello  ' })
    expect(fxInput(el).value).toBe('  hello  ')

    // 失焦提交（Excel 语义：点击网格等场景自然提交）
    typeFx(el, 'blur-submit')
    fxInput(el).dispatchEvent(new FocusEvent('blur'))
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ v: 'blur-submit' })
  })

  it('名称框输入 B3 / B3:D5 跳转正确；非法输入被拒绝', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }))
    await nextTick()

    // 单格地址 → selectCell 跳转
    typeName(el, 'B3')
    await nextTick()
    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 1 })
    expect(nameBox(el).value).toBe('B3')

    // 区域 → selectRange 跳转
    typeName(el, 'B3:D5')
    await nextTick()
    expect(sheet.getSelection().ranges[0]).toEqual({
      start: { row: 2, col: 1 },
      end: { row: 4, col: 3 }
    })
    expect(nameBox(el).value).toBe('B3:D5')

    // 非法：不跳转、不写入，名称框还原为当前选区地址
    typeName(el, 'INVALID!')
    await nextTick()
    expect(sheet.getSelection().ranges[0]).toEqual({
      start: { row: 2, col: 1 },
      end: { row: 4, col: 3 }
    })
    expect(nameBox(el).value).toBe('B3:D5')

    // Esc：还原显示
    typeName(el, 'X99', 'Escape')
    await nextTick()
    expect(sheet.getSelection().ranges[0]).toEqual({
      start: { row: 2, col: 1 },
      end: { row: 4, col: 3 }
    })
    expect(nameBox(el).value).toBe('B3:D5')
  })

  it('公式栏编辑期间网格事件不打断输入；提交后网格渲染计算值', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    sheet.setCellValue({ row: 1, col: 0 }, 2)
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }), exposed)
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    // 聚焦进入编辑态并输入（不按键）
    typeFx(el, '=SUM(A1:A2)')
    // 网格侧选区变化（编辑态锁：输入内容不被覆盖）
    sheet.selectCell({ row: 5, col: 5 })
    await nextTick()
    expect(fxInput(el).value).toBe('=SUM(A1:A2)')

    // 提交 → 写进入编辑时的格（A3），而非当前选区格（F6）
    fxInput(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ f: 'SUM(A1:A2)', v: 3 })

    // 提交后网格渲染计算值（模型 A3 → 表格坐标 (1,3)）
    expect(exposed.value?.getGrid()?.getTable().getCellValue(1, 3)).toBe(3)
  })

  it('网格侧编辑提交（change_cell_value）后公式栏同步显示', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }), exposed)
    await nextTick()
    sheet.selectCell({ row: 0, col: 0 })
    await nextTick()

    // 模拟网格双击编辑提交（与 grid 测试同一路径：change_cell_value → 模型回写）
    exposed.value?.getGrid()?.getTable().changeCellValue(1, 1, 'grid-edited', false, true)
    await nextTick()
    expect(fxInput(el).value).toBe('grid-edited')
  })

  it('网格编辑器打开（startEditCell）→ 公式栏镜像显示公式原文，提交后退出镜像', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    sheet.setCellFormula({ row: 0, col: 0 }, '=SUM(1,2)')
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }), exposed)
    await nextTick()
    sheet.selectCell({ row: 0, col: 0 })
    await nextTick()

    // 程序化进入网格编辑（表格坐标 (1,1) = 模型 A1）
    exposed.value?.getGrid()?.getTable().startEditCell(1, 1)
    await nextTick()
    expect(fxInput(el).readOnly).toBe(true)
    expect(fxInput(el).value).toBe('=SUM(1,2)')

    // 提交 → 编辑器 onEnd → 公式栏退出镜像（显示模型内容）
    exposed.value?.getGrid()?.getTable().completeEditCell()
    await nextTick()
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ f: 'SUM(1,2)' })
    expect(fxInput(el).readOnly).toBe(false)
    expect(fxInput(el).value).toBe('=SUM(1,2)')
  })

  it('tab 切换：重绑订阅并刷新（新 sheet 的选区 / 单元格内容回显）', async () => {
    const workbook = createWorkbook()
    const sheet1 = workbook.activeSheet
    const sheet2 = workbook.getSheet('Sheet2')!
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }))
    await nextTick()
    // Sheet1 默认选区 A1
    expect(nameBox(el).value).toBe('A1')

    // Sheet2 的选区不影响公式栏（订阅的是 Sheet1）
    sheet2.selectCell({ row: 1, col: 1 })
    await nextTick()
    expect(nameBox(el).value).toBe('A1')

    workbook.activateSheet('Sheet2')
    await nextTick()
    expect(nameBox(el).value).toBe('B2')

    sheet2.setCellValue({ row: 1, col: 1 }, 's2')
    await nextTick()
    expect(fxInput(el).value).toBe('s2')

    // 切回 Sheet1：公式栏跟随
    workbook.activateSheet('Sheet1')
    await nextTick()
    expect(nameBox(el).value).toBe('A1')
  })

  it('fx 编辑中切换 tab：编辑态重置，草稿不写入任何 sheet', async () => {
    const workbook = createWorkbook()
    const sheet1 = workbook.activeSheet
    const sheet2 = workbook.getSheet('Sheet2')!
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }))
    await nextTick()
    sheet1.selectCell({ row: 0, col: 0 })
    await nextTick()

    // 进入 fx 编辑态并输入草稿
    const input = fxInput(el)
    input.dispatchEvent(new Event('focus', { bubbles: true }))
    input.value = 'draft'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    // 切 tab → 编辑态重置（editing=false、editAddr=null）
    workbook.activateSheet('Sheet2')
    await nextTick()
    // fx 显示新 sheet 内容（空），不再显示草稿
    expect(input.value).toBe('')
    // Enter 提交：编辑态已重置 → 不写入
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(sheet2.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(sheet1.getCellData({ row: 0, col: 0 })).toBeUndefined()
  })

  it('showFormulaBar=false 隐藏公式栏', async () => {
    const { el } = mount(() => ({ showFormulaBar: false }))
    await nextTick()
    expect(el.querySelector('.u-sheet__formula-bar')).toBeNull()
  })
})

/** 设置 fx 文本并同步光标到末尾（触发补全 / 引用选择上下文） */
function setFxText(el: HTMLElement, text: string): HTMLTextAreaElement {
  const input = fxInput(el)
  input.dispatchEvent(new FocusEvent('focus'))
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.setSelectionRange(text.length, text.length)
  input.dispatchEvent(new Event('keyup', { bubbles: true }))
  return input
}

function fxButton(el: HTMLElement): HTMLButtonElement {
  return el.querySelector<HTMLButtonElement>('button.u-sheet__fx-label')!
}

/** 函数弹框 Teleport 到 body 级 #pop-container（fx 按钮与工具栏共用同一弹框组件） */
function functionsPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('#pop-container .u-sheet__functions-panel')
}

/** 等待弹层渲染：watch flush + Teleport 挂载 */
async function flushPopup(): Promise<void> {
  await nextTick()
  await nextTick()
}

describe('USheet 公式栏：fx 函数弹框', () => {
  it('fx 渲染为可点击 button；无活动单元格时禁用且不打开弹框', async () => {
    const sheet = new Workbook().activeSheet
    const { el } = mountFormulaBar(sheet)
    await nextTick()

    // 清空选区（Sheet 构造默认选 A1）：与 fx 输入框同一禁用条件
    sheet.selection.clear()
    await nextTick()
    const button = fxButton(el)
    expect(button.tagName).toBe('BUTTON')
    expect(button.disabled).toBe(true)
    expect(fxInput(el).disabled).toBe(true)

    button.click()
    await flushPopup()
    expect(functionsPanel()).toBeNull()

    // 有活动格 → 可点击
    sheet.selectCell({ row: 0, col: 0 })
    await nextTick()
    expect(button.disabled).toBe(false)
  })

  it('点击 fx 开弹框；再点 fx / 点击弹框外 / Esc 关闭；开关不改选区、单元格内容与草稿', async () => {
    const sheet = new Workbook().activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 'keep')
    const { el } = mountFormulaBar(sheet)
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    // 挂起草稿编辑（focus + 输入，不提交）
    const input = setFxText(el, 'draft')
    const button = fxButton(el)
    const selectionBefore = sheet.getSelection()

    // 点击 fx → 弹框打开
    button.click()
    await flushPopup()
    expect(functionsPanel()).not.toBeNull()
    // 开弹框不改选区 / 不写单元格 / 草稿保留
    expect(sheet.getSelection()).toEqual(selectionBefore)
    expect(sheet.getCellData({ row: 2, col: 0 })).toBeUndefined()
    expect(input.value).toBe('draft')

    // 再次点击 fx → 关闭
    button.click()
    await flushPopup()
    expect(functionsPanel()).toBeNull()
    expect(input.value).toBe('draft')

    // 点击弹框外 → 关闭
    button.click()
    await flushPopup()
    window.dispatchEvent(new MouseEvent('click'))
    await flushPopup()
    expect(functionsPanel()).toBeNull()
    expect(input.value).toBe('draft')

    // Esc → 关闭；全程单元格未被写入
    button.click()
    await flushPopup()
    functionsPanel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPopup()
    expect(functionsPanel()).toBeNull()
    expect(input.value).toBe('draft')
    expect(sheet.getCellData({ row: 2, col: 0 })).toBeUndefined()
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'keep' })
  })

  it('选中函数：进入编辑态输出 =SUM()，光标在括号内、焦点在 fx 输入框；Enter 提交到活动格', async () => {
    const sheet = new Workbook().activeSheet
    const { el } = mountFormulaBar(sheet)
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    fxButton(el).click()
    await flushPopup()
    // 默认「常用」首项 SUM
    document.querySelector<HTMLElement>('#pop-container .u-sheet__functions-item')!.click()
    await nextTick()
    await nextTick()

    const input = fxInput(el)
    expect(input.value).toBe('=SUM()')
    expect(input.selectionStart).toBe('=SUM()'.length - 1)
    expect(input.selectionEnd).toBe('=SUM()'.length - 1)
    expect(document.activeElement).toBe(input)
    expect(el.querySelector('.u-sheet__fx-suggest')).toBeNull()

    // 提交 → 写入进入编辑时的目标格（当前活动格 A3）
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ f: 'SUM()' })
    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 0 })
  })

  it('工具栏「函数」按钮打开同一弹框，选中行为与 fx 按钮一致', async () => {
    const workbook = new Workbook()
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }))
    await nextTick()

    const toolbarButton = el.querySelector<HTMLButtonElement>('[data-tool-id="functions"]')!
    toolbarButton.click()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPopup()
    expect(functionsPanel()).not.toBeNull()

    document.querySelector<HTMLElement>('#pop-container .u-sheet__functions-item')!.click()
    await nextTick()
    await nextTick()
    // 公式栏进入编辑态（默认选区 A1）
    const input = fxInput(el)
    expect(input.value).toBe('=SUM()')
    expect(input.selectionStart).toBe('=SUM()'.length - 1)
    expect(document.activeElement).toBe(input)
    // 弹框随选中关闭
    expect(functionsPanel()).toBeNull()
  })
})

function suggestList(el: HTMLElement): HTMLElement | null {
  return el.querySelector('.u-sheet__fx-suggest')
}

describe('USheet 公式栏：函数补全与引用选择', () => {
  it('输入 = 弹出候选含 SUM；SU 过滤到 SUM；↓+Enter 替换为 =SUM() 且光标在括号内', async () => {
    const workbook = new Workbook()
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }))
    await nextTick()

    setFxText(el, '=')
    await nextTick()
    expect(suggestList(el)).not.toBeNull()
    const emptyPrefixNames = [...el.querySelectorAll('.u-sheet__fx-suggest-item')].map(
      (n) => n.querySelector('.u-sheet__fx-suggest-sig')!.textContent
    )
    expect(emptyPrefixNames.length).toBeGreaterThan(0)
    expect(emptyPrefixNames.some((t) => t?.startsWith('SUM('))).toBe(true)

    setFxText(el, '=SU')
    await nextTick()
    const items = [...el.querySelectorAll('.u-sheet__fx-suggest-item')].map(
      (n) => n.querySelector('.u-sheet__fx-suggest-sig')!.textContent
    )
    expect(items.some((t) => t?.startsWith('SUM('))).toBe(true)

    const input = fxInput(el)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(input.value).toBe('=SUM()')
    expect(input.selectionStart).toBe(5)
    expect(suggestList(el)).toBeNull()
  })

  it('Esc 分层：先关候选再取消编辑；候选开着时 Enter 确认而非提交', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 'keep')
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }))
    await nextTick()

    const input = setFxText(el, '=S')
    await nextTick()
    expect(suggestList(el)).not.toBeNull()

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(suggestList(el)).toBeNull()
    expect(input.value).toBe('=S') // 仍在编辑

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(input.value).toBe('keep') // 取消还原
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'keep' })
  })

  it('引用插入文本与光标位置；blur 抑制；非引用选择失焦仍提交', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }), exposed)
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    const input = setFxText(el, '=SUM(')
    await nextTick()

    // pointerdown on grid → blur 不提交（引用选择）；监听绑定在实例容器（LRU 缓存）
    const gridEl = el.querySelector('.u-sheet__grid-instance')!
    gridEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    input.dispatchEvent(new FocusEvent('blur'))
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toBeUndefined()
    expect(input.value).toBe('=SUM(')

    // 网格选区拦截 → handleRefSelect 路径（VTable 时序见 sheet-core selection-debug）
    const { el: barEl, exposed: barExposed } = mountFormulaBar(sheet)
    await nextTick()
    setFxText(barEl, '=SUM(')
    await nextTick()
    barExposed.value!.handleRefSelect(parseRange('A1:B2'))
    await nextTick()
    const barInput = fxInput(barEl)
    expect(barInput.value).toBe('=SUM(A1:B2')
    expect(barInput.selectionStart).toBe('=SUM(A1:B2'.length)

    // 非引用选择场景失焦提交
    setFxText(el, 'plain')
    await nextTick()
    fxInput(el).dispatchEvent(new FocusEvent('blur'))
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ v: 'plain' })
  })

  it('网格镜像期不弹补全', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    sheet.setCellFormula({ row: 0, col: 0 }, '=SUM(1,2)')
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }), exposed)
    await nextTick()
    sheet.selectCell({ row: 0, col: 0 })
    await nextTick()

    exposed.value?.getGrid()?.getTable().startEditCell(1, 1)
    await nextTick()
    expect(fxInput(el).readOnly).toBe(true)
    expect(fxInput(el).value).toBe('=SUM(1,2)')
    expect(suggestList(el)).toBeNull()

    exposed.value?.getGrid()?.getTable().completeEditCell()
    await nextTick()
  })

  it('连续引用选择：=A1+ 后再插入 B1', async () => {
    const sheet = new Workbook().activeSheet
    const { el, exposed } = mountFormulaBar(sheet)
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    setFxText(el, '=A1+')
    await nextTick()
    exposed.value!.handleRefSelect(parseRange('B1'))
    await nextTick()
    expect(fxInput(el).value).toBe('=A1+B1')
  })

  it('多行文本：默认保持单行高度，鼠标进入展开，移出后收起', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 'Line1\nLine2\nLine3\nLine4\nLine5')
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }))
    await nextTick()
    sheet.selectCell({ row: 0, col: 0 })
    await nextTick()

    const input = fxInput(el)
    const panel = el.querySelector('.u-sheet__fx-input-panel')!
    const editor = el.querySelector('.u-sheet__fx-editor')!

    // 默认单行未展开，无 is-expanded 类，height 为空（由 CSS min-height 承载）
    expect(panel.classList.contains('is-expanded')).toBe(false)
    expect(input.style.height).toBe('')

    // 鼠标移入公式栏编辑区：触发展开
    editor.dispatchEvent(new MouseEvent('mouseenter'))
    await nextTick()
    expect(panel.classList.contains('is-expanded')).toBe(true)

    // 鼠标移出公式栏编辑区：收起为单行
    editor.dispatchEvent(new MouseEvent('mouseleave'))
    await nextTick()
    expect(panel.classList.contains('is-expanded')).toBe(false)
    expect(input.style.height).toBe('')
  })
})

// ─── 目标格选区高亮保持（弹框打开与参数点选期间）──────────────

/** VTable 事件名（ListTable.EVENT_TYPE 常量值；@veltra/sheet 不直接依赖 @visactor/vtable，不做运行时引入） */
const EVT_SELECTED_CELL = 'selected_cell'
const EVT_DRAG_SELECT_END = 'drag_select_end'

type GridTable = ReturnType<SheetGrid['getTable']>

/** 模拟画布点选格（VTable 时序：selectCells → SELECTED_CELL） */
function canvasClickCell(table: GridTable, col: number, row: number): void {
  table.selectCells([{ start: { col, row }, end: { col, row } }])
  table.fireListeners(EVT_SELECTED_CELL, { col, row })
}

/** 画布当前选区末尾项（表格坐标；VTable 范围对象含额外内部字段，按坐标匹配） */
function lastCanvasRange(table: GridTable) {
  return table.getSelectedCellRanges().at(-1)
}

describe('USheet 公式栏：目标格选区高亮保持', () => {
  it('fx 弹框打开期间点选画布：目标格高亮与名称框保持、模型选区不变，不插入引用文本', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }), exposed)
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    fxButton(el).click()
    await flushPopup()
    expect(functionsPanel()).not.toBeNull()

    // 弹框打开期间点选画布 B2（表格坐标 (2,2)）
    const table = exposed.value!.getGrid()!.getTable()
    canvasClickCell(table, 2, 2)

    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 0 })
    expect(sheet.getSelection().ranges[0]).toEqual({
      start: { row: 2, col: 0 },
      end: { row: 2, col: 0 }
    })
    // 画布选区回推为目标格 A3（表格坐标 (1,3)），名称框仍显示 A3
    expect(lastCanvasRange(table)).toMatchObject({
      start: { col: 1, row: 3 },
      end: { col: 1, row: 3 }
    })
    expect(nameBox(el).value).toBe('A3')
    // 未处于引用选择上下文：不插入引用文本
    expect(fxInput(el).value).toBe('')
  })

  it('选中函数后点选画布参数格：只插入引用文本、目标格选区不变；提交后选区与名称框仍指向目标格', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }), exposed)
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    // fx 弹框选中 SUM → 编辑态 =SUM()（目标 = 活动格 A3）
    fxButton(el).click()
    await flushPopup()
    document.querySelector<HTMLElement>('#pop-container .u-sheet__functions-item')!.click()
    await nextTick()
    await nextTick()
    const input = fxInput(el)
    expect(input.value).toBe('=SUM()')

    // 点选参数格 A1（表格坐标 (1,1)）→ 只插入引用文本（括号随 =SUM() 模板闭合），目标格选区不变
    const table = exposed.value!.getGrid()!.getTable()
    canvasClickCell(table, 1, 1)
    await nextTick()
    expect(input.value).toBe('=SUM(A1)')
    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 0 })
    expect(lastCanvasRange(table)).toMatchObject({
      start: { col: 1, row: 3 },
      end: { col: 1, row: 3 }
    })
    expect(nameBox(el).value).toBe('A3')

    // 提交 → 写入目标格 A3，选区与名称框仍指向 A3
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ f: 'SUM(A1)', v: 1 })
    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 0 })
    expect(nameBox(el).value).toBe('A3')
    expect(lastCanvasRange(table)).toMatchObject({
      start: { col: 1, row: 3 },
      end: { col: 1, row: 3 }
    })
  })

  it('工具栏「函数」入口与 fx 一致：弹框期间点选画布保持目标格；拖选参数后提交仍指向目标格', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    sheet.setCellValue({ row: 1, col: 0 }, 2)
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }), exposed)
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    el.querySelector<HTMLButtonElement>('[data-tool-id="functions"]')!.click()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPopup()
    expect(functionsPanel()).not.toBeNull()

    // 弹框打开期间点选画布 B2：目标格 A3 高亮保持、模型选区不变、不插入文本
    const table = exposed.value!.getGrid()!.getTable()
    canvasClickCell(table, 2, 2)
    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 0 })
    expect(lastCanvasRange(table)).toMatchObject({
      start: { col: 1, row: 3 },
      end: { col: 1, row: 3 }
    })
    expect(fxInput(el).value).toBe('')

    // 选中 SUM → 拖选参数区域 A1:A2（SELECTED_CELL → DRAG_SELECT_END 完整时序）
    document.querySelector<HTMLElement>('#pop-container .u-sheet__functions-item')!.click()
    await nextTick()
    await nextTick()
    const input = fxInput(el)
    expect(input.value).toBe('=SUM()')
    table.selectCells([{ start: { col: 1, row: 1 }, end: { col: 1, row: 2 } }])
    table.fireListeners(EVT_SELECTED_CELL, { col: 1, row: 2 })
    table.fireListeners(EVT_DRAG_SELECT_END, {})
    await nextTick()
    expect(input.value).toBe('=SUM(A1:A2)')
    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 0 })
    expect(nameBox(el).value).toBe('A3')

    // 提交 → 选区与名称框仍指向目标格 A3
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ f: 'SUM(A1:A2)', v: 3 })
    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 0 })
    expect(nameBox(el).value).toBe('A3')
  })

  it('公式提交后选区与名称框仍指向目标格（编辑期间名称框跳转离开时回推）', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(() => ({ workbook, rows: 20, cols: 8 }), exposed)
    await nextTick()
    sheet.selectCell({ row: 2, col: 0 })
    await nextTick()

    // 编辑目标 A3；期间经名称框跳转到 B5（模型选区离开目标格）
    const input = setFxText(el, '=1+1')
    typeName(el, 'B5')
    await nextTick()
    expect(sheet.getSelection().activeCell).toEqual({ row: 4, col: 1 })
    expect(nameBox(el).value).toBe('B5')

    // 提交 → 写入 A3，模型选区 / 名称框 / 画布高亮回推目标格
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(sheet.getCellData({ row: 2, col: 0 })).toMatchObject({ f: '1+1', v: 2 })
    expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 0 })
    expect(nameBox(el).value).toBe('A3')
    expect(lastCanvasRange(exposed.value!.getGrid()!.getTable())).toMatchObject({
      start: { col: 1, row: 3 },
      end: { col: 1, row: 3 }
    })
  })
})
