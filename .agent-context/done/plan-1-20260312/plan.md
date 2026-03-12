# 修复 Select 组件清空后新增选项残留

> 状态: 已执行

## 目标

修复 Select 组件在 `creatable` 模式下，用户新增选项并选中后，点击清空按钮，之前新增的下拉选项仍然残留在列表中的问题。期望行为：清空后，用户创建的临时选项也应一并移除。

## 根因分析

- `use-options.ts` 中维护了 `createdOptions`（用户创建并选中的选项）和 `tempOptions`（输入中的临时选项）。
- 用户选中临时选项后，`temOptionsToCreatedOptions()` 将其从 `tempOptions` 转入 `createdOptions`。
- `select.vue` 中 `handleClear` 只清空了 `selected`，未清空 `createdOptions`。
- `options` 计算属性在无 `tempOptions` 时会将 `createdOptions` 作为前置选项展示，导致清空后创建的选项仍然可见。

## 内容

### 步骤 1：在 `use-options.ts` 中暴露清空创建选项的方法

- 新增 `clearCreatedOptions` 函数，将 `createdOptions.value` 置为空数组。
- 在 `UseOptionsReturned` 接口中添加该方法的类型声明。
- 在 `return` 中导出该方法。

### 步骤 2：在 `select.vue` 的 `handleClear` 中调用清空方法

- 从 `useOptions` 解构出 `clearCreatedOptions`。
- 在 `handleClear` 函数中调用 `clearCreatedOptions()`。

### 步骤 3：验证

- 启动 sample 应用，在 Select 的 `creatable` 场景下执行：新增选项 → 选中 → 清空 → 打开下拉，确认新增选项已不存在。

## 影响范围

- 修改文件: `ui/components/select/use-options.ts`（新增 `clearCreatedOptions` 函数、接口声明、导出）
- 修改文件: `ui/components/select/select.vue`（解构 `clearCreatedOptions`，在 `handleClear` 中调用）

## 历史补丁

