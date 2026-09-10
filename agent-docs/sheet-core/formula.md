---
title: "formula 公式引擎：解析求值与函数扩展"
description: "从 @veltra/sheet-core 导入的无头公式引擎：parseFormula / tokenizeFormula 解析、evaluateAst 求值、collectReferences 依赖收集、registerFormulaFunction 注册自定义函数；四则与 SUM / AVERAGE / ROUND / ABS 经 @cat-kit/core $n 高精度计算，错误码含 #DIV/0!、#CYCLE! 等 6 种。"
aliases: ["formula", "公式引擎", "公式计算", "FormulaEngine", "电子表格公式", "函数注册"]
keywords: ["parseFormula", "evaluateAst", "tokenizeFormula", "FormulaParseError", "registerFormulaFunction", "listFormulaFunctions", "SUM", "AVERAGE", "ROUND", "ABS", "#DIV/0!", "#CYCLE!", "#NAME?", "自定义函数", "公式计算", "错误码", "跨表引用", "循环引用", "高精度"]
---

# formula 公式引擎：解析求值与函数扩展

`@veltra/sheet-core` 主入口导出完整公式引擎：解析（`tokenizeFormula` / `parseFormula`）、求值（`evaluateAst` 与三个 `coerceTo*` 强转函数）、错误值体系（`FORMULA_ERROR_CODES` / `formulaError` / `isFormulaError` / `isFormulaErrorCode`）、引用收集（`collectReferences`）、函数注册表（`registerFormulaFunction` / `listFormulaFunctions` / `invokeFormulaFunction`）与工作簿级 `DependencyGraph`。表格场景不直接调求值器，而是经 `Sheet.setCellFormula` 或 `setCellValue(addr, '=…')` 写公式：引擎自动登记依赖、命令执行后增量重算，派生补丁并入同一 undo 单元。

## 快速上手

```ts
import { Workbook } from '@veltra/sheet-core'

const workbook = new Workbook() // 构造时创建默认表 Sheet1 与共享依赖图
const sheet = workbook.activeSheet

sheet.setCellValue({ row: 0, col: 0 }, 10) // A1（坐标 0-based）
sheet.setCellValue({ row: 0, col: 1 }, 20) // B1
sheet.setCellFormula({ row: 0, col: 2 }, '=SUM(A1:B1)') // 带 '=' 前缀也可，存入时剥掉

sheet.getDisplayValue({ row: 0, col: 2 }) // => 30
sheet.getCellData({ row: 0, col: 2 })?.f // => 'SUM(A1:B1)'，公式原文不含 '='
sheet.getCellData({ row: 0, col: 2 })?.v // => 30，缓存恒为 JS number
```

## API 签名

`CellAddress`（`{ row: number; col: number }`，0-based）与 `CellRange`（`{ start, end }` 闭区间，`start` 恒为左上角）从主入口 `@veltra/sheet-core` 导入。

