# 07 — UReportDesigner 全量

**What to build:** 设计器完备：`UReportDesigner` 组件整合最小闭环（06）并迁入 Action Pill、拓扑连线、条件规则对话框；预览模式内嵌查看器路径（05）展示真实取数展开的填充报表；`template` prop 载入既有模板继续设计；XLSX 导出（条件样式打平进快照，ADR-0001 决策 2 / 架构约束 3）。

**Blocked by:** 05 — UReportViewer 运行态闭环；06 — 设计器最小闭环

**Status:** ready-for-agent

- [ ] 设计态全部交互（角色切换/聚合配置/条件规则/清除绑定/拓扑高亮）在组件内可用
- [ ] 预览切换经内嵌查看器路径展示填充报表，可切回设计态且绑定不丢
- [ ] 传入既有模板可完整恢复绑定与设计态
- [ ] 导出 XLSX 样式保真（条件样式打平）
- [ ] topology/conditional-rules/binding-float-panel 等随迁测试全绿
