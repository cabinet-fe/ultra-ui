---
title: "sheet - -core 公式计算引擎、AST 解析求值与自定义函数注册"
description: "无头电子表格公式计算引擎：tokenizeFormula / parseFormula / evaluateAst / DependencyGraph，registerFormulaFunction 扩展自定义函数。四则与 SUM / AVERAGE / ROUND / ABS 对齐 @cat-kit/core 的 $n，单元格 v 仍为 number，=1/0 仍 #DIV/0!"
keywords:
  - sheet
  - @veltra/sheet-core
  - formula
  - registerFormulaFunction
  - evaluateAst
  - SUM
  - AVERAGE
  - ROUND
  - ABS
  - "$n"
  - "#DIV/0!"
  - 公式计算引擎
  - 解析求值与自定义函数注册
aliases: ["formula", "sheet", "公式引擎", "公式函数"]
---

公式引擎在 `@veltra/sheet-core` 主入口：解析（`tokenizeFormula` / `parseFormula`）、求值（`evaluateAst`）、工作簿级 `DependencyGraph`，以及可扩展的函数表（`registerFormulaFunction` / `listFormulaFunctions` / `invokeFormulaFunction`）。日常写格请用 `Sheet.setCellFormula` 或 `setCellValue(addr, '=SUM(A1:A3)')`——引擎会登记依赖并增量重算，派生补丁并入同一 undo 单元。

`CellData.f` 存公式原文（**不含** `=`），`v` / `t` 为计算缓存。跨表引用形如 `Sheet2!A1`；循环引用得到 `#CYCLE!`。跨表依赖图在 `Workbook` 级共享。

```ts
import { Workbook, listFormulaFunctions } from '@veltra/sheet-core'

const wb = new Workbook()
wb.activeSheet.setCellValue({ row: 0, col: 0 }, 10)
wb.activeSheet.setCellFormula({ row: 0, col: 1 }, 'A1*2')
wb.activeSheet.getDisplayValue({ row: 0, col: 1 }) // 20

console.log(listFormulaFunctions().map((fn) => fn.name))
```

## 解析

`tokenizeFormula(text)` → `FormulaToken[]`（数字 / 字符串 / 标识符 / 运算符等，不做语义消歧）。`parseFormula(text)` 再编成 `AstNode`；非法输入抛 `FormulaParseError`（Sheet 层捕获后该格记 `#ERROR!`）。

优先级与 Excel 一致：比较 < `&` < `+ -` < `* /` < 一元 `+ -` < `^`（右结合）< `%`。一元紧于幂：`-2^2` 为 `(-2)^2 = 4`。

`collectReferences(ast)` 收集 AST 上的单元格/区域引用（`AstReference`）。

## 求值

`evaluateAst(node, ctx)` 需要 `FormulaEvalContext`：`currentSheet`、`readCell`、`readRange`、`callFunction`。空格在数字上下文当 0、文本当 `''`、布尔当 `false`；错误值遇运算即传播。四则 `+` `-` `*` `/` 走 `@cat-kit/core` 的 `$n`（`plus` / `minus` / `mul` / `div`），与 `$n` 对应调用结果 `===`，再转成 JS `number` 写入缓存（`getCellData().v` 的 `typeof` 为 `'number'`，不是 Decimal / 字符串）。`=1/0`、`=0/0` 仍为 `#DIV/0!`（`t === 'e'`），不会变成 `$n.div` 的 `Infinity` / `NaN`。幂 `^`、百分比 `%`、一元 `+`/`-`、`&`、比较运算不走 `$n`。不用 `$n.calc` 替换求值器。包 peer 含 `@cat-kit/core` `>=1.2.1`。

```ts
import { Workbook } from '@veltra/sheet-core'

const wb = new Workbook()
const sheet = wb.activeSheet
sheet.setCellFormula({ row: 0, col: 0 }, '=0.1+0.2')
const plus = sheet.getCellData({ row: 0, col: 0 })
plus?.v // => 0.3
typeof plus?.v // => 'number'

sheet.setCellFormula({ row: 0, col: 1 }, '=1/0')
sheet.getCellData({ row: 0, col: 1 }) // => { v: '#DIV/0!', t: 'e' }
sheet.setCellFormula({ row: 0, col: 2 }, '=0/0')
sheet.getCellData({ row: 0, col: 2 }) // => { v: '#DIV/0!', t: 'e' }
```

强转：`coerceToNumber` / `coerceToText` / `coerceToBoolean`。区域引用作为函数参数时展开为**稀疏存在的格**组成的数组，不是稠密矩阵。

错误码见 `FORMULA_ERROR_CODES`：`#DIV/0!`、`#VALUE!`、`#NAME?`、`#REF!`、`#ERROR!`、`#CYCLE!`。用 `formulaError` / `isFormulaError` / `isFormulaErrorCode` 构造与判定。写入单元格时序列化为 `v = 错误码, t = 'e'`。

