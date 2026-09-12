---
title: SheetTool 工具栏扩展与 SheetContext
description: USheet 工具栏扩展机制：registerTool / unregisterTool 向全局注册表注册与注销自定义工具，SheetTool 定义按钮与八种弹层，SheetContext 是工具操作表格的唯一门面，写操作全走命令系统可撤销。
aliases: [registerTool, unregisterTool, SheetContext, createSheetContext, 工具栏扩展, 自定义工具]
keywords: [registerTool, unregisterTool, defaultToolRegistry, SheetTool, SheetToolGroup, SheetToolPopupType, SheetContext, createSheetContext, executeCommand, applyStyle, getSelection, setFrozen, 自定义工具, 工具栏按钮, 弹层工具, 撤销]
---

# SheetTool 工具栏扩展与 SheetContext

`@veltra/sheet` 导出工具栏扩展 API：`registerTool` / `unregisterTool` 向全局注册表 `defaultToolRegistry` 注册、注销工具，`createSheetContext` 创建工具操作门面 `SheetContext`。USheet 工具栏渲染注册表中的全部工具；内置工具与自定义工具走同一通道，宿主可同 id 覆盖或移除。工具是框架无关的纯定义，`icon` 接收 Vue 组件，由 USheet 渲染。

## 快速上手

```ts
import { registerTool } from '@veltra/sheet'
import type { SheetContext } from '@veltra/sheet'

registerTool({
  id: 'insert-date',
  title: '插入日期',
  group: 'demo',
  onClick(ctx: SheetContext) {
    const { activeCell } = ctx.getSelection() // activeCell: CellAddress | null
    if (activeCell) ctx.setCellValue(activeCell, new Date().toLocaleDateString('sv-SE'))
  }
})
// => 工具栏出现「插入日期」按钮（demo 组）；注册表全局共享，所有 USheet 实例可见
```

## API 签名

```ts
import type { CellAddress, CellRange } from '@veltra/sheet-core'
import type { Sheet } from '@veltra/sheet-core/core/sheet'
import type { Workbook } from '@veltra/sheet-core/core/workbook'

/** 弹层型工具类型：vue 层按类型渲染弹层面板，面板交互走 SheetContext 命令入口 */
export type SheetToolPopupType =
  | 'fill-color' // 填充颜色面板
  | 'border' // 边框预设面板
  | 'font-color' // 字体颜色面板
  | 'font-size' // 字号面板
  | 'find' // 查找替换条
  | 'functions' // 函数列表面板（纯查看 + 搜索，不写模型）
  | 'insert-image' // 插入浮动图片面板（本地文件 + URL）
  | 'export' // 导出 xlsx / csv 选择面板

/** 工具定义 */
export interface SheetTool {
  /** 唯一 id；同 id 重复注册视为替换（保留原位置） */
  id: string
  /** 按钮文本 */
  title: string
  /** 图标（Vue 组件，由 USheet 渲染） */
  icon?: unknown
  /** 悬浮提示；缺省用 title */
  tooltip?: string
  /** 分组名（组间渲染分隔符）；缺省 'default' */
  group?: string
  /** 组内排序（升序，相同 order 按注册先后）；缺省 0 */
  order?: number
  /** 是否可见（工具栏状态刷新时求值）；缺省可见 */
  visible?(ctx: SheetContext): boolean
  /** 是否禁用（工具栏状态刷新时求值）；缺省可用 */
  disabled?(ctx: SheetContext): boolean
  /** 是否激活高亮（vue 层渲染 is-active）；缺省 false */
  active?(ctx: SheetContext): boolean
  /** 弹层型工具：vue 层渲染弹层面板，onClick 不执行 */
  popup?: SheetToolPopupType
  /** 点击执行；ctx 是唯一操作入口（写操作全走命令系统，天然可撤销） */
  onClick(ctx: SheetContext): void
}

/** 分组视图（供工具栏渲染） */
export interface SheetToolGroup {
  name: string
  tools: SheetTool[]
}

/** 缺省分组名 */
export const DEFAULT_TOOL_GROUP = 'default'

/** 全局默认注册表（内置工具也注册于此）；注册一次，所有 USheet 实例共享 */
export declare const defaultToolRegistry: ToolRegistry

/** 注册工具到默认注册表；id / title / onClick 缺失时同步抛 Error */
export function registerTool(tool: SheetTool): void

/** 从默认注册表注销；id 不存在时返回 false（不触发 change） */
export function unregisterTool(id: string): boolean

export declare class ToolRegistry {
  register(tool: SheetTool): void
  unregister(id: string): boolean
  get(id: string): SheetTool | undefined
  has(id: string): boolean
  get size(): number
  getGroups(): SheetToolGroup[]
  /** 订阅注册表变化（register / unregister），返回取消订阅函数 */
  onChange(handler: () => void): () => void
}

/** createSheetContext 可选配置 */
export interface SheetContextOptions {
  /** 当前渲染网格尺寸；applyStyle / clearStyle 用其判定整行/整列，缺省时不走行列默认样式 */
  resolveGridSize?: () => { rows: number; cols: number }
}

/**
 * 创建工具上下文。resolveSheet 传 Sheet 实例或解析函数（USheet 传 () => activeSheet，
 * tab 切换后自动指向当前 sheet）；workbook 可传实例或解析函数，无头单表场景可省略
 */
export function createSheetContext(
  resolveSheet: Sheet | (() => Sheet),
  workbook?: Workbook | (() => Workbook),
  options?: SheetContextOptions
): SheetContext
```

