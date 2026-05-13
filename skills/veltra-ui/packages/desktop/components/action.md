# UAction / UActionGroup — 操作按钮

> `import type { ActionProps, ActionEmits, ActionExposed, ActionGroupProps, ActionGroupExposed } from '@veltra/desktop'`

`UAction` 继承 `UButton` 所有能力，额外提供 `needConfirm` 二次确认和 `run` 事件。`UActionGroup` 包裹多个操作，超出 `max` 的项自动收纳到 `…` 下拉菜单，支持统一控制子项默认样式（`type`/`size`/`text`/`circle`/`loading`）。

## Import

```ts
import { UAction, UActionGroup } from '@veltra/desktop'
```

## UAction Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `needConfirm` | `boolean` | — | 点击时弹出二次确认（`UPopConfirm`），确认后才触发 `run` |
| `inDropdown` | `boolean` | `false` | 是否始终收纳在下拉菜单中，无视 `max` 限制。下拉内强制非圆形 |
| `type` | `ColorType` | — | `'primary'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`；未设置时跟随 `UActionGroup` 的 `type` |
| `size` | `ComponentSize` | `'small'` | `'small'` \| `'default'` \| `'large'`；未设置时跟随 `UActionGroup` 的 `size` |
| `text` | `boolean` | `true` | 文本模式；未设置时跟随 `UActionGroup` 的 `text` |
| `circle` | `boolean` | — | 圆形按钮；未设置时跟随 `UActionGroup` 的 `circle` |
| `loading` | `boolean` | — | 加载中；未设置时跟随 `UActionGroup` 的 `loading` |
| `plain` | `boolean` | — | 朴素模式 |
| `loadingIcon` | `Component` | — | 自定义加载图标组件 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `icon` | `Component` | — | 图标组件 |
| `iconSize` | `number` | — | 图标大小（px） |
| `iconPosition` | `'left' \| 'right'` | `'left'` | 图标位置 |
| `propagate` | `boolean` | — | `false` 时阻止 click 事件冒泡 |

## Emits

| event | 签名 | 说明 |
|-------|------|------|
| `run` | `() => void` | 点击执行（无需确认时直接触发；需确认时确认后触发） |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 按钮内容 |

## Exposed

```ts
interface ActionExposed {}
```

无对外暴露成员。

---

# UActionGroup — 操作组

将多个 `UAction` 包裹为行内操作组，超出 `max` 数量的操作自动收纳到 `…` 下拉菜单。通过依赖注入（`provide`/`inject`）统一控制子项默认 `type`/`size`/`text`/`circle`/`loading`，子项可通过同名 prop 单独覆盖。

## Import

```ts
import { UActionGroup } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `max` | `number` | `3` | 最大可见操作数，超出部分折叠到下拉菜单 |
| `type` | `ColorType` | `'primary'` | 子项默认按钮类型 |
| `size` | `'small' \| 'default' \| 'large'` | `'small'` | 子项默认尺寸 |
| `text` | `boolean` | `true` | 子项默认是否文本模式 |
| `circle` | `boolean` | `false` | 子项默认是否圆形 |
| `loading` | `boolean` | `false` | 子项默认是否加载中 |

## Emits

无。

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 放置 `UAction` 子项。子项之间自动添加分隔符 |

## Exposed

```ts
interface ActionGroupExposed {
  closeTip: () => void
}
```

| 方法 | 签名 | 说明 |
|------|------|------|
| `closeTip` | `() => void` | 关闭下拉菜单 |

## Examples

### 基础操作组

```vue
<u-action-group :max="4">
  <u-action @run="handleView">查看</u-action>
  <u-action @run="handleEdit">编辑</u-action>
  <u-action need-confirm type="danger" @run="handleDelete">删除</u-action>
</u-action-group>
```

### 统一默认样式 + 单独覆盖

```vue
<u-action-group type="info" size="default" :text="false">
  <u-action @run="handleCopy">复制</u-action>
  <u-action @run="handlePaste">粘贴</u-action>
  <!-- 覆盖组默认值 -->
  <u-action type="danger" @run="handleRemove">移除</u-action>
</u-action-group>
```

### 在表格操作列中使用

```vue
<u-table :columns="columns" :data="data" row-key="id">
  <template #column:action="{ row }">
    <u-action-group :max="3">
      <u-action @run="handleEdit(row)">编辑</u-action>
      <u-action @run="handleDetail(row)">详情</u-action>
      <u-action need-confirm type="danger" @run="handleDelete(row)">删除</u-action>
      <u-action @run="handleCopy(row)">复制</u-action>
    </u-action-group>
  </template>
</u-table>

<script setup>
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称' },
  { key: 'action', name: '操作', width: 200, align: 'center' }
])
</script>
```

### 始终在下拉菜单 + 圆形图标（`@veltra/icons`）

```vue
<u-action-group circle>
  <u-action type="primary" :icon="Edit" @run="handleEdit">
    {{ '' }}
  </u-action>
  <!-- in-dropdown 强制收纳到下拉，方便在紧凑场景隐藏次常用操作 -->
  <u-action type="danger" :icon="Delete" in-dropdown @run="handleDelete">
    {{ '' }}
  </u-action>
</u-action-group>
```

### 手动关闭下拉菜单

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { ActionGroupExposed } from '@veltra/desktop'

const groupRef = useTemplateRef<ActionGroupExposed>('group')

const handleRun = () => {
  // ... 执行操作后关闭下拉
  groupRef.value?.closeTip()
}
</script>

<template>
  <u-action-group ref="group" :max="2">
    <u-action @run="handleRun">操作一</u-action>
    <u-action @run="handleRun">操作二</u-action>
    <u-action @run="handleRun">操作三</u-action>
  </u-action-group>
</template>
```
