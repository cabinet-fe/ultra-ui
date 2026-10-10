---
title: USheet 电子表格组件
description: USheet 电子表格组件：一个组件渲染工具栏、公式栏、网格与底部 sheet 标签栏，数据模型为 infinitable/sheet 工作簿；支持公式合计（setCellFormula 写入 / getCellData().f 读取 / 数据填充自动重算 / registerFormulaFunction 自定义函数）、原生滚动条缺省（scrollbar 全形态透传）、填报只读（setCellReadonly / setRangeReadonly）、动态单元格样式、自定义工具栏工具、列头定制（header）与类型化编辑器（editors 按格路由）。
aliases: [USheet, Sheet, 电子表格, spreadsheet, 表格编辑器]
keywords:
  [
    SheetProps,
    SheetExposed,
    SheetContextOptions,
    showToolbar,
    showFormulaBar,
    showTabs,
    registerTool,
    setCellReadonly,
    setRangeReadonly,
    resolveCellStyle,
    resolveCellRenderer,
    header,
    editors,
    scrollbar,
    ScrollbarOptions,
    setCellFormula,
    registerFormulaFunction,
    active-sheet-change,
    colResize,
    col-resize-end,
    getContext,
    导出面,
    公式,
    自动重算,
    自定义函数,
    填报,
    只读单元格,
    工具栏,
    公式栏,
    冻结行列,
    跨表公式,
    虚拟滚动
  ]
---

# USheet 电子表格组件

`@veltra/sheet` 导出电子表格组件 `USheet` 与类型 `SheetProps` / `SheetEmits` / `SheetExposed`。`USheet` 负责 UI 与工具栏：工具栏（24 个内置工具）、公式栏（名称框 + fx 输入栏）、虚拟滚动网格、底部 sheet 标签栏与右键菜单。数据模型来自 npm 包 `infinitable`（`/sheet` 子路径，`@veltra/sheet` 的 dependency）的 `Workbook` / `Sheet`——本包不 re-export，`Workbook`、`setCellReadonly` 等模型与命令 API 一律 `from 'infinitable/sheet'` 导入。

## 快速上手

前置条件（缺一不可）：

1. 安装 `@veltra/sheet`（peer `@veltra/desktop` 提供右键菜单、弹层依赖；引擎 `infinitable` 随包自动安装）。
2. 应用入口初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`；不初始化则 `--u-*` token 为空、组件无颜色。
3. 样式二选一：手动 `import '@veltra/sheet/components/sheet/style'`；或经 `unplugin-vue-components` 配 `VeltraUIResolver`（`@veltra/vite` 导出）自动引入样式。
4. 宿主必须给组件明确高度：grid 区是 `flex: 1`，根元素高度塌陷为 0 时表格不可见。

```vue
<script setup lang="ts">
import { USheet } from '@veltra/sheet'
import { Workbook } from 'infinitable/sheet'
import '@veltra/sheet/components/sheet/style'

const workbook = new Workbook()
const sheet = workbook.activeSheet
sheet.setCellValue({ row: 0, col: 0 }, '品名') // 0-based：{ row: 0, col: 0 } 即 A1
sheet.setCellValue({ row: 0, col: 1 }, '数量')
sheet.setCellValue({ row: 1, col: 0 }, 'A4 纸')
sheet.setCellValue({ row: 1, col: 1 }, 200)
</script>

<template>
  <!-- 不传 workbook 时组件内部自建单 sheet 空工作簿 -->
  <u-sheet :workbook="workbook" :rows="40" :cols="10" style="height: 480px" />
