---
'@veltra/sheet': minor
---

新增报表设计器 `UReportDesigner` 最小闭环（ADR-0003 决策 2 / ADR-0004 首个消费者）：`connector` 必填 + `v-model:connections`（纯序列化连接对象，仅驻留内存，持久化由宿主掌控）+ 可选 `workbook`。数据中枢 drawer 适配 `DataConnector`——连接 CRUD（删连接级联删其数据集）、真实测试连接（新建草稿同样可测）、SQL 数据集编辑、`${param}` 参数提取与元数据覆盖、describe 字段解析（字段缓存供字段面板 catalog）、记录预览（按参数默认值取数）。字段面板 HTML5 拖拽落格写 Cell Meta 绑定（绑定格式不变，角色推导与 playground 旧设计器一致）；绑定单元格升级为带角色色彩的富渲染徽章（`resolveCellRenderer` 首个消费者，未绑定格回落默认渲染）。expose `getTemplate()` 返回含 meta 绑定与内嵌数据集定义的 `ReportTemplate`。Action Pill / 拓扑连线 / 条件规则对话框 / 预览模式 / XLSX 导出留待后续 ticket。
