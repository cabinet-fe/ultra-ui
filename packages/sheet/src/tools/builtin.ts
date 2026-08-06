import { FontColor } from '@veltra/icons/colorful'
import {
  AlignBottom,
  AlignCenter,
  AlignTop,
  Bold,
  Border,
  Download,
  Fill,
  FontSize,
  Italic,
  MergeCells,
  PictureRounded,
  Rollback,
  Rollfront,
  Search,
  Strikethrough,
  Underline,
  UnmergeCells,
  Upload,
  VerticalAlignCenter,
  VerticalAlignLeft,
  VerticalAlignRight,
  Wrap
} from '@veltra/icons/normal'
import { rangesEqual } from '@veltra/sheet-core/core/address'
import type { HorizontalAlign, VerticalAlign } from '@veltra/sheet-core/core/style/types'

import type { SheetContext } from './context'
import { registerTool } from './registry'

/** 取活动格所在首选区；无选区返回 null */
function selectionRange(ctx: SheetContext) {
  const { activeCell, ranges } = ctx.getSelection()
  const range = ranges[0]
  if (!activeCell || !range) return null
  return { activeCell, range }
}

/** 字体 toggle：以活动格当前值为基准，对选区统一翻转（Excel 语义） */
function toggleFontFlag(
  ctx: SheetContext,
  field: 'bold' | 'italic' | 'underline' | 'strikethrough'
): void {
  const sel = selectionRange(ctx)
  if (!sel) return
  const on = ctx.getCellStyle(sel.activeCell)?.font?.[field] === true
  ctx.setCellStyle(sel.range, { font: { [field]: on ? null : true } })
}

/** 对齐 toggle：点当前档 = 清除，点其它档 = 切换 */
function toggleAlign(
  ctx: SheetContext,
  axis: 'horizontal' | 'vertical',
  value: HorizontalAlign | VerticalAlign
): void {
  const sel = selectionRange(ctx)
  if (!sel) return
  const current = ctx.getCellStyle(sel.activeCell)?.align?.[axis]
  if (current === value) {
    ctx.setCellStyle(sel.range, { align: { [axis]: null } })
  } else {
    ctx.setCellStyle(sel.range, { align: { [axis]: value } })
  }
}

/**
 * 内置工具（dogfood 扩展机制）。
 *
 * 分组：history ｜ cell ｜ text ｜ edit ｜ insert ｜ file。
 * 与第三方工具走同一注册通道，可由宿主 unregisterTool 移除或同 id 覆盖。
 * 本模块由包入口引入：经包入口导入即完成注册。
 */

// ─── history ───────────────────────────────────────────────

registerTool({
  id: 'undo',
  title: '撤销',
  icon: Rollback,
  tooltip: '撤销（Ctrl/Cmd+Z）',
  group: 'history',
  order: 0,
  disabled: (ctx) => !ctx.canUndo,
  onClick: (ctx) => {
    ctx.undo()
  }
})

registerTool({
  id: 'redo',
  title: '重做',
  icon: Rollfront,
  tooltip: '重做（Ctrl/Cmd+Shift+Z 或 Ctrl+Y）',
  group: 'history',
  order: 1,
  disabled: (ctx) => !ctx.canRedo,
  onClick: (ctx) => {
    ctx.redo()
  }
})

// ─── cell（边框 / 填充颜色 / 合并 / 取消合并）────────────────

registerTool({
  id: 'border',
  title: '边框',
  icon: Border,
  tooltip: '设置单元格边框',
  group: 'cell',
  order: 0,
  popup: 'border',
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: () => {}
})

registerTool({
  id: 'fill-color',
  title: '填充颜色',
  icon: Fill,
  tooltip: '设置单元格背景填充',
  group: 'cell',
  order: 1,
  popup: 'fill-color',
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: () => {}
})

registerTool({
  id: 'merge',
  title: '合并',
  icon: MergeCells,
  tooltip: '合并选中区域',
  group: 'cell',
  order: 2,
  disabled: (ctx) => {
    const { activeCell, ranges } = ctx.getSelection()
    const range = ranges[0]
    if (!activeCell || !range) return true
    // 单格无可合并
    if (range.start.row === range.end.row && range.start.col === range.end.col) return true
    // 选区恰好等于既有合并区域 → 无操作必要
    const mergeRange = ctx.getCellInfo(activeCell).mergeRange
    return !!mergeRange && rangesEqual(mergeRange, range)
  },
  onClick: (ctx) => {
    const range = ctx.getSelection().ranges[0]
    if (!range) return
    ctx.mergeCells(range)
  }
})

registerTool({
  id: 'unmerge',
  title: '取消合并',
  icon: UnmergeCells,
  tooltip: '取消活动格所在合并',
  group: 'cell',
  order: 3,
  disabled: (ctx) => {
    const { activeCell } = ctx.getSelection()
    if (!activeCell) return true
    return !ctx.getCellInfo(activeCell).mergeRange
  },
  onClick: (ctx) => {
    const { activeCell, ranges } = ctx.getSelection()
    if (!activeCell || !ranges[0]) return
    ctx.unmergeCells(ranges[0])
  }
})

// ─── text（B/I/U/S / 字体颜色 / 字号 / 对齐×6 / 自动换行）────

