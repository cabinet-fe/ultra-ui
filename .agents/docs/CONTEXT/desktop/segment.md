# 分段单选组件 USegment

## 术语

- **USegment**：桌面端独立分段单选组件（`<u-segment>`），用于单选分段切换场景。
- **SegmentItem**：分段选项对象类型，支持 label / value / disabled 等字段。

## 领域

`USegment`（`packages/desktop/src/components/segment`）是桌面端独立的轻量分段单选组件，采用标准表单组件规范设计。支持 `v-model` 双向绑定、`items` 选项列表配置、`labelKey` 与 `valueKey` 自定义字段映射、`size`（small / medium / large）、`block` 撑满容器、`disabled` 全局禁用与 `disabledItem` 单项禁用回调控制，以及 `readonly` 只读回退展示。选项点击时同步更新模型值并派发携带目标 item 的 `change` 事件。已从 `URadioGroup` 中剥离并清理 `variant="button"` 变体逻辑与样式。

## 影响文件

- 新增：`packages/desktop/src/components/segment/__test__/segment.test.ts`
- 新增：`packages/desktop/src/components/segment/index.ts`
- 新增：`packages/desktop/src/components/segment/segment.vue`
- 新增：`packages/desktop/src/components/segment/style.scss`
- 新增：`packages/desktop/src/components/segment/style.ts`
- 新增：`packages/desktop/src/types/segment.ts`
- 修改：`packages/desktop/src/components/index.ts`
- 修改：`packages/desktop/src/components/radio-group/__test__/radio-group.test.ts`
- 修改：`packages/desktop/src/components/radio-group/radio-group.vue`
- 修改：`packages/desktop/src/components/radio-group/style.scss`
- 修改：`packages/desktop/src/style.ts`
- 修改：`packages/desktop/src/types/index.ts`
- 修改：`packages/desktop/src/types/radio-group.ts`
- 修改：`packages/vite/src/components.gen.ts`
- 修改：`playground/App.vue`
- 修改：`playground/components.d.ts`

## 更新记录

- 2026-08-26：归档自 cooking/segment
