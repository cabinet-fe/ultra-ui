---
title: "sheet-core 数据模型（Sheet / Workbook / CellStore）"
description: "从 @veltra/sheet-core 导入的无头表格数据模型，纯 TS 无 Vue / DOM 依赖：Sheet 与 Workbook 单表多表、稀疏 CellStore、0-based A1 地址工具（cellKey / parseAddress / createRange）、SelectionModel 选区、MergeManager 合并、StylePool 样式池、CellMetaStore 单元格侧车数据与浮动图片 SheetImage。"
aliases: ["数据模型", "Sheet", "Workbook", "CellStore", "表格内核", "无头表格", "工作表模型"]
keywords: ["Sheet", "Workbook", "CellStore", "cellKey", "parseAddress", "createRange", "formatRange", "SelectionModel", "MergeManager", "StylePool", "composeCellStyles", "CellMetaStore", "SheetImage", "FrozenState", "SheetSnapshot", "冻结", "单元格合并", "选区", "稀疏存储", "快照"]
---

# sheet-core 数据模型（Sheet / Workbook / CellStore）

`@veltra/sheet-core` 主入口导出无头表格数据模型（纯 TS，无 Vue / DOM 依赖）：`Workbook` 管多表与共享公式依赖图，`Sheet` 是单表统一操作入口，单元格存于稀疏 `CellStore`；配套 0-based A1 地址工具（`cellKey` / `parseAddress` / `createRange` 等）、`SelectionModel` 选区、`MergeManager` 合并、`StylePool` 样式池、`CellMetaStore` 单元格侧车数据与浮动图片 `SheetImage`。一切写操作经命令系统执行并产生补丁，本篇覆盖数据模型与读写；命令与撤销重做见 `sheet-core/commands.md`。

## 快速上手

```ts
import { Workbook, parseAddress, createRange, formatRange } from '@veltra/sheet-core';

const workbook = new Workbook(); // 构造时已含一张默认表 Sheet1
const sheet = workbook.activeSheet;

sheet.setCellValue({ row: 0, col: 0 }, 42);         // 0-based：{ row: 0, col: 0 } 即 A1
sheet.setCellValue(parseAddress('B1')!, '=A1+1');   // B1 = { row: 0, col: 1 }；'=' 前缀写公式
console.log(sheet.getDisplayValue({ row: 0, col: 1 })); // => 43（公式缓存值）
console.log(formatRange(createRange({ row: 0, col: 1 }, { row: 2, col: 2 }))); // => 'B1:C3'
```

## API 签名

### 地址与范围

```ts
/** 单元格地址（0-based：{ row: 0, col: 0 } 即 A1） */
export interface CellAddress { row: number; col: number }
/** 单元格区域（闭区间，start 恒为左上角，end 恒为右下角） */
export interface CellRange { start: CellAddress; end: CellAddress }
export function cellKey(addr: CellAddress): number // 地址 → 数值 key（row * 2^20 + col；要求 col < 2^20）
export function colIndexToName(col: number): string // 列号 → 列名：0 → 'A'，25 → 'Z'，26 → 'AA'；非负整数，否则抛 RangeError
export function colNameToIndex(name: string): number // 列名 → 列号：'A' → 0，'AA' → 26；非法列名返回 -1
export function parseAddress(text: string): CellAddress | null // 解析 A1 记法（兼容 $A$1）→ 地址；行号从 1 起；非法返回 null
export function formatAddress(addr: CellAddress): string // 地址 → A1 记法：{ row: 1, col: 1 } → 'B2'
export function createRange(a: CellAddress, b: CellAddress): CellRange // 两角点构造规范化区域（start ≤ end，入参顺序无关）
export function parseRange(text: string): CellRange | null // 解析 'B2' 或 'B2:D5'（兼容绝对引用）；非法返回 null
export function formatRange(range: CellRange): string // 区域 → 记法：单格 → 'B2'，多格 → 'B2:D5'
export function rangesEqual(a: CellRange, b: CellRange): boolean // 区域相等 / 相交 / 区域包含地址
export function rangesIntersect(a: CellRange, b: CellRange): boolean
export function rangeContainsAddress(range: CellRange, addr: CellAddress): boolean
export function boundingBox(ranges: readonly [CellRange, ...CellRange[]]): CellRange // 一组区域的最小包围盒（至少传入一个区域）
export function iterateRange(range: CellRange): Generator<CellAddress, void, undefined> // 按行主序遍历区域内所有地址（含空格）
```

### CellStore 与单元格数据

