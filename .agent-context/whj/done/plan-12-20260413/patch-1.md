# 区间输入 autoPair

## 补丁内容

为 `UNumberRangeInput` 增加可选属性 `autoPair`（默认 `false`）。为 `true` 时，在焦点离开整个区间控件（非在起止框之间切换）后，若仅一侧有数值则将另一侧设为相同值，并通过 `normalizeFromSplit` 保持与现有起止顺序规则一致；避免元组一侧仍为 `undefined`。

在 `sample/src/number-range-input/index.vue` 增加示例段落。

## 影响范围

- 修改文件: `ui/types/components/number-range-input.ts`
- 修改文件: `ui/components/number-range-input/number-range-input.vue`
- 修改文件: `sample/src/number-range-input/index.vue`
