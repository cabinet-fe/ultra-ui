---
'@veltra/desktop': patch
'@veltra/sheet': patch
'@veltra/sheet-core': patch
---

- `@veltra/sheet-core`：解耦 `SheetGrid` 等渲染层符号至独立子路径 `@veltra/sheet-core/grid`，避免主入口把 `@visactor/vtable` 类型图拉入无头 TS 程序；优化 xlsx 导入性能，只遍历有效 cells Map，并对超大空白格式格设置紧邻带限制，避免极端表格卡死。
- `@veltra/sheet`：适配 `@veltra/sheet-core/grid` 导出与 xlsx 导入选项。
- `@veltra/desktop`：file-viewer 动态导入适配 `@veltra/sheet-core/grid`。
