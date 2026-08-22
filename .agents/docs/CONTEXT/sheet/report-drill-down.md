# 报表下钻

## 术语

- **ReportDrillConfig**：绑定格下钻配置，挂在 `ReportBinding.drill?`（Cell Meta namespace `report`，随绑定序列化）；`target` = 目标模板引用（宿主模板列表项的 ref，不支持手填），`mapping` = 源记录字段名 → 详情报 Filter Bar 参数 id，`openMode` = `'switch'`（查看器内切换）| `'dialog'`（UDialog 弹框）
- **ReportTemplateListItem**：宿主提供的可下钻模板列表项（`ref` + `label`），设计器下拉与查看器 resolveTemplate 契约共用
- **DrillStack**：下钻栈，自根层（初始报表）到栈顶的层序列，每层 = 一张 `ReportTemplate` + 当时的 Filter Bar 参数值，至少一层

## 领域

`packages/sheet/src/report/` 内核（纯 TS headless）的下钻配置模型与多层下钻栈逻辑，经 `index.ts` 导出。查看器交互与设计器配置尚未消费本内核。

- 兼容性：模板 `version` 保持 `1`；旧绑定无 `drill` 键，序列化往返后仍不出现，旧查看器忽略该字段。
- `resolveDrillParams(config, record)`：按 `mapping` 从绑定格对应记录取值，生成详情报 Filter Bar 参数值。记录字段值为 `undefined` 时跳过该参数（详情报回退默认值），`null` 保留；空映射返回空参数。
- 下钻栈只做不可变更新（返回新栈，便于组件层挂响应式）：`createDrillStack(root)` 以初始报表建根层；`pushDrillLayer(stack, next, currentParams?)` 压入详情报层，并把前层参数定格为离开时的值（缺省保留原值）；`popDrillLayer(stack)` 弹回上一层，仅剩根层时原样返回；`currentDrillLayer(stack)` 取栈顶。指向自身或成环不做检测，照常压栈，靠 pop 逐级退出。

## 影响文件

- 新增：`packages/sheet/src/report/drill.ts`
- 新增：`packages/sheet/src/report/__test__/drill.test.ts`
- 修改：`packages/sheet/src/report/types.ts`
- 修改：`packages/sheet/src/report/index.ts`

## 更新记录

- 2026-08-22：新建条目（report-drill-down P1：下钻配置模型与下钻栈纯逻辑内核）；涉及：`packages/sheet/src/report/types.ts`、`packages/sheet/src/report/drill.ts`、`packages/sheet/src/report/index.ts`、`packages/sheet/src/report/__test__/drill.test.ts`
