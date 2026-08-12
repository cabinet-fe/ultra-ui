# 09 — 样式拆分、工具链与文档收尾

**What to build:** `components/report/style.scss` 按组件切分；`resolver:gen` / `skill:gen` 刷新；根与 `packages/sheet/AGENTS.md` 同步新引擎结构与绑定模型；changeset 声明 breaking；整库验证全绿。

**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08

**Status:** ready-for-agent

- [ ] `packages/sheet/src/components/report/style.scss`（902 行，超单文件 500 行偏好）按 designer / viewer / hub 切分为三份，`style.ts` 入口同步；`sideEffects` 与 pack entry 不变
- [ ] `bun run resolver:gen`（report 组件导出未增删则应无 diff，仍需确认）
- [ ] `bun run skill:gen`；`skills/veltra-ui` 中 sheet 包的 API 文档更新——`ReportBinding` 新字段、`ReportAggregate` 新枚举、`ReportTemplate.version`、`UReportViewer.exportXlsx()`、删除的角色与 `leftParent` 一族符号
- [ ] `packages/sheet/AGENTS.md` 更新：`report/render/` 模块结构与职责表、绑定模型（方向 + 父格 + 聚合）、预设降级说明、扩展坐标系语义、`mergeSpan`、条件样式 `field` / `scope`、查看器 `exportXlsx()`
- [ ] `packages/sheet-core/AGENTS.md` 检查是否需同步（本次未动 sheet-core；若 cell hook 消费方式有变则同步）
- [ ] 根 `AGENTS.md` 的包职责描述如涉及报表能力表述则同步
- [ ] `vp changeset`：`@veltra/sheet` minor，明确声明 breaking——`ReportBinding` 结构变更（`role` / `leftParent` 删除，新增 `expand: 'right'` / `rowParent` / `colParent` / `mergeSpan` / `preset`）、`ReportAggregate` 的 `select` → `list` 更名、`ReportTemplate.version` 必填、存量模板一律要求重建
- [ ] 整库验证全绿：`bun run lint`（含类型检查）、`bun run test`、`bun run build`
- [ ] `playground` 手工冒烟：搭一张带标题行的交叉表（验证旧实现静默失效的场景）、一张多级列头报表、一张 `mergeSpan: false` 的平铺明细报表并导出 XLSX

## Comments
