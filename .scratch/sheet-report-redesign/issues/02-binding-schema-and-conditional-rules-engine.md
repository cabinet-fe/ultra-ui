Status: ready-for-agent

# 02 — 报表绑定 Schema 扩展与条件样式评估引擎

**What to build:** 
扩展 `ReportBinding` 数据结构，使其支持 5 大语义角色（分组头、明细行、小计行、总计行、矩阵交叉点）及条件格式规则配置；实现独立的条件样式求值模块 `rules/`，提供根据单元格运行态数值微秒级计算并叠加 `CellStyle` 增量的能力。

**Blocked by:** None — can start immediately.

- [ ] `ReportBinding` 类型包含 `role` (`group` | `detail` | `subtotal` | `grandTotal` | `matrix`)、`aggregate`、`sort` 以及 `conditionalRules` 数组结构
- [ ] 定义 `ConditionalRule` 结构（比较运算符如 `gt`/`eq`/`between` 等、对比值、样式 Patch 增量）
- [ ] 实现 `evaluateCondition` 纯函数评估器，支持各种运算符求值与样式增量合并
- [ ] 编写条件样式引擎单测，覆盖数值匹配、范围比较、多规则优先级与样式合并逻辑
