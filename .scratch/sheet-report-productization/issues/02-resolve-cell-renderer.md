# 02 — sheet-core 渲染扩展口 resolveCellRenderer

**What to build:** 宿主可经 `resolveCellRenderer(addr, base)` 按格自定义单元格渲染（ADR-0004）：`SheetGridOptions` 新增 hook，`buildColumns` 安装 customLayout 按格分发器，返回 `undefined` 回落默认渲染；USheet 经 `SheetProps` 透传。hook 不进模型、不进快照。cell hook 性能契约（纯函数、同步、O(1) 查找、禁异步与大对象分配）写入工程文档。

**Blocked by:** 01 — sheet 包骨架重构（props/types 已移位，避免边改边搬）

**Status:** ready-for-agent

- [ ] hook 生效：列级 customLayout 分发器按格回调，地址正确
- [ ] 返回 `undefined` 时渲染与现状一致；快照与模型无 renderer 残留
- [ ] 缝隙 2 测试（canvas mock）覆盖上述行为
- [ ] cell hook 性能契约写入 `packages/sheet-core/AGENTS.md`
- [ ] 全量测试绿
