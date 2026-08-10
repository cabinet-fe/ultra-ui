# 05 — UReportViewer 运行态闭环

**What to build:** 报表查看器组件 + headless 组合式函数（ADR-0003 决策 2）：`connector` 与 `template` 必填 props；内部完成"从模板实际绑定的数据集提取参数并集 → 生成 Filter Bar → 经连接器取数 → renderReport 展开 → 只读展示"；expose `refresh()`；取数有 loading、后端业务错误有可读提示。Filter Bar 相关代码自 playground 迁入。

**Blocked by:** 03 — 报表纯 TS 内核 + DataConnector 入包

**Status:** ready-for-agent

- [ ] 给定带绑定的模板与 stub connector，组件完成全流程并渲染展开结果（缝隙 3 组件测试）
- [ ] Filter Bar 控件按参数类型映射（text/number/date/date-range/select），改值重新取数
- [ ] loading 与 `ok:false` 错误状态可见；`refresh()` 触发重新取数
- [ ] filter-bar 相关测试随迁至包内、fixtures 内联，全绿