</template>
```

## API 签名

从 `@veltra/sheet` 导出的组件与类型（工具注册 API `registerTool` / `createSheetContext` 等见 `agent-docs/sheet/sheet-tools.md`；导出面逐项结论见下方「导出面清单」）：

```ts
import type { Sheet, Workbook } from 'infinitable/sheet'
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

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 电子表格组件属性 */
export interface SheetProps {
  /** 工作簿实例（多 sheet / 跨表公式的载体）；缺省内部自建（单 sheet） */
  workbook?: Workbook
  /** 渲染行数，默认 100 */
  rows?: number
  /** 渲染列数，默认 26（A..Z） */
  cols?: number
  /** 显示值覆盖：覆盖视口 record，不写 CellData.v */
  resolveDisplayValue?: ResolveDisplayValue
  /** 动态单元格样式：视口渲染时叠加样式补丁，不写 CellData.s */
  resolveCellStyle?: ResolveCellStyleHook
  /** 动态单元格渲染：按格返回引擎 CellRenderer；返回 undefined 回落默认渲染；不写模型、不进快照 */
  resolveCellRenderer?: ResolveCellRenderer
  /**
   * 列头机制（透传 SheetGrid）：按列列头标题与表头自定义 DOM 渲染，不传保持缺省字母
   * 表头；引用更替触发网格重建
   */
  header?: SheetGridHeaderOptions
  /**
   * 类型化编辑器机制（透传 SheetGrid）：多编辑器注册与按格路由，不传保持统一文本
   * 编辑器；readonly 下忽略；引用更替触发网格重建
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
  /** 只读预览（关闭编辑回写、填充柄等写入口），默认 false */
  readonly?: boolean
  /** 列宽拖拽（透传 SheetGrid）：readonly 下置 true 仅放开列头 resize 手柄，编辑仍关闭；默认 false */
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
  /** 列宽拖拽落定（拖拽写模型之后）：载荷含列索引与最终宽度 */
  (name: 'col-resize-end', payload: { col: number; width: number }): void
}

/** 组件内部定义；ref 上实际是解包后的 SheetExposed 形态 */
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

`SheetExposed` 经 `DeconstructValue` 解包：模板 ref 上 `sheetRef.value.workbook` 直接是 `Workbook`，不是 `ComputedRef<Workbook>`。`SheetContext` 类型见 `agent-docs/sheet/sheet-tools.md`。

### 导出面清单（逐项结论）

`@veltra/sheet` 主入口（`src/index.ts`）导出面逐项审计结论。入口同时执行内置工具副作用注册（`import './tools/builtin'`，pack treeshake 已按 sideEffects 保留）。

| 符号 | 导出 | 理由 |
| ------------------------------ | :--: | ------------------------------------------------------------------------------------------------------------------ |
| `USheet` | 是 | 组件本体；下游（如 meta report）经模板使用的唯一组件入口 |
| `SheetProps` / `SheetEmits` | 是 | 组件 props / emits 类型，宿主类型标注必需 |
| `SheetExposed` | 是 | 模板 ref 类型（meta report 现用法）；经 `DeconstructValue` 解包后的形态 |
| `createSheetContext` / `SheetContext` | 是 | 无头 imperative API（脚本、测试、自组 UI 场景），见 `agent-docs/sheet/sheet-tools.md` |
| `SheetContextOptions` | 是 | `createSheetContext` 第三参类型：导出函数签名引用的稳定类型须随函数可达（无头宿主引用 `resolveGridSize` / `syncAxisSizes` 配置） |
| `registerTool` / `unregisterTool` / `defaultToolRegistry` | 是 | 工具栏扩展注册 API（全局注册表入口） |
| `SheetTool` / `SheetToolGroup` / `SheetToolPopupType` | 是 | 注册 API 的定义类型，下游编写自定义工具必需 |
| 内部 hooks（`use-tool-popup` / `use-sheet-grid` / `use-formula-suggest` 等） | 否 | 组件内部实现细节，签名与行为不构成稳定承诺 |
| popup 子组件（`functions-popup.vue` / 各弹层面板） | 否 | UI 编排细节；交互经工具栏工具与公式栏入口触达 |
| `apply-style` 内部函数（`axisStyleItemsForRange` / `classifySelectionStyleTarget`） | 否 | `SheetContext.applyStyle` 门面内部实现 |
| `ToolRegistry` 类 / `DEFAULT_TOOL_GROUP` / `MIN_ROW_COL_SIZE` | 否 | 外部一律用 `defaultToolRegistry` 实例与 `registerTool` / `unregisterTool`；缺省分组与尺寸下限由字段缺省值 / 门面钳制承担 |
| 引擎符号（`Workbook` / `Sheet` / `ScrollbarOptions` / `SetCellValueItem` / `registerFormulaFunction` 等） | 否 | 「不 re-export 引擎符号」约定：模型与类型从 `infinitable/sheet` 直导，公式注册表 API 从 `infinitable` 主入口直导 |

