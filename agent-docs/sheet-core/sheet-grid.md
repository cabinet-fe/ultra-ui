---
title: 'SheetGrid 渲染网格（引擎适配层）'
description: '从 @veltra/sheet-core/grid 子路径导出的引擎适配层：SheetGrid 把 Sheet 数据模型直挂 @infinite-table/core 的 ListTable（模型直挂、pull 式取值），覆盖渲染、编辑回写、选区、冻结、合并、填充柄、右键菜单、浮动图片与 wrap 行高，支持 readonly 只读预览与 resolveCellRenderer / resolveCellStyle / resolveDisplayValue 三个渲染 hook。'
aliases: ['SheetGrid', 'sheet-grid', '渲染网格', '表格渲染层', '引擎适配层', 'Grid']
keywords:
  [
    'SheetGrid',
    'SheetGridOptions',
    'ListTable',
    'CellRenderer',
    'resolveCellRenderer',
    'resolveCellStyle',
    'resolveDisplayValue',
    'onContextMenu',
    'onEditStart',
    'interceptSelection',
    'readonly',
    '浮动图片',
    '冻结',
    '合并单元格',
    '右键菜单',
    '只读预览',
    '填充柄',
    '虚拟滚动',
    '子路径导入',
    '撤销重做'
  ]
---

# SheetGrid 渲染网格（引擎适配层）

`SheetGrid` 是 `@veltra/sheet-core/grid` 子路径导出的引擎适配层 Facade：数据完全在自己的 `Sheet` 模型上，`@infinite-table/core` 的 `ListTable` 只做渲染与输入，模型变更经事件被动刷新（无手动刷新 API）。同入口还导出类型 `SheetGridOptions` / `ResolveCellRenderer` / `ResolveDisplayValue` / `ResolveCellStyleHook` / `SheetGridContextMenuInfo` / `SheetGridContextMenuKind`，并 re-export 引擎类型 `CellRenderer` / `CellRenderTarget`。

## 快速上手

```ts
import { Sheet } from '@veltra/sheet-core'
import { SheetGrid } from '@veltra/sheet-core/grid' // 固定从子路径导入

const container = document.getElementById('<容器 id>')! // 宿主需给容器宽高
const sheet = new Sheet('Sheet1')
sheet.setCellValue({ row: 0, col: 0 }, 'Hello')

const grid = new SheetGrid({ container, sheet }) // 渲染 100 行 × 26 列高水位（默认）

sheet.undo() // 编程撤销走模型命令栈；界面内 Ctrl/Cmd+Z 撤销已由 grid 内置
grid.release() // 释放引擎表实例与全部事件监听
```

## API 签名

