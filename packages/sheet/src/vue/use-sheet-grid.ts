import { contextmenu } from '@veltra/desktop'
import { onBeforeUnmount, onMounted, watch } from 'vue'

import { rangeContainsAddress, type CellAddress } from '../core/address'
import type { Sheet } from '../core/sheet'
import { SheetGrid, type SheetGridContextMenuInfo } from '../grid/sheet-grid'
import type { SheetContext } from '../tools/context'
import { defaultToolRegistry, type SheetTool } from '../tools/registry'
import type { SheetProps } from '../types'

/** 模板 ref（useTemplateRef 的只读形态） */
type ElRef<T> = { readonly value: T | null | undefined }

/** 公式栏暴露的网格编辑镜像接口（formula-bar.vue defineExpose） */
export interface FormulaBarMirror {
  mirrorGridEdit: (addr: CellAddress) => void
  exitMirror: (addr: CellAddress) => void
}

interface UseSheetGridOptions {
  props: SheetProps
  /** grid 容器模板 ref */
  gridRef: ElRef<HTMLElement>
  getActiveSheet: () => Sheet
  context: SheetContext
  /** 打开弹层型工具（插入行/列数量面板与工具栏入口共用） */
  openToolPopup: (tool: SheetTool | undefined) => void
  formulaBarRef: ElRef<FormulaBarMirror>
}

/**
 * SheetGrid 生命周期与网格右键菜单：
 * - rebuildGrid：释放旧实例并按当前活动 sheet 重建（tab 切换 / structure-change /
 *   导入扩张 / rows、cols props 变化；数据/选区/冻结/行高随重建恢复）
 * - 右键菜单：合并 / 取消合并 / 插入行 / 插入列 / 删除行 / 删除列（语义对齐内置工具，
 *   插入行列经 openToolPopup 打开数量输入面板）
 */
export function useSheetGrid(options: UseSheetGridOptions) {
  const { props, gridRef, getActiveSheet, context, openToolPopup, formulaBarRef } = options
  let grid: SheetGrid | undefined

  function handleContextMenu(info: SheetGridContextMenuInfo): void {
    // body 格：若点击落在当前选区外则先选中该格；行号/列头保留当前选区
    if (info.addr) {
      const inSelection = context
        .getSelection()
        .ranges.some((range) => rangeContainsAddress(range, info.addr!))
      if (!inSelection) context.selectCell(info.addr)
    }

    const mergeTool = defaultToolRegistry.get('merge')
    const unmergeTool = defaultToolRegistry.get('unmerge')
    const insertRowsTool = defaultToolRegistry.get('insert-rows')
    const insertColsTool = defaultToolRegistry.get('insert-cols')
    const deleteRowsTool = defaultToolRegistry.get('delete-rows')
    const deleteColsTool = defaultToolRegistry.get('delete-cols')

    contextmenu.pop({
      mousePosition: { x: info.x, y: info.y },
      width: 180,
      menus: [
        {
          label: '合并单元格',
          disabled: mergeTool?.disabled?.(context) ?? true,
          callback: () => mergeTool?.onClick(context)
        },
        {
          label: '取消合并单元格',
          disabled: unmergeTool?.disabled?.(context) ?? true,
          callback: () => unmergeTool?.onClick(context)
        },
        {
          label: '插入行',
          disabled: insertRowsTool?.disabled?.(context) ?? true,
          callback: () => openToolPopup(insertRowsTool)
        },
        {
          label: '插入列',
          disabled: insertColsTool?.disabled?.(context) ?? true,
          callback: () => openToolPopup(insertColsTool)
        },
        {
          label: '删除行',
          disabled: deleteRowsTool?.disabled?.(context) ?? true,
          callback: () => deleteRowsTool?.onClick(context)
        },
        {
          label: '删除列',
          disabled: deleteColsTool?.disabled?.(context) ?? true,
          callback: () => deleteColsTool?.onClick(context)
        }
      ]
    })
  }

  function rebuildGrid(): void {
    const container = gridRef.value
    if (!container) return
    grid?.release()
    grid = new SheetGrid({
      container,
      sheet: getActiveSheet(),
      rows: props.rows,
      cols: props.cols,
      onContextMenu: handleContextMenu,
      // 网格进入编辑 → 公式栏镜像实时文本；编辑结束（提交/取消）→ 退出镜像
      onEditStart: (addr) => formulaBarRef.value?.mirrorGridEdit(addr),
      onEditEnd: (addr) => formulaBarRef.value?.exitMirror(addr)
    })
  }

  onMounted(rebuildGrid)

  watch(() => [props.rows, props.cols], rebuildGrid)

  onBeforeUnmount(() => {
    grid?.release()
    grid = undefined
  })

  return { rebuildGrid, getGrid: () => grid }
}