判定口径：稳定公共 API（组件、props/emits/exposed 类型、imperative 门面及其配置类型、工具注册函数与定义类型）导出；内部实现（hooks、popup 子组件、门面内部函数、常量）与引擎符号不导出。

## 参数说明

| 参数                  | 类型                      | 默认                    | 必填 | 约束                                                                                                                                                                  |
| --------------------- | ------------------------- | ----------------------- | :--: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workbook`            | `Workbook`                | 内部自建单 sheet 工作簿 |  否  | 运行期更换引用触发整表重建（tabs、网格、事件重绑）                                                                                                                    |
| `rows`                | `number`                  | `100`                   |  否  | 渲染行数；只决定可视区尺寸，不限制模型写入范围                                                                                                                        |
| `cols`                | `number`                  | `26`                    |  否  | 渲染列数（A..Z）                                                                                                                                                      |
| `showToolbar`         | `boolean`                 | `true`                  |  否  | `false` 时工具栏整体不渲染                                                                                                                                            |
| `showFormulaBar`      | `boolean`                 | `true`                  |  否  | 公式栏含名称框与 fx 输入栏；填报页必须设 `false`                                                                                                                      |
| `showTabs`            | `boolean`                 | `true`                  |  否  | 底部标签栏：点击切换、末尾「+」新增、右键重命名/删除                                                                                                                  |
| `showRowHeader`       | `boolean`                 | `true`                  |  否  | 行号列；右键菜单含插入/删除行、行高、冻结到当前行                                                                                                                     |
| `showColHeader`       | `boolean`                 | `true`                  |  否  | 列字母表头；右键菜单含插入/删除列、列宽、冻结到当前列                                                                                                                 |
| `readonly`            | `boolean`                 | `false`                 |  否  | 整表只读预览；按格控制改用模型 `setCellReadonly`                                                                                                                      |
| `colResize`           | `boolean`                 | `false`                 |  否  | 列宽拖拽透传 SheetGrid：`readonly: true` 下置 `true` 仅放开列头 resize 手柄（编辑仍关闭），供只读预览宿主微调列宽；非 readonly 本就允许拖拽；变化触发网格重建          |
| `scrollbar`           | `boolean \| ScrollbarOptions` | `{ mode: 'native' }` | 否 | 滚动条透传 SheetGrid：`false` 整体关闭（不显示任何滚动条）；缺省原生档——浏览器原生滚动条独立 gutter 渲染、不遮挡最底行/最右列；`true` 画布悬浮滚动条；对象形态按引擎语义透传（`mode: 'canvas'` 回画布档，含 `visibility` / `hideDelay` / `reserve`）。`ScrollbarOptions` 从 `infinitable/sheet` 导入；对象为构造期选项，引用更替触发网格重建（勿在模板内联对象字面量） |
| `resolveDisplayValue` | `ResolveDisplayValue`     | —                       |  否  | `(addr, base) => CellValue \| undefined`；必须同步                                                                                                                    |
| `resolveCellStyle`    | `ResolveCellStyleHook`    | —                       |  否  | `(addr, baseStyle?) => CellStyle \| undefined`；必须同步、O(1) 查找                                                                                                   |
| `resolveCellRenderer` | `ResolveCellRenderer`     | —                       |  否  | `(addr, base) => CellRenderer \| undefined`；返回 undefined 回落默认渲染（类型见 `infinitable/sheet`）                                                          |
| `header`              | `SheetGridHeaderOptions`  | —                       |  否  | 列头机制透传 SheetGrid：`resolveTitle` 按列覆盖标题、`resolveHeader` 按列自定义表头 DOM；机制签名与行为见 `infinite-table` 库文档（docs-search）；引用更替触发网格重建 |
| `editors`             | `SheetGridEditorsOptions` | —                       |  否  | 类型化编辑器机制透传 SheetGrid：`editors` 注册自定义编辑器、`route` 按格路由，未命中回落统一文本编辑器；`readonly` 时忽略；引用更替触发网格重建                       |

## 方法与事件

### 事件

`active-sheet-change`：payload `{ sheet: Sheet; index: number }`。工作簿活动表变化时触发——点击底部标签、宿主调用 `workbook.activateSheet()`、删除激活 sheet 后自动切换；触发前组件已完成弹层关闭与网格切换。更换 `workbook` prop 不触发本事件。

`col-resize-end`：payload `{ col: number; width: number }`。列宽拖拽落定时触发（拖拽已自动写回 `sheet.setColWidth`，不进 undo）；`readonly` 下须同时 `colResize: true` 才可拖拽。

### 暴露方法（`SheetExposed`）

模板 ref 用 `useTemplateRef<SheetExposed>('sheetRef')` 取值。均为同步方法：

| 成员             | 签名                         | 说明                                                                                  |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| `workbook`       | `Workbook`                   | 当前工作簿；`props.workbook` 缺省时为内部自建实例                                     |
| `getActiveSheet` | `(): Sheet`                  | 当前活动 `Sheet` 实例；模型读写从这里进                                               |
| `getContext`     | `(): SheetContext`           | 工具上下文，成员清单见下                                                              |
| `getGrid`        | `(): SheetGrid \| undefined` | 底层网格实例（调试/测试用），未挂载时 `undefined`；模型变更自动同步视图，无需手动刷新 |

`getActiveSheet()` 返回的 `Sheet` 来自 `infinitable/sheet`。填报只读控制的三个模型方法签名（本包不 re-export）：

```ts
import type { CellAddress, CellRange } from 'infinitable/sheet'
// CellAddress = { row: number; col: number }
// CellRange = { start: CellAddress; end: CellAddress }（闭区间，start 恒为左上角）