```ts
/** 值类型：n=数字 s=字符串 b=布尔 str=公式结果字符串 e=错误 d=日期（序列数） */
export type CellType = 'n' | 's' | 'b' | 'str' | 'e' | 'd'
export type CellValue = string | number | boolean | null
export interface CellData {
  v?: CellValue // 原始值（公式格为计算缓存值）
  t?: CellType // 值类型，缺省按 v 推断
  f?: string // 公式文本（不含 '='），如 'SUM(A1:B2)+Sheet2!C3'
  s?: number // 样式池引用（StyleId）
}
/** 序列化条目 */
export interface CellSnapshotItem extends CellData { row: number; col: number }
/** 数字文本正则（不含 TRUE/FALSE） */
export const NUMERIC_TEXT_RE: RegExp
/** 规范化用户输入（Excel 键入语义）：数字文本 → number、TRUE/FALSE（忽略大小写）→ boolean、前导 ' 强制文本 */
export function normalizeInputValue(value: CellValue): CellValue
/** 按原始值推断类型：number → 'n'、boolean → 'b'、string → 's'、其余 undefined */
export function inferCellType(v: CellValue): CellType | undefined
/** 判定为空：无公式、无样式且值为 null/undefined/''（只有样式的格不算空） */
export function isEmptyCellData(data: CellData | undefined): boolean
/** CellData 相等（v/t/f/s 四字段逐一比较） */
export function cellDataEqual(a: CellData | undefined, b: CellData | undefined): boolean
```

### Sheet 类

```ts
/** 冻结状态（Excel 语义：rows = 冻结顶部行数，cols = 冻结左侧列数） */
export interface FrozenState { rows: number; cols: number }
/** Sheet 全量快照（宿主序列化持久化用） */
export interface SheetSnapshot {
  cells: CellSnapshotItem[]
  styles: CellStyle[]
  merges: CellRange[]
  frozen: FrozenState
  rows: number // 表格尺寸（0 = 未声明，由视图层 props 决定）
  cols: number
  selection?: { activeCell: CellAddress; ranges: CellRange[] } // 选区；可选，向后兼容，旧快照缺省回落 A1
  rowHeights?: [number, number][] // 自定义行高：[行号, 像素]
  colWidths?: [number, number][] // 自定义列宽：[列号, 像素]
  rowStyles?: [number, StyleId][] // 行默认样式：引用同一 styles 池
  colStyles?: [number, StyleId][] // 列默认样式
  images?: SheetImage[]
  meta?: CellMetaSnapshotItem[]
}
export class Sheet {
  readonly store: CellStore; readonly merges: MergeManager; readonly selection: SelectionModel
  readonly history: HistoryManager; readonly formulaGraph: DependencyGraph; readonly stylePool: StylePool
  constructor(name?: string, formulaGraph?: DependencyGraph) // name 默认 'Sheet1'
  get name(): string // 只读；改名必须经 Workbook.renameSheet
  get rowCount(): number // 数据行高水位（colCount 同理）
  get rows(): number // 声明的渲染行数（0 = 未声明；cols 同理）
  get frozen(): FrozenState // 副本
  get canUndo(): boolean // canRedo 同理
}
```

### Workbook

```ts
export type WorkbookEvents = {
  'active-sheet-change': { sheet: Sheet; index: number }
  'sheets-change': { sheets: Sheet[] }
  'sheet-rename': { sheet: Sheet; oldName: string; newName: string }
}
/** addSheet 初始单元格输入：原始值或 { v, t, f } 数据对象（不支持 s 样式引用与 Date 对象） */
export type AddSheetCellInput = CellValue | undefined | { v?: CellValue; t?: CellType; f?: string }
export interface AddSheetOptions {
  data?: readonly (readonly AddSheetCellInput[])[] // 初始数据：二维数组，从 A1 起按行列写入；null/undefined/'' 跳过
  rows?: number // 初始渲染行数（与数据高水位取大；仅传入时校验，非正整数抛错）
  cols?: number // 初始渲染列数（同上）
}
export class Workbook {
  readonly formulaGraph: DependencyGraph // 工作簿级共享公式依赖图
  constructor() // 构造时立即 addSheet() 一张默认表 Sheet1
  get sheetCount(): number
  get activeSheet(): Sheet
  get activeSheetIndex(): number
}
```

### 选择（SelectionModel）

```ts
export interface SelectionState {
  /** 活动单元格（锚点语义）；未选中时为 null。ranges = 选中区域列表（单选区，预留多选区） */
  activeCell: CellAddress | null
  ranges: CellRange[]
}
export class SelectionModel {
  get activeCell(): CellAddress | null
  get ranges(): CellRange[]
}
```

### 合并（MergeManager）

```ts
/** 单元格在合并语义下的种类 */
export type MergedCellKind = 'normal' | 'merged-anchor' | 'merged-covered'
export interface CellInfo {
  kind: MergedCellKind
  anchor: CellAddress // 锚点地址；普通格为自身
  mergeRange?: CellRange // 所在合并区域；普通格无
}
/** 与既有合并相交时，最终生效区域大于入参：取包围盒 */
export interface MergeResult { range: CellRange; removed: CellRange[] }
export class MergeManager {
  get size(): number
}
```

