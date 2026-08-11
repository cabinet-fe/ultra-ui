---
'@veltra/sheet': minor
---

`UReportDesigner` 设计器完备（ADR-0001 决策 4 / ADR-0003 决策 2）：迁入 Action Pill 悬浮编辑卡（选中绑定格就地切换角色 / 配置聚合 / 排序 / 清除绑定，分组锚点守卫不允许降级明细）、拓扑连线覆层（SVG 弧线高亮父子扩展依赖）与条件规则对话框（运算符按字段类型映射、拖拽/按钮排序、样式预览）。新增 `template` prop 载入既有 `ReportTemplate` 继续设计（恢复网格绑定与设计态数据集，内嵌连接按 id 合并进 `v-model:connections`，describe 自动恢复字段缓存）。预览模式内嵌 `UReportViewer` 路径展示真实取数展开的填充报表（Filter Bar 按绑定数据集参数并集自动生成），切回设计态绑定不丢。预览态一键导出样式保真 XLSX（条件样式已在 `renderReport` 展开阶段打平进快照，ADR-0001 决策 2；列宽经 VTable 运行时捕获随导出写入）。新增 peer `@veltra/compositions`（条件规则对话框拖拽排序；desktop 既有 peer，宿主无新增安装负担）。
