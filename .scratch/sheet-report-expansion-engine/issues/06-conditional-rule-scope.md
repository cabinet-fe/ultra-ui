# 06 — 条件样式跨字段求值与整行作用范围

**What to build:** `ConditionalRule` 的 `field`（对同一记录的另一字段求值）与 `scope: 'row'`（染满整个物理输出行）落地，含求值链改造与规则编辑器 UI。补齐 redesign issue 09 记为「记入后续 issue」的缺口。

**Blocked by:** 05 — 设计器适配：预设切换、点选式父格编辑、落格推断重写

**Status:** done

- [x] `rules/evaluate.ts`：`evaluateConditionalStyle` 求值入参从单一 `cellValue` 扩展为「当前记录 + 绑定字段」，`rule.field` 缺省取绑定格自身字段、指定时取同一条记录的该字段
- [x] `scope: 'row'` 语义：命中后染满**整个物理输出行**，含横向展开出的所有列与该行的静态格
- [x] 两阶段样式解析：行内静态格的样式必须延后到该行所有绑定格求值完成之后（现状 `StyleResolver.resolve` 逐格即时解析，无法表达行级叠加）
- [x] 条件样式仍在展开阶段打平进 `SheetSnapshot.styles` 与 `StylePool`（ADR-0001 决策 2 的导出打平机制不变，保证 XLSX 保真）
- [x] 规则编辑器（`rule-row.vue` / `conditional-rules/helpers.ts`）新增：求值字段选择（默认「本格字段」，可选同数据集其他字段）、作用范围选择（本格 / 整行）
- [x] 运算符按**所选求值字段**的类型映射（现状按绑定格字段类型映射）
- [x] `rule-preview.vue` 预览需体现作用范围差异
- [x] 文档写明：交叉表下 `scope: 'row'` 会染满整行，整行高亮的真实用例是明细行报表
- [x] 测试：`field` 跨字段求值、`scope: 'row'` 覆盖静态格与横向展开列、两阶段解析不影响 `scope: 'cell'` 现有断言、规则编辑器 helpers 的字段与范围选项

## Comments

- **不做 `scope: 'column'`**：实现上只是把行级两阶段机制换个轴，但无真实需求驱动，等有消费方再加。
