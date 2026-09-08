---
title: 'sheet - -core 电子表格底层数据模型与单元格存储操作'
description: '无头表格核心数据结构：Workbook 工作簿、Sheet 工作表、稀疏矩阵 CellStore 存储、0-based 坐标系统与 A1 单元格地址转换（parseAddress/formatAddress）、区域合并与选区、浮动图片管理与单元格只读权限'
keywords: ['sheet', '@veltra/sheet-core', 'model', '电子表格底层数据模型与单元格存储操作']
aliases: ['model', 'sheet']
---

`@veltra/sheet-core` 主入口导出无头数据模型：`Workbook` 管多表与共享公式依赖图，`Sheet` 是单表统一操作入口。单元格存在稀疏 `CellStore` 里；合并、选区、浮动图片、单元格只读都挂在 `Sheet` 上。坐标一律 0-based：`{ row: 0, col: 0 }` 即 A1。需要 A1 字符串时，主入口另有 `parseAddress` / `formatAddress` / `createRange` / `parseRange` 等工具（不必单独成篇）。

模型与命令、公式、IO 从 `@veltra/sheet-core` 导入。`SheetGrid` 不在主入口，见 `sheet-grid.md`。

```ts
import { Workbook, createRange, parseAddress } from '@veltra/sheet-core'

const workbook = new Workbook() // 构造时已有一张默认表
const sheet = workbook.activeSheet

sheet.setCellValue({ row: 0, col: 0 }, 1) // A1
sheet.setCellValue(parseAddress('B1')!, '=A1+1')
```

## Workbook

- `new Workbook()` 立刻 `addSheet()` 一张表，名称默认 `Sheet1`。
- `addSheet(name?, options?)`：名称缺省为不冲突的 `Sheet{n}`。`options.data` 是从 A1 起的二维数组（原始值自动推断类型；`null` / `undefined` / `''` 跳过；对象 `{ v, t, f }` 可带公式，`f` 不含 `=`）。`options.rows` / `cols` 与数据高水位取大；仅传入时必须是正整数，否则抛错。初始数据写入后 `history.clear()`，基线不进 undo。
- `getSheet(name)` / `getSheets()` / `activeSheet` / `activateSheet(name)` / `removeSheet(name)` / `renameSheet(old, next)`。
- 增删改名 sheet **不进 undo**。
- `beginBatch()` / `endBatch()`：嵌套批量结构变更，结束时合并补发 `sheets-change` 等事件（导入多表时避免事件风暴）。
- 全部 sheet 共享 `workbook.formulaGraph`（`DependencyGraph`）。
- 事件：`on('active-sheet-change' | 'sheets-change' | 'sheet-rename', handler)`，返回取消订阅函数。

改名必须走 `Workbook.renameSheet`，不要调用 `Sheet.setName`（内部接口）。

## Sheet 与 CellStore

`Sheet` 组合 `CellStore`、`MergeManager`、`SelectionModel`、`HistoryManager`、`StylePool`。宿主读写请走 `Sheet` 方法：

| 方法                            | 作用                                             |
| ------------------------------- | ------------------------------------------------ |
| `getCellData(addr)`             | 原始存储；被合并覆盖的非锚点格为 `undefined`     |
| `getDisplayValue(addr)`         | 解析到锚点后的显示值                             |
| `setCellValue(addr, value)`     | 写原始值（空 = 清除）；字符串以 `=` 开头则当公式 |
| `setCells(items)`               | 批量写 `CellData`，一次调用 = 一个 undo 单元     |
| `setCellFormula(addr, formula)` | 写公式（可带或不带 `=`）；原文存在 `CellData.f`  |

空单元格不占存储：无公式且 `v` 为空即删除。`rowCount` / `colCount` 只是数据高水位；`rows` / `cols` 是渲染尺寸（可由视图层 `ensureTableSize` 声明）。

`CellData`：`v` 原始值（公式格为计算缓存）、`t` 类型（`n` / `s` / `b` / `str` / `e` / `d`）、`f` 公式原文（不含 `=`）、`s` 为 `StylePool` 的 `StyleId`。

`CellStore` 是稀疏矩阵（`Map<row, Map<col, CellData>>`），随 `Sheet` 导出。`CellStore.setCellValue` / `Sheet.setCell` / `setCellStyles` 是内部便捷写入口，**不是公开承诺**——生产代码用 `setCells` / `setCellStyle`。

选区、冻结、行高、列宽 **不进 undo**；可随 `sheet.snapshot()` 序列化。样式（含行/列默认样式）进 undo。有效样式 = 列 → 行 → 格字段级叠加（`getEffectiveStyle` / `composeCellStyles`）。

## 合并与选区

合并锚点 = 区域左上角，数据只存在锚点。`MergeManager` 只管几何；值搬迁由 `Sheet.mergeCells` 完成。与既有合并相交时取包围盒。

```ts
import { createRange } from '@veltra/sheet-core'

sheet.mergeCells(createRange({ row: 0, col: 0 }, { row: 1, col: 1 }))
sheet.unmergeCells(createRange({ row: 0, col: 0 }, { row: 1, col: 1 }))
sheet.getCellInfo({ row: 1, col: 1 }) // kind: 'merged-covered'，anchor 指向 A1
```

`getCellInfo` 返回 `kind`：`normal` / `merged-anchor` / `merged-covered`。写入与选中内部会 `resolveAnchor`。

选区由 `SelectionModel` 持有：`selectCell(addr)` / `selectRange(range, active?)` / `getSelection()`。被覆盖格会解析到锚点并扩展到整个合并区。

## 浮动图片

`SheetImage`：`id` + `Uint8Array` 字节 + `type`（`png` / `jpeg` / `gif` / `svg` / `webp`）+ `anchor.from`（可带格内像素 `offsetX` / `offsetY`）+ 可选 `to` / 宽高 / alt / title。写入走命令：

```ts
const id = sheet.insertImage({
  data: pngBytes,
  type: 'png',
  anchor: { from: { row: 0, col: 0 } },
  width: 120,
  height: 80
})
sheet.updateImage(id, { anchor: { from: { row: 1, col: 1 } } })
sheet.removeImage(id)
```

行列插入/删除会平移锚点；锚点区间被完整删除时图片一并移除（同一 undo 单元）。辅助函数 `createImageId` / `cloneSheetImage` / `cloneImageAnchor` 在主入口。

## 单元格只读（填报）

标记存在 Cell Meta，namespace 为导出常量 `CELL_READONLY_META_NAMESPACE`（`'cell-readonly'`），payload 恒为 `true`。可 undo、随 `SheetSnapshot.meta` 序列化、随行列插入删除平移、合并格解析锚点。

```ts
sheet.setRangeReadonly(createRange({ row: 0, col: 0 }, { row: 9, col: 9 }))
sheet.setCellReadonly({ row: 1, col: 1 }, false) // 放开输入格
sheet.isCellReadonly({ row: 0, col: 0 }) // true
```

**拦截在 `SheetGrid`**：只读格不开启编辑器，回写守卫，填充柄跳过只读目标（从只读格向外复制仍允许）。模型层不设防——直接调 `setCellValue` 仍能写入。xlsx 导出不含只读标记。

使用 `@veltra/sheet` 的 `USheet` 时，工具栏 / 公式栏不经 grid 守卫；填报宿主应关掉这些写入口（`showToolbar` / `showFormulaBar` 等为 `false`）。
