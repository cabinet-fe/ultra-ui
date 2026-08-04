import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'

import { Workbook } from '../../core/workbook'
import { USheet } from '../../index'
import { registerTool, unregisterTool } from '../../tools/registry'
import type { SheetExposed } from '../../types'

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

function createWorkbook() {
  const workbook = new Workbook()
  workbook.addSheet('Sheet2')
  return workbook
}

/** 按 data-tool-id / title 文本 / 原生 title 定位工具按钮（图标化后 textContent 可能为空） */
function toolButton(el: HTMLElement, idOrTitle: string): HTMLButtonElement | undefined {
  return [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__tool')].find(
    (button) =>
      button.dataset.toolId === idOrTitle ||
      button.textContent?.includes(idOrTitle) ||
      button.title.includes(idOrTitle)
  )
}

/** 等待弹层打开：openPopup 走 setTimeout 宏任务（避免真实浏览器中同次 click 冒泡关闭面板） */
async function flushPopup(): Promise<void> {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

function tabs(el: HTMLElement): HTMLButtonElement[] {
  return [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__tab')]
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
})

describe('USheet 组件', () => {
  it('挂载后默认选区 A1：名称框显示 A1、fx 输入栏可用', async () => {
    const workbook = createWorkbook()
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const nameBox = el.querySelector<HTMLInputElement>('.u-sheet__name-box')!
    const fxInput = el.querySelector<HTMLTextAreaElement>('.u-sheet__fx-input')!
    expect(nameBox.value).toBe('A1')
    expect(fxInput.disabled).toBe(false)
    expect(workbook.activeSheet.getSelection().activeCell).toEqual({ row: 0, col: 0 })
  })

  it('挂载：工具栏图标化分组（history｜cell｜text｜edit｜file），tabs 与 grid 挂载', async () => {
    const { el } = mount(() => ({ workbook: createWorkbook(), rows: 10, cols: 6 }))
    await nextTick()

    const tools = [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__tool')].map(
      (button) => button.dataset.toolId
    )
    expect(tools).toEqual([
      'undo',
      'redo',
      'border',
      'fill-color',
      'merge',
      'unmerge',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'font-color',
      'font-size',
      'align-left',
      'align-center',
      'align-right',
      'valign-top',
      'valign-middle',
      'valign-bottom',
      'wrap-text',
      'find',
      'import',
      'export'
    ])
    // 五组之间四个分隔符
    expect(el.querySelectorAll('.u-sheet__toolbar-divider')).toHaveLength(4)
    // 图标化：每个内置工具有 icon，按钮无可见文字
    for (const button of el.querySelectorAll<HTMLButtonElement>('.u-sheet__tool')) {
      expect(button.querySelector('.u-sheet__tool-icon')).not.toBeNull()
      expect(button.textContent?.trim()).toBe('')
      expect(button.title.length).toBeGreaterThan(0)
    }
    // 已移除的工具不再出现
    for (const id of [
      'insert-rows',
      'insert-cols',
      'delete-rows',
      'delete-cols',
      'freeze',
      'freeze-row',
      'freeze-col',
      'unfreeze',
      'export-xlsx',
      'export-csv'
    ]) {
      expect(toolButton(el, id)).toBeUndefined()
    }

    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1', 'Sheet2'])
    expect(tabs(el)[0]!.classList.contains('is-active')).toBe(true)

    // VTable 已挂载到 grid 容器
    expect(el.querySelector('.u-sheet__grid canvas')).not.toBeNull()

    // 单行滚动结构：工具按钮全部位于滚动视口内的 list 容器
    const scroll = el.querySelector('.u-sheet__toolbar-scroll')
    const list = el.querySelector('.u-sheet__toolbar-list')
    expect(scroll).not.toBeNull()
    expect(list).not.toBeNull()
    expect(scroll!.querySelectorAll('.u-sheet__tool').length).toBeGreaterThan(0)
    expect(list!.querySelectorAll('.u-sheet__tool').length).toBeGreaterThan(0)
  })

  it('工具栏无溢出时不渲染导航箭头（happy-dom 无布局 → 判定不溢出）', async () => {
    const { el } = mount(() => ({ workbook: createWorkbook(), rows: 10, cols: 6 }))
    await nextTick()

    // happy-dom 下 clientWidth/scrollWidth 均为 0 → overflowing = false → 箭头不渲染
    expect(el.querySelectorAll('.u-sheet__toolbar-nav')).toHaveLength(0)
  })

  it('内置 undo/redo 按钮随 history-change 置灰，点击等效快捷键', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const undoButton = toolButton(el, 'undo')!
    const redoButton = toolButton(el, 'redo')!
    expect(undoButton.disabled).toBe(true)
    expect(redoButton.disabled).toBe(true)

    sheet.setCellValue({ row: 0, col: 0 }, 'x')
    await nextTick()
    expect(undoButton.disabled).toBe(false)
    expect(redoButton.disabled).toBe(true)

    undoButton.click()
    await nextTick()
    expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(undoButton.disabled).toBe(true)
    expect(redoButton.disabled).toBe(false)

    redoButton.click()
    await nextTick()
    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 'x', t: 's' })
  })

  it('tab 切换：active 样式移动，工具上下文指向当前 sheet', async () => {
    const workbook = createWorkbook()
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }), exposed)
    await nextTick()

    expect(exposed.value?.getActiveSheet().name).toBe('Sheet1')
    expect(exposed.value?.getContext().sheetName).toBe('Sheet1')

    tabs(el)[1]!.click()
    await nextTick()

    expect(tabs(el)[1]!.classList.contains('is-active')).toBe(true)
    // grid 实例缓存：切换后旧实例保留（LRU，visibility:hidden），容器内有 2 个 canvas
    expect(el.querySelectorAll('.u-sheet__grid canvas')).toHaveLength(2)
    // 激活实例可见、旧实例隐藏
    const instances = el.querySelectorAll<HTMLElement>('.u-sheet__grid-instance')
    expect(instances[0]!.style.visibility).toBe('hidden')
    expect(instances[1]!.style.visibility).toBe('visible')
    expect(exposed.value?.getActiveSheet().name).toBe('Sheet2')
    // 工具上下文（与工具按钮同一门面）指向切换后的 sheet
    expect(exposed.value?.getContext().sheetName).toBe('Sheet2')

    // grid 已重建到 Sheet2：写入 Sheet2 应在表格可见
    workbook.getSheet('Sheet2')!.setCellValue({ row: 0, col: 0 }, 's2')
    await nextTick()
    expect(exposed.value?.getGrid()?.getTable().getCellValue(1, 1)).toBe('s2')
  })

  it('props 变更响应：showToolbar/showTabs 显隐，rows 变化重建 grid', async () => {
    const workbook = createWorkbook()
    const state = ref({ rows: 10, showToolbar: true, showTabs: true })
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    const { el } = mount(
      () => ({
        workbook,
        rows: state.value.rows,
        cols: 6,
        showToolbar: state.value.showToolbar,
        showTabs: state.value.showTabs
      }),
      exposed
    )
    await nextTick()

    const gridBefore = exposed.value?.getGrid()
    expect(gridBefore).toBeDefined()

    state.value = { ...state.value, showToolbar: false, showTabs: false }
    await nextTick()
    expect(el.querySelector('.u-sheet__toolbar')).toBeNull()
    expect(el.querySelector('.u-sheet__tabs')).toBeNull()

    state.value = { ...state.value, rows: 20 }
    await nextTick()
    const gridAfter = exposed.value?.getGrid()
    expect(gridAfter).toBeDefined()
    expect(gridAfter).not.toBe(gridBefore)
  })

  it('workbook prop 变更：tabs 与 grid 切到新工作簿', async () => {
    const workbook1 = createWorkbook()
    const workbook2 = new Workbook()
    workbook2.addSheet('数据表')
    const current = ref(workbook1)
    const { el } = mount(() => ({ workbook: current.value, rows: 10, cols: 6 }))
    await nextTick()
    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1', 'Sheet2'])

    current.value = workbook2
    await nextTick()
    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1', '数据表'])
    expect(el.querySelector('.u-sheet__grid canvas')).not.toBeNull()
  })

  it('注册表联动：运行时 register/unregister 工具即时增删按钮', async () => {
    const { el } = mount(() => ({ workbook: createWorkbook(), rows: 10, cols: 6 }))
    await nextTick()
    expect(toolButton(el, 'temp-tool')).toBeUndefined()

    registerTool({ id: 'temp-tool', title: '临时工具', onClick: () => {} })
    await nextTick()
    expect(toolButton(el, 'temp-tool')).toBeDefined()
    // 无 icon 时回落文字按钮
    expect(toolButton(el, 'temp-tool')!.textContent?.trim()).toBe('临时工具')

    expect(unregisterTool('temp-tool')).toBe(true)
    await nextTick()
    expect(toolButton(el, 'temp-tool')).toBeUndefined()
  })

  it('无 props 默认挂载：内部自建工作簿（单 sheet），工具栏/tabs 正常', async () => {
    const { el } = mount()
    await nextTick()
    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1'])
    expect(el.querySelectorAll('.u-sheet__tool').length).toBeGreaterThan(0)
    expect(el.querySelector('.u-sheet__grid canvas')).not.toBeNull()
  })

  it('tab「+」按钮：添加 sheet 并自动激活新表', async () => {
    const workbook = createWorkbook()
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const addButton = el.querySelector<HTMLButtonElement>('.u-sheet__tab-add')!
    addButton.click()
    await nextTick()

    expect(workbook.sheetCount).toBe(3)
    expect(workbook.activeSheet.name).toBe('Sheet3')
    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1', 'Sheet2', 'Sheet3'])
    // 新表自动激活：active 样式落在新 tab 上
    expect(tabs(el)[2]!.classList.contains('is-active')).toBe(true)
  })

  it('renameSheet 后 tab 文本跟随更新', async () => {
    const workbook = createWorkbook()
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    expect(workbook.renameSheet('Sheet2', '数据表')).toBe(true)
    await nextTick()
    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1', '数据表'])

    // 重名（大小写不敏感）被拒绝：tab 文本不变
    expect(workbook.renameSheet('Sheet1', '数据表')).toBe(false)
    await nextTick()
    expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['Sheet1', '数据表'])
  })

  it('多实例并存：共享注册表，工具点击只作用于各自实例的活动 sheet', async () => {
    const workbook1 = new Workbook()
    const workbook2 = new Workbook()
    const first = mount(() => ({ workbook: workbook1, rows: 10, cols: 6 }))
    const second = mount(() => ({ workbook: workbook2, rows: 10, cols: 6 }))
    await nextTick()

    registerTool({
      id: 'mark-active',
      title: '标记当前格',
      onClick: (ctx) => {
        const active = ctx.getSelection().activeCell ?? { row: 0, col: 0 }
        ctx.setCellValue(active, 'marked')
      }
    })
    await nextTick()

    // 两个实例都渲染该工具（注册表全局共享）
    const button1 = toolButton(first.el, 'mark-active')
    const button2 = toolButton(second.el, 'mark-active')
    expect(button1).toBeDefined()
    expect(button2).toBeDefined()

    // 点击实例 2 的工具 → 只写实例 2 的 sheet（各自 SheetContext 绑定各自工作簿）
    workbook2.activeSheet.selectCell({ row: 2, col: 1 })
    await nextTick()
    button2!.click()
    await nextTick()
    expect(workbook2.activeSheet.getCellData({ row: 2, col: 1 })).toEqual({ v: 'marked', t: 's' })
    expect(workbook1.activeSheet.getCellData({ row: 2, col: 1 })).toBeUndefined()

    // 该写入经命令系统：实例 2 的 undo 可用且可撤销
    expect(workbook2.activeSheet.canUndo).toBe(true)
    workbook2.activeSheet.undo()
    expect(workbook2.activeSheet.getCellData({ row: 2, col: 1 })).toBeUndefined()

    unregisterTool('mark-active')
  })

  it('合并/取消合并按钮随选区联动，点击生效且可 undo', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const mergeButton = toolButton(el, 'merge')!
    const unmergeButton = toolButton(el, 'unmerge')!
    // 默认单格 A1：合并禁用；无合并 → 取消合并禁用
    expect(mergeButton.disabled).toBe(true)
    expect(unmergeButton.disabled).toBe(true)

    // 拖选区域（经模型 API 模拟 grid 拖选回写）
    sheet.selectRange({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })
    await nextTick()
    expect(mergeButton.disabled).toBe(false)

    mergeButton.click()
    await nextTick()
    expect(sheet.getCellInfo({ row: 1, col: 1 }).kind).toBe('merged-covered')

    // 选中合并锚点 → 取消合并可用
    sheet.selectCell({ row: 0, col: 0 })
    await nextTick()
    expect(unmergeButton.disabled).toBe(false)

    unmergeButton.click()
    await nextTick()
    expect(sheet.getCellInfo({ row: 1, col: 1 }).kind).toBe('normal')

    sheet.undo()
    expect(sheet.getCellInfo({ row: 1, col: 1 }).kind).toBe('merged-covered')
  })

  it('弹层工具：点击打开面板（UPalette 渲染），点击面板外关闭并提交事务', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    // 默认选区 A1：填充可用
    const fillButton = toolButton(el, 'fill-color')!
    expect(fillButton.disabled).toBe(false)

    fillButton.click()
    await flushPopup()
    // 面板已渲染（含 UPalette 取色器）
    const popupEl = document.querySelector<HTMLElement>('#pop-container .u-sheet__popup')
    expect(popupEl).not.toBeNull()
    expect(document.querySelector('#pop-container .u-sheet__popup .u-palette')).not.toBeNull()
    // 面板 Teleport 到 body 级 #pop-container（不在 mount 容器内，定位由 usePop 接管）
    expect(el.querySelector('.u-sheet__popup')).toBeNull()

    // 点击面板外（grid 区）→ 关闭；空事务不入历史
    el.querySelector('.u-sheet__grid')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('#pop-container .u-sheet__popup')).toBeNull()
    expect(sheet.history.undoSize).toBe(0)
  })

  it('文本工具：加粗 toggle + active 高亮；字体颜色弹层可打开', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const boldButton = toolButton(el, 'bold')!
    expect(boldButton.classList.contains('is-active')).toBe(false)
    boldButton.click()
    await nextTick()
    expect(sheet.getCellStyle({ row: 0, col: 0 })?.font?.bold).toBe(true)
    expect(boldButton.classList.contains('is-active')).toBe(true)
    boldButton.click()
    await nextTick()
    expect(sheet.getCellStyle({ row: 0, col: 0 })).toBeUndefined()
    expect(boldButton.classList.contains('is-active')).toBe(false)

    toolButton(el, 'font-color')!.click()
    await flushPopup()
    expect(document.querySelector('#pop-container .u-sheet__popup .u-palette')).not.toBeNull()
    el.querySelector('.u-sheet__grid')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('#pop-container .u-sheet__popup')).toBeNull()
  })

  it('字号弹层：预设写入 + 关闭提交为一个 undo 单元', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    toolButton(el, 'font-size')!.click()
    await flushPopup()
    const sizeButtons = [
      ...document.querySelectorAll<HTMLButtonElement>('#pop-container .u-sheet__popup-size-item')
    ]
    expect(sizeButtons.map((button) => button.textContent?.trim())).toContain('14')
    sizeButtons.find((button) => button.textContent?.trim() === '14')!.click()
    await nextTick()
    expect(sheet.getCellStyle({ row: 0, col: 0 })?.font?.size).toBe(14)

    el.querySelector('.u-sheet__grid')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('#pop-container .u-sheet__popup')).toBeNull()
    expect(sheet.history.undoSize).toBe(1)
    sheet.undo()
    expect(sheet.getCellStyle({ row: 0, col: 0 })).toBeUndefined()
  })

  it('边框面板：预设应用 + 关闭提交为一个 undo 单元', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    sheet.selectRange({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })
    await nextTick()
    toolButton(el, 'border')!.click()
    await flushPopup()

    const presetButtons = [...document.querySelectorAll('#pop-container .u-sheet__popup-preset')]
    expect(presetButtons.map((button) => button.textContent?.trim())).toEqual([
      '全边框',
      '外边框',
      '下边框',
      '无边框'
    ])

    presetButtons.find((button) => button.textContent?.trim() === '全边框')!.click()
    await nextTick()
    // 选区内每格四边都有边框
    expect(sheet.getCellStyle({ row: 0, col: 0 })?.border?.top).toBeDefined()
    expect(sheet.getCellStyle({ row: 1, col: 1 })?.border?.bottom).toBeDefined()
    expect(sheet.getCellStyle({ row: 0, col: 1 })?.border?.left).toBeDefined()

    // 无边框 → 清除边框
    presetButtons.find((button) => button.textContent?.trim() === '无边框')!.click()
    await nextTick()
    expect(sheet.getCellStyle({ row: 0, col: 0 })?.border).toBeUndefined()

    // 点击外部关闭 → 面板期间所有写入合并为一个 undo 单元
    el.querySelector('.u-sheet__grid')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('#pop-container .u-sheet__popup')).toBeNull()
    expect(sheet.history.undoSize).toBe(1)

    sheet.undo()
    expect(sheet.getCellStyle({ row: 0, col: 0 })).toBeUndefined()
  })

  it('冻结：模型 setFrozen 驱动 VTable 冻结布局联动（工具栏入口已迁至右键菜单）', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    const exposed: { value: SheetExposed | undefined } = { value: undefined }
    mount(() => ({ workbook, rows: 10, cols: 6 }), exposed)
    await nextTick()

    sheet.setFrozen(1, 0)
    await nextTick()
    expect(sheet.frozen).toEqual({ rows: 1, cols: 0 })
    // 模型 1 行 → frozenRowCount = 2：列头行 + 首行；列保持 1：行号列
    expect(exposed.value?.getGrid()?.getTable().frozenRowCount).toBe(2)
    expect(exposed.value?.getGrid()?.getTable().frozenColCount).toBe(1)

    sheet.setFrozen(1, 1)
    await nextTick()
    expect(exposed.value?.getGrid()?.getTable().frozenColCount).toBe(2)

    sheet.setFrozen(0, 0)
    await nextTick()
    expect(sheet.frozen).toEqual({ rows: 0, cols: 0 })
  })

  it('导入弹层：点击打开（UFilePicker 渲染），点击外部关闭且不产生历史条目', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    toolButton(el, 'import')!.click()
    await flushPopup()
    expect(document.querySelector('#pop-container .u-sheet__popup')).not.toBeNull()
    expect(document.querySelector('#pop-container .u-file-picker')).not.toBeNull()

    // 导入面板不参与事务：关闭不产生历史条目
    el.querySelector('.u-sheet__grid')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('#pop-container .u-sheet__popup')).toBeNull()
    expect(sheet.history.undoSize).toBe(0)
  })

  it('导出弹层：单按钮打开两选项；点击选项触发下载并关闭，不产生历史', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    const createObjectURL = vi.fn(() => 'blob:mock')
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL
    try {
      toolButton(el, 'export')!.click()
      await flushPopup()
      const options = [
        ...document.querySelectorAll<HTMLButtonElement>('#pop-container .u-sheet__export-option')
      ]
      expect(options.map((button) => button.textContent?.trim())).toEqual([
        '导出 Excel (.xlsx)',
        '导出 CSV (.csv)'
      ])

      options[0]!.click()
      await nextTick()
      await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalled(), { timeout: 2000 })
      expect(document.querySelector('#pop-container .u-sheet__popup')).toBeNull()
      expect(sheet.history.undoSize).toBe(1) // 预置 setCellValue；导出本身不写模型

      toolButton(el, 'export')!.click()
      await flushPopup()
      createObjectURL.mockClear()
      document
        .querySelectorAll<HTMLButtonElement>('#pop-container .u-sheet__export-option')[1]!
        .click()
      await nextTick()
      await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalled(), { timeout: 2000 })
      const csvBlob = createObjectURL.mock.calls[0]![0] as Blob
      expect(csvBlob.type).toContain('text/csv')
      expect(document.querySelector('#pop-container .u-sheet__popup')).toBeNull()
    } finally {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    }
  })

  it('查找条：打开 → 关键词定位命中 → Enter 下一个 / Shift+Enter 上一个 → 关闭', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 'hello')
    sheet.setCellValue({ row: 0, col: 1 }, 'world')
    sheet.setCellValue({ row: 1, col: 0 }, 'hello again')
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    toolButton(el, 'find')!.click()
    await flushPopup()
    expect(document.querySelector('#pop-container .u-sheet__popup')).not.toBeNull()
    expect(document.querySelector('#pop-container .u-sheet__find-input')).not.toBeNull()

    // 输入关键词 → 定位第一个命中（A1）
    const input = document.querySelector<HTMLInputElement>(
      '#pop-container .u-sheet__find-input .u-input__native'
    )!
    input.value = 'hello'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(sheet.getSelection().activeCell).toEqual({ row: 0, col: 0 })
    expect(document.querySelector('#pop-container .u-sheet__find-count')!.textContent?.trim()).toBe(
      '1 / 2'
    )

    // Enter → 下一个命中（A3）
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(sheet.getSelection().activeCell).toEqual({ row: 1, col: 0 })
    expect(document.querySelector('#pop-container .u-sheet__find-count')!.textContent?.trim()).toBe(
      '2 / 2'
    )

    // Enter 循环回第一个
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(sheet.getSelection().activeCell).toEqual({ row: 0, col: 0 })

    // Shift+Enter → 上一个（循环回最后一个）
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true })
    )
    await nextTick()
    expect(sheet.getSelection().activeCell).toEqual({ row: 1, col: 0 })

    // 无命中 → 计数 0 / 0，导航禁用
    input.value = '不存在'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('#pop-container .u-sheet__find-count')!.textContent?.trim()).toBe(
      '0 / 0'
    )
    expect(
      document.querySelector<HTMLButtonElement>('#pop-container .u-sheet__find-nav')!.disabled
    ).toBe(true)

    // 关闭
    document.querySelector<HTMLButtonElement>('#pop-container .u-sheet__find-close')!.click()
    await nextTick()
    expect(document.querySelector('#pop-container .u-sheet__popup')).toBeNull()
  })

  it('替换：单个替换可 undo；全部替换 = 单 undo 单元，undo 一次全部还原', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 'foo')
    sheet.setCellValue({ row: 0, col: 1 }, 'foo')
    sheet.setCellValue({ row: 1, col: 0 }, 'foo')
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    toolButton(el, 'find')!.click()
    await flushPopup()

    const queryInput = document.querySelector<HTMLInputElement>(
      '#pop-container .u-sheet__find-input .u-input__native'
    )!
    queryInput.value = 'foo'
    queryInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('#pop-container .u-sheet__find-count')!.textContent?.trim()).toBe(
      '1 / 3'
    )

    // 全部替换：3 格一次写入
    const replaceInputs = [
      ...document.querySelectorAll('#pop-container .u-sheet__find-input .u-input__native')
    ]
    replaceInputs[1]!.value = 'bar'
    replaceInputs[1]!.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    document.querySelectorAll('#pop-container .u-sheet__find-btn')[1]!.click()
    await nextTick()

    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'bar' })
    expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 'bar' })
    expect(sheet.getCellData({ row: 1, col: 0 })).toMatchObject({ v: 'bar' })
    // 全部替换 = 单 undo 单元（3 次 setCellValue 初始 + 1 次替换）
    expect(sheet.history.undoSize).toBe(4)

    // undo 一次 → 全部还原
    sheet.undo()
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'foo' })
    expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 'foo' })
    expect(sheet.getCellData({ row: 1, col: 0 })).toMatchObject({ v: 'foo' })
  })

  it('全部替换跳过公式格（不覆盖公式原文）', async () => {
    const workbook = createWorkbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 'foo')
    sheet.setCellFormula({ row: 1, col: 0 }, '=A1&"!"') // 公式格显示值 foo!
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    toolButton(el, 'find')!.click()
    await flushPopup()

    const queryInput = document.querySelector<HTMLInputElement>(
      '#pop-container .u-sheet__find-input .u-input__native'
    )!
    queryInput.value = 'foo'
    queryInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    // 普通格 + 公式格显示值都命中
    expect(document.querySelector('#pop-container .u-sheet__find-count')!.textContent?.trim()).toBe(
      '1 / 2'
    )

    const replaceInputs = [
      ...document.querySelectorAll('#pop-container .u-sheet__find-input .u-input__native')
    ]
    replaceInputs[1]!.value = 'bar'
    replaceInputs[1]!.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    document.querySelectorAll('#pop-container .u-sheet__find-btn')[1]!.click()
    await nextTick()

    // 普通格被替换，公式格保留公式（显示值也因依赖 A1 变化为 bar!）
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'bar' })
    expect(sheet.getCellData({ row: 1, col: 0 })).toMatchObject({ f: 'A1&"!"' })
    expect(sheet.getCellData({ row: 1, col: 0 })?.v).toBe('bar!')
  })
})