```ts
// ─── 解析 ────────────────────────────────────────────────
/** 解析失败异常；Sheet 层捕获后该格记为 #ERROR! */
export class FormulaParseError extends Error {
  name: 'FormulaParseError'
}

export type FormulaOperator =
  | '+' | '-' | '*' | '/' | '^' | '&' | '%'
  | '(' | ')' | ',' | '!' | ':'
  | '=' | '<>' | '<' | '<=' | '>' | '>='

export type FormulaToken =
  | { type: 'number'; value: number; raw: string }
  | { type: 'string'; value: string }
  /** 函数名 / 单元格引用形态 / 裸表名（含 $ 绝对引用写法）；TRUE/FALSE 由 parser 归约为布尔 */
  | { type: 'ident'; name: string }
  /** 带单引号的表名（'' 转义为字面单引号） */
  | { type: 'quoted-name'; name: string }
  | { type: 'op'; op: FormulaOperator }

/** 公式文本（不含 '='）→ token 序列；非法输入抛 FormulaParseError */
export function tokenizeFormula(text: string): FormulaToken[]

/** 公式文本（不含 '='）→ AST；非法输入抛 FormulaParseError */
export function parseFormula(text: string): AstNode

// ─── AST 与引用收集 ───────────────────────────────────────
export type BinaryOperator =
  | '+' | '-' | '*' | '/' | '^' | '&'
  | '=' | '<>' | '<' | '<=' | '>' | '>='

export type AstNode =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'boolean'; value: boolean }
  /** 未知名称（如裸写的 Sheet2 / 未定义命名）；求值为 #NAME? */
  | { kind: 'name'; name: string }
  | { kind: 'cell'; sheet?: string; addr: CellAddress }
  | { kind: 'range'; sheet?: string; range: CellRange }
  | { kind: 'unary'; op: '-' | '+'; operand: AstNode }
  /** 百分号后缀（除以 100） */
  | { kind: 'percent'; operand: AstNode }
  | { kind: 'binary'; op: BinaryOperator; left: AstNode; right: AstNode }
  | { kind: 'call'; name: string; args: AstNode[] }

/** 公式中的一个引用；sheet 缺省 = 公式所在表 */
export interface AstReference {
  sheet?: string
  range: CellRange
}

/** 遍历 AST 收集全部引用；单格视为 1×1 区域，默认追加到传入的 out 数组 */
export function collectReferences(node: AstNode, out?: AstReference[]): AstReference[]

// ─── 错误值 ──────────────────────────────────────────────
/** Excel 子集 + 解析失败 #ERROR!、循环引用 #CYCLE! */
export const FORMULA_ERROR_CODES = [
  '#DIV/0!', '#VALUE!', '#NAME?', '#REF!', '#ERROR!', '#CYCLE!'
] as const
export type FormulaErrorCode = (typeof FORMULA_ERROR_CODES)[number]

/** 求值过程中的错误标记（带内部 brand，禁止手造对象）；随运算传播 */
export interface FormulaError {
  readonly code: FormulaErrorCode
}

export function formulaError(code: FormulaErrorCode): FormulaError
export function isFormulaError(value: unknown): value is FormulaError
/** 判定合法错误码（读取 t='e' 的单元格时校验 v） */
export function isFormulaErrorCode(value: unknown): value is FormulaErrorCode

// ─── 求值 ────────────────────────────────────────────────
/** 标量值；null = 空单元格 */
export type ScalarValue = number | string | boolean | null
/** 求值结果：标量 / 错误 / 区域展开数组（数组仅作为函数参数形态出现） */
export type EvalValue = ScalarValue | FormulaError | (ScalarValue | FormulaError)[]

export interface FormulaEvalContext {
  /** 当前公式所在表（裸引用的缺省表） */
  readonly currentSheet: string
  /** 读单格（原始存储语义；表不存在 → #REF!） */
  readCell(sheet: string, addr: CellAddress): ScalarValue | FormulaError
  /** 读区域（只含稀疏存在的格；表不存在 → #REF!） */
  readRange(sheet: string, range: CellRange): (ScalarValue | FormulaError)[] | FormulaError
  /** 调函数（名称未知 → #NAME?；参数个数非法 → #VALUE!）；可直接传 invokeFormulaFunction */
  callFunction(name: string, nodes: AstNode[], evalNode: (node: AstNode) => EvalValue): EvalValue
}

export function evaluateAst(node: AstNode, ctx: FormulaEvalContext): EvalValue

/** 强转数字：null→0，布尔→1/0，数字文本→数字，其余文本→#VALUE!，错误传播 */
export function coerceToNumber(value: EvalValue): number | FormulaError
/** 强转文本：null→''，数字→String，布尔→'TRUE'/'FALSE'，错误传播 */
export function coerceToText(value: EvalValue): string | FormulaError
/** 强转布尔：null→FALSE，数字≠0，'TRUE'/'FALSE' 文本，其余文本→#VALUE!，错误传播 */
export function coerceToBoolean(value: EvalValue): boolean | FormulaError

// ─── 函数注册表 ───────────────────────────────────────────
/** 补全 / 帮助元数据；不传时 listFormulaFunctions 对该函数返回空 params 与空 description */
export interface FormulaFunctionMeta {
  /** 参数名列表，如 ['number1', 'number2', '...'] */
  params: string[]
  /** 中文一句话说明 */
  description: string
}

export type FormulaFunction = {
  minArgs?: number
  maxArgs?: number
  /** 易失性：任意单元格变更触发的重算必重新求值（内置 TODAY/NOW/RAND/RANDBETWEEN） */
  volatile?: boolean
  meta?: FormulaFunctionMeta
  kind?: 'normal'
  impl: (args: EvalValue[]) => EvalValue
} | {
  minArgs?: number
  maxArgs?: number
  volatile?: boolean
  meta?: FormulaFunctionMeta
  kind: 'lazy'
  impl: (nodes: AstNode[], evalNode: (node: AstNode) => EvalValue) => EvalValue
}

/** 注册函数：名称大小写不敏感（存大写）；同名覆盖；注册表模块级全局 */
export function registerFormulaFunction(name: string, def: FormulaFunction): void

/** 枚举全部已注册函数元数据，按名称升序；无 meta 的返回 { name, params: [], description: '' } */
export function listFormulaFunctions(): Array<{ name: string } & FormulaFunctionMeta>

/** 按名称分发求值：未知名 → #NAME?；参数个数越 minArgs/maxArgs 界 → #VALUE! */
export function invokeFormulaFunction(
  name: string,
  nodes: AstNode[],
  evalNode: (node: AstNode) => EvalValue
): EvalValue

// ─── 依赖图（Workbook 级共享）─────────────────────────────
/** 公式节点的一个依赖（sheet 名已补齐为具体值） */
export interface FormulaDependency {
  sheetName: string
  range: CellRange
}

/** 公式节点；ast 为 null = 解析失败（求值 #ERROR!，无依赖） */
export interface FormulaNode {
  readonly sheetName: string
  readonly addr: CellAddress
  readonly formula: string
  readonly ast: AstNode | null
  readonly deps: FormulaDependency[]
  /** AST 含易失性函数；任意单元格变更触发的重算必重新求值 */
  readonly volatile: boolean
}

export declare class DependencyGraph {
  registerSheet(sheet: Sheet): void
  /** 注销并移除该表全部公式节点；返回引用方重算补丁（未应用，引用方变 #REF!） */
  unregisterSheet(sheet: Sheet): CellPatch[]
  /** 表改名后索引重排（引用跟随新名，公式文本不重写）；必须在 Sheet.setName 之后调用 */
  renameSheet(oldName: string, newName: string): void
  getSheet(name: string): Sheet | undefined
  /** 遍历全部公式节点：[sheet, node] */
  allNodes(): Generator<[Sheet, FormulaNode], void, undefined>
  getNode(sheetName: string, addr: CellAddress): FormulaNode | undefined
  get nodeCount(): number
  /** 单元格补丁后的图同步（f 增/删/改 → 节点增/删/重建） */
  syncCell(sheet: Sheet, addr: CellAddress, before?: CellData, after?: CellData): void
  /** 整表内容替换后的图重建 */
  rebuildSheet(sheet: Sheet, cells: readonly CellSnapshotItem[]): void
  /** 变更集 → 标脏 + 拓扑序增量重算 → 派生 CellPatch[]（未应用） */
  recalc(changed: readonly { sheet: Sheet; addr: CellAddress }[]): CellPatch[]
}
```

