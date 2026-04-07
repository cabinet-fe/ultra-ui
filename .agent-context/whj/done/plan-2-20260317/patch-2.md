# 修复 creatable 模式下 checkedSet 与 model 双向 watcher 竞态

## 补丁内容

patch-1 通过交换 watcher 声明顺序修复，但 Vue 3.5 的新 effect 系统不保证按声明顺序执行 pre-flush watchers，导致问题仍可复现：W1（model/optionsMap → checkedSet）可能先于 W2（checkedSet → model）执行，从旧 model 重建 checkedSet，丢失刚添加的选项。

**根因**：两个 pre-flush watcher 之间的执行顺序不可靠，布尔守卫变量依赖顺序才能生效。

**修复**：移除 W2，事件处理器同步修改 checkedSet + model，用同步 guard 跳过 W1 冗余重建：

1. 移除 W2（`watch(checkedSet, ...)`）及旧守卫变量 `modelIsChangedBySet` / `setIsChangedByModel`
2. 新增 `internalChange` 守卫：事件处理器**同步设置**（guaranteed before pre-flush）
3. 所有事件处理器先**增量修改 checkedSet**（O(1) add/delete），再设 guard、更新 model
4. W1 检测 `internalChange` 为 true 时跳过重建并重置 flag；仅外部变更（父组件 v-model / options prop）触发全量重建
5. `emitChange` 简化为 `Array.from(checkedSet)`，因为 checkedSet 已在同步阶段被正确更新

**可靠性保证**：sync code → pre-flush watcher 的执行顺序由 Vue 架构保证（非 watcher 间排序），不受 effect 系统实现变化影响。

**性能保证**：每次勾选/取消为 O(1) 的 checkedSet.add/delete，仅外部变更走 O(n) 全量重建。

## 影响范围

- 修改文件: `ui/components/multi-select/multi-select.vue`
