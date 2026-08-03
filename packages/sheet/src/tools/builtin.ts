import { rangesEqual } from '../core/address'
import { exportSheetCsv, exportWorkbookXlsx } from '../core/io/export'
import { registerTool } from './registry'

/**
 * 内置工具（dogfood 扩展机制）：undo/redo + 合并/取消合并。
 *
 * 与第三方工具走同一注册通道，可由宿主 unregisterTool 移除或同 id 覆盖。
 * 本模块由 tools/index.ts 引入（与 core/command 的 default-registry 同构）：
 * 经包入口导入即完成注册，无头使用 core 深导入不涉及此全局副作用。
 */

registerTool({
  id: 'undo',
  title: '撤销',
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
  tooltip: '重做（Ctrl/Cmd+Shift+Z 或 Ctrl+Y）',
  group: 'history',
  order: 1,
  disabled: (ctx) => !ctx.canRedo,
  onClick: (ctx) => {
    ctx.redo()
  }
})

registerTool({
  id: 'merge',
  title: '合并',
  tooltip: '合并选中区域',
  group: 'cell',
  order: 0,
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
  tooltip: '取消活动格所在合并',
  group: 'cell',
  order: 1,
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

// ─── 样式工具（弹层型：vue 层渲染面板，面板交互走 SheetContext 命令入口） ───

registerTool({
  id: 'fill-color',
  title: '填充颜色',
  tooltip: '设置单元格背景填充',
  group: 'cell',
  order: 2,
  popup: 'fill-color',
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: () => {}
})

registerTool({
  id: 'border',
  title: '边框',
  tooltip: '设置单元格边框',
  group: 'cell',
  order: 3,
  popup: 'border',
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: () => {}
})

// ─── 冻结工具（模型状态，不进 undo；active 高亮读当前冻结值） ───

registerTool({
  id: 'freeze',
  title: '冻结到当前行列',
  tooltip: '冻结活动单元格上方行与左侧列',
  group: 'freeze',
  order: 0,
  disabled: (ctx) => !ctx.getSelection().activeCell,
  active: (ctx) => {
    const active = ctx.getSelection().activeCell
    if (!active) return false
    const frozen = ctx.frozen
    return frozen.rows === active.row + 1 && frozen.cols === active.col + 1
  },
  onClick: (ctx) => {
    const active = ctx.getSelection().activeCell
    if (!active) return
    ctx.setFrozen(active.row + 1, active.col + 1)
  }
})

registerTool({
  id: 'freeze-row',
  title: '冻结首行',
  tooltip: '冻结第一行',
  group: 'freeze',
  order: 1,
  active: (ctx) => ctx.frozen.rows >= 1,
  onClick: (ctx) => {
    ctx.setFrozen(1, ctx.frozen.cols)
  }
})

registerTool({
  id: 'freeze-col',
  title: '冻结首列',
  tooltip: '冻结第一列',
  group: 'freeze',
  order: 2,
  active: (ctx) => ctx.frozen.cols >= 1,
  onClick: (ctx) => {
    ctx.setFrozen(ctx.frozen.rows, 1)
  }
})

registerTool({
  id: 'unfreeze',
  title: '取消冻结',
  tooltip: '取消全部冻结',
  group: 'freeze',
  order: 3,
  disabled: (ctx) => ctx.frozen.rows === 0 && ctx.frozen.cols === 0,
  onClick: (ctx) => {
    ctx.setFrozen(0, 0)
  }
})

// ─── 查找（弹层型：vue 层渲染查找条，交互走 SheetContext + core/find） ───

registerTool({
  id: 'find',
  title: '查找',
  tooltip: '查找与替换（Ctrl/Cmd+F）',
  group: 'default',
  order: 0,
  popup: 'find',
  onClick: () => {}
})

// ─── 导入导出工具（file 组：导出 xlsx / 导出 csv / 导入） ───
// 导出 = 生成 Blob 下载（浏览器 API 仅在此工具层使用，core/io 保持纯 TS 无头可测）；
// 导入 = 弹层型工具（vue 层渲染 UFilePicker 文件选择 + 替换工作簿确认提示）。

/** 生成浏览器下载（Blob → 临时 URL → a.click） */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

registerTool({
  id: 'export-xlsx',
  title: '导出 xlsx',
  tooltip: '导出当前工作簿为 .xlsx 文件（多 sheet / 公式 / 合并 / 样式 / 冻结 / 行高）',
  group: 'file',
  order: 0,
  onClick: (ctx) => {
    const workbook = ctx.workbook
    if (!workbook) return
    void exportWorkbookXlsx(workbook).then((buffer) => {
      downloadBlob(
        new Blob([buffer as unknown as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }),
        `${workbook.activeSheet.name || 'workbook'}.xlsx`
      )
    })
  }
})

registerTool({
  id: 'export-csv',
  title: '导出 csv',
  tooltip: '导出当前工作表为 .csv 文件（公式导计算值）',
  group: 'file',
  order: 1,
  onClick: (ctx) => {
    const workbook = ctx.workbook
    if (!workbook) return
    const csv = exportSheetCsv(workbook.activeSheet)
    downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `${workbook.activeSheet.name || 'sheet'}.csv`
    )
  }
})

registerTool({
  id: 'import',
  title: '导入',
  tooltip: '从 .xlsx / .csv 文件导入',
  group: 'file',
  order: 2,
  popup: 'import',
  onClick: () => {}
})