### 样式（StylePool / CellStyle / composeCellStyles）

```ts
export type StyleId = number // 1 起递增，池内唯一
/** 边框线型：thin/medium/thick 实线分级，dashed/dotted 虚线/点线 */
export type BorderLineStyle = 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted'
export type BorderSide = 'top' | 'right' | 'bottom' | 'left'
export interface BorderEdge { style: BorderLineStyle; width: number; color: string } // width px；color CSS 颜色
export type HorizontalAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom' // 模型用 middle；hucre/Excel 导出为 center
export interface CellFont {
  color?: string // '#RRGGBB'；缺省 = 主题文本色
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  size?: number // 字号（pt）；渲染时 ×4/3 转 px
}
export interface CellAlign { horizontal?: HorizontalAlign; vertical?: VerticalAlign; wrap?: boolean } // wrap = 自动换行
export interface CellStyle {
  fill?: { color: string } // 背景填充；缺省 = 无填充
  border?: Partial<Record<BorderSide, BorderEdge>> // 四边边框；缺省边 = 无边框
  font?: CellFont // 字体；缺省 = 主题默认
  align?: CellAlign // 对齐 / 换行；缺省由主题决定
  numFmt?:
    | { type: 'date' } // 数字格式：仅影响显示，单元格恒存原始值
    | { type: 'thousands' } // 千分位分组
    | { type: 'cnUpper' } // 中文大写金额
    | { type: 'fixed'; digits: number } // 固定小数位数（四舍五入仅作用于显示）
}
/** 边框四边固定顺序 [top, right, bottom, left] */
export const BORDER_SIDES: readonly BorderSide[]
/** 线型 → 默认线宽（px）：thin/dashed/dotted 1、medium 2、thick 3 */
export const BORDER_STYLE_WIDTH: Record<BorderLineStyle, number>
/** 单边缺失字段默认值：{ style: 'thin', width: 1, color: '#000000' } */
export const BORDER_EDGE_DEFAULTS: BorderEdge
/** 字体 / 对齐字段固定序列化顺序（样式池 key 稳定） */
export const FONT_STYLE_KEYS: readonly ('color' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'size')[]
export const ALIGN_STYLE_KEYS: readonly ('horizontal' | 'vertical' | 'wrap')[]
export class StylePool {
  get size(): number // 池内样式定义数量
}
/**
 * 完整样式层叠加（列 → 行 → 格）：overlay 未给出的字段保留 base。
 * fill 层级替换；border 边级；font/align/numFmt 字段级。同步，不抛错。
 */
export function composeCellStyles(
  base: CellStyle | undefined,
  overlay: CellStyle | undefined
): CellStyle | undefined
```

### 元数据（CellMetaStore）

```ts
export interface CellMetaSnapshotItem { row: number; col: number; namespace: string; payload: unknown }
export function cellMetaKey(row: number, col: number, namespace: string): string // 生成存储键（row,col,namespace 三元组）
export function cellMetaKeyFrom(addr: CellAddress, namespace: string): string // 从地址与 namespace 生成存储键
export function cloneCellMetaPayload(payload: unknown): unknown // 深拷贝载荷（structuredClone 优先，不可克隆回退 JSON）
export function cellMetaPayloadEqual(a: unknown, b: unknown): boolean // 载荷相等（JSON 比较，用于无变更跳过）
export const CELL_READONLY_META_NAMESPACE: 'cell-readonly' // 单元格只读标记 namespace；payload 恒为 true
/** 稀疏存储（与 CellStore 平行，不写入 CellData）；键 = row,col,namespace */
export class CellMetaStore {}
```

### 图片（SheetImage）

```ts
export type SheetImageType = 'png' | 'jpeg' | 'gif' | 'svg' | 'webp'
export interface SheetImageAnchor {
  from: CellAddress & { offsetX?: number; offsetY?: number } // 起始格；offsetX/offsetY 为格内像素偏移（px，相对该格左上角，缺省 0）
  to?: CellAddress // 跨单元格锚定的结束格；可选
}
export interface SheetImage {
  id: string
  data: Uint8Array // 图片字节（本地文件 / xlsx 导入）
  type: SheetImageType
  anchor: SheetImageAnchor
  src?: string // URL 来源；存在时优先于 data 字节，不参与 xlsx 导出/导入
  fit?: 'fill' | 'contain' // 缩放模式：fill 拉伸（默认）；contain 等比缩放完整显示于锚定区域内（不裁剪不溢出）
  width?: number // 渲染宽高（px，96 DPI）；缺省由渲染层取自然尺寸
  height?: number
  altText?: string
  title?: string
}
/** 插入入参：与 SheetImage 字段一致，仅 id 可选（缺省由命令生成） */
export interface ImageInput extends Omit<SheetImage, 'id'> { id?: string }
/** 生成图片 id（crypto.randomUUID 优先，无 crypto 回落时间戳） */
export function createImageId(): string
/** 深拷贝锚点 */
export function cloneImageAnchor(anchor: SheetImageAnchor): SheetImageAnchor
/** 浅拷贝图片元数据（data 字节共享；锚点独立） */
export function cloneSheetImage(image: SheetImage): SheetImage
```