`SheetContext` 完整定义：

```ts
export interface SheetContext {
  /** 当前活动 sheet 名 */
  readonly sheetName: string
  /** 当前工作簿只读引用（无 workbook 时为 undefined）；sheet 增删改名不经此门面，宿主直接操作 Workbook */
  readonly workbook?: Workbook

  // ─── 选区 ────────────────────────────────────────────────
  getSelection(): SelectionState // { activeCell: CellAddress | null; ranges: CellRange[] }
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
  /** 按选区形态写样式：整行选区 → rowStyles；整列选区 → colStyles；其余逐格 */
  applyStyle(range: CellRange, partial: CellStylePatch): void
  /** 选区样式目标（与 applyStyle 同一判定）；未注入渲染尺寸时恒为 'cell' */
  resolveStyleTarget(range: CellRange): 'row' | 'col' | 'cell'
  /** 按选区形态清除样式；未注入渲染尺寸时一律走 clearCellStyle */
  clearStyle(range: CellRange): void
  /** 设置区域单元格样式（部分合并语义）；空样式 = 删除 s 字段 */
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
  readonly frozen: FrozenState // { rows: 顶部冻结行数; cols: 左侧冻结列数 }
  setFrozen(rows: number, cols: number): void

  // ─── 行列插入/删除（结构变更，可 undo） ──────────────────
  /** 插入 count 行到 at 行之前；count 缺省 1 */
  insertRows(at: number, count?: number): void
  insertCols(at: number, count?: number): void
  /** 删除 [at, at+count) 行 */
  deleteRows(at: number, count?: number): void
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

  // ─── 事件订阅（绑定订阅时的活动 sheet；tab 切换后需重新订阅） ──
  onSelectionChange(handler: (state: SelectionState) => void): () => void
  onHistoryChange(handler: (state: HistoryState) => void): () => void
  onFrozenChange(handler: (state: FrozenState) => void): () => void
  /** 图片集合变化（单图带 id；整表替换时 id 缺省） */
  onImageChange(handler: (payload: { id?: string }) => void): () => void
}
```

`SelectionState` / `CellData` / `CellValue` / `CellStylePatch` / `ImageInput` 等类型从 `@veltra/sheet-core` 主入口导入。

## 参数说明

`SheetTool` 字段：

| 字段 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `id` | `string` | — | 是 | 空字符串抛 `Error('工具注册失败：id 不能为空')`；同 id 重复注册 = 替换定义并保留原位置 |
| `title` | `string` | — | 是 | 缺失抛 `Error('工具注册失败：<id> 缺少 title')` |
| `onClick` | `(ctx: SheetContext) => void` | — | 是 | 缺失或非函数抛 `Error('工具注册失败：<id> 缺少 onClick')`；`popup` 工具的 onClick 不执行，写 `() => {}` 占位 |
| `icon` | `unknown`（Vue 组件） | — | 否 | 从 `@veltra/icons/normal` / `@veltra/icons/colorful` 取 |
| `tooltip` | `string` | `title` | 否 | 悬浮提示文本 |
| `group` | `string` | `'default'` | 否 | 同组连续排列，组间分隔符；组序 = 各组最早注册位置 |
| `order` | `number` | `0` | 否 | 组内升序；相同 order 按注册先后 |
| `visible` | `(ctx) => boolean` | 恒可见 | 否 | 工具栏状态刷新时重新求值 |
| `disabled` | `(ctx) => boolean` | 恒可用 | 否 | 工具栏状态刷新时重新求值 |
| `active` | `(ctx) => boolean` | `false` | 否 | 高亮 `is-active`；工具栏状态刷新时重新求值 |
| `popup` | `SheetToolPopupType` | — | 否 | 仅 8 个取值；设置后面板由 USheet 渲染，`onClick` 不执行 |

