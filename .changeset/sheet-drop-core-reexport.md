---
'@veltra/sheet': minor
---

**Breaking**：主入口不再 re-export `@veltra/sheet-core` 符号（sheet-core 独立发包，移除二传手导出）。core API（`Workbook` / `Sheet` / `SheetGrid` / 公式 / IO / 样式与图片类型等）一律 `from '@veltra/sheet-core'` 直导。`@veltra/sheet` 主入口只保留自有能力：`USheet`、tools（`createSheetContext` / `defaultToolRegistry` / `registerTool` / `unregisterTool` 等）与组件类型（`SheetProps` / `SheetEmits` / `SheetExposed`）。
