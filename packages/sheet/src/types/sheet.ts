import type { Sheet } from '@veltra/sheet-core/core/sheet'
import type { Workbook } from '@veltra/sheet-core/core/workbook'
import type {
  ResolveCellRenderer,
  ResolveCellStyleHook,
  ResolveDisplayValue,
  SheetGrid
} from '@veltra/sheet-core/grid/sheet-grid'
import type { DeconstructValue } from '@veltra/utils'
import type { ComputedRef } from 'vue'

import type { SheetContext } from '../tools/context'

/** 电子表格组件属性 */
export interface SheetProps {
  /** 工作簿实例（多 sheet / 跨表公式的载体）；缺省内部自建（单 sheet） */
  workbook?: Workbook
  /** 渲染行数，默认 100 */
  rows?: number
  /** 渲染列数，默认 26（A..Z） */
  cols?: number
  /**
   * 显示值覆盖（设计态 Binding Placeholder 等）：覆盖 VTable record，不写 CellData.v
   */
  resolveDisplayValue?: ResolveDisplayValue
  /**
   * 动态单元格样式：视口渲染时叠加条件样式补丁，不写 CellData.s / StylePool
   */
  resolveCellStyle?: ResolveCellStyleHook
  /**
   * 动态单元格渲染（ADR-0004）：视口布局时按格自定义渲染形态（VTable
   * customLayout，布局构建用 sheet-core 导出的 CustomLayout），返回 undefined
   * 回落默认渲染；不写模型、不进快照
   */
  resolveCellRenderer?: ResolveCellRenderer
  /** 是否显示工具栏，默认 true */
  showToolbar?: boolean
  /** 是否显示顶部公式栏（名称框 + fx 输入栏），默认 true */
  showFormulaBar?: boolean
  /** 是否显示底部 sheet 标签栏，默认 true */
  showTabs?: boolean
  /** 只读预览（关闭编辑回写、填充柄等写入口） */
  readonly?: boolean
}

export interface SheetEmits {
  /** 激活 sheet 切换（点击 tab 或宿主调用 workbook.activateSheet） */
  (name: 'active-sheet-change', payload: { sheet: Sheet; index: number }): void
}

/** 在组件内部引用 */
export interface _SheetExposed {
  /** 当前工作簿（props.workbook 缺省时为内部自建实例） */
  workbook: ComputedRef<Workbook>
  /** 当前活动 sheet */
  getActiveSheet: () => Sheet
  /** 工具上下文（与工具栏工具同一门面；tab 切换后自动指向当前 sheet） */
  getContext: () => SheetContext
  /** 底层 SheetGrid（调试/测试用） */
  getGrid: () => SheetGrid | undefined
}

/** 电子表格组件暴露的属性和方法 */
export type SheetExposed = DeconstructValue<_SheetExposed>
