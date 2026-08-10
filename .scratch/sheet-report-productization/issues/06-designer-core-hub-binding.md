# 06 — 设计器最小闭环：数据中枢（连接器版）+ 拖拽绑定

**What to build:** 数据中枢 drawer 适配 `DataConnector`：连接 CRUD（内存态、`v-model:connections` 注入）、真实测试连接、SQL 数据集编辑、`${param}` 参数提取与元数据覆盖、describe 字段解析、记录预览。字段面板拖拽落格写 Cell Meta（绑定格式不变）；绑定格渲染带角色色彩的富渲染徽章（`resolveCellRenderer` 首个消费者，ADR-0004）；expose `getTemplate()` 返回含绑定的可序列化模板。

**Blocked by:** 02 — resolveCellRenderer 扩展口；03 — 报表纯 TS 内核 + DataConnector 入包

**Status:** ready-for-agent

- [ ] 连接/数据集 CRUD 全走 connector，凭据仅驻留内存（ADR-0003 决策 4）
- [ ] 拖拽字段落格生成绑定，角色推导行为与现状一致
- [ ] 绑定格显示角色徽章而非纯文本占位符
- [ ] `getTemplate()` 返回含 meta 绑定的 SheetSnapshot
- [ ] 组件级测试覆盖关键交互（落格写 meta、getTemplate 快照）
