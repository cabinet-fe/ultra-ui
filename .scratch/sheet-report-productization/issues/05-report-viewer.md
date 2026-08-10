# 05 — UReportViewer 运行态闭环

**What to build:** 报表查看器组件 + headless 组合式函数（ADR-0003 决策 2）：`connector` 与 `template` 必填 props；内部完成"从模板实际绑定的数据集提取参数并集 → 生成 Filter Bar → 经连接器取数 → renderReport 展开 → 只读展示"；expose `refresh()`；取数有 loading、后端业务错误有可读提示。Filter Bar 相关代码自 playground 迁入。

**Blocked by:** 03 — 报表纯 TS 内核 + DataConnector 入包

**Status:** completed

- [x] 给定带绑定的模板与 stub connector，组件完成全流程并渲染展开结果（缝隙 3 组件测试）
- [x] Filter Bar 控件按参数类型映射（text/number/date/date-range/select），改值重新取数
- [x] loading 与 `ok:false` 错误状态可见；`refresh()` 触发重新取数
- [x] filter-bar 相关测试随迁至包内、fixtures 内联，全绿

## Comments

- **自包含模板格式（实施钉死）**：`ReportTemplate = SheetSnapshot + datasets?: ReportDatasetDef[]`（`src/report/template.ts`）。查看器仅有 `connector` + `template` 两个数据来源，而连接器契约是无状态的（每次请求携带完整连接对象），故数据集定义（含连接凭据）必须内嵌模板才能闭环（用户故事 7「传给查看器直接运行」）。与决策 4 不冲突：库自身零持久化；模板是否落盘、凭据如何安全存储由下游决定（用户故事 6）。`Sheet.snapshot()` 不产生 `datasets` 字段，`restore()`/`snapshot()` 往返会丢失，由设计器 `getTemplate()`（06/07）吐出时附加。
- **可选 `workbook` prop**：超出决策 2 字面（仅 connector + template），理由有三——USheet `workbook?` 缺省内部自建的既有先例；缝隙 3 组件测试需模型观察口（canvas 渲染无 DOM 可断言）；07 票预览态 XLSX 导出需要拿到填充后的 sheet。
- **filter-bar helpers 经包根导出**：`parseDateRangeValue` / `resolveNumberParamValue` / `patchParamValues` 迁入 `src/report/filter-bar.ts` 并随内核 `export *` 公开；playground 旧文件已删、页面改从包导入（单一事实源，03 票先例）。playground 的 `filter-bar.vue` 外壳暂留（旧演示页整体由 08 删除），控件映射模板存在一份临时重复。
- **skills/veltra-ui 未更新**：按 ticket 分工留待 09（skill:gen 统一收尾，06/07 还会引入 UReportDesigner）。
- **遗留观察（非本票引入）**：`vp test` 会触发 playground `reportServerPlugin` 联动启动并占用 8787 端口；本地 dev 已占用时全量测试失败（可 `REPORT_SERVER_PORT` 绕行）。建议 04/09 跟进（如 `process.env.VITEST` 守卫）。