## 参数说明

Sheet 核心方法参数（`Workbook.addSheet` 选项五要素——`name`：`string`，默认 `Sheet{n}`，非必填，模型层不限制表名但 xlsx 导出时非法表名（`[ ] : * ? / \`、>31 字符、保留名 `History`）由导出层抛错；`options.data`：`AddSheetCellInput[][]`，非必填，从 A1 写入、`f` 为公式原文（不含 `'='`）、基线状态不进 undo；`options.rows` / `options.cols`：`number`，非必填，正整数且与数据高水位取大）：

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `addr` | `CellAddress` | — | 是 | 0-based；写入与显示值读取自动解析合并锚点 |
| `value`（`setCellValue`） | `CellValue` | — | 是 | `null` / `''` 清除该格；`'='` 前缀转公式；数字文本转 `number`、`TRUE`/`FALSE` 转 `boolean`、前导 `'` 强制文本 |
| `items`（`setCells`） | `{ addr, data? }[]` | — | 是 | `data` 空数据 = 清除；一次调用 = 一个 undo 单元 |
| `range`（`setCellStyle` / `mergeCells` / `unmergeCells`） | `CellRange` | — | 是 | 闭区间；`mergeCells` 相交时自动取包围盒 |
| `partial`（`setCellStyle`） | `CellStylePatch` | — | 是 | 部分合并：`fill` 存在即覆盖、`border` 边级、`font`/`align` 逐字段、`numFmt` 整体替换；字段值 `null` 删除 |
| `rows, cols`（`setFrozen`） | `number` | `0` | 否 | 负数 / 非有限值归一为 0，小数向下取整 |
| `at, count`（`insertRows` 等） | `number` | `count = 1` | `at` 是 | `at >= 0`；`count <= 0` 无操作不入历史 |
| `input`（`insertImage`） | `ImageInput` | — | 是 | `data` / `type` / `anchor` 必填；`id` 缺省生成；`src` URL 来源时 `data` 传空 `Uint8Array` |
| `namespace`（`setCellMeta`） | `string` | — | 是 | 空白 namespace 无操作；必须用限定前缀（如 `'cell-readonly'`）避免冲突 |
| `formula`（`setCellFormula`） | `string` | — | 是 | 可带 `'='` 前缀（自动剥离）；空白公式清除该格 |

## 方法与事件

### 地址与范围

全部为纯函数，同步；签名见 `## API 签名`。补充约束：`cellKey` 的 `col` 必须 `< 2^20`，否则 key 冲突；`colIndexToName` 非负整数以外的入参抛 `RangeError('列号必须是非负整数: <col>')`；`colNameToIndex` / `parseAddress` / `parseRange` 非法输入返回 `null`（`'A0'` / `'1A'` / `''` 均非法）；`boundingBox` 至少传入 1 个区域。

### CellStore 与单元格数据

`CellStore` 为稀疏矩阵（`Map<row, Map<col, CellData>>`），空单元格不占存储。同步，全部方法不抛错：

- `getCell(addr)` → `CellData | undefined`：返回副本，外部修改不影响存储。
- `setCell(addr, data?)`：存储副本；空数据（`isEmptyCellData`）等价删除。
- `setCellValue(addr, value)`：`null` / `''` 删除；其余经 `normalizeInputValue` 规范化后写入并推断类型；`deleteCell(addr)` → `boolean`：是否确有删除。
- `entries()` / `entriesInRange(range)` → `Generator<[CellAddress, CellData]>`：只遍历真实存在的格（行主序，副本）；宽区域用 `entriesInRange`，不做稠密扫描；`rowsForColumn(col)` → `Generator<number>`：该列有数据的行号。
- `peekCell(addr)` / `peekEntries()` / `peekRow(row)` / `rowKeys()`：只读访问内部引用，调用方不得修改返回对象。
- `snapshot()` → `CellSnapshotItem[]`；`restore(items)`：清空重建并重算高水位；`clear()`：清空全部（高水位归 0）。
- `insertRows(at, count)` / `deleteRows(at, count)` / `insertCols(at, count)` / `deleteCols(at, count)`：坐标平移，不产生新数据；删除区间内数据移除。
- `rowCount` / `colCount`：高水位（只增不减；`restore` 与结构平移后按真实数据重算）；`size`：真实格数。

