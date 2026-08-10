# 08 — playground 演示页重写 + 旧模块/mock 删除

**What to build:** sheet-report 演示页重写为新组件的薄消费页（设计器 + 查看器，连接由演示者在 UI 自行输入，经 hono 参考服务取数）；旧 `playground/src/sheet-report/` 实现、内存 mock 数据库、模拟 testConnection、迷你 SQL 执行器、种子模板、dataset-hub 专属测试全部删除（ADR-0003 决策 5），零残留。

**Blocked by:** 04 — playground hono 连接器参考服务；07 — UReportDesigner 全量

**Status:** ready-for-agent

- [ ] 演示页仅用包内组件完成"配连接 → 建数据集 → 绑定 → 预览 → Filter Bar 筛选"全流程
- [ ] 旧 sheet-report 模块与 mock 相关文件、种子模板、dataset-hub 测试零残留
- [ ] 负责人用真实 MySQL 与 PG 各完成一次端到端演练
