---
'@veltra/sheet-core': patch
---

grid 适配层迁移到官方 `infinitable/sheet` 子路径（infinitable ^0.1.0 → ^0.1.2）：删除手写 grid 九个模块（模型/选区/编辑器/表头/浮动图/行高/样式/坐标/主题，约 1330 行），`@veltra/sheet-core/grid` 内部改为 re-export 官方 SheetGrid，仅保留衔接本仓 core Sheet 类型的薄桥；公共 API 与行为不变。hucre ^1.1.0 → ^1.2.0。
