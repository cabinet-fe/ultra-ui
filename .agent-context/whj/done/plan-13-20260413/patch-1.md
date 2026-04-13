# focusout 合并 change 触发

## 补丁内容

将 `autoPair` 补全单侧与区间顺序归一化拆成两个返回 `boolean` 的步骤，由 `handleRangeFocusOut` 在焦点离开整块控件后顺序执行，仅在任一步骤实际修改了 `model` 时调用一次 `emit('change', …)`，避免同一失焦链路内连续两次 `change`。

## 影响范围

- 修改文件: `ui/components/number-range-input/number-range-input.vue`
