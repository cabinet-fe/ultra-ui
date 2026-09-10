---
title: "UTabs / UTabsHorizontal / UTabsVertical 标签页"
description: "标签页组件：UTabs 渲染标签栏加内容面板，面板用与 TabItem.key 同名的具名插槽提供；UTabsHorizontal / UTabsVertical 是只有标签栏的轻量版。支持动态增删页签、溢出滚动箭头、KeepAlive 面板保活与胶囊风格。"
aliases: [Tabs, TabPane, ElTabs, 页签, 选项卡, 标签栏]
keywords:
  - modelValue
  - TabItem
  - closable
  - keepAlive
  - position
  - block
  - rounded
  - close
  - 页签
  - 选项卡
  - 动态增删
  - 溢出滚动
  - 路由标签栏
  - 面板缓存
  - 内容面板
  - 胶囊风格
---

# UTabs / UTabsHorizontal / UTabsVertical 标签页

`@veltra/desktop` 导出 `UTabs`、`UTabsHorizontal`、`UTabsVertical`。`UTabs` 渲染标签栏 + 内容面板，页签数据由 `items` 提供，面板内容由与 `TabItem.key` 同名的具名插槽提供；`UTabsHorizontal` / `UTabsVertical` 只有标签栏、不含内容区，适合自定义内容区或后台路由标签栏。需要承载内容面板的多视图切换用本组件；只是切换一个值（如列表视图维度，选中后联动刷新数据）不需要内容区时用 `USegment` 分段控制器。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabs } from '@veltra/desktop'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const items: TabItem[] = [
  { key: 'home', name: '首页' },
  { key: 'order', name: '订单' }
]
</script>

<template>
  <!-- 面板插槽名 = TabItem.key -->
  <u-tabs v-model="active" :items="items">
    <template #home>首页内容</template>
    <template #order>订单内容</template>
  </u-tabs>
  <!-- => 点击「订单」后 active 为 'order'，显示订单内容 -->
</template>
```

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

/** 单个页签 */
export type TabItem = {
  /** 标题名称；不传则以 key 作为标题 */
  name?: string
  /** 页签唯一标识；同时是 UTabs 内容面板的插槽名 */
  key: string
  /** 是否禁用；禁用后点击无事件、不显示关闭按钮 */
  disabled?: boolean
  /** 单个页签是否可关闭；未设置时沿用组件级 closable */
  closable?: boolean
}

/** 标签页（标签栏 + 内容面板）属性 */
export interface TabsProps extends ComponentProps {
  /** 当前激活的标签 key，v-model 绑定 */
  modelValue?: string
  /** 标签项。必填 */
  items: TabItem[]
  /** 是否可关闭，作为未显式设置 closable 的 TabItem 的默认值。默认 false */
  closable?: boolean
  /** 标签栏是否填充父容器宽度；仅 position 为 top/bottom 时生效。默认 false */
  block?: boolean
  /** 是否开启圆角胶囊风格。默认 false */
  rounded?: boolean
  /** 标签栏位置。默认 'top' */
  position?: 'left' | 'right' | 'top' | 'bottom'
  /** 是否用 KeepAlive 缓存面板状态。默认 false */
  keepAlive?: boolean
}

/** 标签页事件 */
export interface TabsEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

/** 水平标签栏（position: top/bottom）属性；不含内容面板 */
export interface TabsHorizontalProps {
  size?: ComponentSize
  modelValue?: string
  items: TabItem[]
  closable?: boolean
  block?: boolean
  rounded?: boolean
  /** 仅 'top' | 'bottom'。默认 'top' */
  position?: 'top' | 'bottom'
}

/** 垂直标签栏（position: left/right）属性；不含内容面板 */
export interface TabsVerticalProps {
  size?: ComponentSize
  modelValue?: string
  items: TabItem[]
  closable?: boolean
  rounded?: boolean
  /** 仅 'left' | 'right'。默认 'left' */
  position?: 'left' | 'right'
}
```

