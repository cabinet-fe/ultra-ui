# UTabs / UTabsHorizontal / UTabsVertical — 标签页

> `import type { TabsProps, TabsEmits, TabsExposed, TabItem } from '@veltra/desktop'`

`UTabs` 为组合版（tab 栏 + 内容面板）。`UTabsHorizontal` / `UTabsVertical` 为仅有 tab 栏的独立组件，适合自管内容（如后台路由栏）。

## Import

```ts
// UTabs / UTabsHorizontal / UTabsVertical 由 Vite 自动导入，无需手动 import
import type { TabItem } from '@veltra/desktop'
```

## 关联类型

```ts
interface TabItem {
  key: string // 唯一标识，同时是内容面板 slot 名
  name?: string // 标题，不传则用 key
  disabled?: boolean
  closable?: boolean // 单项级覆盖，未设置时沿用组件级 closable
}
```

## UTabs Props

| prop         | type                                     | default     | 说明                                                   |
| ------------ | ---------------------------------------- | ----------- | ------------------------------------------------------ |
| `modelValue` | `string`                                 | —           | 当前激活的 tab key                                     |
| `items`      | `TabItem[]`                              | **必填**    | 标签项                                                 |
| `size`       | `'small' \| 'default' \| 'large'`        | `'default'` | 尺寸                                                   |
| `closable`   | `boolean`                                | `false`     | 默认所有项可关闭（被 item 级 `closable` 覆盖）         |
| `block`      | `boolean`                                | `false`     | 填充父容器宽度（仅 `position` 为 `top`/`bottom` 生效） |
| `rounded`    | `boolean`                                | `false`     | 圆角胶囊风格                                           |
| `position`   | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`     | 显示位置                                               |
| `keepAlive`  | `boolean`                                | `false`     | 切换时缓存已渲染面板                                   |

## UTabs Emits

| event               | 参数                             | 说明     |
| ------------------- | -------------------------------- | -------- |
| `update:modelValue` | `(value: string)`                | 激活变更 |
| `click`             | `(item: TabItem, index: number)` | 点击标签 |
| `close`             | `(item: TabItem, index: number)` | 关闭标签 |

## UTabs Slots

**动态命名 slot**：每个 `TabItem.key` 对应一个同名 slot（作用域 `{ key: string }`）作为内容面板。不提供 slot 则不渲染内容区。

## UTabsHorizontal / UTabsVertical Props

仅 `position` 取值范围与 `UTabs` 不同：

- `UTabsHorizontal`：`position?: 'top' | 'bottom'`，支持 `block`
- `UTabsVertical`：`position?: 'left' | 'right'`，无 `block`

其余 props（`modelValue` / `items` / `size` / `closable` / `rounded`）与 emits（`update:modelValue` / `click` / `close`）均与 `UTabs` 一致。两者无 `keepAlive`、无内容 slot。

## Examples

### 基础 + 可关闭 + 保活

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const items = ref<TabItem[]>([
  { key: 'home', name: '首页', closable: false },
  { key: 'user', name: '用户管理' },
  { key: 'order', name: '订单中心' }
])

function onClose(item: TabItem, index: number) {
  items.value.splice(index, 1)
  if (active.value === item.key) active.value = items.value[0]?.key ?? ''
}
</script>

<template>
  <u-tabs :items="items" v-model="active" closable keep-alive rounded @close="onClose">
    <template #home>首页内容</template>
    <template #user>用户管理内容</template>
    <template #order>订单中心内容</template>
  </u-tabs>
</template>
```

### 垂直标签页

```vue
<u-tabs :items="items" v-model="active" position="left" rounded>
  <template #general>通用设置</template>
  <template #security>安全设置</template>
</u-tabs>
```

### 独立水平栏（后台路由栏）

```vue
<u-tabs-horizontal :items="barItems" v-model="active" rounded closable block @close="onClose" />
```
