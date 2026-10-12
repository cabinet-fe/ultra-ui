import { createRange } from 'infinitable/sheet'
import { Sheet } from 'infinitable/sheet'
import { describe, expect, it } from 'vite-plus/test'

import { createSheetContext } from '../../../tools/context'
import {
  applyNumFmtToSelection,
  buildBodyMenus,
  buildColHeaderMenus,
  buildRowHeaderMenus,
  cellImageToFloat,
  defaultInsertCount,
  ensureContextMenuSelection,
  isColInSelection,
  isRowInSelection,
  resolveRenderSize,
  wholeColRange,
  wholeRowRange
} from '../sheet-context-menu'

describe('sheet-context-menu helpers', () => {
  it('defaultInsertCount = 选区覆盖行/列数（钳制 1..1000）', () => {
    expect(defaultInsertCount(null, 'row')).toBe(1)
    expect(defaultInsertCount(createRange({ row: 2, col: 0 }, { row: 4, col: 2 }), 'row')).toBe(3)
    expect(defaultInsertCount(createRange({ row: 0, col: 1 }, { row: 0, col: 5 }), 'col')).toBe(5)
    expect(defaultInsertCount(createRange({ row: 0, col: 0 }, { row: 2000, col: 0 }), 'row')).toBe(
      1000
    )
  })

  it('整行/整列选区与选区覆盖判定', () => {
    expect(wholeRowRange(2, 6)).toEqual({ start: { row: 2, col: 0 }, end: { row: 2, col: 5 } })
    expect(wholeColRange(3, 10)).toEqual({ start: { row: 0, col: 3 }, end: { row: 9, col: 3 } })
    const ranges = [createRange({ row: 1, col: 0 }, { row: 3, col: 5 })]
    expect(isRowInSelection(ranges, 2)).toBe(true)
    expect(isRowInSelection(ranges, 5)).toBe(false)
    expect(isColInSelection(ranges, 4)).toBe(true)
    expect(isColInSelection(ranges, 6)).toBe(false)
  })

  it('resolveRenderSize：模型已声明时以模型为准（可低于 props）', () => {
    expect(resolveRenderSize(100, 26, 120, 10)).toEqual({ rows: 120, cols: 10 })
    expect(resolveRenderSize(100, 26, 29, 26)).toEqual({ rows: 29, cols: 26 })
    expect(resolveRenderSize(undefined, undefined, 0, 0)).toEqual({ rows: 100, cols: 26 })
  })
})

describe('ensureContextMenuSelection', () => {
  it('body 落点在选区外 → 选中该格', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectRange(createRange({ row: 0, col: 0 }, { row: 1, col: 1 }))
    ensureContextMenuSelection(
      ctx,
      { kind: 'body', addr: { row: 5, col: 2 } },
      { rows: 100, cols: 26 }
    )
    expect(ctx.getSelection().activeCell).toEqual({ row: 5, col: 2 })
  })

  it('行号落点在选区外 → 选中整行', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    ensureContextMenuSelection(
      ctx,
      { kind: 'row-header', addr: null, row: 4 },
      { rows: 100, cols: 6 }
    )
    expect(ctx.getSelection().ranges[0]).toEqual({
      start: { row: 4, col: 0 },
      end: { row: 4, col: 5 }
    })
  })

  it('行号落点在选区内 → 保留选区', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const range = createRange({ row: 2, col: 0 }, { row: 4, col: 5 })
    sheet.selectRange(range)
    ensureContextMenuSelection(
      ctx,
      { kind: 'row-header', addr: null, row: 3 },
      { rows: 100, cols: 6 }
    )
    expect(ctx.getSelection().ranges[0]).toEqual(range)
  })

  it('列头落点在选区外 → 选中整列', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    ensureContextMenuSelection(
      ctx,
      { kind: 'col-header', addr: null, col: 2 },
      { rows: 10, cols: 26 }
    )
    expect(ctx.getSelection().ranges[0]).toEqual({
      start: { row: 0, col: 2 },
      end: { row: 9, col: 2 }
    })
  })
})

