---
title: "SheetGrid 渲染网格（VTable 适配层）"
description: "从 @veltra/sheet-core/grid 子路径导出的 VTable 渲染适配层：SheetGrid 把 Sheet 数据模型接到 ListTable 视图（编辑回写、选区、冻结、右键、浮动图片），支持 readonly 只读预览与 resolveCellRenderer / resolveCellStyle / resolveDisplayValue 三个渲染 hook。"
aliases: ["SheetGrid", "sheet-grid", "VTable 适配层", "表格渲染层", "渲染网格"]
keywords: ["SheetGrid", "VTable", "ListTable", "SheetGridOptions", "CustomLayout", "resolveCellRenderer", "resolveCellStyle", "resolveDisplayValue", "onContextMenu", "readonly", "自定义渲染", "只读预览", "右键菜单", "虚拟滚动", "子路径导入"]
---

# SheetGrid 渲染网格（VTable 适配层）

`SheetGrid` 是 `@veltra/sheet-core/grid` 子路径导出的 VTable 适配层 Facade：数据完全在自己的 `Sheet` 模型上，`ListTable` 只做渲染与输入，模型变更经适配层被动刷新。同入口还导出 `CustomLayout`（VTable 布局构建器）与类型 `SheetGridOptions` / `SheetGridContextMenuKind` / `SheetGridContextMenuInfo` / `ICustomLayoutObj` / `ResolveCellRenderer` / `ResolveDisplayValue` / `ResolveCellStyleHook`。

**必须从子路径导入**：主入口 `@veltra/sheet-core` 刻意不 re-export 这些符号（`src/grid/index.ts` 原注释）——"避免 Workbook/Sheet 等无头 API 把 @visactor/vtable 类型图拉进 TS 程序"。写 `import { SheetGrid } from '@veltra/sheet-core'` 拿不到该导出。

## 快速上手

```ts
import { Sheet } from '@veltra/sheet-core'
import { SheetGrid } from '@veltra/sheet-core/grid' // 固定从子路径导入

const container = document.getElementById('<容器 id>')! // 宿主需给容器宽高
const sheet = new Sheet('Sheet1')
sheet.setCellValue({ row: 0, col: 0 }, 'Hello')

const grid = new SheetGrid({
  container,
  sheet,
  rows: 100, // 渲染行数高水位，默认 100
  cols: 26 // 渲染列数高水位，默认 26
})

grid.undo() // 撤销上一次写操作（非 readonly 下 Ctrl/Cmd+Z 快捷键已内置）
grid.refresh() // 全量重建 records；模型变更自动同步，仅在需要强制重建时调用
grid.release() // 释放 VTable 实例与全部事件监听
```

## API 签名

