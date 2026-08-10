# Context Map

## Contexts

- [Sheet Report](./packages/sheet-core/CONTEXT.md) — 在电子表格上配置并渲染类 ureport/FineReport 的报表模板

## Relationships

- **Sheet Report → Spreadsheet Core**：报表设计态叠加在 Sheet 网格之上；渲染产物是普通 `SheetSnapshot`（填充报表），由现有表格只读预览展示
- **Sheet Report ↛ Spreadsheet Formula**：绑定 / 报表表达式与 `CellData.f` 电子表格公式是不同概念，不得混用同一语义
- **Playground → Sheet Report**：渲染引擎与设计师/查看器组件已产品化进 `@veltra/sheet`（见 ADR-0003）；playground 只保留演示页与 dev-only 连接器参考实现；sheet-core 提供 Cell Meta 扩展面与 cell hook 渲染扩展口（见 ADR-0001/0002/0004）
