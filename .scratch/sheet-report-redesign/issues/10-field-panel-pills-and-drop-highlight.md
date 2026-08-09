Status: completed

# 10 — 字段面板胶囊化与拖拽落点高亮

**What to build:**
重构 `field-panel.vue`，解决字段块过大、拖拽看不清落点的问题：

- 字段项改为 ~24px 高**胶囊**（类型图标 + 中文名，全圆角），flex-wrap 流式排列，一行约 2 个
- 数据集分组可折叠 + 面板顶部搜索框过滤字段
- 拖拽 ghost 即小胶囊本身（元素小则 ghost 小）
- `dragover` 网格时用现有 `cell-coords` 换算**实时高亮目标单元格**（虚线框 overlay），drop 后绑定到该格
- 保留「点击字段绑定到当前选中格」备选路径

**Blocked by:** 07 — 数据连接与 SQL 数据集模型（字段面板数据源切换为 hub.listDatasets()）.

- [x] 胶囊字段项 + flex-wrap 布局
- [x] 数据集分组折叠 + 字段搜索
- [x] 网格 dragover 落点高亮 overlay
- [x] 已绑定标识保留（胶囊内 ✓）