### Sheet 类

构造：`new Sheet(name?, formulaGraph?)`。宿主经 `Workbook` 获得 `Sheet`（独立 `Sheet` 自建依赖图，注册进共享依赖图由构造第二参指定）。以下方法全部同步。写入均经命令可撤销：

- `getCellData(addr)` → `CellData | undefined`：原始存储语义，被合并覆盖的非锚点格 → `undefined`；`getDisplayValue(addr)` → `CellValue | undefined`：锚点解析语义，被覆盖格返回锚点的值。
- `setCellValue(addr, value)`：空值（`null` / `''`）清除；`'='` 前缀转 `setCellFormula`；数字文本 / `TRUE` / `FALSE` / 前导 `'` 按输入规范化。
- `setCells(items)`：批量写入 `{ addr, data? }[]`，一次调用 = 一个 undo 单元。
- `setCellFormula(addr, formula)`：可带 `'='` 前缀；空白公式清除；解析失败按 `#ERROR!` 处理。
- `getCellInfo(addr)` → `CellInfo`：`normal` / `merged-anchor` / `merged-covered` + 锚点 + 合并区域。
- `mergeCells(range)` → `CellRange`：返回最终生效区域（与既有合并相交时取包围盒）。值保留：包围盒内按行主序第一个有值格的值写入新锚点，其余清空；边界外边框合成写入锚点；`mergeCellsBatch(ranges)` 批量合并，一次调用 = 一个 undo 单元。
- `unmergeCells(range)`：解除与 `range` 相交的所有合并；仅原锚点保留值。
- `selectCell(addr)`（被覆盖格自动定位锚点并扩展至合并区域完整范围）、`selectRange(range, active?)`（`active` 缺省为区域起点锚点）、`getSelection()` → `SelectionState`。
- `setFrozen(rows, cols)`（不进 undo）：负数 / 非有限值归一为 0、小数向下取整、与当前值相同不触发事件；`frozen` getter 返回副本。
- `insertRows(at, count = 1)` / `insertCols(at, count = 1)`：插入到 `at` 之前；数据、合并、行高/列宽、行列样式、图片锚点、公式引用与表格尺寸一并平移（发 `structure-change`；`count <= 0` 时无操作不入历史）。
- `deleteRows(at, count = 1)` / `deleteCols(at, count = 1)`：删除 `[at, at+count)`；区间内数据与图片移除，公式引用断链为 `#REF!`。
- `setCellStyle(range, partial)`：区域内逐格（锚点）应用 `CellStylePatch` 部分合并；空结果删除 `s` 字段；`setCellStyles(items)`：按格不同 `partial` / `clear`，一个 undo 单元。
- `clearCellStyle(range)`：清除区域样式，保留值 / 公式；纯样式格整体删除。
- `getCellStyle(addr)` → `CellStyle | undefined`：该格 `s` 字段（原始存储语义）。
- `getEffectiveStyle(addr)` → `CellStyle | undefined`：列 → 行 → 格字段级叠加（合并格读锚点）；空单元格无 `s` 仍可继承行列默认样式。
- `setRowStyle(row, partial)` / `clearRowStyle(row)` / `setColStyle(col, partial)` / `clearColStyle(col)`：行列默认样式，经命令进 undo；空样式 = 清除；`getRowStyle(row)` / `getColStyle(col)` → `CellStyle | undefined`。
- `getCellMeta<T>(addr, namespace)` → `T | undefined`：副本；合并格解析锚点；`setCellMeta(addr, namespace, payload)`：经命令可撤销，`payload` 传 `undefined` 等价删除。
- `clearCellMeta(addr, namespace)`；`entriesCellMeta()` → `Generator<[CellAddress, string, unknown]>`。
- `setCellReadonly(addr, readonly = true)` / `setRangeReadonly(range, readonly = true)` / `isCellReadonly(addr)` → `boolean`：单元格只读标记，存于 namespace `'cell-readonly'`；`setRangeReadonly` 事务合并为单 undo 单元。
- `getImages()` → `readonly SheetImage[]`（快照副本）；`getImage(id)` → `SheetImage | undefined`（副本）。
- `insertImage(input)` → `string`：返回生成的 id；id 已存在时无操作；`removeImage(id)`：不存在则无操作。
- `updateImage(id, patch)`：更新锚点 / 宽高 / 文案（`ImageUpdateFields`）；不存在或无变更则无操作。
- 行高列宽（不进 undo，随快照序列化）：`getRowHeight(row)` / `getColWidth(col)` → `number | undefined`（未设置返回 `undefined`）；`setRowHeight(row, height)` / `setColWidth(col, width)`（值 `<= 0` 或非有限值时清除该行/列自定义值）；`getRowHeights()` / `getColWidths()` → `ReadonlyMap<number, number>`。
- 命令、历史与事务（详见 `sheet-core/commands.md`）：`executeCommand<R>(id, params)` → `R | undefined`（经 `defaultCommandRegistry` 执行；id 未注册抛 `Error`）；`undo()` / `redo()` → `boolean`；`canUndo` / `canRedo` getter；`beginTransaction()` / `commit()` / `rollback()` 事务内所有命令合并为一个 undo 单元（可嵌套拍平到最外层；`rollback` 还原已应用变更并放弃事务）。
- `snapshot()` → `SheetSnapshot`：单元格 + 样式池 + 合并 + 冻结 + 选区 + 尺寸 + 行高/列宽 + 行列样式 + 图片 + meta；空数组字段不序列化。
- `restore(snapshot)`：全量还原；单元格/样式/合并/图片静默恢复（不发事件），冻结变化时发 `frozen-change`，旧快照缺省字段回落默认值（选区回落 A1）。

