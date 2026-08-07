# 02 — 设计态：放入 Binding + 占位覆盖显示

**What to build:** playground 增加报表配置示例页：提供 mock Dataset 与字段面板；用户可通过点击或拖入，把字段写成当前格的 Binding（默认列表 + 纵向扩展）；Design Mode 下网格用 Binding Placeholder 覆盖显示（如 `orders.amount`），占位不写入单元格值。

**Blocked by:** 01 — Cell Meta 扩展面（undo + 快照）

**Status:** resolved

- [x] 示例页可打开，并展示至少一个 mock Dataset 的字段列表
- [x] 选中格后，点击或拖入字段会写入 namespace `report` 的 Binding（经 Cell Meta）
- [x] Design Mode 网格显示 Binding Placeholder；静态表头/标签仍用普通单元格值
- [x] 写入 Binding 可撤销；刷新/恢复快照后 Binding 仍在
- [x] 词汇与 ADR：Binding、Binding Placeholder、Design Mode；占位覆盖显示见 ADR-0004