```ts
import type { CellAddress, CellRange, CellStyle, CellValue, Sheet } from '@veltra/sheet-core'
import type { ListTable } from '@visactor/vtable'

export interface SheetGridOptions {
  /** 挂载容器；宿主需给容器宽高 */
  container: HTMLElement
  /** 数据模型；构造会把模型 rowCount/colCount 抬到 rows/cols 高水位 */
  sheet: Sheet
  /** 渲染行数高水位。默认 100 */
  rows?: number
  /** 渲染列数高水位。默认 26 */
  cols?: number
  /** 显示值覆盖 hook：record 构建时按格触发 */
  resolveDisplayValue?: ResolveDisplayValue
  /** 单元格样式 hook：每次场景图重绘按格触发（最热路径） */
  resolveCellStyle?: ResolveCellStyleHook
  /** 单元格渲染 hook：视口格布局时按格触发；传入才安装 customLayout 分发器 */
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
  /** 行号列。默认 true；false 时不渲染行号列，冻结映射不再 +1 */
  showRowHeader?: boolean
  /** 列字母表头。默认 true；false 时不渲染列头行，冻结映射不再 +1 */
  showColHeader?: boolean
}

/** 显示值覆盖：(addr, base) → 覆盖值；返回 undefined 回落 base */
export type ResolveDisplayValue = (
  addr: CellAddress,
  base: CellValue | undefined
) => CellValue | undefined

/** 样式叠加：(addr, baseStyle) → 合并后的样式；返回 undefined 回落默认样式 */
export type ResolveCellStyleHook = (
  addr: CellAddress,
  baseStyle?: CellStyle
) => CellStyle | undefined

/** 自定义渲染：返回 VTable customLayout 布局对象；返回 undefined 回落默认渲染。
 *  base 为显示值（经 resolveDisplayValue 覆盖后）；合并区域非锚点格 base 为该格自身空值，
 *  宿主如需合并文本自行读锚点。纯函数、同步、O(1) 查找；不写模型、不进快照。 */
export type ResolveCellRenderer = (
  addr: CellAddress,
  base: CellValue | undefined
) => ICustomLayoutObj | undefined

export type SheetGridContextMenuKind = 'body' | 'row-header' | 'col-header'

export interface SheetGridContextMenuInfo {
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

/** VTable 布局构建器（Container / Text / Rect / Image / Group），本入口 re-export 自 @visactor/vtable */
export { CustomLayout }
/** VTable customLayout 布局对象类型，本入口 re-export */
export type { ICustomLayoutObj }

export class SheetGrid {
  constructor(options: SheetGridOptions)
  /** 底层 ListTable 实例；仅在确实需要 VTable 原生能力时使用 */
  getTable(): ListTable
  /** 浮动图片 DOM 叠层实例（ImageLayer 类型未从子路径导出） */
  getImageLayer(): ImageLayer
  /** 全量重建 records（setRecords） */
  refresh(): void
  /** 容器内相对坐标 → 模型地址；行号列 / 列头 / 空白返回 null */
  hitTestSheetAddr(x: number, y: number): CellAddress | null
  /** 立即执行排队的微任务批量同步（cell-change / merge-change 合并 flush） */
  flushPending(): void
  /** 立即从模型全量同步一次（记录、wrap 行高、冻结、选区、列宽、图片可见性） */
  syncFromModel(): void
  /** false 挂起模型→视图同步（LRU 隐藏实例）；true 恢复并一次性补齐 */
  setVisible(on: boolean): void
  /** 撤销；有可撤销操作返回 true */
  undo(): boolean
  /** 重做；有可重做操作返回 true */
  redo(): boolean
  /** 释放 VTable 实例、事件监听与图片叠层 */
  release(): void
  /** 等价 release() */
  destroy(): void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | --- | :---: | --- |
| `container` | `HTMLElement` | — | 是 | 容器需有宽高；grid 在容器上挂键盘与触摸滚动监听 |
| `sheet` | `Sheet` | — | 是 | 一个 Sheet 实例可对应多个 SheetGrid；释放 grid 不影响模型 |
| `rows` | `number` | `100` | 否 | 与模型现有行数取大，最小 1；仅渲染高水位，空格不占存储 |
| `cols` | `number` | `26` | 否 | 与模型现有列数取大，最小 1；仅渲染高水位，空格不占存储 |
| `readonly` | `boolean` | `false` | 否 | `true` 时关闭编辑器与回写、填充柄、行列 resize、undo/redo 快捷键、图片拖动与删除；保留渲染、选区、滚动、键盘导航、`onContextMenu` |
| `showRowHeader` | `boolean` | `true` | 否 | `false` 不渲染行号列；冻结映射不再 +1 |
| `showColHeader` | `boolean` | `true` | 否 | `false` 不渲染列头行；冻结映射不再 +1 |
| `resolveDisplayValue` | `ResolveDisplayValue` | — | 否 | record 构建时触发（数据变更才重建），开销最低 |
| `resolveCellStyle` | `ResolveCellStyleHook` | — | 否 | 每次场景图重绘 × 视口可见格，最热路径 |
| `resolveCellRenderer` | `ResolveCellRenderer` | — | 否 | 视口格布局时触发；**仅宿主传入才安装**列级 customLayout 分发器 |
| `onContextMenu` | `(info) => void` | — | 否 | 右键时触发；`info.x` / `info.y` 为 viewport 坐标 |
| `onEditStart` / `onEditEnd` | `(addr) => void` | — | 否 | 编辑进入 / 退出；`readonly: true` 不触发 |
| `interceptSelection` | `() => boolean` | — | 否 | 返回 `true` 拦截本次选区（不写入模型选区） |
| `onSelectionIntercept` | `(range) => void` | — | 否 | 拦截发生时回调被拦截的模型区域；须与 `interceptSelection` 配对使用 |

## 方法与事件

实例方法全部同步。宿主常用：`getTable`（VTable 原生能力）、`hitTestSheetAddr`（拖放命中单元格）、`flushPending` / `syncFromModel` / `setVisible`（多实例与挂起恢复）、`undo` / `redo`（自定义工具栏按钮）、`release`（卸载）。`resolveEditTextForEditor` / `notifyEditorEditStart` / `notifyEditorEditEnd` 是编辑器路由的内部对接点，由本库注册的单元格编辑器回调，宿主不直接调用。

回调触发时机：

- `onContextMenu(info)`：右键任意区域。`kind = 'body'` 时 `addr` 为模型地址；`'row-header'` / `'col-header'` 时 `addr` 为 `null`、`row` / `col` 为模型行列号；角点归 `'body'`（`addr` 为 `null`）。本库只回调，不渲染菜单。
- `onEditStart(addr)` / `onEditEnd(addr)`：编辑器打开 / 关闭，`addr` 为模型地址。
- 选区：VTable `SELECTED_CELL` / `DRAG_SELECT_END` → `interceptSelection()` 返回 `true` 则不写模型并回调 `onSelectionIntercept(range)`；否则写入 `sheet` 选区并回驱视图（`syncingSelection` 防递归）。
- 模型 → 视图：监听 `Sheet` 的 `cell-change` / `merge-change` / `content-reset` / `image-change` 等事件批量刷新，不逐补丁同步；超过 64 格的批次走一次 `setRecords` 全量重建。

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
  readonly: true, // 不挂编辑器、禁填充柄与行列 resize、不绑 undo 快捷键
  showRowHeader: true,
  onContextMenu: (info) => {
    // readonly 下照常触发；菜单内容由宿主决定
    console.log(info.kind, info.addr) // => 'body' { row: 0, col: 0 }
  }
})
```