注册函数：

| 函数 | 签名 | 行为 |
| --- | --- | --- |
| `registerTool` | `(tool: SheetTool) => void` | 校验失败同步抛 `Error`（报错原文见上表）；成功后触发 `change` |
| `unregisterTool` | `(id: string) => boolean` | 返回是否删除；`false` 时表示 id 不存在且不触发 `change` |

## 方法与事件

### 注册表语义

- 注册表全局共享：所有 USheet 实例渲染同一组工具，各自上下文绑定各自工作簿。
- 组序 = 各组最早注册位置；组内按 `(order, 注册序)` 升序。
- 同 id 重复注册 = 替换定义并保留原注册位置（HMR / 覆盖内置工具友好）。
- 工具栏状态（`visible` / `disabled` / `active`）在选区、历史、单元格、合并、冻结变化与注册表变化时重新求值；高频变更合并到微任务，每帧最多重算一次。

### 弹层型工具行为

- `popup: 'fill-color' | 'border' | 'font-color' | 'font-size'`：面板打开时自动 `beginTransaction`，关闭时 `commit`（失败 `rollback`）——面板期间全部写入合并为单 undo 单元。
- `popup: 'find'`：查找替换条；每次替换是独立 undo 单元，全部替换为单 undo 单元。`Ctrl/Cmd+F` 开合，仅当焦点在 USheet 实例内响应，不劫持容器外浏览器原生查找。
- `popup: 'functions'`：函数列表面板（纯查看，不参与事务）：列出 `listFormulaFunctions()` 全部已注册函数（内置 + 宿主经 `registerFormulaFunction` 注册的自定义函数）的签名与描述，顶部搜索框按名称 / 描述大小写不敏感过滤；点击不写模型。
- `popup: 'insert-image'`：本地文件 + URL 输入；`popup: 'export'`：xlsx / csv 选择面板（下载侧效应，无模型写入，不参与事务）。
- 内置 `import` 工具无弹层：点击直接拉起系统文件选择（USheet 内部覆盖其行为）。

### `SheetContext` 订阅与生命周期

- `onSelectionChange` / `onHistoryChange` / `onFrozenChange` / `onImageChange` 在订阅时绑定当前活动 sheet，返回取消订阅函数；tab 切换后原订阅不再收到新表事件，必须重新订阅。
- USheet 内部的 `getContext()` 每次 tab 切换后自动指向当前 sheet；无头场景用 `createSheetContext(() => sheet, workbook)` 传解析函数可获同样行为。

## 典型示例

### 自定义工具：依赖选区状态的完整定义

```ts
import { registerTool, unregisterTool } from '@veltra/sheet'
import type { SheetContext, SheetTool } from '@veltra/sheet'

const clearSheetTool: SheetTool = {
  id: 'demo-clear-content',
  title: '清空内容',
  tooltip: '清除选区内容（保留样式），可撤销',
  group: 'demo',
  order: 1,
  // 无选区时隐藏；选区回归时重新出现
  visible: (ctx: SheetContext) => ctx.getSelection().activeCell !== null,
  disabled: (ctx: SheetContext) => ctx.getSelection().ranges.length === 0,
  onClick: (ctx: SheetContext) => {
    const range = ctx.getSelection().ranges[0]
    if (!range) return
    ctx.beginTransaction() // 多格清除合并为单 undo 单元
    for (let row = range.start.row; row <= range.end.row; row++) {
      for (let col = range.start.col; col <= range.end.col; col++) {
        ctx.setCellValue({ row, col }, '')
      }
    }
    ctx.commit()
  }
}

registerTool(clearSheetTool)

// 页面卸载时注销，避免残留全局按钮
// unregisterTool('demo-clear-content') // => true
```

### 覆盖内置工具

内置工具组序为 `history ｜ cell ｜ text ｜ edit ｜ insert ｜ file`，全部可被同 id 覆盖或注销。常用 id：`undo`、`redo`、`border`、`fill-color`、`merge`、`unmerge`、`bold`、`italic`、`underline`、`strikethrough`、`font-color`、`font-size`、`align-left`、`align-center`、`align-right`、`valign-top`、`valign-middle`、`valign-bottom`、`wrap-text`、`find`、`functions`、`insert-image`、`import`、`export`。