## 参数说明

### 公式语法（tokenizer / parser 实际支持范围）

- 输入文本**不含 `=`**：`parseFormula('=A1+1')` 抛 `FormulaParseError`；`=` 前缀由 `Sheet.setCellFormula` / `setCellValue` 负责剥掉。
- 数字：`123`、`1.5`、`.5`、科学计数 `1e3` / `1.2E-2`。
- 字符串字面量：`"文本"`，内部 `""` 转义为一个 `"`；未闭合抛 `字符串缺少结束引号`。
- 布尔字面量：`TRUE` / `FALSE`，大小写不敏感。
- 单元格引用：`$?[A-Za-z]{1,3}$?[1-9]\d*`，如 `A1`、`$A$1`、`BC12`；列最多 3 个字母，行号从 1 起。`$A$1` 与 `A1` 等价（模型按值解析，绝对标记不影响求值）。
- 区域引用：`A1:B9`；`:` 后必须是单元格引用，否则抛 `区域 ":" 后应为单元格引用，得到 …`。
- 跨表引用：`Sheet2!A1`、`'My Sheet'!A1:B2`。表名为标识符（字母 / `_` / `$` / 非 ASCII 开头，中文可用）或单引号形式（`''` 转义）；带引号表名只能作为跨表引用前缀。表不存在求值为 `#REF!`。
- 函数调用：`SUM(A1, 2)`，参数逗号分隔，允许零参 `TODAY()`；函数名大小写不敏感。
- 空白字符（空格 / 制表 / 换行）忽略；不支持 Excel 的空格交集运算符。
- 其他标识符（不匹配引用形态、不后随 `(` 或 `!`）归为未知名称节点，求值 `#NAME?`（如裸写表名 `Sheet2`、含连续点的 `A1..B2`）。

