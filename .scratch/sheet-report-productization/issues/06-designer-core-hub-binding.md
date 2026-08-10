# 06 — 设计器最小闭环：数据中枢（连接器版）+ 拖拽绑定

**What to build:** 数据中枢 drawer 适配 `DataConnector`：连接 CRUD（内存态、`v-model:connections` 注入）、真实测试连接、SQL 数据集编辑、`${param}` 参数提取与元数据覆盖、describe 字段解析、记录预览。字段面板拖拽落格写 Cell Meta（绑定格式不变）；绑定格渲染带角色色彩的富渲染徽章（`resolveCellRenderer` 首个消费者，ADR-0004）；expose `getTemplate()` 返回含绑定的可序列化模板。

**Blocked by:** 02 — resolveCellRenderer 扩展口；03 — 报表纯 TS 内核 + DataConnector 入包

**Status:** completed

- [x] 连接/数据集 CRUD 全走 connector，凭据仅驻留内存（ADR-0003 决策 4）
- [x] 拖拽字段落格生成绑定，角色推导行为与现状一致
- [x] 绑定格显示角色徽章而非纯文本占位符
- [x] `getTemplate()` 返回含 meta 绑定的 SheetSnapshot
- [x] 组件级测试覆盖关键交互（落格写 meta、getTemplate 快照）

## Comments

- **`getTemplate()` 返回 `ReportTemplate`**（`SheetSnapshot` + 内嵌 `datasets`）：与 05 票钉死的自包含模板格式一致（`Sheet.snapshot()` 不产生 `datasets`，吐出时附加）；spec/本票行文中的「SheetSnapshot」指其超集，文档措辞建议 09 票统一。
- **数据集内部态以 `connectionId` 引用连接**：`v-model:connections` 是连接单一事实源；`getTemplate()` 吐出时解析为内嵌连接对象（克隆）并丢弃 `fields` 缓存，无匹配连接的数据集不吐出。删除连接级联删除其数据集（playground 平移）。
- **`workbook?` prop**：沿用 05 票查看器先例（USheet `workbook?` 缺省内部自建；组件测试的模型观察口；07 票 XLSX 导出需要拿到设计态 sheet）。
- **describe 字段缓存语义**：describe 成功写入数据集 `fields` 缓存（字段面板 catalog 数据源，`fieldOverrides` 在 catalog 层应用）；SQL 清空时清缓存（无查询无字段）；describe 业务错误保留 last-good 缓存并展示错误（绑定不因瞬时错误消失）。
- **角色推导 parity**：`createReportBinding` 默认值、首列第二行分组锚点约定、同行右侧落格继承分组数据集均自 playground 逐字平移；drop 时网格未就绪直接放弃、仅 hit-test 落空回退当前选区（code-review 修正回旧语义）。
- **徽章配色硬编码**：canvas 绘制无法消费 CSS 变量，`REPORT_ROLE_BADGE_COLORS` 为 5 角色具体色值；label 解析走组件内 `fieldLabelMap`（O(1)），不使用 `setBindingCatalog` 全局态。
- **code-review 已运行**（Standards + Spec 双轴）：修复连接草稿重复（表单 `connection` prop 改为必填）、`effectiveExpanded` 命名反转、drop 回退语义偏移、SQL 清空残留字段缓存；其余为既有先例或有依据的判断项。
- **skills/veltra-ui 未更新**：按 ticket 分工留待 09（skill:gen 统一收尾，07 还会扩展设计器）。
