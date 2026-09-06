---
title: sheet-core 公式引擎
description: 解析、求值、依赖图与 registerFormulaFunction 自定义函数
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

`evaluateAst(node, ctx)` 需要 `FormulaEvalContext`：`currentSheet`、`readCell`、`readRange`、`callFunction`。空格在数字上下文当 0、文本当 `''`、布尔当 `false`；错误值遇运算即传播。

强转：`coerceToNumber` / `coerceToText` / `coerceToBoolean`。区域引用作为函数参数时展开为**稀疏存在的格**组成的数组，不是稠密矩阵。

错误码见 `FORMULA_ERROR_CODES`：`#DIV/0!`、`#VALUE!`、`#NAME?`、`#REF!`、`#ERROR!`、`#CYCLE!`。用 `formulaError` / `isFormulaError` / `isFormulaErrorCode` 构造与判定。写入单元格时序列化为 `v = 错误码, t = 'e'`。

无头直接求值（自备上下文）适合测试或自定义运行时；表格场景让 `Sheet` / `Workbook` 驱动即可。

## 依赖图

`DependencyGraph` 是工作簿计算中枢：按表名解析跨表引用（表不存在 → `#REF!`），正向索引公式格 → 引用，反向索引用于标脏。变更后 BFS 标脏，再拓扑序增量重算。环上格子 `#CYCLE!`；打破循环后经标脏自动恢复。

图状态与单元格存储同步：公式原文变更由命令补丁维护节点。**命令执行后**才重算；undo/redo 回放派生补丁里的缓存值，不再重算。

`Workbook` 构造时创建并共享一张图；独立 `new Sheet()` 会自建一张。表改名后引用跟随新名（公式文本不重写）。删除表会使引用方变为 `#REF!`。

## 注册函数

内置（大小写不敏感）：`SUM`、`AVERAGE`、`MAX`、`MIN`、`COUNT`、`COUNTA`、`IF`、`AND`、`OR`、`NOT`、`ROUND`、`ABS`、`CONCATENATE`。`IF` 为 `kind: 'lazy'`，未选分支不求值。

同名 `registerFormulaFunction` 会覆盖，供扩展。错误请用 `formulaError` 返回，不要手造对象：

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
