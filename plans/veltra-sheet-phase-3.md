# 阶段 3：公式引擎

> 总览与设计决策见 [veltra-sheet-plan.md](./veltra-sheet-plan.md)（决策 6）。自研轻量引擎：tokenizer → Pratt parser → AST → evaluator + 依赖图增量重算。

## 任务清单

### 3.1 解析

- [x] `core/formula/tokenizer.ts`：数字/字符串/布尔/单元格引用/区域/跨表引用/函数名/运算符/括号/百分号
- [x] `core/formula/parser.ts`：Pratt parser → AST（二元/一元运算优先级、函数调用、括号、引用节点）
- [x] 引用形态全覆盖：`A1`、`A1:B9`、`Sheet2!A1`、`'My Sheet'!A1`、`'S2'!A1:B2`

### 3.2 求值

- [x] `core/formula/evaluator.ts`：AST 求值，空格按 0/空串参与运算的规则
- [x] `core/formula/functions.ts`：函数注册表（可扩展）+ 基础函数集：SUM / AVERAGE / MAX / MIN / COUNT / COUNTA / IF / AND / OR / NOT / ROUND / ABS / CONCATENATE
- [x] 区域引用在聚合函数中展开时只迭代稀疏存在的格
- [x] 错误值体系：`#DIV/0!` / `#VALUE!` / `#NAME?` / `#REF!` / `#ERROR!` / `#CYCLE!`

### 3.3 依赖图 `core/formula/dependency-graph.ts`

- [x] 正反向依赖索引（公式格 → 引用格；引用格 → 依赖者）
- [x] 变更时标脏 + 拓扑序增量重算
- [x] 循环引用检测 → 环上所有格 `#CYCLE!`，打破循环后自动恢复

### 3.4 集成

- [x] 编辑以 `=` 开头 → `SetCellFormulaCommand`（走命令系统，自动获得 undo/redo；重算派生变更并入同一事务）
- [x] `CellData.f` 存公式原文，`v / t` 存计算缓存；解析失败 → `#ERROR!` 并存错误信息
- [x] 跨表引用目标存在性检查（不存在 → `#REF!`）；sheet 重命名/删除的引用联动列为已知限制，记入包 `AGENTS.md`
- [x] grid 层：公式格显示计算值，编辑时显示公式原文（同 Excel 行为）
- [x] playground 演示：双 sheet，跨表求和示例

## 验证清单

### 单测

- [x] 解析：`=1+2*3`=7、括号优先级、`=A1+B2`、`=SUM(A1:A10)`、`=Sheet2!A1*2`、`='My Sheet'!A1`
- [x] 依赖：改 A1 → 依赖它的 `=A1*2`、间接依赖 `=B1+1`（B1=`=A1*2`）按正确顺序重算
- [x] 循环：`A1==B1+1, B1==A1+1` → 双格 `#CYCLE!`，打破循环后自动恢复
- [x] 跨表：Sheet2 值变更 → Sheet1 引用格重算；引用不存在 sheet → `#REF!`
- [x] 区域：`SUM(A1:A10)` 只迭代存在的格（稀疏性）；空格按 0 参与聚合
- [x] 错误：除零 `#DIV/0!`、类型错误 `#VALUE!`、未知函数 `#NAME?`
- [x] undo 集成：输入公式 → 重算波及 10 格 → 单次 undo 全部还原
- [x] 函数集：SUM / AVERAGE / MAX / MIN / COUNT / COUNTA / IF / AND / OR / NOT / ROUND / ABS / CONCATENATE 各有用例

### 人工（playground）

- [x] 双 sheet 跨表求和实时联动；公式格显示值、编辑显示原文

### 通用门槛

- [x] `bun run lint` / `bun run test` / `bun run build` 全绿
