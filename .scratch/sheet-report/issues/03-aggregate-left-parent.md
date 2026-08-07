# 03 — 设计态：聚合方式 + 左父格

**What to build:** 在已有 Binding 放置能力上，用属性面板配置 Aggregate（list / group / sum）、纵向 Expand，以及 Left Parent（默认规则可覆盖）。用户能配出「客户分组 → 订单明细 → 合计行」的 Report Template，并在设计网格上通过占位读懂结构。

**Blocked by:** 02 — 设计态：放入 Binding + 占位覆盖显示

**Status:** resolved

- [x] 选中绑定格可改 Aggregate：list / group / sum
- [x] 可确认或覆盖 Left Parent（无 / 默认 / 指定设计地址）
- [x] 能保存并恢复一张含分组明细 + Subtotal Row 的 Report Template
- [x] 默认左父规则与可覆盖行为符合共识；无需可视化连线 UI
- [x] 术语：Aggregate、Expand、Left Parent、Subtotal Row、Report Template
