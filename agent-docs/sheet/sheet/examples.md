---
title: USheet 示例
description: 接入 USheet；填报用 setRangeReadonly / setCellReadonly 锁格，并关掉工具栏与公式栏
---

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

## 填报：锁格并关掉写入口

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