```ts
import type { CellAddress, CellRange, CellStyle, CellValue, Sheet } from '@veltra/sheet-core'
import type { CellRenderer, ListTable } from '@infinite-table/core'

export interface SheetGridOptions {
  /** 挂载容器；宿主需给容器宽高，grid 把 static 定位归一为 relative */
  container: HTMLElement
  /** 数据模型；一个 Sheet 可对应多个 SheetGrid，释放 grid 不影响模型 */
  sheet: Sheet
  /** 渲染行数高水位。默认 100；仅扩张：模型现有行数更大时以模型为准 */
  rows?: number
  /** 渲染列数高水位。默认 26；仅扩张：模型现有列数更大时以模型为准 */
  cols?: number
  /** 表视口宽（CSS 像素）。缺省测量容器，未布局回落 960 */
  width?: number
  /** 表视口高（CSS 像素）。缺省测量容器，未布局回落 420 */
  height?: number
  /** 显示值覆盖 hook：base 已含公式缓存值与 numFmt 格式化，返回 undefined 回落 base */
  resolveDisplayValue?: ResolveDisplayValue
  /** 单元格样式 hook：每次格渲染按格拉取（pull 式热路径），叠加在模型有效样式之上 */
  resolveCellStyle?: ResolveCellStyleHook
  /** 单元格渲染 hook：返回引擎 CellRenderer 接管该格内容绘制；传入才安装分发器 */
  resolveCellRenderer?: ResolveCellRenderer
  /** 右键回调；readonly 模式照常触发，菜单内容由宿主决定 */
  onContextMenu?: (info: SheetGridContextMenuInfo) => void
  /** 进入单元格编辑（双击 / Enter） */
  onEditStart?: (addr: CellAddress) => void
  /** 编辑提交 / 退出 */
  onEditEnd?: (addr: CellAddress) => void
  /** 返回 true 时本次选区不写入模型，改回调 onSelectionIntercept */
  interceptSelection?: () => boolean
  /** 被拦截的选区范围（模型坐标） */
  onSelectionIntercept?: (range: CellRange) => void
  /** 只读预览模式。默认 false */
  readonly?: boolean
  /** 行号列。默认 true；false 时行号列归零宽，内容原点左移 */
  showRowHeader?: boolean
  /** 列字母表头。默认 true；false 时列头行归零高，内容原点上移 */
  showColHeader?: boolean
}

/** 显示值覆盖：base = numFmt 格式化后的显示值；返回 undefined 回落 base */
export type ResolveDisplayValue = (
  addr: CellAddress,
  base: CellValue | undefined
) => CellValue | undefined

/** 样式叠加：(addr, baseStyle) → 合并后样式；返回 undefined 回落模型有效样式 */
export type ResolveCellStyleHook = (
  addr: CellAddress,
  baseStyle?: CellStyle
) => CellStyle | undefined

/** 自定义渲染：返回引擎 CellRenderer（格内局部坐标 canvas 绘制函数），undefined 回落默认渲染。
 *  base 为显示值（公式缓存 + numFmt + resolveDisplayValue 之后）；合并区域由引擎路由主格。
 *  纯函数、同步、O(1) 查找；不写模型、不进快照。 */
export type ResolveCellRenderer = (
  addr: CellAddress,
  base: CellValue | undefined
) => CellRenderer | undefined

export type SheetGridContextMenuKind = 'body' | 'row-header' | 'col-header'

export interface SheetGridContextMenuInfo {
  /** 客户端坐标（容器 getBoundingClientRect + 引擎事件层坐标），可直接用于弹层定位 */
  x: number
  y: number
  kind: SheetGridContextMenuKind
  /** body 格为模型地址；row-header / col-header / 角点为 null */
  addr: CellAddress | null
  /** kind = 'row-header' 时的模型行号 */
  row?: number
  /** kind = 'col-header' 时的模型列号 */
  col?: number
}

export class SheetGrid {
  constructor(options: SheetGridOptions)
  /** 底层引擎 ListTable 实例（调试 / 测试用） */
  getTable(): ListTable
  /** 容器内相对坐标 → 模型地址；行号列 / 列头 / 空白返回 null */
  hitTestSheetAddr(x: number, y: number): CellAddress | null
  /** LRU 可见性：false 挂起模型→视图同步（只置脏）；true 恢复，脏则一次性全量同步 */
  setVisible(on: boolean): void
  /** 释放引擎表实例、事件监听与浮动图 objectURL */
  release(): void
  /** 等价 release() */
  destroy(): void
}
```

## 参数说明

