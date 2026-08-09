Status: ready-for-agent

# 05 — 智能画布交互 Overlay (SVG 拓扑关联弧线与悬浮 Action Pill)

**What to build:** 
升级 `playground/src/sheet-report/designer/` 视图交互体验。在 Sheet 设计画布上方叠加响应式 SVG 拓扑关联弧线，直观呈现当前选中单元格与其关联分组的依赖链；同时在选中的绑定单元格上方悬浮显示快捷 Action Pill，支持就地快速修改单元格角色、设置聚合函数或调出条件格式规则弹窗。

**Blocked by:** 02 — 报表绑定 Schema 扩展与条件样式评估引擎.

- [ ] 实现 SVG 画布 Overlay，根据选中的单元格绑定信息实时计算坐标并绘制依赖弧线
- [ ] 实现悬浮 Action Pill 快捷胶囊组件，随着选区位置滑动定位
- [ ] Action Pill 包含就地快速操作（切换 Role 角色、修改 Aggregate 聚合方式、添加条件格式）
- [ ] 配合右侧 Inspector 检查器卡片，同步响应单元格绑定的微调与更新