registerTool({
  id: 'bold',
  title: '加粗',
  icon: Bold,
  tooltip: '加粗',
  group: 'text',
  order: 0,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.font?.bold === true
  },
  onClick: (ctx) => toggleFontFlag(ctx, 'bold')
})

registerTool({
  id: 'italic',
  title: '斜体',
  icon: Italic,
  tooltip: '斜体',
  group: 'text',
  order: 1,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.font?.italic === true
  },
  onClick: (ctx) => toggleFontFlag(ctx, 'italic')
})

registerTool({
  id: 'underline',
  title: '下划线',
  icon: Underline,
  tooltip: '下划线',
  group: 'text',
  order: 2,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.font?.underline === true
  },
  onClick: (ctx) => toggleFontFlag(ctx, 'underline')
})

registerTool({
  id: 'strikethrough',
  title: '删除线',
  icon: Strikethrough,
  tooltip: '删除线',
  group: 'text',
  order: 3,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.font?.strikethrough === true
  },
  onClick: (ctx) => toggleFontFlag(ctx, 'strikethrough')
})

registerTool({
  id: 'font-color',
  title: '字体颜色',
  icon: FontColor,
  tooltip: '设置字体颜色',
  group: 'text',
  order: 4,
  popup: 'font-color',
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: () => {}
})

registerTool({
  id: 'font-size',
  title: '字号',
  icon: FontSize,
  tooltip: '设置字体大小',
  group: 'text',
  order: 5,
  popup: 'font-size',
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: () => {}
})

registerTool({
  id: 'align-left',
  title: '左对齐',
  icon: VerticalAlignLeft,
  tooltip: '水平左对齐',
  group: 'text',
  order: 6,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.align?.horizontal === 'left'
  },
  onClick: (ctx) => toggleAlign(ctx, 'horizontal', 'left')
})

registerTool({
  id: 'align-center',
  title: '居中',
  icon: VerticalAlignCenter,
  tooltip: '水平居中',
  group: 'text',
  order: 7,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.align?.horizontal === 'center'
  },
  onClick: (ctx) => toggleAlign(ctx, 'horizontal', 'center')
})

registerTool({
  id: 'align-right',
  title: '右对齐',
  icon: VerticalAlignRight,
  tooltip: '水平右对齐',
  group: 'text',
  order: 8,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.align?.horizontal === 'right'
  },
  onClick: (ctx) => toggleAlign(ctx, 'horizontal', 'right')
})

registerTool({
  id: 'valign-top',
  title: '顶端对齐',
  icon: AlignTop,
  tooltip: '垂直顶端对齐',
  group: 'text',
  order: 9,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.align?.vertical === 'top'
  },
  onClick: (ctx) => toggleAlign(ctx, 'vertical', 'top')
})

registerTool({
  id: 'valign-middle',
  title: '垂直居中',
  icon: AlignCenter,
  tooltip: '垂直居中对齐',
  group: 'text',
  order: 10,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.align?.vertical === 'middle'
  },
  onClick: (ctx) => toggleAlign(ctx, 'vertical', 'middle')
})

registerTool({
  id: 'valign-bottom',
  title: '底端对齐',
  icon: AlignBottom,
  tooltip: '垂直底端对齐',
  group: 'text',
  order: 11,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.align?.vertical === 'bottom'
  },
  onClick: (ctx) => toggleAlign(ctx, 'vertical', 'bottom')
})

registerTool({
  id: 'wrap-text',
  title: '自动换行',
  icon: Wrap,
  tooltip: '自动换行',
  group: 'text',
  order: 12,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    return !!active && ctx.getCellStyle(active)?.align?.wrap === true
  },
  onClick: (ctx) => {
    const sel = selectionRange(ctx)
    if (!sel) return
    const on = ctx.getCellStyle(sel.activeCell)?.align?.wrap === true
    ctx.setCellStyle(sel.range, { align: { wrap: on ? null : true } })
  }
})

// ─── edit（查找）───────────────────────────────────────────

registerTool({
  id: 'find',
  title: '查找',
  icon: Search,
  tooltip: '查找与替换（Ctrl/Cmd+F）',
  group: 'edit',
  order: 0,
  popup: 'find',
  onClick: () => {}
})

// ─── insert（插入图片）─────────────────────────────────────

registerTool({
  id: 'insert-image',
  title: '插入图片',
  icon: PictureRounded,
  tooltip: '插入浮动图片',
  group: 'insert',
  order: 0,
  popup: 'insert-image',
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: () => {}
})

// ─── file（导入 / 导出）────────────────────────────────────
// 导出 = 弹层选 xlsx / csv；导入 = 点击直接系统文件选择（vue/import-file.ts，
// sheet.vue 覆盖 onClick；tools 层不 import vue）。
// 下载逻辑见 tools/download.ts（core/io 保持纯 TS 无头可测）。

registerTool({
  id: 'import',
  title: '导入',
  icon: Download,
  tooltip: '从 .xlsx / .csv 文件导入',
  group: 'file',
  order: 0,
  onClick: () => {}
})

registerTool({
  id: 'export',
  title: '导出',
  icon: Upload,
  tooltip: '导出为 Excel 或 CSV',
  group: 'file',
  order: 1,
  popup: 'export',
  onClick: () => {}
})
