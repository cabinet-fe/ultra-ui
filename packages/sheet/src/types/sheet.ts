import type { DeconstructValue } from '@veltra/utils'
import type {
  CellLinkClickEvent,
  CellLinkHoverEvent,
  CellLinkLeaveEvent,
  FloatContextMenuEvent,
  ImageLinkClickEvent
} from 'infinitable'
import type { Sheet } from 'infinitable/sheet'
import type { Workbook } from 'infinitable/sheet'
import type {
  CellAddress,
  ResolveCellRenderer,
  ResolveCellStyleHook,
  ResolveDisplayValue,
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
   * 滚动条）；缺省 true 画布常驻档——引擎归一化 canvas always + reserve，滚动条
   * 常驻画在画布内（reserve 只在画布内预留轨道，不占页面布局、不遮挡单元格）。
   * 变化触发网格重建
   */
  scrollbar?: boolean
  /**
   * 滚动近端动态增长（透传 SheetGrid，构造期选项）：滚动缓冲末端触到当前行列数
   * 时模型与引擎同步扩容（引擎缺省 true）；false 为固定尺寸网格——内容定尺寸的
   * 报表 / 表单宿主置 false 后不再滚入空白增长区。变化触发网格重建
   */
  growOnScroll?: boolean
}

/**
 * 浮动图右键事件载荷：引擎 `FloatContextMenuEvent` 关键字段 + 页面坐标。
 *
 * 右键命中浮动图时引擎不穿透到单元格右键（body 菜单不弹），宿主经
 * `float-context-menu` 自行弹浮动图菜单（预览 / 超链接 / 删除等）。
 */
export interface FloatContextMenuPayload {
  /** 命中的浮动对象 id */
  id: string
  /** 层坐标（CSS 像素，相对 grid 实例容器） */
  x: number
  y: number
  /** 页面视口坐标（层坐标 + grid 容器偏移；与 body 右键菜单同口径，供菜单定位） */
  clientX: number
  clientY: number
  /** 引擎原始右键事件（最小 DOM 事件结构） */
  originalEvent: FloatContextMenuEvent['originalEvent']
}

export interface SheetEmits {
  /** 激活 sheet 切换（点击 tab 或宿主调用 workbook.activateSheet） */
  (name: 'active-sheet-change', payload: { sheet: Sheet; index: number }): void
  /** 列宽拖拽落定（写模型之后）：载荷含列索引与最终宽度 */
  (name: 'col-resize-end', payload: { col: number; width: number }): void
  /**
   * 单元格超链接悬停（引擎 `CellLinkHoverEvent` 形态：格坐标 + URL/显示文本 +
   * 落点层坐标）；tooltip 由宿主渲染，ultra-ui 不接管
   */
  (name: 'cell-link-hover', payload: CellLinkHoverEvent): void
  /** 单元格超链接离开（引擎 `CellLinkLeaveEvent` 形态：刚离开的链接格坐标） */
  (name: 'cell-link-leave', payload: CellLinkLeaveEvent): void
  /**
   * 单元格超链接单击（引擎 `CellLinkClickEvent` 形态：真实指针 down+up 命中
   * 同一链接格；框选拖拽/键盘选中不触发）。组件已接管打开：emit 后直接新标签
   * 打开（引擎 `openCellLinkOnClick` 已关闭）
   */
  (name: 'cell-link-click', payload: CellLinkClickEvent): void
  /**
   * 图片链接单击（引擎 `ImageLinkClickEvent`，`kind` 区分 `cell` 嵌入图 /
   * `float` 浮动图）。组件已接管打开：emit 后弹确认框，确认才新标签打开
   * （防误触跳转；引擎 `openCellLinkOnClick` 已关闭）
   */
  (name: 'image-link-click', payload: ImageLinkClickEvent): void
  /**
   * 按格嵌入图变化（`{ addr?: CellAddress }` 定向语义：单格变更带 addr，
   * 结构平移/整表替换时缺省）；仅当前活动 sheet 的事件被透传
   */
  (name: 'cell-image-change', payload: { addr?: CellAddress }): void
  /**
   * 浮动图右键（载荷见 {@link FloatContextMenuPayload}；右键不穿透到
   * 单元格 body 菜单，宿主据此弹浮动图独立菜单）
   */
  (name: 'float-context-menu', payload: FloatContextMenuPayload): void
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