describe('build*Menus', () => {
  it('行号菜单：插入×2 / 删除 / 行高 / divider / 冻结项；无合并/插入列', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectRange(createRange({ row: 1, col: 0 }, { row: 3, col: 5 }))
    const menus = buildRowHeaderMenus(ctx)
    const labels = menus.map((m) => m.label ?? (m.divider ? '---' : ''))
    expect(labels).toEqual([
      '在上方插入行',
      '在下方插入行',
      '删除行',
      '行高',
      '---',
      '冻结到当前行',
      '取消冻结'
    ])
    expect(menus.filter((m) => m.keepOpen)).toHaveLength(3)
    expect(menus.some((m) => m.divider)).toBe(true)
    expect(menus.at(-1)?.disabled).toBe(true)
    expect(labels.join()).not.toContain('合并')
    expect(labels.join()).not.toContain('插入列')
  })

  it('冻结到当前行 active 标记 + 取消冻结可用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectRange(createRange({ row: 0, col: 0 }, { row: 2, col: 5 }))
    sheet.setFrozen(3, 0) // endRow(2)+1
    const menus = buildRowHeaderMenus(ctx)
    expect(menus.find((m) => m.label?.includes('冻结到当前行'))?.label).toBe('✓ 冻结到当前行')
    expect(menus.find((m) => m.label === '取消冻结')?.disabled).toBe(false)
  })

  it('冻结以右键命中行列为准，不放大整行/整列残留选区（先冻行再冻列不失效）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    // 用户路径：右键行号 2 冻结到第 3 行 → 残留整行选区（行 2 × 全部列 0..5）
    sheet.selectRange(wholeRowRange(2, 6))
    sheet.setFrozen(3, 0)
    // 随后右键列头 col 1：落点在整行选区内 → ensureContextMenuSelection 保留选区，
    // 冻结列必须用命中的 col=1 而非选区末端 col=5（否则冻结全部列，视觉不生效）
    ensureContextMenuSelection(
      ctx,
      { kind: 'col-header', addr: null, col: 1 },
      { rows: 10, cols: 6 }
    )
    expect(ctx.getSelection().ranges[0]).toEqual(wholeRowRange(2, 6))
    const menus = buildColHeaderMenus(ctx, { col: 1 })
    menus.find((m) => m.label === '冻结到当前列')!.callback!()
    expect(sheet.frozen).toEqual({ rows: 3, cols: 2 })

    // 对称路径：先冻列 → 残留整列选区（全部行 0..9 × col 1）→ 右键行号 4 冻结到第 5 行
    sheet.setFrozen(0, 0)
    sheet.selectRange(wholeColRange(1, 10))
    sheet.setFrozen(0, 2)
    ensureContextMenuSelection(
      ctx,
      { kind: 'row-header', addr: null, row: 4 },
      { rows: 10, cols: 6 }
    )
    const rowMenus = buildRowHeaderMenus(ctx, { row: 4 })
    rowMenus.find((m) => m.label === '冻结到当前行')!.callback!()
    expect(sheet.frozen).toEqual({ rows: 5, cols: 2 })
  })

  it('冻结项未传命中行列时回落选区末端（旧调用方兼容）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectRange(createRange({ row: 0, col: 0 }, { row: 2, col: 5 }))
    buildRowHeaderMenus(ctx).find((m) => m.label === '冻结到当前行')!.callback!()
    expect(sheet.frozen.rows).toBe(3)
    sheet.setFrozen(0, 0)
    buildColHeaderMenus(ctx).find((m) => m.label === '冻结到当前列')!.callback!()
    expect(sheet.frozen.cols).toBe(6)
  })

  it('列头菜单对称', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectRange(createRange({ row: 0, col: 1 }, { row: 9, col: 3 }))
    const labels = buildColHeaderMenus(ctx).map((m) => m.label ?? (m.divider ? '---' : ''))
    expect(labels).toEqual([
      '在左侧插入列',
      '在右侧插入列',
      '删除列',
      '列宽',
      '---',
      '冻结到当前列',
      '取消冻结'
    ])
  })

  it('行高/列宽项：默认内嵌数值输入，readonly 降级为禁用文本项', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })

    const rowItem = buildRowHeaderMenus(ctx).find((m) => m.label === '行高')!
    expect(rowItem.keepOpen).toBe(true)
    expect(rowItem.render).toBeTruthy()
    expect(rowItem.disabled).toBeFalsy()

    const colItem = buildColHeaderMenus(ctx).find((m) => m.label === '列宽')!
    expect(colItem.keepOpen).toBe(true)
    expect(colItem.render).toBeTruthy()

    // readonly：render 内嵌组件自带点击路径，禁用态必须去掉 render 拦死输入
    const readonlyRow = buildRowHeaderMenus(ctx, { readonly: true }).find(
      (m) => m.label === '行高'
    )!
    expect(readonlyRow.disabled).toBe(true)
    expect(readonlyRow.render).toBeUndefined()
    const readonlyCol = buildColHeaderMenus(ctx, { readonly: true }).find(
      (m) => m.label === '列宽'
    )!
    expect(readonlyCol.disabled).toBe(true)
    expect(readonlyCol.render).toBeUndefined()
  })

  it('body 菜单：合并/取消合并 + 设置数据格式子菜单 + 插入超链接 + 插入/嵌入图片，不含行列插入删除', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    const menus = buildBodyMenus(ctx)
    expect(menus).toHaveLength(7)
    expect(menus.map((m) => m.label ?? (m.divider ? '---' : ''))).toEqual([
      '合并单元格',
      '取消合并单元格',
      '---',
      '设置数据格式',
      '插入超链接',
      '插入图片',
      '嵌入图片'
    ])
    const insertImage = menus.find((m) => m.label === '插入图片')!
    expect(insertImage.disabled).toBeFalsy()
    expect(insertImage.callback).toBeTruthy()
    const embedImage = menus.find((m) => m.label === '嵌入图片')!
    expect(embedImage.disabled).toBeFalsy()
    expect(embedImage.callback).toBeTruthy()
    const labels = menus.map((m) => m.label).join()
    expect(labels).not.toContain('插入行')
    expect(labels).not.toContain('插入列')
    expect(labels).not.toContain('删除行')
    expect(labels).not.toContain('删除列')
  })

  it('body 设置数据格式子菜单：日期 / 千分位金额 / 大写金额 / 小数位数', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    const sub = buildBodyMenus(ctx).find((m) => m.label === '设置数据格式')!
    expect(sub.disabled).toBeFalsy()
    const children = sub.children!
    expect(children.map((c) => c.label)).toEqual(['日期', '千分位金额', '大写金额', '小数位数'])
    // 小数位数项内嵌位数输入（keepOpen + render），其余三项直点直用
    expect(children[3]?.keepOpen).toBe(true)
    expect(children[3]?.render).toBeTruthy()
    expect(children.slice(0, 3).every((c) => typeof c.callback === 'function')).toBe(true)
  })

  it('设置数据格式：四项各应用 numFmt 到当前选区全部单元格，原始值不变', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 0, col: 0 }, 45000)
    sheet.setCellValue({ row: 0, col: 1 }, 1234567.89)
    const range = createRange({ row: 0, col: 0 }, { row: 0, col: 1 })

    const cases = [
      { label: '日期', numFmt: { type: 'date' } },
      { label: '千分位金额', numFmt: { type: 'thousands' } },
      { label: '大写金额', numFmt: { type: 'cnUpper' } }
    ] as const
    for (const c of cases) {
      sheet.selectRange(range)
      const sub = buildBodyMenus(ctx).find((m) => m.label === '设置数据格式')!
      sub.children!.find((child) => child.label === c.label)!.callback!()
      for (const addr of [
        { row: 0, col: 0 },
        { row: 0, col: 1 }
      ]) {
        expect(ctx.getCellStyle(addr)?.numFmt).toEqual(c.numFmt)
      }
      // 仅样式变化，原始值不变
      expect(ctx.getCellData({ row: 0, col: 0 })?.v).toBe(45000)
      expect(ctx.getCellData({ row: 0, col: 1 })?.v).toBe(1234567.89)
      sheet.undo()
    }

    // 小数位数：经同一入口 applyNumFmtToSelection（render onConfirm 同路径）
    sheet.selectRange(range)
    applyNumFmtToSelection(ctx, { type: 'fixed', digits: 2 })
    expect(ctx.getCellStyle({ row: 0, col: 0 })?.numFmt).toEqual({ type: 'fixed', digits: 2 })
    expect(ctx.getCellStyle({ row: 0, col: 1 })?.numFmt).toEqual({ type: 'fixed', digits: 2 })
    sheet.undo()
  })

  it('设置数据格式：undo/redo 恢复样式', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 1, col: 1 }, 1.005)
    sheet.selectRange(createRange({ row: 1, col: 1 }, { row: 1, col: 1 }))
    const sub = buildBodyMenus(ctx).find((m) => m.label === '设置数据格式')!
    sub.children!.find((c) => c.label === '千分位金额')!.callback!()
    expect(ctx.getCellStyle({ row: 1, col: 1 })?.numFmt).toEqual({ type: 'thousands' })

    expect(ctx.undo()).toBe(true)
    expect(ctx.getCellStyle({ row: 1, col: 1 })?.numFmt).toBeUndefined()
    expect(ctx.redo()).toBe(true)
    expect(ctx.getCellStyle({ row: 1, col: 1 })?.numFmt).toEqual({ type: 'thousands' })
    expect(ctx.getCellData({ row: 1, col: 1 })?.v).toBe(1.005)
  })

  it('设置数据格式：清空选区时为无操作（不产生 undo 单元）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    sheet.selection.clear()
    applyNumFmtToSelection(ctx, { type: 'date' })
    expect(ctx.getCellStyle({ row: 0, col: 0 })).toBeUndefined()
    // undo 直接回滚到 setCellValue 之前，证明未新增 undo 单元
    expect(ctx.undo()).toBe(true)
    expect(ctx.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(ctx.canUndo).toBe(false)
  })

  it('body 插入图片 / 嵌入图片 / 设置数据格式：无活动格时禁用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selection.clear()
    const menus = buildBodyMenus(ctx)
    expect(menus.find((m) => m.label === '插入图片')?.disabled).toBe(true)
    expect(menus.find((m) => m.label === '嵌入图片')?.disabled).toBe(true)
    expect(menus.find((m) => m.label === '设置数据格式')?.disabled).toBe(true)
    // 无活动格：超链接项同样禁用
    expect(menus.find((m) => m.label === '插入超链接')?.disabled).toBe(true)
  })

  it('行号/列头菜单仍含插入删除行列', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    const rowLabels = buildRowHeaderMenus(ctx)
      .map((m) => m.label)
      .join()
    const colLabels = buildColHeaderMenus(ctx)
      .map((m) => m.label)
      .join()
    expect(rowLabels).toContain('在上方插入行')
    expect(rowLabels).toContain('在下方插入行')
    expect(rowLabels).toContain('删除行')
    expect(colLabels).toContain('在左侧插入列')
    expect(colLabels).toContain('在右侧插入列')
    expect(colLabels).toContain('删除列')
  })

  it('行号菜单：上方插入落在选区首行、下方插入落在末行+1', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 5, col: 0 }, 'keep')
    sheet.selectRange(createRange({ row: 1, col: 0 }, { row: 2, col: 5 }))
    const menus = buildRowHeaderMenus(ctx)
    // 模拟 confirm：直接调 insert（与 render onConfirm 同路径）
    ctx.insertRows(1, 2) // 上方
    expect(sheet.getDisplayValue({ row: 7, col: 0 })).toBe('keep')
    sheet.undo()
    ctx.insertRows(3, 2) // 下方 endRow+1
    expect(sheet.getDisplayValue({ row: 7, col: 0 })).toBe('keep')
    expect(menus[0]?.keepOpen).toBe(true)
  })
})

