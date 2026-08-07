# 04 — 预览：扩展渲染 + 设计/预览双模

**What to build:** playground 内实现渲染：按 Left Parent 建扩展树，Expansion Band 内 list zip，group 纵向 merge 拉伸，Subtotal Row 按父实例插入并聚合过滤子集；工具栏在 Design Mode 与 Preview Mode 间切换，同一 Sheet 用模板快照与 Filled Report 快照互换，预览只读。

**Blocked by:** 03 — 设计态：聚合方式 + 左父格

**Status:** resolved

- [x] 对「客户 group + 订单 list + 合计行 sum」模板 + mock Dataset，能生成正确行数与分组小计的 Filled Report
- [x] 同页可切换 Design / Preview；回设计恢复 Report Template，预览不污染模板
- [x] Preview Mode 只读；扩展实例携带模板样式
- [x] 渲染逻辑符合 ADR-0003；引擎留在 playground，不提前抽进 sheet-core
- [x] 术语：Filled Report、Preview Mode、Expansion Band、Dataset
