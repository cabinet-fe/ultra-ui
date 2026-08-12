# 05 — 设计器适配：预设切换、点选式父格编辑、落格推断重写

**What to build:** `UReportDesigner` 与 `useReportDesigner` 按新模型改造：Action Pill 编辑展开方向 / 父格 / `mergeSpan`、父格改为点选式编辑、拖拽落格推断规则替换坐标硬编码、拓扑连线改读真实存储的父格、徽章文案改预设。

**Blocked by:** 04 — 展开与填充：新 renderReport 上线、旧引擎删除

**Status:** ready-for-agent

- [ ] **落格推断规则**（替换 `isGroupAnchorCell` 的 `row === 1 && col === 0` 硬编码）：
  - 同列向上找最近的纵向扩展绑定 → `rowParent` 候选
  - 同行向左找最近的横向扩展绑定 → `colParent` 候选
  - 预设默认「明细」（`list` + `down`）
  - 字段为数值类型且落点位于已有展开带的下方相邻行 → 预设「小计」
  - 推断结果立即以拓扑连线可视化，用户看到连错当场改
- [ ] **删除 `resolveParentGroupDataset` 的数据集覆盖**：跨数据集拖拽保留字段自己的 `dataset`（现状 `binding.dataset = parentDataset` 会产生「dataset 为 Y、field 属于 X」的无效绑定，静默出空值）
- [ ] **Action Pill 父格编辑**：点「设置行方向父格 / 列方向父格」进入拾取态 → 用户在网格上点目标格 → 写入绑定 → 拓扑连线实时更新确认；下拉候选（同数据集的扩展绑定格）为辅助入口；**不做** A1 地址输入框
- [ ] Action Pill 新增控件：展开方向（`down` / `right` / `none`）、`mergeSpan` 开关、清除父格
- [ ] Action Pill 预设切换按 02 的预设映射表写入组合值；绑定不匹配任何预设时显示「自定义」
- [ ] 拓扑连线（`topology.ts` / `topology-overlay.vue`）改读 `rowParent` / `colParent`，不再沿推导链猜测；行方向与列方向连线视觉可区分
- [ ] 绑定徽章（`binding-badge.ts`）文案与配色改按 `preset`（含 `cross`）；`REPORT_ROLE_BADGE_COLORS` 更名并补预设色；继续遵守 cell hook 性能契约（纯函数、同步、O(1) 查找）
- [ ] 字段面板与 `formatBindingPlaceholder` 的聚合文案跟随 `list` 更名
- [ ] `getTemplate()` 写入 `version: 1`；`template` prop 载入时校验版本并对不兼容模板给可读错误提示（不静默降级）
- [ ] 组件级测试（缝隙 3）：落格推断产出正确的父格与预设、跨数据集不覆盖数据集、点选式父格编辑写入模板、预设切换写入正确组合值、拓扑连线读真实父格、版本校验分叉

## Comments