| 参数                        | 类型                   | 默认     | 必填 | 约束                                                                                                                                                                          |
| --------------------------- | ---------------------- | -------- | :--: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `container`                 | `HTMLElement`          | —        |  是  | 容器需有宽高；grid 在容器上挂键盘、滚轮监听与 `ResizeObserver`                                                                                                                |
| `sheet`                     | `Sheet`                | —        |  是  | 一个 `Sheet` 可对应多个 `SheetGrid`；释放 grid 不影响模型                                                                                                                     |
| `rows`                      | `number`               | `100`    |  否  | 渲染高水位，最小 1；仅扩张不收缩：模型现有行数更大时以模型为准（删行后不被更小的 props 撑回）                                                                                 |
| `cols`                      | `number`               | `26`     |  否  | 渲染高水位，最小 1；仅扩张不收缩，同 `rows`                                                                                                                                   |
| `width` / `height`          | `number`               | 测量容器 |  否  | 未布局（`clientWidth` / `clientHeight` 为 0）回落 `960` / `420`                                                                                                               |
| `readonly`                  | `boolean`              | `false`  |  否  | `true` 时不注册编辑器、`Enter` 不进编辑、填充柄不写值、行列 resize 关闭、不绑 undo/redo 快捷键、浮动图禁拖动与 `Delete` 删除；保留渲染、选区、滚动、键盘导航、`onContextMenu` |
| `showRowHeader`             | `boolean`              | `true`   |  否  | `false` 不渲染行号列                                                                                                                                                          |
| `showColHeader`             | `boolean`              | `true`   |  否  | `false` 不渲染列头行                                                                                                                                                          |
| `resolveDisplayValue`       | `ResolveDisplayValue`  | —        |  否  | 每次格显示值解析按格回调（渲染热路径）；`base` 已含公式缓存与 numFmt 格式化                                                                                                   |
| `resolveCellStyle`          | `ResolveCellStyleHook` | —        |  否  | 每次格渲染按格拉取；叠加链：模型有效样式（列 → 行 → 格）→ 宿主 hook → 引擎样式映射                                                                                            |
| `resolveCellRenderer`       | `ResolveCellRenderer`  | —        |  否  | 格节点重建时按格回调（合并区路由主格）；**仅宿主传入才安装分发器**，默认场景渲染管线零差异                                                                                    |
| `onContextMenu`             | `(info) => void`       | —        |  否  | 右键时触发；`info.x` / `info.y` 为客户端坐标                                                                                                                                  |
| `onEditStart` / `onEditEnd` | `(addr) => void`       | —        |  否  | 编辑进入 / 退出；`readonly: true` 不触发                                                                                                                                      |
| `interceptSelection`        | `() => boolean`        | —        |  否  | 返回 `true` 拦截本次选区（不写模型选区）                                                                                                                                      |
| `onSelectionIntercept`      | `(range) => void`      | —        |  否  | 拦截发生时回调被拦截的模型区域；须与 `interceptSelection` 配对使用                                                                                                            |

## 方法与事件

实例方法全部同步。`resolveDisplayValue` / `resolveCellStyle` / `resolveCellRenderer` 三个 hook 遵守性能契约：纯函数、同步返回、O(1) 查找（稀疏 Map / 地址直查），禁止异步操作与长数组 / 大字符串分配；hook 不写模型、不进快照。

撤销重做：门面无 `undo()` / `redo()` 方法。非 readonly 下 `Ctrl/Cmd+Z` 撤销、`Ctrl+Shift+Z` / `Ctrl+Y` 重做已内置（走 `sheet` 模型命令栈）；编程撤销重做直接调 `sheet.undo()` / `sheet.redo()`。

内置交互（构造时接线，`release()` 退订）：

- 滚轮滚动：容器 `wheel` → 表滚动，`shift+滚轮` 换轴为横向；触控 / 惯性滚动由引擎内置。宿主不要再对同一容器自行挂 `wheel` 调滚动，会双重滚动。
- 键盘：`Ctrl+A` 全选（readonly 也可用）；`Delete` / `Backspace` 删除选中的浮动图片（非 readonly 且有选中时接管）；`<input>` / `<textarea>` 聚焦时不接管任何键。
- 编辑：双击 / `Enter` 进入，提交经模型命令回写（可撤销），编辑文本上限 50000 字符；被 `Sheet.setCellReadonly` 标记的格双击 / `Enter` 均不进入编辑会话。
- 行列 resize：拖拽落定自动写回 `sheet.setRowHeight` / `sheet.setColWidth`（不进 undo）；列宽变化联动重估该列 wrap 行高。
- 容器 resize：`ResizeObserver` 原地自适应，不重建实例，滚动位置与选区保留。

回调触发时机：

- `onContextMenu(info)`：右键任意区域。`kind = 'body'` 时 `addr` 为模型地址；`'row-header'` / `'col-header'` 时 `addr` 为 `null`、`row` / `col` 为模型行列号；角点归 `'body'`（`addr` 为 `null`）。本库只回调，不渲染菜单。
- `onEditStart(addr)` / `onEditEnd(addr)`：编辑器打开 / 关闭，`addr` 为模型地址。
- 选区：画布选区先问 `interceptSelection()`，返回 `true` 则不写模型并回调 `onSelectionIntercept(range)`；否则写入 `sheet` 选区。模型选区变化（`sheet.selectRange`）回驱画布，不可见活动格自动滚入视口；引擎外部回写不广播，无回环。
- 填充柄：拖拽生成经自有 `generateFill`（公式相对引用位移 + 平铺），单 undo 单元写入；只读目标格不被覆盖（从只读格向外复制仍允许）。

