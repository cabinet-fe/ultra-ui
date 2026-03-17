# 修复 creatable 模式下勾选/回车无法新增 tag

## 补丁内容

Vue 按 watcher 创建顺序执行 effect：`watch([model, optionsMap])` (W1) 先于 `watch(checkedSet)` (W2) 创建，因此在同一 flush 周期内 W1 总先执行。

当用户勾选临时选项或回车创建新选项时，`handleCheck` / `handleCreateByEnter` 在同一同步块中同时修改 `createdOptions`（触发 `optionsMap` 变化 → W1）和 `checkedSet`（→ W2）。W1 先执行时 `modelIsChangedBySet` 尚为 `false`，于是 `checkedSet.clear()` 后从旧 `model`（尚未被 W2 更新）重建 checkedSet，导致刚添加的 created 选项丢失。随后 W2 被 `setIsChangedByModel` 跳过，最终 tag 未新增、输入框被清空。

**修复**：交换两个 `watch` 的声明顺序，使 `watch(checkedSet)` 先于 `watch([model, optionsMap])` 创建。这样在同一 flush 周期内 W2 先执行，`model` 已包含新值，W1 被 `modelIsChangedBySet` 正确跳过。

## 影响范围

- 修改文件: `ui/components/multi-select/multi-select.vue`