### 运算符与优先级（低 → 高）

| 级别 | 运算符 | 说明 |
| :---: | --- | --- |
| 1 | `=` `<>` `<` `<=` `>` `>=` | 比较；文本比较大小写不敏感；混合类型 数字 < 文本 < 布尔 |
| 2 | `&` | 文本拼接（操作数经 `coerceToText` 强转） |
| 3 | `+` `-` | 加减，经 `$n.plus` / `$n.minus` 高精度 |
| 4 | `*` `/` | 乘除，经 `$n.mul` / `$n.div`；除数为 0 → `#DIV/0!` |
| 5 | 一元 `+` `-` | 紧于幂次（Excel 行为）：`-2^2` = `(-2)^2` = `4` |
| 6 | `^` | 幂，右结合：`2^3^2` = `2^(3^2)`；JS `Math.pow`，`0^负数` → `#DIV/0!`，结果非有限 → `#VALUE!` |
| 7 | 后缀 `%` | 除以 100 |

### 主要函数参数

| 函数 | 参数 | 返回 | 抛错 / 错误路径 |
| --- | --- | --- | --- |
| `tokenizeFormula` | `text: string`（公式原文，不含 `=`） | `FormulaToken[]` | 非法输入抛 `FormulaParseError` |
| `parseFormula` | `text: string`（公式原文，不含 `=`） | `AstNode` | 同 `tokenizeFormula`：非法输入抛 `FormulaParseError` |
| `collectReferences` | `node: AstNode`；`out?: AstReference[]`（追加目标） | `AstReference[]` | 不抛错 |
| `evaluateAst` | `node: AstNode`；`ctx: FormulaEvalContext` | `EvalValue` | 不抛错；错误以 `FormulaError` 返回；自定义函数抛异常时由依赖图捕获记 `#ERROR!` |
| `registerFormulaFunction` | `name: string`；`def: FormulaFunction` | `void` | 不抛错；同名覆盖 |
| `listFormulaFunctions` | 无 | `Array<{ name, params, description }>`，按名称升序 | 不抛错 |
| `invokeFormulaFunction` | `name: string`；`nodes: AstNode[]`；`evalNode` | `EvalValue` | 未知名返回 `#NAME?`；参数个数越界返回 `#VALUE!` |

`FormulaEvalContext` 三个方法的错误约定：表不存在时 `readCell` / `readRange` 返回 `formulaError('#REF!')`；`callFunction` 直接传 `invokeFormulaFunction` 即可复用内置注册表。

### 错误码（FORMULA_ERROR_CODES 全集）

| 错误码 | 触发条件 |
| --- | --- |
| `#DIV/0!` | 除数为 0（`1/0`、`0/0`）；`AVERAGE` 无数字可平均；`0` 的负次幂 |
| `#VALUE!` | 强转失败（非数字文本参与算术等）；数组参与比较；区域直接作为公式结果（如 `=A1:B2`）；`AND` / `OR` 无有效参数；`^` 结果非有限；`RANDBETWEEN` 参数非有限或 `bottom > top` |
| `#NAME?` | 未知名称节点；调用未注册函数 |
| `#REF!` | `readCell` / `readRange` 的表不存在（表被删除） |
| `#ERROR!` | 公式解析失败（`FormulaNode.ast` 为 null，`f` 保留原文）；求值期异常（如自定义函数抛错） |
| `#CYCLE!` | 循环引用：环上所有格均得 `#CYCLE!`；打破循环后经标脏重算自动恢复 |

求值期的 `FormulaError` 随运算传播（左操作数优先）；写入单元格时序列化为 `v = 错误码字符串, t = 'e'`。读取时 `isFormulaErrorCode(data.v)` 校验合法码。

