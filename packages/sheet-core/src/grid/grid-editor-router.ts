import { register } from '@visactor/vtable'
import type { ListTable } from '@visactor/vtable'
import { InputEditor } from '@visactor/vtable-editors'
import type { EditContext } from '@visactor/vtable-editors'

import type { SheetGrid } from './sheet-grid'

/** 公式感知编辑器：进入编辑时公式格显示原文（同 Excel），其余格显示当前值 */
export class FormulaAwareInputEditor extends InputEditor {
  /** 由 SheetGrid 注入：返回进入编辑时应显示的文本；undefined = 用 VTable 默认值 */
  resolveEditText?: (table: ListTable, col: number, row: number) => string | undefined
  /** 由 SheetGrid 注入：进入编辑（onStart）时通知，供公式栏镜像实时文本 */
  notifyEditStart?: (table: ListTable, col: number, row: number) => void
  /** 由 SheetGrid 注入：编辑结束（onEnd，提交/取消）时通知，供公式栏退出镜像 */
  notifyEditEnd?: (table: ListTable | undefined) => void

  /**
   * 当前编辑会话的 table：onStart 从 EditContext 捕获、onEnd（无参回调）用于路由。
   * 编辑器为单例但编辑会话串行（开启新会话前旧会话必已 complete/cancel），
   * 故实例字段足够；onEnd 后清空，未配对 onEnd 时按 undefined 安全 no-op。
   */
  private editingTable: ListTable | undefined

  override onStart(context: EditContext<string>): void {
    const table = context.table as ListTable
    this.editingTable = table
    this.notifyEditStart?.(table, context.col, context.row)
    const text = this.resolveEditText?.(table, context.col, context.row)
    super.onStart(text === undefined ? context : { ...context, value: text })
  }

  override onEnd(): void {
    // 编辑结束即通知（先于 super：happy-dom 下 element 未挂载时 super 直接 return）
    const table = this.editingTable
    this.editingTable = undefined
    this.notifyEditEnd?.(table)
    super.onEnd()
  }
}

/**
 * 编辑器全局单例（#1 泄露修复）：VTable 的 `register.editor` 写入模块级全局
 * `editors = {}` 且只有 `clearAll()` 全清（连带 themes）、无单条注销 API。
 * 旧实现每个 grid 实例注册一个名称单调递增的编辑器（`veltra-sheet-input-N`），
 * 3 个 hook 闭包捕获实例 → 拖住 sheet（整个模型）与 table.options 永久无法 GC。
 * 现改为：全局只注册一个固定名编辑器，hook 由发起编辑的 ListTable（onStart 的
 * EditContext.table；onEnd 无参，用 onStart 捕获的会话 table）经 `gridByTable`
 * 反查所属 SheetGrid——多实例同页时路由精确，不依赖「当前激活」全局槽；
 * 编辑器注册表不再随实例增长，被释放实例的模型可被 GC（WeakMap 不持强引用）。
 */
export const EDITOR_NAME = 'veltra-sheet-input'

/** ListTable → 所属 SheetGrid：构造时登记、release 时删除（编辑器 hook 路由表） */
const gridByTable = new WeakMap<ListTable, SheetGrid>()

/** 单例编辑器：所有 SheetGrid 共享；hook 按发起编辑的 table 反查实例，查不到安全 no-op */
export const formulaAwareEditor = new FormulaAwareInputEditor()
formulaAwareEditor.resolveEditText = (table, col, row) =>
  gridByTable.get(table)?.resolveEditTextForEditor(col, row)
formulaAwareEditor.notifyEditStart = (table, col, row) =>
  gridByTable.get(table)?.notifyEditorEditStart(col, row)
formulaAwareEditor.notifyEditEnd = (table) => {
  if (table) gridByTable.get(table)?.notifyEditorEditEnd()
}
register.editor(EDITOR_NAME, formulaAwareEditor)

export function registerGridEditor(table: ListTable, grid: SheetGrid): void {
  gridByTable.set(table, grid)
}

export function unregisterGridEditor(table: ListTable): void {
  gridByTable.delete(table)
}