### 自定义渲染（resolveCellRenderer + CustomLayout）

```ts
import { Workbook } from '@veltra/sheet-core'
import { CustomLayout, SheetGrid, type ResolveCellRenderer } from '@veltra/sheet-core/grid'

// 纯函数、同步、O(1)：按格返回布局对象，undefined 回落默认渲染
const resolveCellRenderer: ResolveCellRenderer = (addr, base) => {
  if (addr.col !== 0) return undefined // 仅第一列自定义
  return {
    rootContainer: new CustomLayout.Container({ width: 80, height: 28, fill: '#E8F1FF' }),
    renderDefault: false // false 不叠加默认文本；true 在自定义布局上叠加
  }
}

const grid = new SheetGrid({
  container: document.getElementById('<容器 id>')!,
  sheet: new Workbook().activeSheet,
  resolveCellRenderer
})
```

### 样式叠加与显示值覆盖

```ts
import { Workbook } from '@veltra/sheet-core'
import { SheetGrid, type ResolveCellStyleHook } from '@veltra/sheet-core/grid'

const sheet = new Workbook().activeSheet
sheet.setCellValue({ row: 0, col: 0 }, 5)

// 样式 hook：基于 baseStyle 叠加，返回 undefined 回落默认
const resolveCellStyle: ResolveCellStyleHook = (addr, baseStyle) => {
  if (addr.row !== 0) return undefined
  return { ...baseStyle, fill: { color: '#FFF7E6' } }
}

const grid = new SheetGrid({
  container: document.getElementById('<容器 id>')!,
  sheet,
  resolveCellStyle,
  // 显示值覆盖：只影响显示，模型仍存原始值 5
  resolveDisplayValue: (addr, base) => (typeof base === 'number' ? `${base} 分` : base)
})
sheet.getCellData({ row: 0, col: 0 })?.v // => 5（模型原始值不变）
```

## 注意事项

> [!WARNING]
> - 本库从 `@veltra/sheet-core/grid` 子路径导入 `SheetGrid` / `CustomLayout` / `resolveCellRenderer` 相关符号，**不是主入口**；主入口刻意不 re-export，避免无头 `import { Workbook }` 把 `@visactor/vtable` 类型图拉进 TS 程序。
> - `CustomLayout` 是 `@visactor/vtable` 的布局构建器，本入口仅 re-export；布局对象形态遵循 VTable `customLayout` 约定（`rootContainer` + `renderDefault`），不是本库自研 DSL。
> - 三个渲染 hook 必须是纯函数、同步返回、O(1) 查找（稀疏 Map / 地址直查），禁止异步操作与长数组 / 大字符串分配；hook 不写模型、不进快照。
> - 不需要自定义渲染就不要传 `resolveCellRenderer`：customLayout 存在会使 VTable 对该列关闭 fast-update 快路径，默认场景必须保持零差异。
> - `readonly: true` 只守 grid 入口：绕过 SheetGrid 直接调命令仍可写模型，只读场景不要暴露命令入口。工具栏 / 公式栏等 grid 之外的写入口由宿主自行隐藏。
> - 主题由本库内置（`themes.DEFAULT.extends`）；经 `getTable()` 拿到 ListTable 后禁止再赋裸 theme 对象，会丢默认色。
> - 需要 ListTable 事件时用 `ListTable.EVENT_TYPE`，不是 `core.EVENT_TYPE`（后者运行时为 `undefined`）。
> - 列宽在构造期写入 column def（一次布局）；运行期改列宽走模型 `sheet.setColWidth`，由适配层回放，禁止对大量列逐次调 ListTable 的 `setColWidth`（实测数百列会卡秒级）。
> - 深导入 `@veltra/sheet-core/core/*` 通配子路径对 tsc 不友好，需 tsconfig `paths` 兜底；显式 `./grid` 子路径无此问题。

## 常见问题

### 导入 `SheetGrid` 报「没有导出」或类型缺失

原因：从主入口 `@veltra/sheet-core` 导入。修复：一律从子路径导入：

```ts
import { SheetGrid, CustomLayout } from '@veltra/sheet-core/grid'
import { Sheet } from '@veltra/sheet-core'
```

### 双击单元格不进入编辑

原因：`readonly: true` 关闭了编辑器，或目标格被 `Sheet.setCellReadonly` 标记为只读（列级 editor 对只读格返回空，双击 / Enter 均不进入）。修复：去掉 `readonly`，或用 `Sheet.setCellReadonly(addr, false)` 解除标记（见 `model.md`）。

### 右键没有菜单出现

原因：本库只回调 `onContextMenu(info)` 并拦截浏览器默认菜单，不渲染任何菜单 UI。修复：在回调里自行弹菜单（`info.x` / `info.y` 可直接定位），按 `info.kind` 区分 body / 行号 / 列头。