插槽：

- `UTabs`：任意具名插槽，插槽名等于 `TabItem.key`，作用域为 `{ key: string }`；没有与激活 key 对应的插槽时不渲染面板。
- `UTabsHorizontal` / `UTabsVertical`：默认插槽，作用域 `{ item: TabItem; index: number }`，用于统一自定义每个标签的渲染。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model`（`modelValue`） | `string` | — | 否 | 值必须是 `items` 中某项的 `key`；点击页签时写回该 `key` |
| `items` | `TabItem[]` | — | 是 | 每项必须有 `key`；`name` 缺省时标题显示 `key` |
| `closable` | `boolean` | `false` | 否 | 组件级默认；`TabItem.closable` 优先级更高 |
| `block` | `boolean` | `false` | 否 | 仅 `position` 为 `top`/`bottom` 生效；标签栏背景铺满父容器宽度，页签自身宽度不变 |
| `rounded` | `boolean` | `false` | 否 | 圆角胶囊风格 |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 否 | `UTabs` 四个值均可；`UTabsHorizontal` 仅 `top`/`bottom`；`UTabsVertical` 仅 `left`/`right` |
| `keepAlive` | `boolean` | `false` | 否 | `true` 时面板包在 `KeepAlive` 中，切走再切回保留内部状态 |
| **继承自 `ComponentProps`** | | | | |
| `size` | `ComponentSize` | `'default'` | 否 | `'small'` \| `'default'` \| `'large'` |

## 方法与事件

三个组件事件一致（`TabsEmits`）：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: string` | 点击非禁用页签后，先于 `click` |
| `click` | `item: TabItem, index: number` | 点击非禁用页签；禁用项点击无任何事件 |
| `close` | `item: TabItem, index: number` | 点击页签上的关闭按钮；仅非禁用且可关闭的页签显示关闭按钮 |

- `close` 只通知、不改数据：组件不会从 `items` 删除该页签，也不会更新 `modelValue`，删除与切换激活页签必须在自己的 `close` 处理函数里完成。
- 组件未 `defineExpose` 任何方法，模板 `ref` 上无可调用属性。

溢出滚动行为（仅 `UTabsHorizontal`，即 `position` 为 `top`/`bottom` 时）：

- 页签总宽超出标签栏时自动显示左/右箭头按钮，点击按视口宽度 80% 的步长平滑滚动。
- 鼠标滚轮纵向滚动转换为标签栏横向滚动；触控板横向滑动不拦截。
- `modelValue` 变化或 `items` 变化后，激活页签自动滚入视野。
- `UTabsVertical`（`position` 为 `left`/`right`）没有滚动箭头与滚轮处理。

## 典型示例

### 可关闭的动态页签

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabs } from '@veltra/desktop'
import type { TabItem } from '@veltra/desktop'

const active = ref('t1')
let seq = 3
const items = ref<TabItem[]>([
  { key: 't1', name: '监控' },
  { key: 't2', name: '报表', closable: true },
  { key: 't3', name: '设置' }
])

function addTab() {
  const key = `t${++seq}`
  items.value.push({ key, name: `任务 ${seq}`, closable: true })
  active.value = key // => 新页签创建后立即激活
}

function onClose(item: TabItem, index: number) {
  // close 事件只通知，删除与切换必须自己做
  items.value.splice(index, 1)
  if (active.value === item.key) {
    active.value = items.value[0]?.key ?? ''
  }
}
</script>

<template>
  <u-tabs v-model="active" :items="items" closable @close="onClose">
    <template #t1>监控面板</template>
    <template #t2>报表面板</template>
    <template #t3>设置面板</template>
  </u-tabs>