describe('buildBodyMenus 超链接项（按目标格链接状态出项）', () => {
  /** 记录句柄调用的简单 spy（mode + 编辑回填载荷） */
  function popupSpy() {
    const calls: Array<{ mode: string; initial?: { url: string; text?: string } }> = []
    const open = (mode: 'cell', initial?: { url: string; text?: string }): void => {
      calls.push({ mode, initial })
    }
    return { calls, open }
  }

  it('无链接格：仅「插入超链接」，callback 经句柄以 cell 模式拉起弹窗（无回填）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    const spy = popupSpy()
    const menus = buildBodyMenus(ctx, { openHyperlinkPopup: spy.open })
    const item = menus.find((m) => m.label === '插入超链接')!
    expect(item.disabled).toBeFalsy()
    expect(menus.some((m) => m.label === '编辑超链接')).toBe(false)
    expect(menus.some((m) => m.label === '取消超链接')).toBe(false)
    item.callback!()
    expect(spy.calls).toEqual([{ mode: 'cell', initial: undefined }])
  })

  it('有链接格：「编辑超链接」回填原 url/text；「取消超链接」clearCellLink 后 getCellLink undefined 且 undo 还原', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const addr = { row: 1, col: 2 }
    sheet.selectCell(addr)
    sheet.setCellLink(addr, { url: 'https://example.com', text: '示例' })
    const spy = popupSpy()
    const menus = buildBodyMenus(ctx, { openHyperlinkPopup: spy.open })

    expect(menus.some((m) => m.label === '插入超链接')).toBe(false)
    const edit = menus.find((m) => m.label === '编辑超链接')!
    expect(edit.disabled).toBeFalsy()
    edit.callback!()
    expect(spy.calls).toEqual([
      { mode: 'cell', initial: { url: 'https://example.com', text: '示例' } }
    ])

    const clear = menus.find((m) => m.label === '取消超链接')!
    expect(clear.disabled).toBeFalsy()
    clear.callback!()
    expect(ctx.getCellLink(addr)).toBeUndefined()
    expect(ctx.undo()).toBe(true)
    expect(ctx.getCellLink(addr)).toEqual({ url: 'https://example.com', text: '示例' })
  })

  it('readonly：插入/编辑/取消项禁用；句柄缺省：插入/编辑项禁用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })

    // 句柄缺省（无宿主接线，如直接调用 build）：插入禁用
    const noHandle = buildBodyMenus(ctx)
    expect(noHandle.find((m) => m.label === '插入超链接')?.disabled).toBe(true)

    // readonly：插入禁用
    const readonlyInsert = buildBodyMenus(ctx, { readonly: true, openHyperlinkPopup: () => {} })
    expect(readonlyInsert.find((m) => m.label === '插入超链接')?.disabled).toBe(true)

    // readonly + 有链接：编辑/取消均禁用
    sheet.setCellLink({ row: 0, col: 0 }, { url: 'https://example.com' })
    const readonlyEdit = buildBodyMenus(ctx, { readonly: true, openHyperlinkPopup: () => {} })
    expect(readonlyEdit.find((m) => m.label === '编辑超链接')?.disabled).toBe(true)
    expect(readonlyEdit.find((m) => m.label === '取消超链接')?.disabled).toBe(true)
    // readonly 不产生模型写入
    expect(readonlyEdit.find((m) => m.label === '取消超链接')?.callback).toBeTruthy()
  })
})

