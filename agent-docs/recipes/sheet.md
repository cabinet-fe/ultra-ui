---
title: USheet 接入与填报
description: 接入 USheet，用 setCellReadonly / setRangeReadonly 做表格化填报，并隐藏工具栏与公式栏写入口
---

`USheet` 提供工具栏、公式栏、网格和底部 sheet 标签。数据模型在 `@veltra/sheet-core`，本包不 re-export 那些符号——`Workbook` / `Sheet` 一律 `from '@veltra/sheet-core'`。

```bash
bun add @veltra/sheet @veltra/sheet-core
```

样式：`import '@veltra/sheet/components/sheet/style'`，或走 `VeltraUIResolver`。宿主需给 `.u-sheet` 明确高度（grid 区 `flex: 1`）。

坐标 0-based：`{ row: 0, col: 0 }` 即 A1。

## 基础接入

不传 `workbook` 时组件内部自建单 sheet；多表或填报模板由宿主创建 `Workbook` 再传入。

```vue
<script setup lang="ts">
import { USheet } from '@veltra/sheet'
import { Workbook } from '@veltra/sheet-core'
import '@veltra/sheet/components/sheet/style'

const workbook = new Workbook()
const sheet = workbook.activeSheet
sheet.setCellValue({ row: 0, col: 0 }, '项目')
sheet.setCellValue({ row: 0, col: 1 }, '金额')
</script>

<template>
  <u-sheet :workbook="workbook" style="height: 480px" />
</template>
```

`USheet` 常用 props：`workbook`、`rows`（默认 100）、`cols`（默认 26）、`showToolbar` / `showFormulaBar` / `showTabs`（默认均 true）、`readonly`（整表只读预览）。Exposed：`workbook`、`getActiveSheet()`、`getContext()`、`getGrid()`。

## 表格化填报

填报场景要「大部分格子锁死、少数输入区可写」。模型 API：

- `sheet.setRangeReadonly(range, readonly?)`：批量标记，合并为单 undo 单元
- `sheet.setCellReadonly(addr, readonly?)`：单格；第二参 `false` 解除
- `sheet.isCellReadonly(addr)`：查询（合并格解析锚点）

拦截发生在 grid 层（双击 / Enter / 回写 / 填充柄跳过只读格）。**工具栏和公式栏不经 grid 守卫**，可绕过只读直接改合计格，因此填报宿主必须关掉这些写入口：`:show-toolbar="false"`、`:show-formula-bar="false"`。

输入区高亮走 `resolveCellStyle`（视口渲染时叠加，不写模型）。该 hook 必须同步、O(1) 查找，禁止在回调里扫全表。

```vue
<script setup lang="ts">
import { USheet } from '@veltra/sheet'
import { Workbook } from '@veltra/sheet-core'
import type { ResolveCellStyleHook } from '@veltra/sheet-core/grid'
import '@veltra/sheet/components/sheet/style'

const workbook = new Workbook()
const sheet = workbook.activeSheet

sheet.setCellValue({ row: 0, col: 0 }, '项目')
sheet.setCellValue({ row: 0, col: 1 }, '金额')
sheet.setCellValue({ row: 1, col: 0 }, '办公费')

// 默认渲染区整表锁定，再放开填写格
const fullRange = { start: { row: 0, col: 0 }, end: { row: 99, col: 25 } }
sheet.setRangeReadonly(fullRange)
sheet.setCellReadonly({ row: 1, col: 0 }, false)
sheet.setCellReadonly({ row: 1, col: 1 }, false)
sheet.history.clear()

const editable = new Set(['1,0', '1,1'])

const resolveCellStyle: ResolveCellStyleHook = (addr, base) => {
  if (editable.has(`${addr.row},${addr.col}`)) {
    return { ...base, fill: { color: '#fffaeb' } }
  }
  return undefined
}
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

提交后再次 `setRangeReadonly(fullRange)` 即可整表重锁。`USheet` 的 `readonly` 是整表预览（关闭编辑回写与填充柄），和单元格级只读是两套能力，填报用后者。