### 内置函数（以 listFormulaFunctions 实际注册为准，共 17 个）

聚合函数的参数形态约定：区域引用展开为**稀疏存在的格**数组——区域内的文本 / 布尔被忽略，只有数字参与；直接参数则强转（非法 → `#VALUE!`）。

| 函数 | 签名 | 语义 |
| --- | --- | --- |
| `SUM` | `SUM(number1, number2, ...)`，至少 1 参 | 求和；`$n.plus` 高精度累加；全空区域 → `0` |
| `AVERAGE` | `AVERAGE(number1, ...)`，至少 1 参 | 平均值 = `$n.div(和, 个数)`；无数字 → `#DIV/0!` |
| `MAX` | `MAX(number1, ...)`，至少 1 参 | 最大值；无数字 → `0` |
| `MIN` | `MIN(number1, ...)`，至少 1 参 | 最小值；无数字 → `0` |
| `COUNT` | `COUNT(value1, ...)`，至少 1 参 | 数字个数：区域内只数数字格；直接参数可强转即计（含 `TRUE`、数字文本） |
| `COUNTA` | `COUNTA(value1, ...)`，至少 1 参 | 非空个数：区域内错误格照常计数；直接错误参数传播 |
| `IF` | `IF(logical_test, value_if_true, value_if_false?)`，2~3 参 | lazy 求值：未选分支不求值（副作用 / 错误不产生）；缺省第三参返回 `false` |
| `AND` | `AND(logical1, ...)`，至少 1 参 | 全真 → `TRUE`；区域内只取布尔格；空集 → `#VALUE!` |
| `OR` | `OR(logical1, ...)`，至少 1 参 | 任一真 → `TRUE`；区域内只取布尔格；空集 → `#VALUE!` |
| `NOT` | `NOT(logical)`，恰 1 参 | 逻辑取反 |
| `ROUND` | `ROUND(number, num_digits)`，恰 2 参 | 四舍五入：`n().fixed` 高精度；位数向零截断；负位数先缩放到整数再舍入（`ROUND(1234.567,-2)` = `1200`）；位数超出 double 精度时恒等 / 归零 |
| `ABS` | `ABS(number)`，恰 1 参 | 绝对值；负值经 `$n.minus(0, value)` |
| `CONCATENATE` | `CONCATENATE(text1, text2, ...)`，至少 1 参 | 连接文本（区域展开，逐值 `coerceToText`；区域内空格按空串） |
| `TODAY` | `TODAY()`，0 参 | volatile；当天 0 点的 1900 系统序列数（本地时间，含伪闰日修正） |
| `NOW` | `NOW()`，0 参 | volatile；当前时刻序列数（含时间小数部分） |
| `RAND` | `RAND()`，0 参 | volatile；`[0, 1)` 随机数 |
| `RANDBETWEEN` | `RANDBETWEEN(bottom, top)`，恰 2 参 | volatile；`[bottom, top]` 闭区间随机整数；参数向零截断，非法或 `bottom > top` → `#VALUE!` |

`SUM` / `AVERAGE` / `ROUND` / `ABS` 与四则 `+` `-` `*` `/` 经 peer 依赖 `@cat-kit/core`（`>=1.2.1`）的 `$n` / `n().fixed` 高精度路径计算，**结果仍写入 JS `number`**（`typeof data.v === 'number'`，不是 Decimal / 字符串）。幂 `^`、百分比 `%`、一元 `+/-`、`&`、比较不走 `$n`。`MAX` / `MIN` / `COUNT` / `COUNTA` / 逻辑 / 文本 / 易失性函数不走 `$n`。

## 方法与事件

`DependencyGraph` 是工作簿级计算中枢，由 `Workbook` 构造时创建并共享；独立 `new Sheet()` 会自建一张。宿主经 `Workbook` / `Sheet` 间接使用；直接操作仅限批量平移、调试等场景。全部方法同步：