无头直接求值（自备上下文）适合测试或自定义运行时；表格场景让 `Sheet` / `Workbook` 驱动即可。

## 依赖图

`DependencyGraph` 是工作簿计算中枢：按表名解析跨表引用（表不存在 → `#REF!`），正向索引公式格 → 引用，反向索引用于标脏。变更后 BFS 标脏，再拓扑序增量重算；AST 含易失性函数的公式格在任意单元格变更触发的重算中必重新求值（值未变不产生派生补丁）。环上格子 `#CYCLE!`；打破循环后经标脏自动恢复。

图状态与单元格存储同步：公式原文变更由命令补丁维护节点。**命令执行后**才重算；undo/redo 回放派生补丁里的缓存值，不再重算。

`Workbook` 构造时创建并共享一张图；独立 `new Sheet()` 会自建一张。表改名后引用跟随新名（公式文本不重写）。删除表会使引用方变为 `#REF!`。

## 注册函数

内置（大小写不敏感）：`SUM`、`AVERAGE`、`MAX`、`MIN`、`COUNT`、`COUNTA`、`IF`、`AND`、`OR`、`NOT`、`ROUND`、`ABS`、`CONCATENATE`、`TODAY`、`NOW`、`RAND`、`RANDBETWEEN`。`IF` 为 `kind: 'lazy'`，未选分支不求值。`TODAY` / `NOW` / `RAND` / `RANDBETWEEN` 带 `volatile`：任意单元格变更触发的重算中必重新求值；`TODAY`/`NOW` 返回 1900 系统序列数（本地时间）。

`SUM` / `AVERAGE` / `ROUND` / `ABS` 走 `@cat-kit/core` 的 `$n` / `n().fixed`，单元格缓存 `v` 仍是 JS `number`（`ROUND` 把 `n().fixed` 的 string 转回 number）：

- `=SUM(0.1,0.2)` 的 `v === 0.3`（`$n.plus` 累加）
- `=AVERAGE(0.1,0.2)` 的 `v === $n.div($n.plus(0.1, 0.2), 2)`；无数字 → `#DIV/0!`
- `=ROUND(1.005,2)` 的 `v === Number(n(1.005).fixed(2))`（即 `1.01`）；`ROUND(2.675,2)===2.68`、`ROUND(2.5,0)===3`、`ROUND(-2.5,0)===-3`、`ROUND(1234.567,-2)===1200`
- `=ABS(-3)` 的 `v === 3` 且为 `number`（负值走 `$n.minus(0, value)`，不保留 `Math.abs`）

`MAX` / `MIN` / `COUNT` / `COUNTA` / 逻辑函数 / 文本函数 / 易失性函数不走 `$n`。

```ts
import { Workbook } from '@veltra/sheet-core'

const wb = new Workbook()
const sheet = wb.activeSheet

sheet.setCellFormula({ row: 0, col: 0 }, '=SUM(0.1,0.2)')
sheet.getCellData({ row: 0, col: 0 })?.v // => 0.3

sheet.setCellFormula({ row: 0, col: 1 }, '=AVERAGE(0.1,0.2)')
sheet.getCellData({ row: 0, col: 1 })?.v // => 与 $n.div($n.plus(0.1, 0.2), 2) 相同

sheet.setCellFormula({ row: 0, col: 2 }, '=ROUND(1.005,2)')
sheet.getCellData({ row: 0, col: 2 })?.v // => 1.01（Number(n(1.005).fixed(2))）

sheet.setCellFormula({ row: 0, col: 3 }, '=ABS(-3)')
const abs = sheet.getCellData({ row: 0, col: 3 })
abs?.v // => 3
typeof abs?.v // => 'number'
```

同名 `registerFormulaFunction` 会覆盖，供扩展。注册表是模块级全局、名称大小写不敏感。自定义 `impl` 入参仍是求值后的 `EvalValue[]`，引擎不预处理数值参数、不强制走 `$n`（扩展方可自行决定是否在 impl 里用 `$n`）。错误请用 `formulaError` 返回，不要手造对象：

```ts
import { coerceToNumber, isFormulaError, registerFormulaFunction } from '@veltra/sheet-core'

registerFormulaFunction('DOUBLE', {
  minArgs: 1,
  maxArgs: 1,
  meta: { params: ['number'], description: '将参数乘以 2' },
  impl: (args) => {
    const n = coerceToNumber(args[0]!)
    if (isFormulaError(n)) return n
    return n * 2
  }
})
```

`listFormulaFunctions()` 返回按名称排序的 `{ name, params, description }`，供补全。`invokeFormulaFunction` 供求值器按名称分发（未知名 → `#NAME?`，参数个数非法 → `#VALUE!`）。