describe('buildBodyMenus 嵌入图项（按目标格嵌入图状态出项）', () => {
  const ADDR = { row: 1, col: 2 }

  /** 弹窗句柄 spy（含图片目标记录） */
  function popupSpy() {
    const calls: Array<{
      mode: 'image'
      initial?: { url: string }
      target?: { kind: 'cell'; addr: { row: number; col: number } }
    }> = []
    return {
      calls,
      open: (
        mode: 'image',
        initial?: { url: string },
        target?: { kind: 'cell'; addr: { row: number; col: number } }
      ): void => {
        calls.push({ mode, initial, target })
      }
    }
  }

  /** 预览句柄 spy */
  function previewSpy() {
    const previews: unknown[] = []
    return { previews, open: (source: unknown): void => previews.push(source) }
  }

  it('无嵌入图：不出现图片项（普通格菜单 + 嵌入图片入口）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell(ADDR)
    const labels = buildBodyMenus(ctx).map((m) => m.label ?? (m.divider ? '---' : ''))
    expect(labels).toHaveLength(7)
    expect(labels).toContain('嵌入图片')
    for (const label of [
      '预览',
      '图片超链接',
      '取消超链接',
      '转为浮动图片',
      '替换图片',
      '移除图片'
    ]) {
      expect(labels).not.toContain(label)
    }
  })

  it('嵌入图格出纯图片菜单：不含合并/数据格式/超链接/插入图片等普通格项（无链接）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    ctx.insertCellImage(ADDR, { src: 'https://example.com/a.png' })
    sheet.selectCell(ADDR)
    const popup = popupSpy()
    const preview = previewSpy()

    const menus = buildBodyMenus(ctx, {
      openHyperlinkPopup: popup.open,
      openImagePreview: preview.open
    })
    expect(menus.map((m) => m.label)).toEqual([
      '预览',
      '图片超链接',
      '转为浮动图片',
      '替换图片',
      '移除图片'
    ])
    for (const label of [
      '合并单元格',
      '取消合并单元格',
      '设置数据格式',
      '插入超链接',
      '插入图片',
      '嵌入图片'
    ]) {
      expect(menus.find((m) => m.label === label)).toBeUndefined()
    }

    menus.find((m) => m.label === '预览')!.callback!()
    expect(preview.previews).toEqual([{ src: 'https://example.com/a.png' }])
    menus.find((m) => m.label === '图片超链接')!.callback!()
    expect(popup.calls).toEqual([
      { mode: 'image', initial: undefined, target: { kind: 'cell', addr: ADDR } }
    ])
  })

  it('有链接嵌入图：含取消超链接；图片超链接回填 url；取消清 link 保其余字段且 undo 还原', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    ctx.insertCellImage(ADDR, { src: 'https://example.com/a.png', link: 'https://example.com' })
    sheet.selectCell(ADDR)
    const popup = popupSpy()

    const menus = buildBodyMenus(ctx, { openHyperlinkPopup: popup.open })
    expect(menus.map((m) => m.label)).toEqual([
      '预览',
      '图片超链接',
      '取消超链接',
      '转为浮动图片',
      '替换图片',
      '移除图片'
    ])

    menus.find((m) => m.label === '图片超链接')!.callback!()
    expect(popup.calls).toEqual([
      {
        mode: 'image',
        initial: { url: 'https://example.com' },
        target: { kind: 'cell', addr: ADDR }
      }
    ])

    menus.find((m) => m.label === '取消超链接')!.callback!()
    expect(ctx.getCellImage(ADDR)).toEqual({ src: 'https://example.com/a.png' })
    expect(ctx.undo()).toBe(true)
    expect(ctx.getCellImage(ADDR)).toEqual({
      src: 'https://example.com/a.png',
      link: 'https://example.com'
    })
  })

  it('移除图片：hasCellImage false 且 undo 还原', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    ctx.insertCellImage(ADDR, { src: 'https://example.com/a.png' })
    sheet.selectCell(ADDR)

    buildBodyMenus(ctx).find((m) => m.label === '移除图片')!.callback!()
    expect(ctx.hasCellImage(ADDR)).toBe(false)
    expect(ctx.undo()).toBe(true)
    expect(ctx.hasCellImage(ADDR)).toBe(true)
  })

  it('转为浮动图片：锚点格落浮动图（格宽高定尺寸、contain 保比例），link 随迁，单 undo 还原', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setRowHeight(ADDR.row, 64)
    sheet.setColWidth(ADDR.col, 120)
    ctx.insertCellImage(ADDR, {
      src: 'https://example.com/a.png',
      type: 'png',
      link: 'https://example.com'
    })
    sheet.selectCell(ADDR)

    buildBodyMenus(ctx).find((m) => m.label === '转为浮动图片')!.callback!()
    // 嵌入图消失，浮动图落在锚点格：尺寸取格宽高，src/link 随迁，fit 对齐嵌入图缺省 contain
    expect(ctx.hasCellImage(ADDR)).toBe(false)
    const floats = ctx.getImages()
    expect(floats).toHaveLength(1)
    expect(floats[0]?.anchor.from).toEqual(ADDR)
    expect(floats[0]?.width).toBe(120)
    expect(floats[0]?.height).toBe(64)
    expect(floats[0]?.fit).toBe('contain')
    expect(floats[0]?.src).toBe('https://example.com/a.png')
    expect(floats[0]?.link).toBe('https://example.com')

    // 事务合并：一次 undo 同时还原嵌入图、清掉浮动图
    expect(ctx.undo()).toBe(true)
    expect(ctx.hasCellImage(ADDR)).toBe(true)
    expect(ctx.getImages()).toHaveLength(0)
  })

  it('转为浮动图片：data 字节图迁字节；无嵌入图无操作', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const addr = { row: 3, col: 4 }
    ctx.insertCellImage(addr, { data: new Uint8Array([7, 8]), type: 'gif' })

    cellImageToFloat(ctx, addr)
    const floats = ctx.getImages()
    expect(floats).toHaveLength(1)
    expect([...floats[0]!.data]).toEqual([7, 8])
    expect(floats[0]!.type).toBe('gif')
    expect(floats[0]!.src).toBeUndefined()

    // 无嵌入图：无操作（不产生浮动图、不新增 undo 单元）
    const undoSizeBefore = sheet.history.undoSize
    cellImageToFloat(ctx, { row: 0, col: 0 })
    expect(ctx.getImages()).toHaveLength(1)
    expect(sheet.history.undoSize).toBe(undoSizeBefore)
  })

  it('readonly：图片超链接/取消超链接/转浮动/替换/移除禁用、预览可用；句柄缺省：预览/图片超链接禁用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    ctx.insertCellImage(ADDR, { src: 'https://example.com/a.png', link: 'https://e.com' })
    sheet.selectCell(ADDR)

    const readonly = buildBodyMenus(ctx, {
      readonly: true,
      openHyperlinkPopup: () => {},
      openImagePreview: () => {}
    })
    expect(readonly.find((m) => m.label === '预览')?.disabled).toBeFalsy()
    expect(readonly.find((m) => m.label === '图片超链接')?.disabled).toBe(true)
    expect(readonly.find((m) => m.label === '取消超链接')?.disabled).toBe(true)
    expect(readonly.find((m) => m.label === '转为浮动图片')?.disabled).toBe(true)
    expect(readonly.find((m) => m.label === '替换图片')?.disabled).toBe(true)
    expect(readonly.find((m) => m.label === '移除图片')?.disabled).toBe(true)

    const noHandles = buildBodyMenus(ctx)
    expect(noHandles.find((m) => m.label === '预览')?.disabled).toBe(true)
    expect(noHandles.find((m) => m.label === '图片超链接')?.disabled).toBe(true)
    expect(noHandles.find((m) => m.label === '转为浮动图片')?.disabled).toBeFalsy()
    expect(noHandles.find((m) => m.label === '移除图片')?.disabled).toBeFalsy()
  })
})
