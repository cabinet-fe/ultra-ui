---
title: "IO 文件导入导出（XLSX / CSV）"
description: "从 @veltra/sheet-core 主入口导入的五个 IO 函数：importXlsx / importCsv 导入，exportWorkbookXlsx / exportSheetXlsx / exportSheetCsv 导出；保留值、公式、合并、样式、冻结、行高列宽与浮动图，可无头使用。"
aliases: ["io", "导入导出", "xlsx 导入", "csv 导出", "Excel 导入导出"]
keywords: ["importXlsx", "importCsv", "exportWorkbookXlsx", "exportSheetXlsx", "exportSheetCsv", "onProgress", "fallbackName", "导入导出", "进度回调", "公式缓存", "浮动图", "样式保真", "InvalidArgumentError"]
---

# IO 文件导入导出（XLSX / CSV）

`@veltra/sheet-core` 主入口导出五个 IO 函数：`importXlsx` / `importCsv` 导入、`exportWorkbookXlsx` / `exportSheetXlsx` / `exportSheetCsv` 导出。底层引擎是 `hucre`，全部可无头使用（不依赖 DOM / Vue / VTable）。`buildWorkbookFromHucre` / `replaceWorkbookWithSnapshots` 及流式 API 不在导出白名单，不是公开承诺 API。

## 快速上手

```ts
import { exportWorkbookXlsx, importXlsx } from '@veltra/sheet-core'

// 导入：xlsx 字节 → 新 Workbook（多表）
const workbook = await importXlsx(buffer)

// 导出：Workbook → xlsx ZIP 字节（Uint8Array）
const bytes = await exportWorkbookXlsx(workbook)
```

## API 签名

```ts
import type { Sheet, Workbook } from '@veltra/sheet-core'

/** XLSX 字节 → 新工作簿（值 / 公式 / 合并 / 样式 / 冻结 / 行高 / 列宽 / 浮动图） */
export function importXlsx(
  buffer: ArrayBuffer | Uint8Array,
  /** 每完成一个 sheet 回调一次（done 从 1 计）；供分片构建进度 UI，可选 */
  onProgress?: (done: number, total: number) => void
): Promise<Workbook>

/** CSV 文本 → 写入既有 Sheet（从 A1 覆盖；事务包裹 = 单 undo 单元） */
export function importCsv(text: string, sheet: Sheet): void

/** 整个工作簿 → XLSX ZIP 字节（多表 + 活动表索引） */
export function exportWorkbookXlsx(workbook: Workbook): Promise<Uint8Array>

/** 单个 Sheet → XLSX ZIP 字节；表名取 sheet.name || options.fallbackName || 'Sheet' */
export function exportSheetXlsx(
  sheet: Sheet,
  options?: { fallbackName?: string }
): Promise<Uint8Array>

/** 单个 Sheet → CSV 字符串（UTF-8 BOM） */
export function exportSheetCsv(sheet: Sheet): string
```

## 参数说明

| 函数 | 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | --- | :---: | --- |
| `importXlsx` | `buffer` | `ArrayBuffer \| Uint8Array` | — | 是 | xlsx 文件字节 |
| `importXlsx` | `onProgress` | `(done, total) => void` | 无 | 否 | 同步回调，每完成一张表一次；导入完成时 `done === total` |
| `importCsv` | `text` | `string` | — | 是 | CSV 文本；类型推断开启（数字 / 布尔 / ISO 日期），前导零保留为字符串 |
| `importCsv` | `sheet` | `Sheet` | — | 是 | 目标表；从 A1 覆盖写入**既有**表 |
| `exportWorkbookXlsx` | `workbook` | `Workbook` | — | 是 | 至少含一张表（`new Workbook()` 自带 Sheet1） |
| `exportSheetXlsx` | `sheet` | `Sheet` | — | 是 | 可为独立 `Sheet`（不在任何 Workbook 里） |
| `exportSheetXlsx` | `options.fallbackName` | `string` | — | 否 | 仅 `sheet.name` 为空串时生效 |
| `exportSheetCsv` | `sheet` | `Sheet` | — | 是 | 范围 = A1 到最后一个有值格（裁剪高水位空行空列） |

返回值与错误：

- `importXlsx` / `exportWorkbookXlsx` / `exportSheetXlsx` 异步，返回 `Promise`；`Uint8Array` 是 xlsx ZIP 字节，浏览器下载须自行 `Blob` + `a[download]`。
- `exportSheetCsv` 同步，返回带 UTF-8 BOM 的字符串。
- `exportWorkbookXlsx` / `exportSheetXlsx` 的表名经 hucre `writeXlsx` 校验，非法时 Promise reject `InvalidArgumentError`：非法字符 `[ ] : * ? / \`、超过 31 字符、保留名 `History`、大小写不敏感重名。模型层不限制表名，导出失败由调用方处理。
- `importCsv` 写入包在事务里，异常时回滚并原样抛出，不留半导入状态。

## 典型示例

### 导入 xlsx（含进度回调）并触发下载

```ts
import { exportWorkbookXlsx, importXlsx } from '@veltra/sheet-core'

const response = await fetch('/<文件地址>/报表.xlsx') // <替换为真实 xlsx 地址>
const buffer = await response.arrayBuffer()

const workbook = await importXlsx(buffer, (done, total) => {
  console.log(`已导入 ${done}/${total} 张表`) // 每完成一张表回调一次，驱动进度 UI
})
console.log(workbook.getSheets().map((sheet) => sheet.name)) // => ['Sheet1', '数据']