</template>
```

### 保活面板与溢出滚动

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabs } from '@veltra/desktop'
import type { TabItem } from '@veltra/desktop'

const active = ref('t01')
// 页签足够多时标签栏溢出，自动出现左右箭头
const items: TabItem[] = Array.from({ length: 15 }, (_, i) => ({
  key: `t${String(i + 1).padStart(2, '0')}`,
  name: `标签页 ${String(i + 1).padStart(2, '0')}`
}))
</script>

<template>
  <!-- keep-alive：切走再切回，输入框内容等内部状态保留 -->
  <u-tabs v-model="active" :items="items" keep-alive>
    <template v-for="item in items" :key="item.key" #[item.key]>
      <input :placeholder="item.name" />
    </template>
  </u-tabs>
</template>
```

### 独立标签栏（无内容面板）

`UTabsHorizontal` / `UTabsVertical` 只渲染标签栏，内容区自己排；默认插槽可统一自定义标签渲染。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabsHorizontal, UTabsVertical } from '@veltra/desktop'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const items = ref<TabItem[]>([
  { key: 'home', name: '首页' },
  { key: 'user', name: '用户管理', disabled: true },
  { key: 'order', name: '订单中心' }
])

function onClose(item: TabItem) {
  items.value = items.value.filter((tab) => tab.key !== item.key)
  if (active.value === item.key) active.value = items.value[0]?.key ?? ''
}
</script>

<template>
  <u-tabs-horizontal
    v-model="active"
    :items="items"
    closable
    block
    @close="onClose"
  >
    <template #default="{ item, index }">
      <span>{{ index + 1 }}. {{ item.name }}</span>
    </template>
  </u-tabs-horizontal>
  <u-tabs-vertical v-model="active" :items="items" position="left" rounded />
  <!-- => 两个标签栏共享同一份 items 与 active，状态同步 -->
</template>
```

## 注意事项

> [!WARNING]
> - 页签内容面板是具名插槽（名称 = `TabItem.key`），不是 `items` 里的 `content` 字段；本库没有 `lazy` / `label` 属性，标题用 `TabItem.name`。
> - `close` 事件不会删除页签：必须在自己的处理函数里从 `items` 移除并处理 `modelValue`，否则页签仍在。
> - `UTabs` 的面板插槽渲染多个根节点时，内容会自动包进 `UScroll`（`tabs__content` 类）获得滚动；单个根节点不包。
> - 溢出滚动箭头仅水平方向（`position: top`/`bottom`）有；`left`/`right` 溢出时无箭头。
> - 禁用页签（`disabled: true`）点击无事件，且不显示关闭按钮，即使设置了 `closable`。
> - `block` 仅对水平标签栏生效，`position: left`/`right` 时设置无效。
> - 本库是 `UTabs` 单组件四向 `position`，不是 Element Plus 的 `ElTabs` + `ElTabPane` 子组件模式；也没有 `type` / `tab-position` 属性，位置用 `position`，风格用 `rounded`。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 点击关闭按钮页签没有消失

原因：`close` 事件只通知，组件不改 `items`。修复：在处理函数里自己删除并维护激活 key：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabs } from '@veltra/desktop'
import type { TabItem } from '@veltra/desktop'

const active = ref('a')
const items = ref<TabItem[]>([{ key: 'a', name: 'A' }, { key: 'b', name: 'B' }])

function onClose(item: TabItem, index: number) {
  items.value.splice(index, 1)
  if (active.value === item.key) active.value = items.value[0]?.key ?? ''
}
</script>

<template>
  <u-tabs v-model="active" :items="items" closable @close="onClose">
    <template #a>A 面板</template>
    <template #b>B 面板</template>
  </u-tabs>
</template>
```

### 切换页签后输入框内容丢失

原因：`keepAlive` 未开启，每次切换重新渲染面板。修复：加 `keep-alive`：

```vue
<template>
  <u-tabs v-model="active" :items="items" keep-alive>
    <template #form><input placeholder="切走后内容保留" /></template>
  </u-tabs>
</template>
```