- `recalc(changed)`：变更格标脏（单格引用走精确索引 O(1)，区域引用线性扫描）→ 向上 BFS 收集全部传递依赖者 → 拓扑序增量重算（memo 去重）→ 返回派生 `CellPatch[]`（未应用，调用方负责应用并入 undo 单元）。AST 含易失性函数的公式格并入标脏源必重新求值；重算结果与缓存一致时不产生补丁。
- `unregisterSheet(sheet)`：返回空数组 = 无引用方；非空 = 引用方的重算补丁（应用后引用方变 `#REF!`）。
- `renameSheet(oldName, newName)`：改名后既有跨表引用保持有效（求值经别名解析旧名，公式文本不重写）；连续改名 `A→B→C` 后引用 `A` 仍有效。
- 循环引用：拓扑求值在途栈遇回边 → 栈中自回边点起全部节点记 `#CYCLE!`；环外依赖方只传播错误。
- 事件：依赖图自身不发事件；公式重算派生补丁由 `Sheet.applyPatch` 应用后随 `cell-change` 事件对视图可见。

## 典型示例

### 无头解析、引用收集与自定义上下文求值

```ts
import {
  collectReferences,
  evaluateAst,
  FormulaParseError,
  invokeFormulaFunction,
  parseFormula,
  type FormulaEvalContext,
  type ScalarValue
} from '@veltra/sheet-core'

// 自备单元格存储：Map<"<col>,<row>", 值>（坐标 0-based，键即 cellKey 的拼接形式）
const cells = new Map<string, ScalarValue>([
  ['0,0', 2], // A1
  ['0,1', 3], // A2
  ['0,2', 4] // A3
])

const ctx: FormulaEvalContext = {
  currentSheet: 'Sheet1',
  readCell: (_sheet, addr) => cells.get(`${addr.col},${addr.row}`) ?? null,
  readRange: (_sheet, range) => {
    const out: ScalarValue[] = []
    for (let r = range.start.row; r <= range.end.row; r++) {
      for (let c = range.start.col; c <= range.end.col; c++) {
        const value = cells.get(`${c},${r}`)
        if (value != null) out.push(value) // 区域只含稀疏存在的格
      }
    }
    return out
  },
  callFunction: invokeFormulaFunction // 复用内置函数注册表
}

const ast = parseFormula('SUM(A1:A3)*10')
collectReferences(ast)[0]!.range // => { start: { row: 0, col: 0 }, end: { row: 2, col: 0 } }
evaluateAst(ast, ctx) // => 90（SUM 高精度累加后乘 10）

try {
  parseFormula('SUM(A1:A3') // 缺右括号
} catch (error) {
  if (error instanceof FormulaParseError) {
    error.name // => 'FormulaParseError'
    error.message // => '期望 ")"，得到 输入末尾'
  }
}
```

### 注册自定义函数（含枚举与覆盖）

```ts
import {
  coerceToNumber,
  formulaError,
  isFormulaError,
  listFormulaFunctions,
  registerFormulaFunction,
  Workbook
} from '@veltra/sheet-core'

// 先注册、后写公式：函数按求值时刻解析，晚注册的公式要等下一次重算才生效
registerFormulaFunction('TRIPLE', {
  minArgs: 1,
  maxArgs: 1,
  meta: { params: ['number'], description: '将数字乘以 3' },
  impl: (args) => {
    const value = coerceToNumber(args[0]!)
    if (isFormulaError(value)) return value // 强转失败返回 #VALUE! 等错误标记
    return value * 3
  }
})

const workbook = new Workbook()
const sheet = workbook.activeSheet
sheet.setCellValue({ row: 0, col: 0 }, 7)
sheet.setCellFormula({ row: 0, col: 1 }, '=triple(A1)') // 函数名大小写不敏感
sheet.getDisplayValue({ row: 0, col: 1 }) // => 21

listFormulaFunctions().filter((fn) => fn.name === 'TRIPLE')
// => [{ name: 'TRIPLE', params: ['number'], description: '将数字乘以 3' }]

// 同名注册覆盖旧实现（模块级全局，影响当前运行时所有工作簿）
registerFormulaFunction('triple', { impl: () => formulaError('#VALUE!') })
// 覆盖后未带 meta：listFormulaFunctions() 中该项变为 { name: 'TRIPLE', params: [], description: '' }
```

### 经 Workbook 的跨表引用与错误码

