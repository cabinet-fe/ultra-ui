# UTabs — 标签页

> `import type { TabsProps, TabsEmits, TabsExposed, TabItem } from '@veltra/desktop'`

组合版标签页（tab 栏 + 内容面板），支持水平/垂直布局、可关闭、保活。同时提供独立的 `UTabsHorizontal`、`UTabsVertical` 子组件用于仅需标签栏的场景。

> [!NOTE]
> 从 `1.1.6` 开始，内容面板切换时的过渡动画简化为了全局统一的**淡入淡出（fade）**动画（通过引入 `@veltra/styles/anime/fade.scss` 驱动），不再使用原有的滑动过渡。这有效消除了复杂嵌套场景中的渲染卡顿与首帧抖动，使视觉切换更加顺畅轻巧。

## Import

```ts
// UTabs、UTabsHorizontal、UTabsVertical 由 Vite 自动导入，无需手动 import
import type { TabItem } from '@veltra/desktop'
```

### TabItem 类型

```ts
interface TabItem {
  /** 标题名称。不传则以 key 为名称 */
  name?: string
  /** 标签页唯一标识，同时对应内容面板的 slot 名 */
  key: string
  /** 是否禁用 */
  disabled?: boolean
  /**
   * 单个标签是否可关闭
   * 未显式设置时，沿用组件级 `closable` 属性
   */
  closable?: boolean
}
```

## UTabs Props

| prop         | type                                     | default     | 说明                                                                                                                        |
| ------------ | ---------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `modelValue` | `string`                                 | —           | 当前激活的标签 key                                                                                                          |
| `items`      | `TabItem[]`                              | **必填**    | 标签项                                                                                                                      |
| `size`       | `'small' \| 'default' \| 'large'`        | `'default'` | 组件尺寸                                                                                                                    |
| `closable`   | `boolean`                                | `false`     | 是否可关闭，作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮                                             |
| `block`      | `boolean`                                | `false`     | 是否填充父容器宽度，仅在 `position` 为 `top` / `bottom` 时生效；开启时 header 容器占满父容器宽度，tab-item 自身宽度保持不变 |
| `rounded`    | `boolean`                                | `false`     | 是否开启圆角胶囊风格                                                                                                        |
| `position`   | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`     | 显示位置                                                                                                                    |
| `keepAlive`  | `boolean`                                | `false`     | 是否保活内容面板，切换标签时缓存已渲染面板                                                                                  |

## UTabs Emits

| event               | 参数                             | 说明               |
| ------------------- | -------------------------------- | ------------------ |
| `update:modelValue` | `(value: string)`                | 切换激活标签时触发 |
| `click`             | `(item: TabItem, index: number)` | 点击标签项时触发   |
| `close`             | `(item: TabItem, index: number)` | 关闭标签项时触发   |

## UTabs Slots

Tabs 使用**动态命名 slot**：每个 tab item 的 `key` 值即为对应的内容面板 slot 名。组件通过 `slots[key]` 查找并渲染到内容区域。

| slot    | 作用域            | 说明                                                                                 |
| ------- | ----------------- | ------------------------------------------------------------------------------------ |
| `[key]` | `{ key: string }` | 每个 tab item 对应一个同名 slot，作为其内容面板；若不提供任何 slot，则不渲染内容区域 |

## UTabs Exposed

```ts
interface TabsExposed {
  // 当前无暴露的属性和方法
}
```

---

## UTabsHorizontal Props

独立水平标签栏组件。适用于仅需 tab 头部栏、自行管理内容区的场景（如后台系统路由标签栏）。

| prop         | type                              | default  | 说明                                                                            |
| ------------ | --------------------------------- | -------- | ------------------------------------------------------------------------------- |
| `modelValue` | `string`                          | —        | 当前激活的标签 key                                                              |
| `items`      | `TabItem[]`                       | **必填** | 标签项                                                                          |
| `size`       | `'small' \| 'default' \| 'large'` | —        | 组件尺寸                                                                        |
| `closable`   | `boolean`                         | `false`  | 是否可关闭，作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮 |
| `block`      | `boolean`                         | `false`  | 是否填充父容器宽度，开启时 header 容器占满父容器宽度，tab-item 自身宽度保持不变 |
| `rounded`    | `boolean`                         | `false`  | 是否开启圆角胶囊风格                                                            |
| `position`   | `'top' \| 'bottom'`               | `'top'`  | 位置                                                                            |

## UTabsHorizontal Emits

| event               | 参数                             | 说明               |
| ------------------- | -------------------------------- | ------------------ |
| `update:modelValue` | `(value: string)`                | 切换激活标签时触发 |
| `click`             | `(item: TabItem, index: number)` | 点击标签项时触发   |
| `close`             | `(item: TabItem, index: number)` | 关闭标签项时触发   |

---

## UTabsVertical Props

独立垂直标签栏组件。

| prop         | type                              | default  | 说明                                                                            |
| ------------ | --------------------------------- | -------- | ------------------------------------------------------------------------------- |
| `modelValue` | `string`                          | —        | 当前激活的标签 key                                                              |
| `items`      | `TabItem[]`                       | **必填** | 标签项                                                                          |
| `size`       | `'small' \| 'default' \| 'large'` | —        | 组件尺寸                                                                        |
| `closable`   | `boolean`                         | `false`  | 是否可关闭，作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮 |
| `rounded`    | `boolean`                         | `false`  | 是否开启圆角胶囊风格                                                            |
| `position`   | `'left' \| 'right'`               | `'left'` | 位置                                                                            |

## UTabsVertical Emits

| event               | 参数                             | 说明               |
| ------------------- | -------------------------------- | ------------------ |
| `update:modelValue` | `(value: string)`                | 切换激活标签时触发 |
| `click`             | `(item: TabItem, index: number)` | 点击标签项时触发   |
| `close`             | `(item: TabItem, index: number)` | 关闭标签项时触发   |

---

## Examples

### 基础标签页

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('tabA')
const items: TabItem[] = [
  { key: 'tabA', name: '标签A' },
  { key: 'tabB', name: '标签B' },
  { key: 'tabC', name: '标签C' }
]
</script>

<template>
  <u-tabs :items="items" v-model="active">
    <template #tabA><p>面板 A</p></template>
    <template #tabB><p>面板 B</p></template>
    <template #tabC><p>面板 C</p></template>
  </u-tabs>
</template>
```

