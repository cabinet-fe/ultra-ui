---
'@veltra/sheet': minor
---

新增报表纯 TS 内核与数据连接器（ADR-0003 决策 1/3）：`renderReport`（模板 + records → Filled Report 快照，分组/小计/总计/矩阵展开与条件样式打平）、绑定（`REPORT_META_NAMESPACE` / `createReportBinding` / `resolveReportRole` 等）、条件规则（`evaluateCondition` / `evaluateConditionalStyle`）、查询参数（`${param}` 提取 `extractParamIds` / `buildParamDefs` / `resolveBoundDatasetParams`）自 playground 迁入 `src/report/` 并从主入口导出；新增 `DataConnector` 接口与 `createHttpConnector({ endpoint })`（`test`/`describe`/`query` 三端点契约，业务错误 `200 + { ok: false, error }` 分叉、无版本段）。playground 旧纯 TS 模块删除、改为从包消费；前端包保持零数据库驱动、零 Node-only 依赖。
