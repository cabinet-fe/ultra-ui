# 07 — UReportDesigner 全量

**What to build:** 设计器完备：`UReportDesigner` 组件整合最小闭环（06）并迁入 Action Pill、拓扑连线、条件规则对话框；预览模式内嵌查看器路径（05）展示真实取数展开的填充报表；`template` prop 载入既有模板继续设计；XLSX 导出（条件样式打平进快照，ADR-0001 决策 2 / 架构约束 3）。

**Blocked by:** 05 — UReportViewer 运行态闭环；06 — 设计器最小闭环

**Status:** completed

- [x] 设计态全部交互（角色切换/聚合配置/条件规则/清除绑定/拓扑高亮）在组件内可用
- [x] 预览切换经内嵌查看器路径展示填充报表，可切回设计态且绑定不丢
- [x] 传入既有模板可完整恢复绑定与设计态
- [x] 导出 XLSX 样式保真（条件样式打平）
- [x] topology/conditional-rules/binding-float-panel 等随迁测试全绿

## Comments

- **设计态覆层/对话框落 `components/report/designer/`**（内部不导出）：`float-panel.vue`（Action Pill）、`topology-overlay.vue` + `topology.ts`、`rules-dialog.vue` + `rule-row.vue` + `rule-preview.vue` + `conditional-rules/helpers.ts`、`cell-coords.ts` / `use-grid-overlay.ts` / `col-widths.ts` 覆层基础设施、`role.ts`（`roleBindingDefaults`）。行为自 playground 逐字平移；样式由 scoped style 转为 `style.scss` BEM 块（`report-float-panel` / `report-topology` / `report-rules-dialog` / `report-rule-row` / `report-rule-preview`），desktop 样式入口补 dialog/radio-group/palette。
- **`template` prop 载入（实施钉死）**：快照 `restore` + `restoreContent` 恢复绑定；内嵌数据集还原为设计态 `DesignerDataset`（`connectionId` 引用）；内嵌连接按 id 合并进 `v-model:connections`——仅缺省追加、宿主同 id 连接优先（单一事实源不反转）；describe 自动恢复字段缓存（业务错误忽略，字段留空可在数据中枢重试）。模板 prop 更换时组件层强制切回设计态。
- **预览 = 内嵌查看器路径**：切预览时 `getTemplate()` 吐出快照交给内嵌 `UReportViewer`（自持 `previewWorkbook`——05 票 `workbook?` 先例的既定用途：导出拿填充后 sheet）。设计态工作簿与预览完全隔离，切回绑定不丢；设计网格 v-if 重建，列宽在切预览时经 VTable 运行时捕获（`designer/col-widths.ts`，sheet-core 列宽未进快照），切回重放。
- **XLSX 导出入内核 `src/report/export-xlsx.ts`**：`exportFilledReportXlsx(sheet, colWidths)` 纯函数返回字节（saveBlob 下载在组件层，内核保持无 DOM）；条件样式已在 `renderReport` 展开阶段打平进 StylePool（ADR-0001 决策 2），导出直接保真。与 sheet-core `exportWorkbookXlsx` 的差异为 columns 定义（列宽未进快照）。保真度经 hucre `readXlsx` + `buildWorkbookFromHucre` 回读断言（值 / 表头样式 / 条件红字）。
- **新增 peer `@veltra/compositions`**（规则对话框 `useDnD` 拖拽排序）：desktop 既有 peer，宿主无新增安装负担；根与包 AGENTS.md 依赖图已同步。
- **drop-highlight-overlay 未随迁**：ticket 迁入清单（Action Pill / 拓扑连线 / 条件规则对话框）与验收标准均未含拖拽落点高亮，保持范围收敛；如 08 演示页需要可后续补迁（`use-grid-overlay` 基础设施已就位）。
- **skills/veltra-ui 未更新**：按 ticket 分工留待 09（skill:gen 统一收尾）。
- **code-review 已运行**（Standards + Spec 双轴）：修复 `neverBundle` 漏列 `@veltra/compositions`（与「neverBundle = 全部 peer + hucre」文档规则对齐）与 `TABLE_ADDR_OFFSET` 双份常量（col-widths 改引 cell-coords 单一事实源）。其余为记录在案的判断项：`export-xlsx.ts` 与 sheet-core `io/export` 的格分发逻辑重复系 playground 平移的既有重复（sheet-core 侧未导出 `cellToHucreCell`，收敛需动 sheet-core 公共面，留待消费驱动）；导出按钮在查看器取数完成前可点（playground 同款缺口：此时导出的是铺底模板结构而非空文件，收敛需查看器暴露填充态，超本票范围）；列宽捕获上限为设计网格列数（矩阵展开超出列用默认宽，playground 预置列集合同款限制）；`template` prop 置空不清空设计态（反向语义未定义，保守保留现状）。
