# 09 — 工具链收尾 + 整库验证

**What to build:** 发布配套收尾：`resolver:gen`（report 组件入组件表）、`skill:gen` 与 `skills/veltra-ui` 内容更新（新组件、DataConnector、resolveCellRenderer）、根 AGENTS.md 目录结构同步、changeset（minor，含 `vue/` 移除的 breaking 说明；fixed 组 sheet-core 随同 bump）；整库最终验证。

**Blocked by:** 08 — playground 演示页重写 + 旧模块/mock 删除

**Status:** ready-for-agent

- [ ] resolver 组件表包含 `UReportDesigner` / `UReportViewer`
- [ ] `skills/veltra-ui` 反映新 API（report 组件、DataConnector/createHttpConnector、resolveCellRenderer）
- [ ] changeset 含 `vue/` → `components/sheet/` 的 breaking 说明
- [ ] `bun run lint` / `bun run test` / `bun run build` 全绿
