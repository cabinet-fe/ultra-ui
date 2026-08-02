---
'@veltra/sheet': minor
---

新增自研公式引擎：tokenizer → Pratt parser → AST → evaluator，支持单元格/区域/跨表引用（含带引号表名）与可扩展函数注册表（内置 SUM / AVERAGE / MAX / MIN / COUNT / COUNTA / IF / AND / OR / NOT / ROUND / ABS / CONCATENATE）。工作簿级依赖图按拓扑序增量重算，循环引用检测为 `#CYCLE!` 且打破循环自动恢复；完整错误值体系（`#DIV/0!` / `#VALUE!` / `#NAME?` / `#REF!` / `#ERROR!` / `#CYCLE!`）。`=` 开头输入走 `SetCellFormulaCommand`，重算派生变更并入同一撤销单元；grid 层公式格显示计算值、编辑时显示公式原文。
