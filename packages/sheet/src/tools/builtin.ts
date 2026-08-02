import { rangesEqual } from '../core/address'
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
