import type { DeconstructValue } from '@veltra/utils'
import type { Sheet } from 'infinitable/sheet'
import type { Workbook } from 'infinitable/sheet'
import type {
  ResolveCellRenderer,
  ResolveCellStyleHook,
  ResolveDisplayValue,
  ScrollbarOptions,
  SheetGrid,
  SheetGridEditorsOptions,
  SheetGridHeaderOptions
} from 'infinitable/sheet'
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
   * 显示值覆盖（设计态 Binding Placeholder 等）：覆盖引擎视口显示文本，不写 CellData.v
   */
  resolveDisplayValue?: ResolveDisplayValue
  /**
   * 动态单元格样式：视口渲染时叠加条件样式补丁，不写 CellData.s / StylePool
   */
  resolveCellStyle?: ResolveCellStyleHook
  /**
   * 动态单元格渲染（ADR-0004）：视口布局时按格自定义渲染形态（返回引擎
   * `CellRenderer`，见 `infinitable/sheet`），返回 undefined 回落默认渲染；
   * 不写模型、不进快照
   */
  resolveCellRenderer?: ResolveCellRenderer
  /**
   * 列头机制（透传 SheetGrid）：按列列头标题与表头自定义 DOM 渲染，不传保持
   * 缺省字母表头；传值变化（引用更替）触发网格重建
   */
  header?: SheetGridHeaderOptions
  /**
   * 类型化编辑器机制（透传 SheetGrid）：多编辑器注册与按格路由，不传保持统一
   * 文本编辑器；readonly 下忽略；传值变化（引用更替）触发网格重建
   */
  editors?: SheetGridEditorsOptions
  /** 是否显示工具栏，默认 true */
  showToolbar?: boolean
  /** 是否显示顶部公式栏（名称框 + fx 输入栏），默认 true */
  showFormulaBar?: boolean
  /** 是否显示底部 sheet 标签栏，默认 true */
  showTabs?: boolean
  /** 是否显示行号列，默认 true */
  showRowHeader?: boolean
  /** 是否显示列字母表头，默认 true */
  showColHeader?: boolean
  /** 只读预览（关闭编辑回写、填充柄等写入口） */
  readonly?: boolean
  /**
   * 列宽拖拽（透传 SheetGrid）：readonly 下置 true 仅放开列头 resize 手柄，编辑仍
   * 关闭；缺省 false 行为不变。变化触发网格重建（构造期选项）
   */
  colResize?: boolean
  /**
   * 滚动条（透传 SheetGrid → 引擎内建，构造期选项）：false 整体关闭（不显示任何
   * 滚动条）；缺省原生档 `{ mode: 'native' }`——浏览器原生滚动条在独立 gutter
   * 渲染、不遮挡最底行/最右列；true 与对象形态按引擎语义透传（对象可配
   * `mode: 'canvas'` 回画布悬浮滚动条，及 visibility / hideDelay / reserve 等
   * canvas 档显示策略）。对象形态引用更替触发网格重建——沿用 header / editors
   * 的稳定引用约定，宿主勿在模板内联对象字面量
   */
  scrollbar?: boolean | ScrollbarOptions
}

export interface SheetEmits {
  /** 激活 sheet 切换（点击 tab 或宿主调用 workbook.activateSheet） */
  (name: 'active-sheet-change', payload: { sheet: Sheet; index: number }): void
  /** 列宽拖拽落定（写模型之后）：载荷含列索引与最终宽度 */
  (name: 'col-resize-end', payload: { col: number; width: number }): void
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
