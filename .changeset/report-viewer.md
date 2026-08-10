---
'@veltra/sheet': minor
---

新增报表查看器 `UReportViewer`（ADR-0003 决策 2）：`connector` + `template` 必填 props，内部完成「从模板实际绑定的数据集提取查询参数并集 → 生成 Filter Bar（text/number/date/date-range/select 控件映射）→ 经连接器取数 → `renderReport` 展开 → 只读展示」运行态闭环；expose `refresh()` 主动刷新；取数有 loading 遮罩、业务错误（`ok:false`）有可读错误提示。模板形态升级为自包含 `ReportTemplate`（`SheetSnapshot` + 内嵌数据集定义 `datasets`，含完整连接对象，可 JSON 序列化流转）；report 内核新增 `getTemplateDatasets` / `getBoundDatasetIds` / `resolveTemplateParams` / `resolveParamDefaults` / `fetchTemplateRecords` 纯函数。Filter Bar 值规范化 helper（`parseDateRangeValue` / `resolveNumberParamValue` / `patchParamValues`）自 playground 迁入为单一事实源。样式入口 `@veltra/sheet/components/report/style`。
