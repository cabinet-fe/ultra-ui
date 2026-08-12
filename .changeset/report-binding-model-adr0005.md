---
'@veltra/sheet': minor
---

按 ADR-0005 重写报表展开引擎（breaking）：`ReportBinding` 以 `expand: 'down'|'right'|'none'` / `rowParent` / `colParent` / `aggregate`（`select`→`list`，新增 `max`/`min`）/ `mergeSpan` 描述布局；删除 `ReportRole` / `leftParent` / `resolveReportRole` 等坐标反推符号；新增设计预设 `preset`（引擎不读）、`ConditionalRule.field`/`scope`、`ReportTemplate.version`（当前 `1`，缺失或高于当前版本载入报错，存量模板须重建）；`UReportViewer` 暴露 `exportXlsx()`；`formatCellAddress`/`parseCellAddress` 支持多字母列。