sheet.setCellReadonly(addr: CellAddress, readonly = true): void // 标记/解除单格只读
sheet.setRangeReadonly(range: CellRange, readonly = true): void // 区域批量标记，事务合并为单 undo 单元
sheet.isCellReadonly(addr: CellAddress): boolean // 合并格解析锚点后判断
```

### `getContext()` 返回的 `SheetContext` 成员清单

- 状态：`sheetName`（活动表名，只读）、`workbook?`（只读引用）
- 选区：`getSelection` / `selectCell` / `selectRange`
- 读取：`getCellData`（原始存储）/ `getDisplayValue`(锚点解析) / `getCellInfo`（合并语义）
- 样式（写经命令系统，可 undo）：`applyStyle` / `resolveStyleTarget` / `clearStyle` / `setCellStyle` / `clearCellStyle` / `setRowStyle` / `setColStyle` / `getCellStyle` / `getEffectiveStyle`
- 写入（可 undo）：`setCellValue` / `setCellFormula` / `setCells` / `mergeCells` / `unmergeCells` / `executeCommand`
- 事务：`beginTransaction` / `commit` / `rollback`
- 历史：`undo` / `redo` / `canUndo` / `canRedo`
- 冻结：`frozen`（只读）/ `setFrozen(rows, cols)`（不进 undo）
- 行列结构（可 undo）：`insertRows` / `insertCols` / `deleteRows` / `deleteCols`
- 浮动图片（可 undo）：`insertImage` / `removeImage` / `updateImage` / `getImages`
- 订阅：`onSelectionChange` / `onHistoryChange` / `onFrozenChange` / `onImageChange`，返回取消订阅函数；订阅绑定当时的活动 sheet，tab 切换后必须重新订阅

完整类型块见 `agent-docs/sheet/sheet-tools.md`。

## 典型示例

### 基础接入：双表与跨表公式

```vue
<script setup lang="ts">
import { USheet } from '@veltra/sheet'
import type { SheetExposed } from '@veltra/sheet'
import { Workbook, type Sheet } from 'infinitable/sheet'
import '@veltra/sheet/components/sheet/style'
import { useTemplateRef } from 'vue'

const workbook = new Workbook()
const sheet1 = workbook.activeSheet // 默认表 Sheet1
const sheet2 = workbook.addSheet('数据源')

sheet2.setCellValue({ row: 0, col: 0 }, '项目')
sheet2.setCellValue({ row: 0, col: 1 }, '数量')
sheet2.setCellValue({ row: 1, col: 1 }, 42)

