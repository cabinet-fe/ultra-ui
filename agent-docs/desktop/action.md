---
title: UAction / UActionGroup 操作按钮
description: 从 @veltra/desktop 导出的操作按钮组件：UAction 继承按钮外观、事件为 run、支持 needConfirm 二次确认；UActionGroup 统一子项默认样式并按 max 把溢出项收纳进「更多」下拉，适合表格操作列等密集场景。
aliases:
  - Action
  - ActionGroup
  - 操作列
  - 行内操作
  - 操作链接
keywords:
  - needConfirm
  - inDropdown
  - closeTip
  - run
  - max
  - circle
  - ActionGroupProps
  - ActionExposed
  - UPopConfirm
  - messageConfirm
  - 双重确认
  - 操作列
  - 行内操作
  - 二次确认
  - 下拉收纳
  - 表格操作
---

# UAction / UActionGroup 操作按钮

`@veltra/desktop` 导出 `UAction`（单个操作项，继承 `UButton` 外观，点击事件为 `run`，支持 `needConfirm` 二次确认）与 `UActionGroup`（操作组：统一子项默认样式、项间加分隔线、按 `max` 把溢出项与 `inDropdown` 项收纳进「更多」下拉菜单），主要用于表格操作列等按钮密集场景。

## 快速上手

```vue
<script setup lang="ts">
import { UAction, UActionGroup } from '@veltra/desktop'

function onView() {}
function onEdit() {}
function onDelete() {}
</script>

<template>
  <u-action-group :max="3">
    <u-action @run="onView">查看</u-action>
    <u-action @run="onEdit">编辑</u-action>
    <u-action need-confirm type="danger" @run="onDelete">删除</u-action>
  </u-action-group>
</template>
```

## API 签名

```ts
import type { Component } from 'vue'

export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'
export type ComponentSize = 'small' | 'default' | 'large'

/** 操作组件属性（继承自 ButtonProps 的字段已展开） */
export interface ActionProps {
  /** 按钮类型（组内可被 UActionGroup 的 type 兜底） */
  type?: ColorType
  /** 是否以文本样式展示（组内可被组兜底；组内默认 true） */
  text?: boolean
  /** 朴素模式 */
  plain?: boolean
  /** 加载中（组内可被组的 loading 兜底） */
  loading?: boolean
  /** 加载图标 */
  loadingIcon?: Component
  /** 是否圆形按钮（组内可被组兜底；下拉中的项强制 false） */
  circle?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 图标 */
  icon?: Component
  /** 图标大小，单位 px */
  iconSize?: number
  /** 图标位置：'left' | 'right' */
  iconPosition?: 'left' | 'right'
  /** 点击是否冒泡；UAction 强制 false，传入无效 */
  propagate?: boolean
  /** 组件尺寸（组内可被组兜底；组内默认 'small'） */
  size?: ComponentSize
  /** 是否需要确认：true 时点击先弹确认气泡，确认后才触发 run。默认 false */
  needConfirm?: boolean
  /** 是否始终位于下拉菜单中，无视组的 max 限制。默认 false */
  inDropdown?: boolean
}

/** 操作组组件属性 */
export interface ActionGroupProps {
  /** 子项默认加载中。默认 false */
  loading?: boolean
  /** 子项默认圆形按钮，适用于图标类。默认 false */
  circle?: boolean
  /** 最大内联显示数量，溢出项自动收纳到下拉菜单。默认 3 */
  max?: number
  /** 子项默认尺寸。默认 'small' */
  size?: 'small' | 'default' | 'large'
  /** 子项默认文本样式。默认 true */
  text?: boolean
  /** 子项默认按钮类型。默认 'primary' */
  type?: ColorType
}

/** 操作组件事件 */
export interface ActionEmits {
  /** 点击（或确认后）触发 */
  (e: 'run'): void
}

/** 操作组暴露（经 DeconstructValue 解包后，ref 上直接访问 closeTip） */
export interface _ActionGroupExposed {
  closeTip: () => void
}
export type ActionGroupExposed = DeconstructValue<_ActionGroupExposed>
```

## 参数说明