describe('tabs 栏', () => {
  it('少量 sheet：「+」在视口外且紧随 viewport（nav 隐藏，不占位）', async () => {
    const workbook = createWorkbook()
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const tabsBar = el.querySelector<HTMLElement>('.u-sheet__tabs')!
    const viewport = el.querySelector<HTMLElement>('.u-sheet__tabs-viewport')!
    const addButton = el.querySelector<HTMLButtonElement>('.u-sheet__tab-add')!
    const navButtons = [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__tabs-nav')]

    // 「+」仍是 tabs 直接子级，不在滚动 list 内
    expect(tabsBar.contains(addButton)).toBe(true)
    expect(viewport.contains(addButton)).toBe(false)
    expect(el.querySelector('.u-sheet__tabs-list .u-sheet__tab-add')).toBeNull()

    // 未溢出：nav 隐藏；DOM 顺序 viewport → next-nav →「+」，布局上「+」紧跟 tab 区
    expect(navButtons).toHaveLength(2)
    expect(navButtons[0]!.style.display).toBe('none')
    expect(navButtons[1]!.style.display).toBe('none')
    expect(viewport.nextElementSibling).toBe(navButtons[1]!)
    expect(navButtons[1]!.nextElementSibling).toBe(addButton)
  })

  it('多 sheet 溢出：viewport 可横滚，nav 出现；next/prev 改变 scrollLeft；活动 tab 滚入视野', async () => {
    const workbook = new Workbook()
    for (let i = 2; i <= 16; i++) workbook.addSheet(`Sheet${i}`)
    const { el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    const viewport = el.querySelector<HTMLElement>('.u-sheet__tabs-viewport')!
    const list = el.querySelector<HTMLElement>('.u-sheet__tabs-list')!
    expect(viewport).not.toBeNull()
    expect(list).not.toBeNull()
    expect(list.children.length).toBe(16)
    // 「+」钉在视口外（tabs 直接子级，不在 list 内）
    expect(el.querySelector('.u-sheet__tabs > .u-sheet__tab-add')).not.toBeNull()
    expect(list.querySelector('.u-sheet__tab-add')).toBeNull()

    // happy-dom 无真实布局：伪造溢出几何，触发导航显隐
    let scrollLeft = 0
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, get: () => 100 })
    Object.defineProperty(viewport, 'scrollWidth', { configurable: true, get: () => 800 })
    Object.defineProperty(viewport, 'scrollLeft', {
      configurable: true,
      get: () => scrollLeft,
      set: (value: number) => {
        scrollLeft = value
      }
    })
    viewport.scrollTo = ((options?: ScrollToOptions | number) => {
      if (typeof options === 'number') {
        scrollLeft = options
      } else if (options && typeof options.left === 'number') {
        scrollLeft = options.left
      }
      viewport.dispatchEvent(new Event('scroll'))
    }) as typeof viewport.scrollTo
    viewport.getBoundingClientRect = () =>
      ({
        left: 0,
        right: 100,
        top: 0,
        bottom: 24,
        width: 100,
        height: 24,
        x: 0,
        y: 0,
        toJSON: () => ({})
      }) as DOMRect

    viewport.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth)
    const navButtons = [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__tabs-nav')]
    expect(navButtons).toHaveLength(2)
    // v-show：溢出时显示；初始 scrollLeft=0 → prev 禁用、next 可用
    expect(navButtons[0]!.style.display).not.toBe('none')
    expect(navButtons[1]!.style.display).not.toBe('none')
    expect(navButtons[0]!.disabled).toBe(true)
    expect(navButtons[1]!.disabled).toBe(false)

    navButtons[1]!.click()
    await nextTick()
    expect(scrollLeft).toBeGreaterThan(0)
    expect(navButtons[0]!.disabled).toBe(false)

    const beforePrev = scrollLeft
    navButtons[0]!.click()
    await nextTick()
    expect(scrollLeft).toBeLessThan(beforePrev)

    // 切换到末尾 sheet：活动 tab 在视口右侧外 → ensureActiveVisible 滚入
    const lastTab = tabs(el)[15]!
    lastTab.getBoundingClientRect = () =>
      ({
        left: 700,
        right: 780,
        top: 0,
        bottom: 24,
        width: 80,
        height: 24,
        x: 700,
        y: 0,
        toJSON: () => ({})
      }) as DOMRect
    scrollLeft = 0
    lastTab.click()
    await nextTick()
    await nextTick()
    expect(workbook.activeSheet.name).toBe('Sheet16')
    expect(scrollLeft).toBeGreaterThan(0)
  })
})