sheet1.setCellValue({ row: 0, col: 0 }, '汇总')
// 公式以 = 开头；跨表引用 数据源!B2
sheet1.setCellFormula({ row: 0, col: 1 }, '=SUM(数据源!B2:B10)')

// 初始数据作为基线，不进 undo 历史
sheet1.history.clear()
sheet2.history.clear()

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

function onSheetChange(payload: { sheet: Sheet; index: number }): void {
  console.log(payload.sheet.name, payload.index) // => 点击标签后如 '数据源' 1
}
</script>

<template>
  <u-sheet
    ref="sheetRef"
    :workbook="workbook"
    style="height: 480px"
    @active-sheet-change="onSheetChange"
  />
</template>
```

`sheetRef.value?.workbook === workbook` 为 `true`（解包后的 `workbook` 即传入实例）。底部标签栏点击即切换并触发 `active-sheet-change`；标签右键可重命名 / 删除（最后一个 sheet 禁删）。

### 填报：整表锁定并放开填写格

填报页必须 `:show-toolbar="false"` 且 `:show-formula-bar="false"`：只读拦截在网格层（双击、Enter、回写、填充柄均被拦），工具栏与公式栏不经这层守卫，留着就能绕过锁定。

```vue
<script setup lang="ts">
import { USheet } from '@veltra/sheet'
import { Workbook, createRange, type CellAddress } from 'infinitable/sheet'
import type { ResolveCellStyleHook } from 'infinitable/sheet'
import '@veltra/sheet/components/sheet/style'

const workbook = new Workbook()
const sheet = workbook.activeSheet
sheet.setCellValue({ row: 0, col: 0 }, '品名')
sheet.setCellValue({ row: 0, col: 1 }, '数量')
sheet.setCellValue({ row: 1, col: 0 }, 'A4 纸')

// 锁定默认渲染区（100 行 × 26 列），再放开两个填写格
sheet.setRangeReadonly(createRange({ row: 0, col: 0 }, { row: 99, col: 25 }))
const writable: CellAddress[] = [
  { row: 1, col: 0 },
  { row: 1, col: 1 }
]
for (const addr of writable) sheet.setCellReadonly(addr, false)
sheet.history.clear() // 模板为基线，不进 undo

// 填写格高亮：叠加视口样式，不写模型；必须同步、按地址 O(1) 查找
const writableKeys = new Set(writable.map((addr) => `${addr.row},${addr.col}`))
const resolveCellStyle: ResolveCellStyleHook = (addr, base) =>
  writableKeys.has(`${addr.row},${addr.col}`) ? { ...base, fill: { color: '#fffaeb' } } : undefined
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

提交后重新整表锁定：再次 `sheet.setRangeReadonly(range)` 并 `sheet.history.clear()` 建立新基线。完整填报流程（校验、按格自动保存）见 `agent-docs/recipes/sheet.md`。

### 自定义工具栏按钮

```vue
<script setup lang="ts">
import { USheet, registerTool, unregisterTool } from '@veltra/sheet'
import type { SheetContext } from '@veltra/sheet'
import { Workbook } from 'infinitable/sheet'
import { onBeforeUnmount } from 'vue'
import '@veltra/sheet/components/sheet/style'

// 注册表全局共享：注册一次，页面里所有 USheet 实例都显示该按钮
registerTool({
  id: 'fill-demo-highlight',
  title: '标黄选区',
  group: 'demo', // 新分组名 → 组间渲染分隔符
  order: 0, // 组内排序，缺省 0
  disabled: (ctx: SheetContext) => !ctx.getSelection().activeCell, // 无选区时禁用
  onClick: (ctx: SheetContext) => {
    const { activeCell, ranges } = ctx.getSelection()
    if (!activeCell || !ranges[0]) return
    ctx.applyStyle(ranges[0], { fill: { color: '#fff3cd' } }) // 写入经命令系统，可撤销
  }
})

onBeforeUnmount(() => {
  unregisterTool('fill-demo-highlight') // 返回 boolean；id 不存在返回 false
})

const workbook = new Workbook()
workbook.activeSheet.setCellValue({ row: 0, col: 0 }, '选中格子后点工具栏「标黄选区」')
</script>

<template>
  <u-sheet :workbook="workbook" style="height: 480px" />
</template>
```

