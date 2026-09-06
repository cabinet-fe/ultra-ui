---
title: "USheet - 电子表格"
description: "接入 USheet；填报用 setRangeReadonly / setCellReadonly 锁格，并关掉工具栏与公式栏"
keywords:
  - USheet
  - @veltra/sheet
  - sheet
  - Sheet
  - 电子表格
aliases: ["sheet", "USheet", "Sheet", "电子表格"]
---
## 快速上手

```ts
import { USheet } from '@veltra/sheet'
```

## 典型示例

从 `@veltra/sheet` 引入 `USheet`。工作簿模型从 `@veltra/sheet-core` 引入，本包不 re-export。样式用 `import '@veltra/sheet/components/sheet/style'`，或走 `VeltraUIResolver`。`.u-sheet` 需要明确高度。格子坐标 0-based。

不传 `workbook` 时内部自建一张空表。需要预置表头或做填报时，由宿主 `new Workbook()` 再传入。

```vue
<script setup lang="ts">
import { USheet } from '@veltra/sheet'
import { Workbook } from '@veltra/sheet-core'
import '@veltra/sheet/components/sheet/style'

const workbook = new Workbook()
const sheet = workbook.activeSheet
sheet.setCellValue({ row: 0, col: 0 }, '品名')
sheet.setCellValue({ row: 0, col: 1 }, '数量')
sheet.setCellValue({ row: 1, col: 0 }, 'A4 纸')
</script>

<template>
  <u-sheet :workbook="workbook" :rows="40" :cols="10" style="height: 480px" />
</template>
```

### 填报：锁格并关掉写入口

只读标记走模型：`setRangeReadonly` 批量锁区（一次 undo），`setCellReadonly(addr, false)` 放开填写格。grid 会拦住双击、Enter、回写和填充柄。工具栏、公式栏**不走**这层守卫，填报页必须 `:show-toolbar="false"`、`:show-formula-bar="false"`。年度预算一类完整流程见 `recipes/sheet.md`。

```vue
<script setup lang="ts">
import { USheet } from '@veltra/sheet'
import { Workbook } from '@veltra/sheet-core'
import type { ResolveCellStyleHook } from '@veltra/sheet-core/grid'
import '@veltra/sheet/components/sheet/style'

const workbook = new Workbook()
const sheet = workbook.activeSheet
sheet.setCellValue({ row: 0, col: 0 }, '品名')
sheet.setCellValue({ row: 0, col: 1 }, '数量')
sheet.setCellValue({ row: 1, col: 0 }, 'A4 纸')

sheet.setRangeReadonly({ start: { row: 0, col: 0 }, end: { row: 99, col: 25 } })
sheet.setCellReadonly({ row: 1, col: 0 }, false)
sheet.setCellReadonly({ row: 1, col: 1 }, false)
sheet.history.clear()

const writable = new Set(['1,0', '1,1'])
const resolveCellStyle: ResolveCellStyleHook = (addr, base) =>
  writable.has(`${addr.row},${addr.col}`) ? { ...base, fill: { color: '#fffaeb' } } : undefined
</script>

<template>
  <u-sheet
    :workbook="workbook"
    :show-toolbar="false"
    :show-formula-bar="false"
    :resolve-cell-style="resolveCellStyle"
    style="height: 480px"
  />
</template>
```

