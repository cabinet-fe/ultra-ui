---
title: Ultra UI 电子表格接入场景
description: 端到端接入 USheet 电子表格：宿主给高度的基础接入、填报只读（setCellReadonly / setRangeReadonly + 隐藏工具栏公式栏）、registerTool 自定义工具，模型操作全部走 @veltra/sheet-core。
aliases: [电子表格, 在线表格, 填报, USheet, Sheet, spreadsheet]
keywords: [USheet, Workbook, setCellReadonly, setRangeReadonly, isCellReadonly, setCellValue, history.clear, showToolbar, showFormulaBar, registerTool, unregisterTool, resolveCellStyle, SheetContext, createRange, 填报, 只读单元格, 隐藏工具栏, 自定义工具, 在线填报]
---

# Ultra UI 电子表格接入场景

Ultra UI（`@veltra/*`）的电子表格方案：`@veltra/sheet` 的 `USheet` 负责 UI（工具栏、公式栏、网格、sheet 标签），数据模型全部在 `@veltra/sheet-core` 的 `Workbook` / `Sheet` 上。本方案覆盖基础接入、填报只读与自定义工具栏工具。

## 场景

- 何时用本方案：需要类 Excel 的在线表格（填报模板、报表录入、数据查看），或要在表格上做只读权限与自定义工具。
- 何时不用：普通行列数据列表——用 `UTable`（见 `recipes/pages.md`）；工作簿模型、公式、导入导出的细节——查 `sheet-core/model.md`、`sheet-core/commands.md`、`sheet-core/io.md`。

## 完整示例

```bash
bun add @veltra/sheet @veltra/sheet-core
```

```ts
// src/main.ts —— 主题必须初始化，否则网格与工具栏无颜色
import { createApp } from 'vue'
import App from './App.vue'
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()

createApp(App).mount('#app')
```

```vue
<!-- src/views/ReportSheet.vue —— 填报模板 + 自定义「插入日期」工具 -->
<script setup lang="ts">
import { USheet, registerTool, unregisterTool } from '@veltra/sheet'
import type { SheetContext, SheetExposed } from '@veltra/sheet'
import { Workbook, createRange, type CellAddress } from '@veltra/sheet-core'
import type { ResolveCellStyleHook } from '@veltra/sheet-core/grid'
import '@veltra/sheet/components/sheet/style'
import { onBeforeUnmount, useTemplateRef } from 'vue'

// ---- 1. 建工作簿与模板（模型操作走 @veltra/sheet-core）----
const workbook = new Workbook()
const sheet = workbook.activeSheet
// 坐标 0-based：{ row: 0, col: 0 } 即 A1
sheet.setCellValue({ row: 0, col: 0 }, '品名')
sheet.setCellValue({ row: 0, col: 1 }, '数量')
sheet.setCellValue({ row: 1, col: 0 }, 'A4 纸')
sheet.setCellValue({ row: 1, col: 1 }, 200)

// ---- 2. 填报只读：整表锁定，再放开两个填写格 ----
// setRangeReadonly 批量标记，事务合并为单 undo 单元
sheet.setRangeReadonly(createRange({ row: 0, col: 0 }, { row: 99, col: 25 }))
const writable: CellAddress[] = [
  { row: 1, col: 1 } // 只放开 B2
]
for (const addr of writable) sheet.setCellReadonly(addr, false) // 第二参 false 解除
sheet.history.clear() // 模板是基线，不进 undo 历史

// 填写格高亮：叠加视口样式，不写模型；必须同步、O(1) 查找
const writableKeys = new Set(writable.map((addr) => `${addr.row},${addr.col}`))
const resolveCellStyle: ResolveCellStyleHook = (addr, base) =>
  writableKeys.has(`${addr.row},${addr.col}`) ? { ...base, fill: { color: '#fffaeb' } } : undefined

// ---- 3. 自定义工具：注册表全局共享，一次注册全部实例可见 ----
registerTool({
  id: 'report-insert-date',
  title: '插入日期',
  group: 'report', // 新分组名，组间渲染分隔符
  order: 0,
  disabled: (ctx: SheetContext) => !ctx.getSelection().activeCell, // 无选区禁用
  onClick: (ctx: SheetContext) => {
    const { activeCell } = ctx.getSelection()
    if (!activeCell) return
    // 写入经命令系统，可撤销
    ctx.setCellValue(activeCell, new Date().toLocaleDateString('sv-SE'))
  }
})
onBeforeUnmount(() => {
  unregisterTool('report-insert-date') // id 不存在返回 false
})

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

function lockAll(): void {
  // 提交后整表重锁并建立新基线
  sheet.setRangeReadonly(createRange({ row: 0, col: 0 }, { row: 99, col: 25 }))
  sheet.history.clear()
}
</script>

<template>
  <!-- 宿主必须给明确高度；grid 区 flex: 1 -->
  <u-sheet
    ref="sheetRef"
    :workbook="workbook"
    :show-toolbar="false"
    :show-formula-bar="false"
    :resolve-cell-style="resolveCellStyle"
    style="height: 480px"
  />
</template>
```

