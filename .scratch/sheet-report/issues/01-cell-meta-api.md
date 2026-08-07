# 01 — Cell Meta 扩展面（undo + 快照）

**What to build:** sheet-core 提供按单元格地址、按 namespace 存取 Cell Meta 的能力；写入走命令通道可撤销，并随 Sheet 快照 round-trip。本票不引入报表 Binding 语义，只交付通用扩展面（可用任意 namespace 的 payload 单测验证）。

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] 可对指定地址设置 / 读取 / 清除 namespaced Cell Meta
- [x] Meta 变更可 undo / redo，与单元格值/样式变更同一命令历史体验
- [x] `snapshot` / `restore` 保留 meta（xlsx IO 不要求携带 meta）
- [x] 有单测覆盖上述行为；公开 API 形状稳定到可供 playground 消费
- [x] 遵守 ADR-0001、ADR-0002；术语用 Cell Meta，不把载荷写进 CellData 的 v/f
