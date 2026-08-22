# 报表下钻

## 术语

- **ReportDrillConfig**：绑定格下钻配置，挂在 `ReportBinding.drill?`（Cell Meta namespace `report`，随绑定序列化）；`target` = 目标模板引用（宿主模板列表项的 ref，不支持手填），`mapping` = 源记录字段名 → 详情报 Filter Bar 参数 id，`openMode` = `'switch'`（查看器内切换）| `'dialog'`（UDialog 弹框）
- **ReportTemplateListItem**：宿主提供的可下钻模板列表项（`ref` + `label`），设计器下拉与查看器 resolveTemplate 契约共用
- **ResolveReportTemplate**：宿主模板解析契约（`(ref) => ReportTemplate | Promise<ReportTemplate>`，失败抛错），设计器配置对话框据此解析目标模板查询参数；查看器侧接线待做
- **DrillStack**：下钻栈，自根层（初始报表）到栈顶的层序列，每层 = 一张 `ReportTemplate` + 当时的 Filter Bar 参数值，至少一层

## 领域

`packages/sheet/src/report/` 内核（纯 TS headless）的下钻配置模型与多层下钻栈逻辑，经 `index.ts` 导出。设计器已消费本内核（下钻配置入口 + 对话框）；查看器交互尚未消费。

- 兼容性：模板 `version` 保持 `1`；旧绑定无 `drill` 键，序列化往返后仍不出现，旧查看器忽略该字段。
- `resolveDrillParams(config, record)`：按 `mapping` 从绑定格对应记录取值，生成详情报 Filter Bar 参数值。记录字段值为 `undefined` 时跳过该参数（详情报回退默认值），`null` 保留；空映射返回空参数。
- 下钻栈只做不可变更新（返回新栈，便于组件层挂响应式）：`createDrillStack(root)` 以初始报表建根层；`pushDrillLayer(stack, next, currentParams?)` 压入详情报层，并把前层参数定格为离开时的值（缺省保留原值）；`popDrillLayer(stack)` 弹回上一层，仅剩根层时原样返回；`currentDrillLayer(stack)` 取栈顶。指向自身或成环不做检测，照常压栈，靠 pop 逐级退出。
- 设计器接线：`ReportDesignerProps` 新增 `drillTemplates?` / `resolveTemplate?`——宿主传入 `drillTemplates` 后绑定格 Action Pill 默认条出现「下钻」入口（已有配置时高亮），不传则无入口；`designer/drill-dialog.vue`（`UReportDrillDialog`，内部不导出）编辑 target（仅列表选择）/ `openMode` / 字段→参数映射，目标模板参数经 `resolveTemplate` 解析（并发守卫只应用最后一次，缺失契约时给出可读提示）；保存 / 移除走 `patchActiveBinding({ drill })`，`drill: undefined` 时删除该键。

## 影响文件

- 新增：`packages/sheet/src/report/drill.ts`
- 新增：`packages/sheet/src/report/__test__/drill.test.ts`
- 新增：`packages/sheet/src/components/report/designer/drill-dialog.vue`
- 修改：`packages/sheet/src/report/types.ts`
- 修改：`packages/sheet/src/report/index.ts`
- 修改：`packages/sheet/src/types/report-designer.ts`
- 修改：`packages/sheet/src/components/report/use-report-designer.ts`
- 修改：`packages/sheet/src/components/report/designer/float-panel.vue`
- 修改：`packages/sheet/src/components/report/report-designer.vue`
- 修改：`packages/sheet/src/components/report/style-designer.scss`
- 修改：`packages/sheet/src/components/report/__test__/use-report-designer.test.ts`
- 修改：`packages/sheet/src/components/report/__test__/report-designer.test.ts`

## 更新记录

- 2026-08-22：新建条目（report-drill-down P1：下钻配置模型与下钻栈纯逻辑内核）；涉及：`packages/sheet/src/report/types.ts`、`packages/sheet/src/report/drill.ts`、`packages/sheet/src/report/index.ts`、`packages/sheet/src/report/__test__/drill.test.ts`
- 2026-08-22：设计器消费下钻内核（report-drill-down P4：`ResolveReportTemplate` 契约、设计器 props、Action Pill 入口与下钻配置对话框）；涉及：`packages/sheet/src/report/drill.ts`、`packages/sheet/src/types/report-designer.ts`、`packages/sheet/src/components/report/designer/drill-dialog.vue`、`packages/sheet/src/components/report/use-report-designer.ts`、`packages/sheet/src/components/report/designer/float-panel.vue`、`packages/sheet/src/components/report/report-designer.vue`、`packages/sheet/src/components/report/style-designer.scss`、`packages/sheet/src/components/report/__test__/use-report-designer.test.ts`、`packages/sheet/src/components/report/__test__/report-designer.test.ts`