模型 → 视图同步（自动，无手动刷新 API）：

- `cell-change`：该行 wrap 行高重估（写模型，只升不降），断行渲染由引擎承担。
- `merge-change` / `content-reset` / `axis-style-change` / 全量 `meta-change`：微任务合并为一次同步——合并区全量替换（签名判重跳过无变化）+ 可视窗口逐格刷新。
- `frozen-change`：冻结数同步；模型冻结数即引擎数据冻结数（行列头不计数，无 ±1）。
- `image-change`：浮动图全量对齐模型（签名判重）。
- `structure-change`（行列插入 / 删除）：**不自动应用**——引擎表格维度构造期固定，宿主重建 `SheetGrid` 实例（见「常见问题」）。

## 典型示例

### 只读预览（Excel / CSV 文件查看）

```ts
import { importXlsx } from '@veltra/sheet-core'
import { SheetGrid } from '@veltra/sheet-core/grid'

const response = await fetch('/<文件地址>/报表.xlsx') // <替换为真实文件地址>
const workbook = await importXlsx(await response.arrayBuffer())

const grid = new SheetGrid({
  container: document.getElementById('<容器 id>')!,
  sheet: workbook.activeSheet,
  readonly: true, // 不挂编辑器、禁填充柄与行列 resize、不绑 undo/redo 快捷键、浮动图只可选中
  showRowHeader: true,
  onContextMenu: (info) => {
    // readonly 下照常触发；菜单内容由宿主决定
    console.log(info.kind, info.addr) // => 'body' { row: 0, col: 0 }
  }
})
```

### 自定义渲染（resolveCellRenderer 负数标红）

```ts
import { Workbook } from '@veltra/sheet-core'
import { SheetGrid, type ResolveCellRenderer } from '@veltra/sheet-core/grid'

const sheet = new Workbook().activeSheet
sheet.setCellValue({ row: 0, col: 0 }, -5)

// 纯函数、同步、O(1)：返回引擎 CellRenderer 接管该格内容绘制，undefined 回落默认渲染
const resolveCellRenderer: ResolveCellRenderer = (addr, base) => {
  if (typeof base !== 'number' || base >= 0) return undefined
  return ({ ctx, height, text, style, font }) => {
    ctx.fillStyle = '#D54941' // 负数标红；背景与边框由引擎节点负责
    ctx.font = font ?? `${style.fontSize ?? 14}px sans-serif`
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 6, height / 2)
  }
}

const grid = new SheetGrid({
  container: document.getElementById('<容器 id>')!,
  sheet,
  resolveCellRenderer
})
```

### 样式叠加、numFmt 与显示值覆盖

```ts
import { Workbook } from '@veltra/sheet-core'
import {
  SheetGrid,
  type ResolveCellStyleHook,
  type ResolveDisplayValue
} from '@veltra/sheet-core/grid'

const sheet = new Workbook().activeSheet
sheet.setCellValue({ row: 0, col: 0 }, 5) // 分数
sheet.setCellValue({ row: 1, col: 0 }, 1234.5) // 金额
sheet.setCellStyle({ start: { row: 1, col: 0 }, end: { row: 1, col: 0 } }, { numFmt: 'thousands' })

// 样式 hook：基于 baseStyle（模型有效样式）叠加，返回 undefined 回落默认
const resolveCellStyle: ResolveCellStyleHook = (addr, baseStyle) =>
  addr.row === 0 ? { ...baseStyle, fill: { color: '#FFF7E6' } } : undefined

// 显示值覆盖：base 已是 numFmt 格式化后的值；返回 undefined 回落 base
const resolveDisplayValue: ResolveDisplayValue = (addr, base) =>
  addr.row === 0 ? `${base} 分` : base

const grid = new SheetGrid({
  container: document.getElementById('<容器 id>')!,
  sheet,
  resolveCellStyle,
  resolveDisplayValue
})
sheet.getCellData({ row: 0, col: 0 })?.v // => 5（模型恒存原始值；显示为 '5 分'）
// A2 显示为 '1,234.50'（内置 numFmt 管线，第二行不触发宿主覆盖）
```

