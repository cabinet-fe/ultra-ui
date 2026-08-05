/**
 * 边框预设生成（纯函数，无 vue 依赖）：把「全边框 / 外边框 / 内边框 / 单侧边框 / 无边框」
 * 展开为逐格样式补丁，供 `sheet.command.set-cell-style` 一次执行（单 undo 单元，
 * 邻居格补丁进同一 items 数组，undo 自动还原邻居）。
 *
 * 共享边语义对齐 Excel / univer「写入时同步邻居，最近设置生效」（渲染层不做仲裁）：
 * - 全边框：选区每格四边写入——共享边两侧双写同一样式，天然一致
 * - 外边框：选区边缘格写对应边；选区外一圈邻居格的**对侧边写 null**——
 *   一条共享边只保留一份权威数据（邻居残留边不会再画到选区边界上）
 * - 内边框：只写选区内部共享边（双写一致），不触界外邻居；单格选区 = 空操作
 * - 上/下/左/右边框：边界行/列写对应边；界外邻居对侧边写 null
 * - 无边框：每格四边写 null（配合边级合并 = 重定义为空集合）+
 *   选区外一圈邻居格的对侧边写 null（否则邻居残留边会画到本格边界上）
 *
 * 邻居 null 边只在邻居确有该边时生成（getStyle 读取现样式），避免无意义补丁项。
 */

import { iterateRange, type CellAddress, type CellRange } from '../address'
import type { BorderEdge, BorderSide, CellStyle, CellStylePatch } from './types'

/** 边框预设 */
export type BorderPreset = 'outer' | 'inner' | 'all' | 'top' | 'bottom' | 'left' | 'right' | 'none'

/** 预设展开后的补丁项（addr + 边级合并 patch） */
export interface BorderPresetItem {
  addr: CellAddress
  patch: CellStylePatch
}

/** 对侧边（共享边的另一侧）：top↔bottom、left↔right */
const OPPOSITE_SIDE: Record<BorderSide, BorderSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right'
}

/** 选区外某侧的邻居地址清单（越界侧返回空） */
function neighborAddresses(range: CellRange, side: BorderSide): CellAddress[] {
  const { start, end } = range
  const addrs: CellAddress[] = []
  if (side === 'top' && start.row > 0) {
    for (let col = start.col; col <= end.col; col++) addrs.push({ row: start.row - 1, col })
  } else if (side === 'bottom') {
    for (let col = start.col; col <= end.col; col++) addrs.push({ row: end.row + 1, col })
  } else if (side === 'left' && start.col > 0) {
    for (let row = start.row; row <= end.row; row++) addrs.push({ row, col: start.col - 1 })
  } else if (side === 'right') {
    for (let row = start.row; row <= end.row; row++) addrs.push({ row, col: end.col + 1 })
  }
  return addrs
}

/**
 * 生成「清除选区外某侧邻居对侧边」的 null 补丁：邻居确有该边时才生成
 * （null = 边级删除，邻居其余边保留）。
 */
function buildNeighborNullItems(
  range: CellRange,
  sides: readonly BorderSide[],
  getStyle: (addr: CellAddress) => CellStyle | undefined
): BorderPresetItem[] {
  const items: BorderPresetItem[] = []
  for (const side of sides) {
    const opposite = OPPOSITE_SIDE[side]
    for (const addr of neighborAddresses(range, side)) {
      if (!getStyle(addr)?.border?.[opposite]) continue
      items.push({ addr, patch: { border: { [opposite]: null } } })
    }
  }
  return items
}

/**
 * 边框预设 → 逐格补丁（含邻居同步）。
 *
 * @param range 目标选区（闭区间）
 * @param preset 预设：outer / inner / all / top / bottom / left / right / none
 * @param edge 线型 + 颜色已合成的边定义（none 预设有参数无感知，仅清边）
 * @param getStyle 读取任意格现样式（合成邻居 null 边清单用；原始存储语义）
 * @returns 补丁项数组，交给 set-cell-style 命令一次执行 = 单 undo 单元
 */
export function buildBorderPresetItems(
  range: CellRange,
  preset: BorderPreset,
  edge: BorderEdge,
  getStyle: (addr: CellAddress) => CellStyle | undefined
): BorderPresetItem[] {
  const items: BorderPresetItem[] = []

  if (preset === 'none') {
    // 显式四边 null = 重定义为空集合（边级合并语义下逐边删除）
    for (const addr of iterateRange(range)) {
      items.push({ addr, patch: { border: { top: null, right: null, bottom: null, left: null } } })
    }
    items.push(...buildNeighborNullItems(range, ['top', 'bottom', 'left', 'right'], getStyle))
    return items
  }

  for (const addr of iterateRange(range)) {
    const border: CellStylePatch['border'] = {}
    const onTop = addr.row === range.start.row
    const onBottom = addr.row === range.end.row
    const onLeft = addr.col === range.start.col
    const onRight = addr.col === range.end.col

    if (preset === 'all' || (preset === 'outer' && onTop) || (preset === 'top' && onTop)) {
      border.top = { ...edge }
    }
    if (preset === 'all' || (preset === 'outer' && onRight) || (preset === 'right' && onRight)) {
      border.right = { ...edge }
    }
    if (preset === 'all' || (preset === 'outer' && onBottom) || (preset === 'bottom' && onBottom)) {
      border.bottom = { ...edge }
    }
    if (preset === 'all' || (preset === 'outer' && onLeft) || (preset === 'left' && onLeft)) {
      border.left = { ...edge }
    }

    // 内边框：非边界侧 = 内部共享边；两侧双写一致，单格选区四侧皆边界 → 空操作
    if (preset === 'inner') {
      if (!onTop) border.top = { ...edge }
      if (!onBottom) border.bottom = { ...edge }
      if (!onLeft) border.left = { ...edge }
      if (!onRight) border.right = { ...edge }
    }

    if (Object.keys(border).length > 0) items.push({ addr, patch: { border } })
  }

  // 外边框：清选区外一圈邻居的对侧边；单侧边框：清对应侧邻居对侧边。
  // 全边框 / 内边框共享边已双写一致，不触碰选区外（同 Excel）
  if (preset === 'outer') {
    items.push(...buildNeighborNullItems(range, ['top', 'bottom', 'left', 'right'], getStyle))
  } else if (preset === 'top') {
    items.push(...buildNeighborNullItems(range, ['top'], getStyle))
  } else if (preset === 'bottom') {
    items.push(...buildNeighborNullItems(range, ['bottom'], getStyle))
  } else if (preset === 'left') {
    items.push(...buildNeighborNullItems(range, ['left'], getStyle))
  } else if (preset === 'right') {
    items.push(...buildNeighborNullItems(range, ['right'], getStyle))
  }
  return items
}
