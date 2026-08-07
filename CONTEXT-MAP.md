# Context Map

## Contexts

- [Sheet Report](./packages/sheet-core/CONTEXT.md) — 在电子表格上配置并渲染类 ureport/FineReport 的报表模板

## Relationships

- **Sheet Report → Spreadsheet Core**：报表设计态叠加在 Sheet 网格之上；渲染产物是普通 `SheetSnapshot`（填充报表），由现有表格只读预览展示
- **Sheet Report ↛ Spreadsheet Formula**：绑定 / 报表表达式与 `CellData.f` 电子表格公式是不同概念，不得混用同一语义
- **Playground → Sheet Report**：首期渲染引擎（expand → Filled Report）放在 playground 示例模块；sheet-core 只提供 Cell Meta 扩展面（见 sheet-core ADR-0001/0002）