### 可关闭标签 + 保活

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const items = ref<TabItem[]>([
  { key: 'home', name: '首页', closable: false },
  { key: 'user', name: '用户管理' },
  { key: 'order', name: '订单中心' }
])

function onClose(item: TabItem, index: number) {
  items.value.splice(index, 1)
  if (active.value === item.key) {
    active.value = items.value[0]?.key ?? ''
  }
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
<template>
  <u-tabs :items="items" v-model="active" position="left" rounded>
    <template #general><p>通用设置</p></template>
    <template #security><p>安全设置</p></template>
    <template #notification><p>通知设置</p></template>
  </u-tabs>

  <u-tabs :items="items" v-model="active" position="right">
    <template #general><p>通用设置</p></template>
    <template #security><p>安全设置</p></template>
    <template #notification><p>通知设置</p></template>
  </u-tabs>
</template>
```

### 独立水平标签栏（后台系统路由标签栏）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const barItems = ref<TabItem[]>([
  { key: 'home', name: '首页' },
  { key: 'user', name: '用户管理' },
  { key: 'order', name: '订单中心' }
])

function onClose(item: TabItem, index: number) {
  barItems.value.splice(index, 1)
  if (active.value === item.key) {
    active.value = barItems.value[0]?.key ?? ''
  }
}
</script>

<template>
  <u-tabs-horizontal :items="barItems" v-model="active" rounded closable block @close="onClose" />
</template>
```

### 对话框内使用

```vue
<template>
  <u-dialog v-model="visible" title="设置">
    <u-tabs :items="tabItems" v-model="active" keep-alive :style="{ height: '240px' }">
      <template #general><p>通用</p></template>
      <template #security><p>安全</p></template>
      <template #about><p>关于</p></template>
    </u-tabs>
  </u-dialog>
</template>
```