事件：`on(type, handler)` 返回取消订阅函数。payload 与触发时机：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `cell-change` | `{ addr }` | 单元格数据变化（含删除），逐补丁发出 |
| `merge-change` | `{ range }` | 合并 / 取消合并 |
| `selection-change` | `SelectionState` | 选区变化（相同选区去重不触发） |
| `history-change` | `{ canUndo, canRedo }` | 历史栈变化（工具栏按钮置灰） |
| `frozen-change` | `FrozenState` | 冻结状态变化（不进 undo） |
| `structure-change` | `StructureChange` | 行列插入 / 删除 |
| `content-reset` | `undefined` | 整表内容替换（导入 / undo 回放整表补丁） |
| `image-change` | `{ id? }` | 图片集合变化；整表替换时 `id` 缺省 |
| `meta-change` | `{ addr?, namespace? }` | Cell Meta 变化；整表替换时二者缺省 |
| `axis-style-change` | `{ axis, index }` | 行 / 列默认样式变化 |

### Workbook

- `addSheet(name?, options?)` → `Sheet`：`name` 缺省为不冲突的 `Sheet{n}`。`options.data` 从 A1 写入（原始值自动推断类型；`null` / `undefined` / `''` 跳过；对象 `{ v, t, f }` 支持公式，写入即注册依赖图并立即重算）；初始数据写入后 `history.clear()`，基线不进 undo。`options.rows` / `cols` 与数据高水位取大，非正整数（含 NaN、小数、Infinity）抛 `Error('Workbook.addSheet：options.rows 必须是正整数，收到 <值>')`（`cols` 同理）。
- `removeSheet(name)` → `boolean`：至少保留一个，不满足或表名不存在返回 `false`；删除后引用该表的公式立即重算为 `#REF!`（不入 undo）；删除激活项时激活相邻 sheet。
- `renameSheet(oldName, newName)` → `boolean`：空名（trim 后）返回 `false`；与现有表重名（不区分大小写，含自身大小写变体）返回 `false`；成功后跨表公式引用跟随新名。
- `activateSheet(name)` → `boolean`：不存在或已是激活项返回 `false`；`getSheet(name)` → `Sheet | undefined`；`getSheets()` → `Sheet[]`（副本）。
- `beginBatch()` / `endBatch()`：批量结构变更（可嵌套）；`endBatch` 无进行中批量时抛 `Error('Workbook.endBatch：没有进行中的批量')`，收尾合并补发 `sheets-change` → `sheet-rename` → `active-sheet-change`（各自仅在确有变化时补发）。
- `on(type, handler)` → `() => void`：订阅 `WorkbookEvents` 三事件；工作簿结构操作（增删改名 sheet）不进 undo。

### 选择（SelectionModel）

实例由 `Sheet` 构造并持有（`sheet.selection`）；宿主优先用 `Sheet.selectCell` / `Sheet.selectRange`：

- `selectCell(addr)`：被覆盖格自动解析到锚点并扩展至合并区域完整范围；`selectRange(range, active?)`：`active` 缺省为区域起点锚点，并钳入区域内。
- `getState()` → `SelectionState` 副本；`restoreState(state)`：静默写入不发 `change`（快照恢复用）；`clear()`：`activeCell` 置 `null`、`ranges` 置空。
- `on(handler)` → `() => void`；状态深比较相等时不触发。

### 合并（MergeManager）

实例由 `Sheet` 构造并持有（`sheet.merges`）；宿主优先用 `Sheet.mergeCells` / `unmergeCells`（含值搬迁），`MergeManager` 只管几何：

