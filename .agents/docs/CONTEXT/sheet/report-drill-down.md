# 报表下钻

## 术语

- **ReportDrillConfig**：绑定格下钻配置，挂在 `ReportBinding.drill?`（Cell Meta namespace `report`，随绑定序列化）；`target` = 目标模板引用（宿主模板列表项的 ref，不支持手填），`mapping` = 源记录字段名 → 详情报 Filter Bar 参数 id，`openMode` = `'switch'`（查看器内切换）| `'dialog'`（UDialog 弹框）
- **ReportTemplateListItem**：宿主提供的可下钻模板列表项（`ref` + `label`），设计器下拉与查看器 resolveTemplate 契约共用
- **ResolveReportTemplate**：宿主模板解析契约（`(ref) => ReportTemplate | Promise<ReportTemplate>`，失败抛错），设计器配置对话框据此解析目标模板查询参数；查看器经 `ReportViewerProps.resolveTemplate?` 消费同一契约，单击下钻时按 `target` 取目标模板
- **DrillStack**：下钻栈，自根层（初始报表）到栈顶的层序列，每层 = 一张 `ReportTemplate` + 当时的 Filter Bar 参数值，至少一层
- **DrillHit**：物理格下钻命中（`config` + 该格 `record`），由 `buildDrillHitMap(template, data)` 在每次成功取数后重建；仅含配了下钻的绑定格落点（含分组/汇总格与展开实例格，合并跨度内每格命中），记录经 `render/aggregate.ts` 导出的 `resolvePlacementContext` 解析（list 明细取源数据行，分组/汇总取祖先分组过滤值合成的上下文）

## 领域

`packages/sheet/src/report/` 内核（纯 TS headless）的下钻配置模型与多层下钻栈逻辑，经 `index.ts` 导出。设计器（下钻配置入口 + 对话框）与查看器（`openMode: 'switch'` 栈式切换、`'dialog'` UDialog 嵌套独立查看器）均已消费本内核。

- 兼容性：模板 `version` 保持 `1`；旧绑定无 `drill` 键，序列化往返后仍不出现，旧查看器忽略该字段。
- `resolveDrillParams(config, record)`：按 `mapping` 从绑定格对应记录取值，生成详情报 Filter Bar 参数值。记录字段值为 `undefined` 时跳过该参数（详情报回退默认值），`null` 保留；空映射返回空参数。
- 下钻栈只做不可变更新（返回新栈，便于组件层挂响应式）：`createDrillStack(root)` 以初始报表建根层；`pushDrillLayer(stack, next, currentParams?)` 压入详情报层，并把前层参数定格为离开时的值（缺省保留原值）；`popDrillLayer(stack)` 弹回上一层，仅剩根层时原样返回；`currentDrillLayer(stack)` 取栈顶。指向自身或成环不做检测，照常压栈，靠 pop 逐级退出。
- 设计器接线：`ReportDesignerProps` 新增 `drillTemplates?` / `resolveTemplate?`——宿主传入 `drillTemplates` 后绑定格 Action Pill 默认条出现「下钻」入口（已有配置时高亮），不传则无入口；`designer/drill-dialog.vue`（`UReportDrillDialog`，内部不导出）编辑 target（仅列表选择）/ `openMode` / 字段→参数映射，目标模板参数经 `resolveTemplate` 解析（并发守卫只应用最后一次，缺失契约时给出可读提示）；保存 / 移除走 `patchActiveBinding({ drill })`，`drill: undefined` 时删除该键。
- 查看器接线：`ReportViewerProps` 新增 `resolveTemplate?`（缺省时下钻不生效：无点击行为与可点视觉提示）与 `initialValues?`（根模板载入时与参数默认值合并，显式键覆盖；弹框下钻据此传入映射参数）。`useReportViewer` 持下钻栈与命中索引（随每次成功取数重建），导出 `currentTemplate`（栈顶，未下钻为 `props.template`）/ `drillDepth` / `canDrillBack` / `resolveDrillHit(addr)` / `resolveDrillTarget(config, record)`（宿主契约取目标模板 + 默认值叠加映射参数；失败设 `DRILL_RESOLVE_FAILED` 可读错误、返回 null、栈不变）；`drillInto`（`openMode: 'switch'`）经 `resolveDrillTarget` 压栈切换并取数；`drillBack()` 弹栈恢复该层当时参数重新取数；宿主更换根模板时下钻栈作废、Filter Bar 按默认值叠加 `initialValues` 重新播种；导出 / 打印始终作用于当前可见层。组件壳 `report-viewer.vue` 经 SheetGrid hit-test 把事件坐标解析为物理格：单击命中 `openMode: 'switch'` 触发 `drillInto`，命中 `'dialog'` 则 `resolveDrillTarget` 后用 UDialog 嵌套独立 `UReportViewer`（传入目标模板、`initialValues` 映射参数与同一 `resolveTemplate`，框内自持下钻栈，可继续下钻与逐级回退）；关闭弹框（关闭按钮 / 遮罩 / Esc）丢弃框内栈与弹框状态，外层查看器不受影响。pointerdown→click 位移超 4px 视为拖选抑制；悬停命中加 `drill-hover` 修饰给网格 `cursor: pointer`（`!important` 覆盖 VTable 内联 cursor）；`canDrillBack` 时显示「返回上一层」drill-bar；弹框内查看器高度由 `style-viewer.scss` 的 `drill-dialog` 元素给出。组件级测试 `__test__/report-drill.test.ts`（stub connector + 三级下钻模板：switch 全流程、dialog 打开 / 框内下钻回退 / 三种关闭丢栈）。

