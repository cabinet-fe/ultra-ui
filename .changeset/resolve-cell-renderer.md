---
'@veltra/sheet-core': minor
'@veltra/sheet': minor
---

新增单元格渲染扩展口 `resolveCellRenderer`（ADR-0004）：`SheetGridOptions` / `SheetProps` 新增对称 hook，`buildColumns` 仅在宿主提供 hook 时安装按格 customLayout 分发器，按格回调（表格坐标转模型地址，合并格落锚点），返回 `undefined` 回落默认渲染；hook 不写模型、不进快照。配套导出 VTable 布局构建工具 `CustomLayout`（Container/Text/Rect…）与类型 `ICustomLayoutObj`。cell hook 性能契约（纯函数/同步/O(1)/禁大对象分配）写入 `packages/sheet-core/AGENTS.md`。