- `computeMerge(range)` → `MergeResult`：纯查询——列出所有与 `range` 相交的既有合并，新区域 = 包围盒；`merge(range)` → `MergeResult`：解除相交合并并登记包围盒。
- `addMerge(range)` / `removeMerge(range)`：低层精确登记 / 移除（按锚点匹配），供补丁回放使用；调用方保证不与既有合并相交。
- `unmerge(range)` → `CellRange[]`：解除所有相交合并，返回被解除区域。
- `resolveAnchor(addr)` → `CellAddress`：被覆盖格 → 锚点；锚点 / 普通格 → 自身；`isMerged(addr)`（含锚点）；`isCovered(addr)`（仅非锚点被覆盖格）。
- `getMergeAt(addr)` → `CellRange | undefined`；`getCellInfo(addr)` → `CellInfo`；`getMerges()` → `CellRange[]` 副本；`size`；`clear()`。

### 样式（StylePool / composeCellStyles）

样式定义集中存池、按内容去重，单元格只持 `StyleId`；实例由 `Sheet` 构造并持有（`sheet.stylePool`）：

- `intern(style)` → `StyleId`：规范化（剔除空 fill / 空边 / 空 font / 空 align）后按内容去重，相同内容返回同一 id；空样式抛 `Error('StylePool.intern：空样式不能内部化')`。
- `get(id)` → `CellStyle | undefined`：副本；不存在返回 `undefined`；`peek(id)`：只读内部定义（渲染热路径用），调用方不得修改返回对象。
- `hasAlignWrap()` → `boolean`：池内是否存在 `align.wrap`。
- `snapshot()` → `CellStyle[]`：按 id 升序导出；`restore(items)`：按序重排 id，单元格 `s` 引用还原后仍有效；`clear()`；池只增不减（undo 回放不回收定义），被引用的 id 永远可解析。
- `composeCellStyles(base, overlay)`：完整样式层叠加，规则见 `## API 签名`；用于复刻 `Sheet.getEffectiveStyle` 的叠加规则。

### 元数据（CellMetaStore）

实例由 `Sheet` 构造并持有（私有 `cellMeta`），宿主经 `Sheet.getCellMeta` / `setCellMeta` / `clearCellMeta` 访问。直接操作 `CellMetaStore` 时（同步，不抛错）：

- `get(addr, namespace)` → `unknown`：副本；不存在返回 `undefined`。
- `set(addr, namespace, payload)`：`payload` 为 `undefined` 等价删除该 namespace；`delete(addr, namespace)`；`has(addr, namespace)` → `boolean`。
- `snapshot()` → `CellMetaSnapshotItem[]`：按 `row,col,namespace` 排序；`restore(items)`：清空重建；`entries()` → `Generator<[CellAddress, string, unknown]>`；meta 载荷必须可序列化（`structuredClone` / JSON 回退），行列入/删除时坐标与载荷内嵌 `CellAddress` 自动平移。

### 图片（SheetImage）

宿主经 `Sheet.insertImage` / `removeImage` / `updateImage` 写入（命令通道，可撤销）。辅助函数与行为：

- `createImageId()` → `string`：`crypto.randomUUID` 优先，无 `crypto` 回落 `img-<时间戳>-<随机串>`；`cloneImageAnchor(anchor)` / `cloneSheetImage(image)`：拷贝工具（`cloneSheetImage` 浅拷贝元数据，`data` 字节共享、锚点独立）。
- `from.offsetX` / `from.offsetY`：格内像素偏移（px，缺省 0）；有 `to` 时宽高按 from→to 跨度兜底。
- 行列插入 / 删除时锚点平移（offset 随 `from` 格保留）；`from` 落在删除区间 → 图片移除（同一 undo 单元）；`to` 落在删除区间 → 收缩为 `at - 1`，非法则去掉 `to`。
- `src` URL 来源的图不参与 xlsx 导出 / 导入；字节图 round-trip 保留（格内像素偏移除外）。

## 典型示例

### 地址工具与稀疏读取

```ts
import { Workbook, parseAddress, parseRange, formatRange, iterateRange } from '@veltra/sheet-core';

const sheet = new Workbook().activeSheet;

// 批量写入：一次调用 = 一个 undo 单元
sheet.setCells([
  { addr: { row: 0, col: 0 }, data: { v: '品类', t: 's' } },
  { addr: parseAddress('B1')!, data: { v: '销售额', t: 's' } },
  { addr: { row: 1, col: 0 }, data: { v: '华东', t: 's' } },
  { addr: { row: 1, col: 1 }, data: { v: 1200, t: 'n' } }
]);

// 只遍历真实存在的格（空格不占存储，不产出条目）
const range = parseRange('A1:B2')!;
for (const addr of iterateRange(range)) {
  const data = sheet.getCellData(addr);
  if (data) console.log(formatRange({ start: addr, end: addr }), data.v);
}
// => A1 品类
// => B1 销售额
// => A2 华东
// => B2 1200
console.log(sheet.store.rowCount, sheet.store.colCount); // => 2 2（数据高水位）
```