## 影响文件

- 新增：`packages/sheet/src/report/drill.ts`
- 新增：`packages/sheet/src/report/__test__/drill.test.ts`
- 新增：`packages/sheet/src/components/report/designer/drill-dialog.vue`
- 新增：`packages/sheet/src/components/report/__test__/report-drill.test.ts`
- 修改：`packages/sheet/src/report/types.ts`
- 修改：`packages/sheet/src/report/index.ts`
- 修改：`packages/sheet/src/report/render/aggregate.ts`
- 修改：`packages/sheet/src/types/report-designer.ts`
- 修改：`packages/sheet/src/types/report-viewer.ts`
- 修改：`packages/sheet/src/components/report/use-report-designer.ts`
- 修改：`packages/sheet/src/components/report/use-report-viewer.ts`
- 修改：`packages/sheet/src/components/report/designer/float-panel.vue`
- 修改：`packages/sheet/src/components/report/report-designer.vue`
- 修改：`packages/sheet/src/components/report/report-viewer.vue`
- 修改：`packages/sheet/src/components/report/style-designer.scss`
- 修改：`packages/sheet/src/components/report/style-viewer.scss`
- 修改：`packages/sheet/src/components/report/__test__/use-report-designer.test.ts`
- 修改：`packages/sheet/src/components/report/__test__/report-designer.test.ts`

## 更新记录

- 2026-08-22：新建条目（report-drill-down P1：下钻配置模型与下钻栈纯逻辑内核）；涉及：`packages/sheet/src/report/types.ts`、`packages/sheet/src/report/drill.ts`、`packages/sheet/src/report/index.ts`、`packages/sheet/src/report/__test__/drill.test.ts`
- 2026-08-22：设计器消费下钻内核（report-drill-down P4：`ResolveReportTemplate` 契约、设计器 props、Action Pill 入口与下钻配置对话框）；涉及：`packages/sheet/src/report/drill.ts`、`packages/sheet/src/types/report-designer.ts`、`packages/sheet/src/components/report/designer/drill-dialog.vue`、`packages/sheet/src/components/report/use-report-designer.ts`、`packages/sheet/src/components/report/designer/float-panel.vue`、`packages/sheet/src/components/report/report-designer.vue`、`packages/sheet/src/components/report/style-designer.scss`、`packages/sheet/src/components/report/__test__/use-report-designer.test.ts`、`packages/sheet/src/components/report/__test__/report-designer.test.ts`
- 2026-08-22：查看器消费下钻内核（report-drill-down P2：`ReportViewerProps.resolveTemplate?`、`DrillHit` / `buildDrillHitMap` 命中索引、查看器栈式切换下钻与返回入口，`openMode: 'switch'`）；涉及：`packages/sheet/src/report/drill.ts`、`packages/sheet/src/report/render/aggregate.ts`、`packages/sheet/src/types/report-viewer.ts`、`packages/sheet/src/components/report/use-report-viewer.ts`、`packages/sheet/src/components/report/report-viewer.vue`、`packages/sheet/src/components/report/style-viewer.scss`、`packages/sheet/src/components/report/__test__/report-drill.test.ts`
- 2026-08-22：查看器接通 UDialog 弹框下钻（report-drill-down P3：抽出 `resolveDrillTarget`、`initialValues?` 播种、`openMode: 'dialog'` 嵌套独立查看器，关闭丢弃框内栈）；涉及：`packages/sheet/src/components/report/use-report-viewer.ts`、`packages/sheet/src/components/report/report-viewer.vue`、`packages/sheet/src/types/report-viewer.ts`、`packages/sheet/src/components/report/style-viewer.scss`、`packages/sheet/src/components/report/__test__/report-drill.test.ts`