`SheetTool` 全部字段、弹层型工具（`popup`）、覆盖内置工具与无头 `createSheetContext` 见 `agent-docs/sheet/sheet-tools.md`。

### 公式合计：写公式 / 读公式 / 数据填充自动重算 / 自定义函数（meta 报表场景）

公式能力四个入口全部经 `SheetContext`（`sheetRef.value.getContext()`）与 `infinitable` 主入口触达；求值与依赖重算为引擎内建——写命令执行后自动增量重算，宿主无需手动刷新：

- **写公式**：`ctx.setCellFormula(addr, '=SUM(B1:B3)')`；`ctx.setCellValue(addr, '=SUM(B1:B3)')` 的 `'='` 前缀同样进公式通道。
- **读公式**：`ctx.getCellData(addr)?.f` 返回公式原文（**不含 `'='` 前缀**，如 `'SUM(B1:B3)'`）；`ctx.getDisplayValue(addr)` 返回计算值。
- **求值与重算**：写入即求值；批量 `ctx.setCells([...])` 填充被引用区域、或 `setCellValue` 修改被引用格后，公式格 `getDisplayValue` 自动更新（一次 `setCells` 调用 = 一个 undo 单元）。公式解析失败显示 `#ERROR!`。
- **自定义函数**：`registerFormulaFunction(name, def)` 从 **`infinitable` 主入口**导入（`@veltra/sheet` 不转售）；注册后内置函数弹框（工具栏「函数」/公式栏 fx）、fx 补全列表与公式求值全部可用。`def.impl(args)` 收到求值后的参数（区域为数值数组）；`def.meta` 提供描述 / 分类 / 参数表，缺省 meta 的函数只出现在弹框「全部」与搜索结果。

```vue
<script setup lang="ts">
import { USheet } from '@veltra/sheet'
import type { SheetExposed } from '@veltra/sheet'
// 引擎直导：模型走 infinitable/sheet；公式注册表走 infinitable 主入口（宿主 package.json 须显式声明 infinitable 依赖）
import { Workbook } from 'infinitable/sheet'
import { registerFormulaFunction } from 'infinitable'
import '@veltra/sheet/components/sheet/style'
import { useTemplateRef } from 'vue'

// 自定义合计函数：注册一次，函数弹框 / fx 补全 / 求值即包含它
registerFormulaFunction('REPORTTOTAL', {
  meta: {
    params: [{ name: 'number1' }, { name: '...' }],
    description: '报表数值合计（跳过非数值）',
    category: '统计'
  },
  impl(args) {
    let total = 0
    for (const arg of args) {
      if (Array.isArray(arg)) {
        for (const item of arg) if (typeof item === 'number') total += item
      } else if (typeof arg === 'number') total += arg
    }
    return total
  }
})

const workbook = new Workbook()
const sheet = workbook.activeSheet
sheet.setCellValue({ row: 0, col: 0 }, '项目')
sheet.setCellValue({ row: 0, col: 1 }, '数量')
// 先写合计公式：被引用区域为空 → SUM 为 0
sheet.setCellFormula({ row: 3, col: 1 }, '=SUM(B2:B3)')
sheet.history.clear() // 模板与公式作为基线，不进 undo

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

function fillReportData(): void {
  // 报表数据填充：一次 setCells = 一个 undo 单元；填充后合计自动重算
  const ctx = sheetRef.value!.getContext()
  ctx.setCells([
    { addr: { row: 1, col: 0 }, data: { v: 'A4 纸', t: 's' } },
    { addr: { row: 1, col: 1 }, data: { v: 200, t: 'n' } },
    { addr: { row: 2, col: 0 }, data: { v: '打印机', t: 's' } },
    { addr: { row: 2, col: 1 }, data: { v: 12, t: 'n' } }
  ])
  ctx.getDisplayValue({ row: 3, col: 1 }) // => 212（自动重算，无需手动刷新）
  ctx.getCellData({ row: 3, col: 1 })?.f // => 'SUM(B2:B3)'（公式原文，不含 =）
}
</script>

<template>
  <u-sheet ref="sheetRef" :workbook="workbook" style="height: 480px" />
  <button type="button" @click="fillReportData">填充报表数据</button>
</template>
```

