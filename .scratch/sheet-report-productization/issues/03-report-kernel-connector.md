# 03 — 报表纯 TS 内核 + DataConnector 入包

**What to build:** 渲染引擎（renderReport）、绑定、条件规则、参数提取等纯 TS 模块从 playground 迁入 `@veltra/sheet` 的 report 模块并导出（ADR-0003 决策 1）；定义 `DataConnector` 接口（test/describe/query）与 `createHttpConnector({ endpoint })`（三端点契约、业务错误 `200 + { ok: false, error }` 分叉、无版本段；ADR-0003 决策 3）。playground 对应纯 TS 文件删除并改为从包导入（单一事实源；mock hub 本票暂留）。随迁测试改写为内联 fixtures。

**Blocked by:** 01 — sheet 包骨架重构

**Status:** ready-for-agent

- [ ] report 模块公开 API 从包导出，playground 从包消费（无双份实现）
- [ ] `createHttpConnector` 三端点请求形状与错误分叉有 mock-fetch 契约测试
- [ ] render/binding/rules/params 测试随迁、fixtures 内联，全绿
- [ ] 前端包零数据库驱动、零 Node-only 依赖（连接器边界，词汇表架构约束 4）
