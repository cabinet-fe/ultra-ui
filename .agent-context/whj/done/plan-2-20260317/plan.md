# multi-select 组件新增 creatable 属性

> 状态: 已执行

## 目标

为 `multi-select` 组件添加 `creatable` 属性，启用后：
1. 自动启用过滤输入框
2. 过滤无精确匹配时显示临时选项，回车可创建并选中
3. 创建的选项在列表中持续存在（label/value 均为输入内容）
4. 通过 tag 关闭删除时，同时从选项列表中移除该创建项

## 内容

### 1. 类型定义 — `ui/types/components/multi-select.ts`
- `MultiSelectProps` 新增 `creatable?: boolean`

### 2. 组件逻辑 — `ui/components/multi-select/multi-select.vue`

#### 2.1 引入与状态
- 从 `useOptions` 返回值重命名为 `rawOptions` / `rawAllOptions`，避免名称冲突
- 新增 `createdOptions: shallowRef<Record<string, any>[]>([])` 存储用户创建的选项

#### 2.2 派生计算
- `options` computed：将 `createdOptions` 与 `rawOptions` 合并，去重（temp 和 created 不重复）
- `allOptions` computed：将 `createdOptions` 与 `rawAllOptions` 合并（供 optionsMap 使用）
- `filterable` computed：追加 `props.creatable` 为启用条件

#### 2.3 交互处理
- `handleCheck`：检测 `option.__isTemp`，创建永久副本加入 `createdOptions` 和 `checkedSet`，清空 queryString
- `handleCreateByEnter`：回车时若无精确匹配则创建并选中，已存在则直接选中
- `handleClose`：关闭 tag 时若为创建项则从 `createdOptions` 中移除
- `handleClear`：清空时同时清空 `createdOptions`
- `handleCheckAll(false)`：取消全选时同时清空 `createdOptions`

#### 2.4 模板
- 过滤输入框新增 `@keydown.enter.prevent="handleCreateByEnter"`

## 影响范围

- `ui/types/components/multi-select.ts` — `MultiSelectProps` 新增 `creatable` 属性
- `ui/components/multi-select/multi-select.vue` — 组件核心逻辑：created 选项管理、Enter 创建、tag 关闭移除

## 历史补丁

- patch-1: 修复 creatable 模式下勾选/回车无法新增 tag
- patch-2: 修复 creatable 模式下 checkedSet 与 model 双向 watcher 竞态
