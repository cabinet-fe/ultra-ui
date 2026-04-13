# 区间数字输入（v-model / v-model:start / v-model:end）核验与示例

> 状态: 已执行

## 目标

对齐用户需求「区间数字输入 + `v-model` + `v-model:start` + `v-model:end`」：核验组件库现有 `UNumberRangeInput` 是否完整覆盖三种绑定；在示例中补充「元组与子模型同时绑定」的对照说明，便于使用者理解同步规则。

## 内容

1. 阅读 `ui/components/number-range-input/number-range-input.vue` 与 `ui/types/components/number-range-input.ts`，确认 `defineModel` 元组与 `start`/`end` 子模型、`splitBound` 初始化与 watch 同步逻辑无回归风险。
2. 在 `sample/src/number-range-input/index.vue` 增加一节：同时使用 `v-model`（元组）与 `v-model:start` / `v-model:end`，并附简短说明（与实现一致：元组为输入框实际数据源，子模型与之双向同步）。
3. 检索 `ui/components/index.ts`、`ui/install.ts`、`ui/types/index.ts` 中 `number-range-input` 的导出与样式注册，若缺失则补全（预期已齐备则仅确认）。

## 影响范围

- `sample/src/number-range-input/index.vue`
- `ui/types/components/number-range-input.ts`
- `ui/components/number-range-input/number-range-input.vue`

## 历史补丁

- patch-1: 区间输入 autoPair