期望结果：渲染 480px 高的表格，表头两格灰底模板、B2 黄底可编辑；双击其他格无法进入编辑；`lockAll()` 后整表不可写。要看到工具栏效果时改回 `:show-toolbar="true"`（默认），工具栏出现「插入日期」按钮。

## 要点说明

- 基础接入四件事：装 `@veltra/sheet` + `@veltra/sheet-core`；入口 `loadTheme()`；样式 `import '@veltra/sheet/components/sheet/style'`（或 `VeltraUIResolver` 自动引入）；宿主给组件明确高度——grid 区是 `flex: 1`，根元素高度塌陷为 0 时表格不可见。
- 不传 `workbook` 时组件内部自建单 sheet 空工作簿；多表、跨表公式、模板预置必须由宿主创建 `Workbook` 传入。`workbook.activeSheet` 即默认表（名为 `Sheet1`），`workbook.addSheet('名')` 加表。
- 坐标一律 0-based `{ row, col }`，不是 `'A1'` 字符串；A1 互转用 `@veltra/sheet-core` 的 `parseAddress` / `formatAddress`。
- 填报只读三件套（`Sheet` 模型方法，`from '@veltra/sheet-core'`）：`setCellReadonly(addr, readonly = true)` 单格、`setRangeReadonly(range, readonly = true)` 区域批量（单 undo 单元）、`isCellReadonly(addr)` 查询（合并格解析锚点）。拦截发生在 grid 层：双击、Enter、回写、填充柄都被拦。
- 隐藏写入口硬规则：填报页必须 `:show-toolbar="false"` 且 `:show-formula-bar="false"`——工具栏和公式栏不经 grid 守卫，留着就能绕过只读直接改合计格。
- `resolveCellStyle` 用于填写格高亮：视口渲染时叠加样式补丁，不写模型、不进快照；hook 必须同步、按地址 O(1) 查找，禁止在回调里扫全表。
- 模板初始化后调 `sheet.history.clear()`，让预置数据成为基线而不进 undo 历史。
- 自定义工具 `registerTool(tool)`：`id` / `title` / `onClick` 必填（缺失同步抛 Error），`group` 分组、`order` 组内排序、`disabled(ctx)` 禁用判定、`popup` 弹层型工具。注册表 `defaultToolRegistry` 全局共享；同 id 重复注册视为替换；`unregisterTool(id)` 返回 `boolean`。工具写操作走 `SheetContext` 的命令入口（`setCellValue` / `applyStyle` / `executeCommand` 等），天然可撤销。
- 提交后重锁：再次 `setRangeReadonly(range)` 并 `history.clear()`。

## 注意事项

> [!WARNING]
> - 模型与命令从 `@veltra/sheet-core` 导入，`@veltra/sheet` 不 re-export：`Workbook` / `Sheet` / `setCellReadonly` / `setRangeReadonly` 一律 `from '@veltra/sheet-core'`；`ResolveCellStyleHook` 等 hook 类型从 `@veltra/sheet-core/grid` 深导入。
> - 本库坐标是 0-based `{ row, col }`，不是 `'A1'` 字符串。
> - `readonly` prop 是整表只读预览（关编辑回写与填充柄），不是填报锁格；按格控制用 `setCellReadonly` / `setRangeReadonly`，且模型层不设防——直接调 `sheet.setCellValue` 仍能写入只读格。
> - `registerTool` 的注册表是全局共享的，不是组件实例级；组件卸载时记得 `unregisterTool`。
> - `USheet` 常用 props 默认值：`rows` 默认 100、`cols` 默认 26、`showToolbar` / `showFormulaBar` / `showTabs` 默认均 `true`、`readonly` 默认 `false`。
> - 暴露成员经解包：模板 ref 上 `sheetRef.value.workbook` 直接是 `Workbook`（不是 `ComputedRef`），另有 `getActiveSheet()` / `getContext()` / `getGrid()`。
