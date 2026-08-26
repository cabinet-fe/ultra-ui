# 选择器组件 USelect

## 术语

- **USelect**：桌面端单选选择器组件（`<u-select>`），组合 UDropdown 与 UInput 实现。
- **临时选项**：`creatable` 模式下输入新值产生、带 `__isTemp` 标记的待创建选项；选中后延迟到面板关闭动画结束才转正为正式选项。

## 领域

`USelect`（`packages/desktop/src/components/select`）是桌面端单选选择器，组合 `UDropdown` 与 `UInput`。支持 `v-model`、`options` 数组或异步函数（传函数时强制启用 `filterable`）、`valueKey` / `labelKey` 字段映射、`clearable`、`creatable` 允许输入创建新选项、`grid` 网格布局（与虚拟滚动互斥）、超过 80 项自动启用虚拟滚动，并接入表单上下文回退（`size` / `disabled` / `readonly`；readonly 时回退为纯文本展示）。

筛选与选择的关键约定：筛选态下点击选项后立即退出查询态（输入框恢复显示选中标签），但查询串清空与临时选项转正都延迟到面板关闭动画结束（`dropdownVisible` 变 false、面板 DOM 卸载）才执行——关闭动画期间列表保持过滤态，避免面板瞬间恢复全量变长闪烁；若动画期间面板被重新打开，先补一次转正再进入查询态。展示文案由选项推导，通过 `update:text` 单向通知父级。

## 影响文件

- 修改：`packages/desktop/src/components/select/select.vue`
- 修改：`packages/desktop/src/components/select/__test__/select.test.ts`

## 更新记录

- 2026-08-26：修复筛选后选择时面板关闭动画期间列表瞬间恢复全量导致闪烁（查询串清空与临时选项转正延迟到面板关闭后）；涉及：packages/desktop/src/components/select
