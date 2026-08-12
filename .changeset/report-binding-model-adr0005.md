---
'@veltra/sheet': minor
---

按 ADR-0005 定稿报表绑定模型（breaking）：`ReportBinding` 以 `expand` / `rowParent` / `colParent` / `aggregate`（`select`→`list`，新增 `max`/`min`）描述布局；删除 `ReportRole` / `leftParent` 与 `resolveReportRole` 等旧符号；新增设计预设 `preset`、`ConditionalRule.field`/`scope`、`ReportTemplate.version`（当前 `1`，缺失或高于当前版本载入报错）；`formatCellAddress`/`parseCellAddress` 支持多字母列。