### UAction

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `needConfirm` | `boolean` | `false` | 否 | `true` 时点击只弹确认气泡（标题固定「确认执行此操作吗？」，方向 `left`），点「确认」才触发 `run`；不要再在 `run` 里叠加 `messageConfirm`（会确认两次） |
| `inDropdown` | `boolean` | `false` | 否 | `true` 时无视 `max` 始终进下拉；下拉内强制 `circle: false`，`run` 后自动关闭下拉 |
| `type` | `ColorType` | `'primary'`（组内） | 否 | 未在 `UActionGroup` 内时默认 `'primary'`；在组内且未传时继承组的 `type` |
| `text` | `boolean` | `true`（组内） | 否 | 同上，继承组的 `text` |
| `size` | `ComponentSize` | `'small'`（组内） | 否 | 同上，继承组的 `size` |
| `loading` | `boolean` | 继承组 | 否 | 单项可覆盖组级 `loading` |
| `circle` | `boolean` | 继承组 | 否 | 单项可覆盖；`inDropdown` 为 `true` 时强制 `false` |
| `disabled` / `plain` / `icon` / `iconSize` / `iconPosition` / `loadingIcon` | 同 UButton | — | 否 | 直接透传给内部 `UButton` |
| `propagate` | `boolean` | — | 否 | 内部强制 `false`：点击不冒泡到表格行等外层，传入无效 |

### UActionGroup

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `max` | `number` | `3` | 否 | 子项超过 `max` 时，内联保留前 `max - 1` 个，第 `max` 个位置渲染「更多」圆形下拉按钮 |
| `loading` | `boolean` | `false` | 否 | 作为所有子项的默认 `loading` |
| `circle` | `boolean` | `false` | 否 | 作为所有子项的默认 `circle` |
| `size` | `'small' \| 'default' \| 'large'` | `'small'` | 否 | 作为所有子项的默认 `size` |
| `text` | `boolean` | `true` | 否 | 作为所有子项的默认 `text`；实心按钮需写 `:text="false"` |
| `type` | `ColorType` | `'primary'` | 否 | 作为所有子项默认 `type`，同时决定「更多」按钮颜色 |

插槽：`UAction` 默认插槽放按钮文字；`UActionGroup` 默认插槽只接受 `UAction` 子项，其他内容不渲染。

## 方法与事件

- `run`（`UAction`）：未配 `needConfirm` 时点击立即触发；配 `needConfirm` 时在确认气泡点「确认」后触发。无 payload。
- `closeTip(): void`（`UActionGroup` 暴露方法，同步，无参数无返回）：关闭组的下拉菜单；组未渲染下拉时调用无效果。`ActionGroupExposed` 经 `DeconstructValue` 解包，通过模板 ref 直接访问 `ref.closeTip()`。`inDropdown` 的子项执行 `run` 后组件内部会自动调用它。

## 典型示例

### 表格操作列：max 收纳 + 删除确认

```vue
<script setup lang="ts">
import { UAction, UActionGroup, UTable, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { name: '名称', key: 'name' },
  { name: '操作', key: 'action', width: 220, align: 'center' }
])

const data = [
  { id: 1, name: '记录一' },
  { id: 2, name: '记录二' }
]

function onEdit(row: Record<string, any>) {}
function onDetail(row: Record<string, any>) {}
function onCopy(row: Record<string, any>) {}
function onDelete(row: Record<string, any>) {}
</script>

<template>
  <u-table :columns="columns" :data="data" row-key="id">
    <template #column:action="{ row }">
      <u-action-group :max="3">
        <!-- 4 个子项超出 max=3：前 2 个内联，第 3 位是「更多」下拉（含复制、删除） -->
        <u-action @run="onEdit(row)">编辑</u-action>
        <u-action @run="onDetail(row)">详情</u-action>
        <u-action @run="onCopy(row)">复制</u-action>
        <u-action need-confirm type="danger" @run="onDelete(row)">删除</u-action>
      </u-action-group>
    </template>
  </u-table>
</template>
```

### 组默认样式与单项覆盖

```vue
<script setup lang="ts">
import { UAction, UActionGroup } from '@veltra/desktop'

function onCopy() {}
function onPaste() {}
function onRemove() {}
</script>

<template>
  <!-- 组级：info 色、default 尺寸、实心按钮；子项未传属性时全部继承 -->
  <u-action-group type="info" size="default" :text="false">
    <u-action @run="onCopy">复制</u-action>
    <u-action @run="onPaste">粘贴</u-action>
    <!-- 单项覆盖组默认 -->
    <u-action type="danger" @run="onRemove">移除</u-action>
  </u-action-group>
</template>
```

