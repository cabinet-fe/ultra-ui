# patch-1：拆分 v-model 与清空按钮占位

## 补丁内容

- 为 `UNumberRangeInput` 增加 `v-model:start`、`v-model:end`（`defineModel('start'|'end')`），与元组 `v-model` 双向同步；若同时传入 `modelValue` 与拆分绑定，以已有 `modelValue` 为准初始化，仅在未绑定元组时由 `start`/`end` 回填。
- 修复 `UInput` 在可清空且有值时，悬停才挂载清空图标导致横向宽度跳变：有值且可清空时固定预留 `clear-slot` 宽度，图标用透明度与 `pointer-events` 控制显隐。

## 影响范围

- 修改文件: `ui/types/components/number-range-input.ts`
- 修改文件: `ui/components/number-range-input/number-range-input.vue`
- 修改文件: `ui/components/input/input.vue`
- 修改文件: `ui/components/input/style.scss`
- 修改文件: `sample/src/number-range-input/index.vue`
