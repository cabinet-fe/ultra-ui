---
title: sheet-core 导入导出
description: importXlsx、importCsv、exportWorkbookXlsx、exportSheetXlsx、exportSheetCsv
---

主入口只白名单五个 IO 函数：`importXlsx` / `importCsv` / `exportWorkbookXlsx` / `exportSheetXlsx` / `exportSheetCsv`。引擎是 `hucre`，可无头使用。不要依赖未从主入口导出的转换函数或 `buildWorkbookFromHucre` / `replaceWorkbookWithSnapshots`（那些不是公开承诺）。

```ts
import {
  importXlsx,
  importCsv,
  exportWorkbookXlsx,
  exportSheetXlsx,
  exportSheetCsv
} from '@veltra/sheet-core'

const workbook = await importXlsx(xlsxBuffer) // ArrayBuffer | Uint8Array
importCsv('a,b\n1,2\n', workbook.activeSheet)

const xlsx = await exportWorkbookXlsx(workbook) // Uint8Array
const oneSheet = await exportSheetXlsx(workbook.activeSheet, { fallbackName: '报表' })
const csv = exportSheetCsv(workbook.activeSheet) // UTF-8 BOM 字符串
```

## importXlsx

`importXlsx(buffer, onProgress?)` → 新的 `Workbook`（多 sheet）。解析值、公式、合并、样式、冻结、行高、列宽、浮动图。每个 sheet 的写入是该表历史上的单个 undo 单元。

第二参 `onProgress?(done, total)` 每完成一张表回调一次，供大文件进度 UI；无头调用可省略。

保真度要点：

- 保留：数字 / 字符串 / 布尔 / 错误；日期 ↔ 1900 序列（`t='d'`）；公式表达式（`f` 不含 `=`，缓存由本地引擎重算，不支持的函数 → `#ERROR!`）；合并；样式（fill / 四边 border / font / align，经 `StylePool` 去重）；冻结；行高；列宽；浮动图。
- 跳过：WPS 单元格内嵌图 `cellImages`；数字格式 `numFmt` 本期忽略。
- 渲染尺寸按有值格 ∪ 合并 ∪ 图片锚点收敛，只读稀疏 `cells` Map，不会用 Excel 极限列数撑满。
- 纯样式格只保留有值范围外扩 100 的紧邻带。
- 无法恢复文件中的选中格，导入后默认 A1。
- xlsx round-trip **丢失**格内像素偏移（`offsetX` / `offsetY`），导入后图片对齐 from 格左上角。

hucre 写出时校验 sheet 名（非法字符 `[ ] : * ? / \`、超过 31 字符、保留名 History、大小写不敏感重名）会抛错；模型层不限制表名，失败由调用方提示。

## importCsv

`importCsv(text, sheet)` 把 CSV 写入**既有** `Sheet`，从 A1 覆盖，整段包在事务里（单 undo 单元）。类型推断开启；空格不覆盖既有格，空串清除目标格。CSV **忽略图片**。

## 导出

| 函数 | 输入 | 输出 |
| --- | --- | --- |
| `exportWorkbookXlsx(workbook)` | 整个工作簿 | `Promise<Uint8Array>`，含多表与 `activeTab` |
| `exportSheetXlsx(sheet, { fallbackName? })` | 单表 | 同上单表 ZIP；表名取 `sheet.name \|\| fallbackName \|\| 'Sheet'`；浮动图保留 |
| `exportSheetCsv(sheet)` | 单表 | CSV 字符串（UTF-8 BOM）。范围从 A1 到最后一个有值格；公式导**计算缓存**；合并覆盖格为空（同 Excel）；不含图片、不含只读等 Cell Meta |

xlsx 导入导出 round-trip 保留浮动图；CSV 不携带图片。
