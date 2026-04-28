# UTabs — 标签页

> `import type { TabsProps, TabsExposed } from '@veltra/desktop'`

组合版标签页（tab 栏 + 内容面板）、独立水平/垂直标签栏。

## Import

```ts
import { UTabs, UTabsHorizontal, UTabsVertical } from '@veltra/desktop'
// 类型
import type { TabItem } from '@veltra/desktop'
```

## TabItem

```ts
interface TabItem {
  key: string          // 唯一标识（对应 slot 名）
  name?: string        // 显示名（不传则以 key 为名）
  disabled?: boolean   // 禁用
  closable?: boolean   // 单个标签可关闭
}
```

## UTabs Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | — | 当前激活的标签 key |
| `items` | `TabItem[]` | **必填** | 标签项 |
| `closable` | `boolean` | `false` | 可关闭 |
| `block` | `boolean` | `false` | 填充宽度 |
| `rounded` | `boolean` | `false` | 圆角胶囊风格 |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 位置 |
| `keepAlive` | `boolean` | `false` | 保活内容面板 |
| `size` | `ComponentSize` | — | 尺寸 |

## Emits

| event | 参数 |
|-------|------|
| `update:modelValue` | `(value: string)` |
| `click` | `(item: TabItem, index: number)` |
| `close` | `(item: TabItem, index: number)` |

## Examples

### 基础标签页

```vue
<script setup>
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('tabA')
const items: TabItem[] = [
  { key: 'tabA', name: '标签A' },
  { key: 'tabB', name: '标签B', disabled: true },
  { key: 'tabC', name: '标签C', closable: true }
]
</script>

<template>
  <u-tabs :items="items" v-model="active" keep-alive>
    <template #tabA><p>面板 A</p></template>
    <template #tabB><p>面板 B</p></template>
    <template #tabC><p>面板 C</p></template>
  </u-tabs>
</template>
```

### 不同位置 + 圆角

```vue
<u-tabs :items="items" v-model="active" position="left" rounded />

<u-tabs :items="items" v-model="active" position="bottom" closable @close="onClose" />
```

### 独立水平标签栏（后台系统路由标签栏）

```vue
<script setup>
import { ref } from 'vue'
import { UTabsHorizontal } from '@veltra/desktop'

const barItems = [
  { key: 'home', name: '首页' },
  { key: 'user', name: '用户管理' },
  { key: 'order', name: '订单中心' }
]
const barActive = ref('home')

function onClose(item) {
  const idx = barItems.findIndex(i => i.key === item.key)
  if (idx >= 0) {
    barItems.splice(idx, 1)
    if (barActive.value === item.key) barActive.value = barItems[0]?.key ?? ''
  }
}
</script>

<template>
  <u-tabs-horizontal
    :items="barItems"
    v-model="barActive"
    rounded
    closable
    @close="onClose"
  />
</template>
```

### 对话框内使用

```vue
<u-dialog v-model="visible">
  <u-tabs :items="tabItems" v-model="active" keep-alive :style="{ height: '240px' }">
    <template #general><p>通用</p></template>
    <template #security><p>安全</p></template>
  </u-tabs>
</u-dialog>
```