`resolveCellStyle` 只在视口叠加样式，必须同步且按地址 O(1) 查找。组件 prop `readonly` 是整表预览，填报用单元格级只读。自定义工具栏按钮用 `registerTool`。

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export interface SheetContext {
  /** 当前活动 sheet 名 */
  readonly sheetName: string
  /**
   * 当前工作簿（导入导出等需要工作簿级操作的场景；无头/单 sheet 场景可能为 undefined）。
   * 只读引用：sheet 增删改名等结构操作仍应经宿主直接操作 Workbook（Phase 3 门面边界）。
   */
  readonly workbook?: Workbook

  // ─── 选区 ────────────────────────────────────────────────
  getSelection(): SelectionState
  /** 选中单格（被覆盖格自动定位锚点） */
  selectCell(addr: CellAddress): void
  selectRange(range: CellRange, active?: CellAddress): void

  // ─── 读取 ────────────────────────────────────────────────
  /** 原始存储语义读取（被合并覆盖格 → undefined） */
  getCellData(addr: CellAddress): CellData | undefined
  /** 锚点解析语义读取（被覆盖格 → 锚点的值） */
  getDisplayValue(addr: CellAddress): CellValue | undefined
  /** 合并语义下的单元格信息（普通格 / 合并锚点 / 被覆盖格） */
  getCellInfo(addr: CellAddress): CellInfo

  // ─── 样式（写入经命令系统，可 undo） ───────────────────────
  /**
   * 按选区形态写样式（Excel 语义）：
   * 整行选区 → rowStyles；整列选区 → colStyles；其余 → 逐格。
   * 判定依赖 createSheetContext 注入的渲染尺寸；未注入时一律走 setCellStyle。
   */
  applyStyle(range: CellRange, partial: CellStylePatch): void
  /**
   * 选区样式目标（与 applyStyle 同一判定）；未注入渲染尺寸时恒为 'cell'。
   */
  resolveStyleTarget(range: CellRange): 'row' | 'col' | 'cell'
  /**
   * 按选区形态清除样式：整行/整列清对应默认样式；其余清单元格 s。
   * 未注入渲染尺寸时一律走 clearCellStyle。
   */
  clearStyle(range: CellRange): void
  /** 设置区域单元格样式（部分合并语义，见 CellStylePatch）；空样式 = 删除 s 字段 */
  setCellStyle(range: CellRange, partial: CellStylePatch): void
  /** 清除区域单元格样式（保留值 / 公式） */
  clearCellStyle(range: CellRange): void
  /** 设置行默认样式（部分合并，进 undo） */
  setRowStyle(row: number, partial: CellStylePatch): void
  /** 设置列默认样式（部分合并，进 undo） */
  setColStyle(col: number, partial: CellStylePatch): void
  /** 读取单元格样式（原始存储语义：被覆盖格 → undefined；不含行列默认） */
  getCellStyle(addr: CellAddress): CellStyle | undefined
  /** 有效样式：列 → 行 → 格字段级叠加（空格可继承行列默认） */
  getEffectiveStyle(addr: CellAddress): CellStyle | undefined

  // ─── 写入（全部经命令系统，可 undo） ───────────────────────
  setCellValue(addr: CellAddress, value: CellValue): void
  setCellFormula(addr: CellAddress, formula: string): void
  /** 批量写入（一次调用 = 一个 undo 单元） */
  setCells(items: SetCellValueItem[]): void
  mergeCells(range: CellRange): CellRange
  unmergeCells(range: CellRange): void
  /** 执行命令注册表中的自定义命令（高级扩展点） */
  executeCommand<R = void>(commandId: string, params: unknown): R | undefined

  // ─── 事务（事务内多次写入合并为一个 undo 单元） ─────────────
  beginTransaction(): void
  commit(): void
  rollback(): void

  // ─── 历史 ────────────────────────────────────────────────
  undo(): boolean
  redo(): boolean
  readonly canUndo: boolean
  readonly canRedo: boolean

  // ─── 冻结（模型状态，不进 undo；随快照序列化） ──────────────
  /** 当前冻结状态（rows = 冻结顶部行数，cols = 冻结左侧列数） */
  readonly frozen: FrozenState
  /** 设置冻结行列数（不进 undo，同 rowHeights 先例） */
  setFrozen(rows: number, cols: number): void

  // ─── 行列插入/删除（结构变更，可 undo） ──────────────────
  /** 插入 count 行到 at 行之前 */
  insertRows(at: number, count?: number): void
  /** 插入 count 列到 at 列之前 */
  insertCols(at: number, count?: number): void
  /** 删除 [at, at+count) 行 */
  deleteRows(at: number, count?: number): void
  /** 删除 [at, at+count) 列 */
  deleteCols(at: number, count?: number): void

  // ─── 浮动图片（写入经命令系统，可 undo） ──────────────────
  /** 插入浮动图片；返回生成的 id */
  insertImage(input: ImageInput): string
  /** 删除浮动图片；不存在则无操作 */
  removeImage(id: string): void
  /** 更新浮动图片锚点/尺寸/文案；不存在或无变更则无操作 */
  updateImage(id: string, patch: ImageUpdateFields): void
  /** 只读图片列表（快照副本） */
  getImages(): readonly SheetImage[]

  // ─── 事件订阅（订阅时绑定到当前活动 sheet；tab 切换后需重新订阅） ──
  onSelectionChange(handler: (state: SelectionState) => void): () => void
  onHistoryChange(handler: (state: HistoryState) => void): () => void
  onFrozenChange(handler: (state: FrozenState) => void): () => void
  /** 图片集合变化（单图带 id；整表替换时 id 缺省） */
  onImageChange(handler: (payload: { id?: string }) => void): () => void
}

import type { Sheet } from '@veltra/sheet-core/core/sheet'
import type { Workbook } from '@veltra/sheet-core/core/workbook'
import type {
  ResolveCellRenderer,
  ResolveCellStyleHook,
  ResolveDisplayValue,
  SheetGrid
} from '@veltra/sheet-core/grid'
import type { ComputedRef } from 'vue'

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
  /** 是否显示行号列，默认 true */
  showRowHeader?: boolean
  /** 是否显示列字母表头，默认 true */
  showColHeader?: boolean
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
```

### 辅助工具

本组件通常配合以下工具来使用。

#### registerTool

向工具栏注册自定义工具；与 `USheet` 共用同一注册表。

使用示例:

```ts
import { registerTool } from '@veltra/sheet'
```

## 注意事项

- 宿主需给高度。填报用 `setCellReadonly` / `setRangeReadonly` 标记只读格，并隐藏工具栏与公式栏（`showToolbar` / `showFormulaBar` 设为 `false`）。模型与命令从 `@veltra/sheet-core` 导入，本包不 re-export。