## 注意事项

> [!WARNING]
>
> - 本库从 `@veltra/sheet-core/grid` 子路径导入 `SheetGrid` 与渲染 hook 类型，**不是主入口**；主入口刻意不 re-export，避免无头 `import { Workbook }` 把引擎类型图拉进 TS 程序。
> - 底座是 `@infinite-table/core` 的 `ListTable`，不是 `@visactor/vtable`：自定义渲染返回引擎 `CellRenderer`（canvas 局部坐标绘制函数），不存在 `CustomLayout` / `ICustomLayoutObj` 布局对象，也不要按 VTable 的 `records` / `setRecords` 用法操作数据——数据源是挂在构造选项里的 `Sheet` 模型。
> - 旧版门面的 `refresh` / `flushPending` / `syncFromModel` / `getImageLayer` / `undo` / `redo` 已删除：模型 → 视图同步全自动（见「方法与事件」），浮动图由引擎 `FloatObjectLayer` 承接，隐藏 / 恢复实例用 `setVisible(false | true)`。
> - 三个渲染 hook 必须是纯函数、同步返回、O(1) 查找，禁止异步操作与长数组 / 大字符串分配；hook 不写模型、不进快照。不需要自定义渲染就不要传 `resolveCellRenderer`。
> - `readonly: true` 只守 grid 入口：绕过 SheetGrid 直接调命令仍可写模型，只读场景不要暴露命令入口；工具栏 / 公式栏这些 grid 之外的写入口由宿主自行隐藏。
> - 主题内置且构造期固化（表头浅底 `#F5F5F5`、正文白底、网格线 `#E1E4E8`、选区 `#2170E7`、hover 关闭），无运行时换肤入口。
> - 默认几何：行高 28px、列头带高 28px、行号列宽 46px、默认列宽 80px。列宽在构造期随列定义写入；运行时改列宽走拖拽（自动写回模型）或 `sheet.setColWidth`，不要绕过模型直接对 `getTable()` 批量改列宽——切实例重建后会丢。
> - 行列插入 / 删除后必须重建 `SheetGrid` 实例；值 / 样式 / 合并 / 冻结 / 图片变更自动同步。
> - 深导入 `@veltra/sheet-core/core/*` 必须带 `.js` 后缀（`@veltra/sheet-core/core/address.js`）；显式 `./grid` 子路径不受影响。

## 常见问题

### 导入 `SheetGrid` 报「没有导出」或类型缺失

原因：从主入口 `@veltra/sheet-core` 导入。修复：一律从子路径导入：

```ts
import { SheetGrid } from '@veltra/sheet-core/grid'
import { Sheet } from '@veltra/sheet-core'
```

### 双击单元格不进入编辑

原因：`readonly: true` 关闭了编辑器，或目标格被 `Sheet.setCellReadonly` 标记为只读（双击 / `Enter` 均不进入编辑会话）。修复：去掉 `readonly`，或用 `Sheet.setCellReadonly(addr, false)` 解除标记（见 `model.md`）。

### 右键没有菜单出现

原因：本库只回调 `onContextMenu(info)` 并拦截浏览器默认菜单，不渲染任何菜单 UI。修复：在回调里自行弹菜单（`info.x` / `info.y` 为客户端坐标，可直接定位），按 `info.kind` 区分 body / 行号 / 列头。

### 插入 / 删除行列后表格没有更新

原因：引擎表格维度构造期固定，`structure-change` 不自动应用。修复：结构操作后重建实例（模型数据不丢，重建只重做视图装配）：

```ts
import { Sheet } from '@veltra/sheet-core'
import { SheetGrid } from '@veltra/sheet-core/grid'

const container = document.getElementById('<容器 id>')!
const sheet = new Sheet('Sheet1')
let grid = new SheetGrid({ container, sheet })

sheet.insertRows(2) // 模型结构变更
grid.release()
grid = new SheetGrid({ container, sheet }) // 重建视图
```