```ts
import { Workbook, isFormulaErrorCode } from '@veltra/sheet-core'

const workbook = new Workbook()
const sheet = workbook.activeSheet
const data = workbook.addSheet('数据')
data.setCellValue({ row: 0, col: 0 }, 6)

sheet.setCellFormula({ row: 0, col: 0 }, '=数据!A1*2') // 裸中文表名可直接作跨表前缀
sheet.getDisplayValue({ row: 0, col: 0 }) // => 12

sheet.setCellFormula({ row: 1, col: 0 }, '=1/0')
const div = sheet.getCellData({ row: 1, col: 0 })
div?.t // => 'e'
isFormulaErrorCode(div?.v) // => true
div?.v // => '#DIV/0!'

// 循环引用：A3 引用 A4、A4 引用 A3
sheet.setCellFormula({ row: 2, col: 0 }, '=A4')
sheet.setCellFormula({ row: 3, col: 0 }, '=A3')
sheet.getCellData({ row: 2, col: 0 })?.v // => '#CYCLE!'
sheet.getCellData({ row: 3, col: 0 })?.v // => '#CYCLE!'

// 打破循环后重算自动恢复
sheet.setCellValue({ row: 3, col: 0 }, 1)
sheet.getDisplayValue({ row: 2, col: 0 }) // => 1
```

## 注意事项

> [!WARNING]
> - 公式原文 `CellData.f` 与 `parseFormula` / `tokenizeFormula` 的入参都**不含 `=`**；`Sheet.setCellFormula` / `setCellValue` 才接受 `=` 前缀并剥掉。直接给 `parseFormula` 传 `'=A1'` 抛 `FormulaParseError: 意外的 "="`。
> - 公式缓存 `v` 是 JS `number` / `string` / `boolean` / 错误码字符串，不是 Decimal 对象；高精度只发生在计算过程中（`$n`），落库前转回 `number`。
> - 一元负号紧于幂次是 Excel 行为：本库 `-2^2` 为 `4`，不是 `-(2^2)`。
> - 错误码是 Excel 子集 + 本库扩展：`#ERROR!`（解析失败 / 求值异常）与 `#CYCLE!`（循环引用）不是 Excel 原生错误码；Excel 的 `#N/A`、`#NULL!`、`#NUM!` 不在本库错误码全集内。
> - `getFormulaFunction` 未从包入口导出（仅测试深导入）；查询已注册函数一律用 `listFormulaFunctions()`。
> - `registerFormulaFunction` 注册表是模块级全局：同名覆盖、大小写不敏感、影响当前运行时所有 `Workbook` / `Sheet`；禁止注册与内置函数同名的函数，除非刻意替换。
> - 四则与 `SUM` / `AVERAGE` / `ROUND` / `ABS` 的高精度路径依赖 peer `@cat-kit/core >= 1.2.1`，未安装 peer 时本包导入即失败。
> - 自定义函数 `impl` 收到的是求值后的 `EvalValue[]`，引擎不预处理、不强制 `$n`；需要高精度请在 impl 内自行使用 `@cat-kit/core`。
> - 区域引用作为函数参数时展开为稀疏存在的格数组，不是稠密矩阵；区域内空格不出现（不按 0 补齐）。

## 常见问题

### 公式格值是 `#ERROR!`，但 `f` 原文看起来完好

原因：写入时 `FormulaParseError` 被捕获，`FormulaNode.ast` 为 `null`。用 `parseFormula` 复现解析错误定位问题字符：

```ts
import { FormulaParseError, parseFormula } from '@veltra/sheet-core'

try {
  parseFormula('SUM(A1:A3') // 与格内 f 相同的原文
} catch (error) {
  if (error instanceof FormulaParseError) console.error(error.message) // => '期望 ")"，得到 输入末尾'
}
```

### 公式求值得到 `#NAME?`

原因：调用的函数未注册（内置 17 个之外且未 `registerFormulaFunction`），或标识符不匹配单元格引用形态（如裸写表名 `Sheet2` 不带 `!`）。修复：注册函数，或补全跨表前缀 `Sheet2!A1`；写公式前完成注册可保证首次求值即命中。

### 导入 xlsx 后公式列全为 `#NAME?` 或 `#ERROR!`

`importXlsx` 只写公式原文，计算缓存由本地引擎重算填充：本地未注册的函数求值 `#NAME?`，解析失败的原文 `#ERROR!`。修复：导入前先 `registerFormulaFunction` 注册文件里用到的自定义函数。