### in-dropdown 固定收纳与手动关下拉

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { UAction, UActionGroup } from '@veltra/desktop'
import type { ActionGroupExposed } from '@veltra/desktop'

const groupRef = useTemplateRef<ActionGroupExposed>('group')

function onReset() {
  // 执行完操作后手动关闭下拉（非 inDropdown 项也会自动关，这里演示显式调用）
  groupRef.value?.closeTip()
}
</script>

<template>
  <u-action-group ref="group" :max="3">
    <u-action @run="onReset">重置</u-action>
    <!-- in-dropdown：无视 max，始终在下拉菜单里 -->
    <u-action in-dropdown type="warning" @run="onReset">恢复默认</u-action>
    <u-action in-dropdown type="danger" need-confirm @run="onReset">清空配置</u-action>
  </u-action-group>
</template>
```

## 注意事项

> [!WARNING]
> - `UAction` 的点击事件是 `run`，不是 `click`；写 `@click` 收不到任何事件。
> - `UActionGroup` 只渲染 `UAction` 子项：在组内写普通按钮、文本等其他子节点会被丢弃。
> - 溢出收纳规则是「`max - 1` 个内联 + 1 个更多按钮」：`max: 3` 且有 4 项时，内联只有 2 个，第 3 个位置是「更多」下拉按钮，不是把 3 个都内联。
> - `inDropdown` 为 `true` 的子项无视 `max` 始终在下拉里，且强制非圆形（`circle: false`）以显示完整文字。
> - `needConfirm` 用的是确认气泡（`UPopConfirm`，标题固定「确认执行此操作吗？」），不是弹窗 `messageConfirm`。**两条确认链路不要叠加**：`needConfirm: true` 时 `run` 已经是「气泡确认之后」的回调，再在 `run` 里调 `messageConfirm` 就是连点两次确认。要弹窗级确认就去掉 `need-confirm`，只在 `run` 里用 `messageConfirm`；要气泡确认就只留 `needConfirm`，`run` 里直接干活。
> - 内部按钮强制 `propagate: false`：点击不会冒泡到表格行，行级点击事件不会因点击操作按钮而触发。
> - `UAction` 可脱离组单独使用（默认 `text` 为 `true`、`size` 为 `small`、`type` 为 `primary`）。

## 常见问题

### 点击按钮 `run` 不触发

原因：写了 `need-confirm` 后点击只会打开确认气泡，必须点气泡里的「确认」才触发 `run`。修复：去掉 `need-confirm`，或在确认流程中等待。

```vue
<template>
  <!-- 直接点击即触发 -->
  <u-action @run="onRun">发布</u-action>
</template>
```

### 组内的其他组件不渲染

原因：`UActionGroup` 只接受 `UAction` 子项。修复：把内容包进 `UAction`，或把其他组件移出组。

### 删除操作要连点两次确认

原因：`needConfirm` 和 `messageConfirm` 叠加了。`need-confirm` 的点击只会弹气泡、不触发 `run`；点气泡里的「确认」后 `run` 才执行，此时业务回调里再调 `messageConfirm` 就冒出第二个弹窗。修复：两者只留一个。

```vue
<script setup lang="ts">
import { messageConfirm } from '@veltra/desktop'

type Row = { id: number; name: string }

// 方案 A：气泡确认，run 里直接删（推荐表格操作列）
function onRemove(row: Row) {
  deleteRow(row.id)
}

// 方案 B：弹窗确认，去掉 need-confirm，只留 messageConfirm 这一次确认
async function onRemoveWithDialog(row: Row) {
  const action = await messageConfirm({
    title: '删除确认',
    message: `确认删除「${row.name}」吗？`,
    confirmButtonType: 'danger',
    cancelButtonText: '取消'
  }).onClosed
  if (action !== 'confirm') return
  deleteRow(row.id)
}

function deleteRow(id: number) {
  // 换成你的删除请求
  console.log('删除', id) // => 删掉 row.id
}
</script>

<template>
  <!-- 方案 A：run 触发时气泡已经确认过了 -->
  <u-action need-confirm type="danger" @run="onRemove(row)">删除</u-action>

  <!-- 方案 B：不要写 need-confirm，确认交给 messageConfirm -->
  <u-action type="danger" @run="onRemoveWithDialog(row)">删除</u-action>
</template>
```