### 样式叠加与单元格合并

```ts
import { Workbook, createRange, parseAddress } from '@veltra/sheet-core';

const sheet = new Workbook().activeSheet;
const range = createRange(parseAddress('A1')!, parseAddress('B2')!);

// 部分合并样式：只给 fill 与 font，不影响 border/align
sheet.setCellStyle(range, { fill: { color: '#FFF7E6' }, font: { bold: true } });
sheet.setCellValue({ row: 0, col: 0 }, '合计');

// 合并 A1:B2：行主序第一个有值格（A1）的值写入新锚点，其余清空
const finalRange = sheet.mergeCells(range);
console.log(finalRange.start, finalRange.end); // => { row: 0, col: 0 } { row: 1, col: 1 }

// 被覆盖格解析锚点：值与样式都来自 A1
console.log(sheet.getDisplayValue({ row: 1, col: 1 })); // => '合计'
console.log(sheet.getCellInfo({ row: 1, col: 1 }).kind); // => 'merged-covered'
console.log(sheet.getEffectiveStyle({ row: 1, col: 1 })?.fill); // => { color: '#FFF7E6' }
```

### 冻结、快照往返与浮动图片

```ts
import { Workbook, type SheetSnapshot } from '@veltra/sheet-core';

const sheet = new Workbook().activeSheet;
sheet.setCellValue({ row: 0, col: 0 }, '表头');
sheet.setFrozen(1, 0); // 冻结顶部 1 行（不进 undo，随快照序列化）
console.log(sheet.frozen); // => { rows: 1, cols: 0 }

// 浮动图片：data 必填（URL 来源传空字节）；返回生成的 id
const imageId = sheet.insertImage({
  data: new Uint8Array([137, 80, 78, 71]), // PNG 字节（示例截断）
  type: 'png',
  anchor: { from: { row: 1, col: 1, offsetX: 8, offsetY: 8 } },
  width: 120,
  height: 80,
  fit: 'contain'
});
sheet.updateImage(imageId, { anchor: { from: { row: 2, col: 2 } } });

const snap: SheetSnapshot = sheet.snapshot();
const restored = new Workbook().activeSheet;
restored.restore(snap); // 冻结变化时发 frozen-change；其余静默还原
console.log(restored.frozen); // => { rows: 1, cols: 0 }
console.log(restored.getDisplayValue({ row: 0, col: 0 })); // => '表头'
console.log(restored.getImage(imageId)?.anchor.from); // => { row: 2, col: 2, offsetX: 8, offsetY: 8 }
```

## 注意事项

> [!WARNING]
> - 本库坐标是 0-based（`{ row: 0, col: 0 }` = A1），不是 Excel 界面的 1-based 行列号；`CellRange` 是闭区间且 `start` 恒为左上角，手工构造倒序角点时必须先过 `createRange` 规范化。
> - 读取有两种语义：`getCellData` 是原始存储（被合并覆盖格 → `undefined`），`getDisplayValue` 是锚点解析；按展示取值用后者。
> - 本库内部便捷写入口是 `Sheet.setCell` / `Sheet.setCellStyles` / `CellStore.setCellValue`，非公开承诺 API；生产代码用 `setCells` / `setCellStyle`，禁止绕过命令直接改 `CellStore`（不产生补丁、不进 undo、依赖图不同步）。
> - 不进 undo 的状态：选区、冻结（`FrozenState`）、行高、列宽、渲染尺寸、工作簿结构（增删改名 sheet）；它们随 `SheetSnapshot` 序列化。
> - `CellStyle.numFmt` 仅影响显示，单元格恒存原始值；`getCellData` / `getDisplayValue` / CSV 导出均为原始值。
> - 改表名必须走 `Workbook.renameSheet`；`Sheet.setName` 是内部接口，直接调用会绕过重名校验与依赖图重索引。
> - 相交判定工具是 `rangeContainsAddress`；`rangeContainsRange`、`mergeCellStyle` 等内部符号不在导出白名单，测试需深导入 `src` 子路径。
> - `cellKey` 要求 `col < 2^20`（列基数 1048576），超出会 key 冲突。

## 常见问题

### `parseAddress('A0')` 返回 `null`

A1 记法行号从 1 起：`'A0'` / `'1A'` / `''` 均非法。0-based 地址转字符串用 `formatAddress`，反向用 `parseAddress`。

### 报错 `Error: StylePool.intern：空样式不能内部化`

直接向池内化了一个无有效字段的空样式。空样式不应入库：调用 `Sheet.setCellStyle` 时空结果会自动删除 `s` 字段；手工操作 `StylePool` 前先剔除空字段，全空则跳过。