// 回写下载：Uint8Array → Blob → a[download]
const bytes = await exportWorkbookXlsx(workbook)
const url = URL.createObjectURL(new Blob([bytes]))
const link = document.createElement('a')
link.href = url
link.download = '报表.xlsx'
link.click()
URL.revokeObjectURL(url)
```

### 导出整簿与单表 xlsx

```ts
import { Workbook, exportSheetXlsx, exportWorkbookXlsx } from '@veltra/sheet-core'

const workbook = new Workbook()
workbook.activeSheet.setCellValue({ row: 0, col: 0 }, '合计')
workbook.addSheet('明细')

const bookBytes = await exportWorkbookXlsx(workbook) // 两张表 + 活动表索引
const sheetBytes = await exportSheetXlsx(workbook.activeSheet, { fallbackName: '汇总' })
// 表名取 sheet.name || fallbackName || 'Sheet'；浮动图随单表导出保留
```

### CSV 写入既有表并导出

```ts
import { Workbook, exportSheetCsv, importCsv } from '@veltra/sheet-core'

const workbook = new Workbook()
const sheet = workbook.activeSheet

// 粘贴语义：从 A1 覆盖写入；CSV 空位不覆盖既有格，空串清除目标格
importCsv('名称,数量\n甲,3\n乙,\n', sheet)
sheet.getDisplayValue({ row: 0, col: 0 }) // => '名称'
sheet.getDisplayValue({ row: 1, col: 1 }) // => 3（类型推断为数字）
sheet.getDisplayValue({ row: 2, col: 1 }) // => undefined（空串清除目标格）

const csv = exportSheetCsv(sheet)
csv.includes('名称,数量') // => true；返回值带 UTF-8 BOM，写文件用 text/csv 编码即可
```

## 注意事项

> [!WARNING]
> - 本篇只覆盖主入口白名单的五个函数。`buildWorkbookFromHucre` / `replaceWorkbookWithSnapshots` / `streamXlsxRows` / `writeXlsxStream` 未导出：流式 API 不支持样式 / 合并 / 公式，本库明确不采用。
> - `importCsv` 写入**既有** `Sheet` 而不是新建工作簿；要"CSV → 新 Workbook"需先 `new Workbook()` 再传 `workbook.activeSheet`。
> - 公式格：xlsx 同时写公式原文（`f` 不含 `=`）与计算缓存值；CSV 只写计算缓存值。导入的公式由本地引擎重算填充缓存——本地未注册的函数求值 `#NAME?`，解析失败 `#ERROR!`。
> - 日期双向以 1900 系统序列数（`t='d'`）存储：xlsx 导入把 hucre 读回的 `Date` 转序列数，导出再写回数字 + 日期格式，round-trip 保真；`TODAY` / `NOW` 返回同一序列系统。
> - numFmt 只保留四类：`date` / `thousands` / `cnUpper` / `fixed(digits)`；百分比、货币、科学计数等导入时忽略（维持原样不识别）。numFmt 仅影响 grid 显示，`getCellData` / CSV 恒为原始值。
> - xlsx round-trip 保留字节浮动图（`png` / `jpeg` / `gif` / `svg` / `webp`），但丢失格内像素偏移 `offsetX` / `offsetY`（导入后对齐 from 格左上角）；WPS 单元格内嵌图（`cellImages`）跳过；CSV 不携带图片。
> - 渲染尺寸按有值格 ∪ 合并 ∪ 图片锚点收敛，不用 Excel 极限列数撑满；纯样式格只保留有值范围外扩 100 的紧邻带。
> - xlsx 不保存选中格（hucre 不解析 OOXML selection），导入后默认选 A1。
> - 表名冲突：导入时大小写不敏感去重，冲突自动追加序号（如 `Sheet 2`）；导出时重名直接抛 `InvalidArgumentError`。

## 常见问题

### 导出报 `InvalidArgumentError`

原因：表名含非法字符 `[ ] : * ? / \`、超过 31 字符、用了保留名 `History` 或与其他表大小写不敏感重名。修复：导出前改名，或对无名表传 `fallbackName`：

```ts
import { Workbook, exportSheetXlsx } from '@veltra/sheet-core'

const workbook = new Workbook()
workbook.renameSheet('Sheet1', 'Q3 报表') // 合法表名
const bytes = await exportSheetXlsx(workbook.activeSheet, { fallbackName: 'Q3' })
```

### 导入后公式列全为 `#NAME?`

原因：文件里的公式用了本引擎未注册的函数（内置 17 个之外），导入写入即触发重算。修复：`importXlsx` 之前先注册同名函数：

```ts
import { coerceToNumber, importXlsx, isFormulaError, registerFormulaFunction } from '@veltra/sheet-core'

registerFormulaFunction('DISCOUNT', {
  minArgs: 1,
  impl: (args) => {
    const value = coerceToNumber(args[0]!)
    if (isFormulaError(value)) return value
    return value * 0.9
  }
})
const workbook = await importXlsx(buffer)
```

### CSV 导出的合并格只有锚点位置有值

原因：模型只存合并锚点格数据（被覆盖格无存储），CSV 按原始存储导出，覆盖格为空——同 Excel 行为。要在 UI 拿合并后的显示值，用 `sheet.getDisplayValue(addr)`（锚点解析语义），不要依赖 CSV。