修改被引用单元格（如 `ctx.setCellValue({ row: 1, col: 1 }, 300)`）后合计同样自动重算。从已删除的 `@veltra/sheet-core` 迁移的宿主：`Workbook` / `Sheet` / `setCellFormula`（Sheet 实例方法）等模型符号改从 `infinitable/sheet` 导入，`registerFormulaFunction` / `listFormulaFunctions` 改从 `infinitable` 主入口导入；`@veltra/sheet` 的 `infinitable` 依赖只保证自身运行，宿主使用引擎符号须在自己的 `package.json` 显式声明 `infinitable`。

## 注意事项

> [!WARNING]
>
> - 模型与命令从 `infinitable/sheet` 导入，本包不 re-export：`Workbook` / `Sheet` / `setCellReadonly` / `setRangeReadonly` / `exportWorkbookXlsx` 等一律 `from 'infinitable/sheet'`；`ResolveCellStyleHook` 等 hook 类型同入口。
> - 宿主必须给 `.u-sheet` 明确高度（如 `style="height: 480px"`）；本库不是自动撑满父容器。
> - 填报锁格必须同时 `:show-toolbar="false"` 与 `:show-formula-bar="false"`：公式栏可绕过只读标记写任意格。
> - 组件 prop `readonly` 是整表只读预览，不是填报锁格；按格控制用 `setCellReadonly` / `setRangeReadonly`，且模型层不设防——直接调用 `sheet.setCellValue` 仍能写入只读格。
> - 坐标一律 0-based `{ row, col }`，不是 `'A1'` 字符串；A1 互转用 `infinitable/sheet` 的 `parseAddress` / `formatAddress`。
> - `header` / `editors` 按引用更替判定变化（变化即重建网格）：用 `computed` 持稳定引用，勿在模板内联对象字面量——每次渲染产生新引用会逐渲染重建网格。
> - `registerTool` 的注册表是全局共享的（`defaultToolRegistry`），不是组件实例级的。
> - `scrollbar` 缺省 v3.0 起为原生档 `{ mode: 'native' }`：浏览器原生滚动条在独立 gutter 渲染，不遮挡最底行 / 最右列单元格。旧缺省是画布悬浮滚动条（等价 `true`）；要保留旧观感显式传 `:scrollbar="true"`。`scrollbar: false` 整体关闭语义不变；对象形态引用更替触发网格重建，勿在模板内联对象字面量（同 `header` / `editors`）。
> - 公式原文 `CellData.f` 不含 `'='` 前缀（写入 `'=SUM(B1:B3)'`、读回 `'SUM(B1:B3)'`）；`registerFormulaFunction` 只在 `infinitable` 主入口，`@veltra/sheet` 不转售。

交互事实补充：网格编辑拦截面覆盖双击、Enter、回写与填充柄；行高拖拽、冻结、选区不进 undo 历史；`Ctrl/Cmd+F` 在焦点落入本实例时打开查找条（不劫持容器外浏览器原生查找）；右键菜单分三套（body：合并 / 数据格式 / 插入图片；行号 / 列头：插入删除、行高 / 列宽、冻结）。10 万行 × 12 列经 `setCells` 批量写入 + 虚拟滚动渲染可用（官方 playground `sheet-big-data` 场景）。

## 常见问题

### 表格区域空白，高度为 0

根元素没有高度。修复：给组件显式高度，父容器用 flex 时同时给组件 `flex: 1` 与 `min-height: 0`：

```vue
<template>
  <div style="display: flex; flex-direction: column; height: 100vh">
    <u-sheet style="flex: 1; min-height: 0" />
  </div>
</template>
```

### 组件渲染了但没有颜色

主题未初始化或样式未引入。修复：入口执行 `import '@veltra/styles/normalize'` + `loadTheme()`，并 `import '@veltra/sheet/components/sheet/style'`（或配 `VeltraUIResolver`）。

### 设置了 `setCellReadonly` 的格仍被改写

两条绕过路径：公式栏手输、代码直接调用模型写入。修复：填报页关掉工具栏与公式栏；模型层只读标记不拦截 `setCellValue`——校验逻辑不要依赖模型拦截，提交前用 `getDisplayValue` 自行校验。
