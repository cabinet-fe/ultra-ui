# 步进后区间顺序归一化

## 补丁内容

步进器（及键盘上下键）通过 `increase` / `decrease` 只更新 `model`，不触发底层 `<input>` 的 `change`，因此 `number-range-input` 原先仅在整块控件 `focusout` 时做 `normalizeFromSplit`，会出现「两侧均有值且起始大于结束」在步进过程中一直保留的问题。

- 在 `number-input.vue` 的 `increase` / `decrease` 末尾增加 `emit('change', model.value)`，使步进与失焦提交一样对外有 `change` 语义。
- 在 `number-range-input.vue` 将两侧 `@change` 从直接 `emitChange` 改为 `handleSideChange`：先执行与失焦相同的 `applyNormalizeRangeOrderOnBlur`，再 `emitChange`，从而在步进后立即把结束值抬到起始（与既有规则一致）。

## 影响范围

- 修改文件: `ui/components/number-input/number-input.vue`
- 修改文件: `ui/components/number-range-input/number-range-input.vue`