```ts
import { registerTool, unregisterTool, defaultToolRegistry } from '@veltra/sheet'
import type { SheetContext } from '@veltra/sheet'
import { exportWorkbookXlsx } from '@veltra/sheet-core'

// 覆盖内置 export：点击直接导出 xlsx，不再弹选择面板
// （同 id 替换保留原位置；新定义若用 popup 必须是 8 个内置类型之一）
registerTool({
  id: 'export',
  title: '导出',
  group: 'file',
  order: 1,
  disabled: (ctx: SheetContext) => !ctx.workbook,
  onClick: async (ctx: SheetContext) => {
    const workbook = ctx.workbook
    if (!workbook) return
    const bytes = await exportWorkbookXlsx(workbook)
    const url = URL.createObjectURL(
      new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `${ctx.sheetName}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
})

// 移除内置工具（如不想要删除线）：返回 true 表示已移除
console.log(unregisterTool('strikethrough')) // => true
console.log(defaultToolRegistry.has('strikethrough')) // => false
```

### 无头场景：createSheetContext

没有 USheet 实例时（脚本、测试、自组 UI），用 `createSheetContext` 直接包一个 `Sheet`：

```ts
import { createSheetContext } from '@veltra/sheet'
import { Workbook } from '@veltra/sheet-core'

const workbook = new Workbook()
const sheet = workbook.activeSheet

// 传解析函数：切换活动表后上下文自动指向新表；传 Sheet 实例则固定指向
const ctx = createSheetContext(() => workbook.activeSheet, workbook, {
  resolveGridSize: () => ({ rows: 100, cols: 26 }) // 整行/整列样式路由需要
})

ctx.selectCell({ row: 0, col: 0 })
ctx.beginTransaction() // 事务内多次写入合并为一个 undo 单元
ctx.setCellValue({ row: 0, col: 0 }, '合计')
ctx.applyStyle({ start: { row: 0, col: 0 }, end: { row: 0, col: 2 } }, { font: { bold: true } })
ctx.commit()
console.log(ctx.undo()) // => true（整组写入一次撤销）
console.log(sheet.getDisplayValue({ row: 0, col: 0 })) // => undefined（值已随撤销清除）
```

## 注意事项

> [!WARNING]
> - `SheetContext` 不暴露 `Sheet` 实例——写方法全部经命令系统（可 undo，`setFrozen` 除外）；绕过门面直接操作 `Sheet` 的代码不属于工具扩展。
> - sheet 增删改名不经过 `SheetContext`，宿主直接操作 `Workbook`（`addSheet` / `removeSheet` / `renameSheet`）；`ctx.workbook` 只是只读引用。
> - `popup` 仅接受 8 个内置类型值，自定义字符串无法让 USheet 渲染面板；需要自定义面板时用普通按钮 + 宿主自己的弹层。
> - `activeCell` 的类型是 `CellAddress | null`（未选中为 `null`），不是 `undefined`；判断用 `!== null`。
> - 注册表是模块级单例：`registerTool` 在模块顶层执行即完成注册（内置工具由包入口 `import './tools/builtin'` 引入），禁止在多实例组件的 setup 里重复注册。
> - 本包不 re-export `@veltra/sheet-core` 的任何符号；`Workbook` / `exportWorkbookXlsx` / `exportSheetCsv` 等一律从 `@veltra/sheet-core` 导入。

## 常见问题

### 报错 `Error: 工具注册失败：<id> 缺少 title`

`registerTool` 校验 `id`、`title`、`onClick` 三项必填，缺失即同步抛出。修复：补全字段再注册。

### 自定义按钮点击后表格数据变了但工具栏 `disabled` 状态不刷新

`visible` / `disabled` / `active` 是 `(ctx) => boolean` 纯函数，在模型事件（选区 / 历史 / 单元格 / 合并 / 冻结）变化时重新求值；依赖外部可变量（如自定义 ref）时，USheet 感知不到。修复：让判定只依赖 `SheetContext` 状态，或把外部状态写入模型后再求值。

### 弹层写入没有被合并成一次撤销

只有 `fill-color` / `border` / `font-color` / `font-size` 四种 `popup` 自动参与面板事务；`find` 每次替换独立、`export` 无模型写入、`import` 无弹层。自定义普通按钮的多步写入需自己包 `beginTransaction` / `commit`。
