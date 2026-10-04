---
title: 'UTabs 标签页（@veltra/mobile 移动端）'
description: '@veltra/mobile 导出的标签页组件：单组件渲染标签栏 + 内容面板，position 支持 top/bottom/left/right 四向布局；溢出标签栏触屏滑动滚动（scroll-snap），活动标签自动滚入视野，标签项触控热区不小于 44px；面板用与 TabItem.key 同名的具名插槽提供，支持动态增删与 KeepAlive 保活。'
aliases: [UTabs, Tabs, TabPane, 页签, 选项卡, 标签栏, 移动端标签页]
keywords:
  [
    modelValue,
    TabItem,
    closable,
    keepAlive,
    position,
    block,
    rounded,
    close,
    页签,
    选项卡,
    动态增删,
    触屏滑动,
    scroll-snap,
    溢出滚动,
    面板缓存,
    胶囊风格,
    底部标签栏
  ]
---

# UTabs 标签页（@veltra/mobile 移动端）

`@veltra/mobile` 导出 `UTabs` 一个组件：渲染标签栏 + 内容面板，页签数据由 `items` 提供，面板内容由与 `TabItem.key` 同名的具名插槽提供；`position` 支持 `top` / `bottom` / `left` / `right` 四向布局。标签栏溢出时触屏滑动滚动，活动标签自动滚入视野。`@veltra/mobile` 只有这一个标签页组件，没有桌面端的独立水平 / 垂直标签栏子组件——只要标签栏、不含内容区的场景用本组件不传面板插槽即可。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabs } from '@veltra/mobile'
import type { TabItem } from '@veltra/mobile'
import '@veltra/mobile/components/tabs/style'

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

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件样式按需引入：`import '@veltra/mobile/components/tabs/style'`。

## API 签名

```ts
import type { ComponentSize } from '@veltra/utils'

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

/** 单个页签 */
export type TabItem = {
  /** 标题名称；不传则以 key 作为标题 */
  name?: string
  /** 页签唯一标识；同时是内容面板的插槽名 */
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
  /** 是否填充父容器宽度；仅 position 为 top/bottom 时生效。默认 false */
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
```

插槽：

- 具名插槽：插槽名等于 `TabItem.key`，作用域为 `{ key: string }`，提供该页签的面板内容；没有与激活 key 对应的插槽时不渲染面板。
- 默认插槽：作用域 `{ item: TabItem; index: number }`，用于统一自定义每个标签项的渲染，缺省渲染 `item.name ?? item.key` 文本。

## 参数说明

| 参数                      | 类型                                     | 默认        | 必填 | 约束                                                       |
| ------------------------- | ---------------------------------------- | ----------- | :--: | ---------------------------------------------------------- |
| `v-model`（`modelValue`） | `string`                                 | —           |  否  | 值必须是 `items` 中某项的 `key`；点击页签时写回该 `key`    |
| `items`                   | `TabItem[]`                              | —           |  是  | 每项必须有 `key`；`name` 缺省时标题显示 `key`              |
| `closable`                | `boolean`                                | `false`     |  否  | 组件级默认；`TabItem.closable` 优先级更高                  |
| `block`                   | `boolean`                                | `false`     |  否  | 仅 `position` 为 `top`/`bottom` 生效；标签栏背景铺满父容器宽度，页签自身宽度不变 |
| `rounded`                 | `boolean`                                | `false`     |  否  | 圆角胶囊风格；水平布局时容器也变胶囊，垂直布局容器保持常规圆角 |
| `position`                | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`     |  否  | 四向布局；`bottom` 时标签栏在内容下方                      |
| `keepAlive`               | `boolean`                                | `false`     |  否  | `true` 时面板包在 `KeepAlive` 中，切走再切回保留内部状态   |
| `size`                    | `'small' \| 'default' \| 'large'`        | `'default'` |  否  | 移动端未传时固定 `'default'`，不读取全局配置               |

## 方法与事件

| 事件                | payload                        | 触发时机                                                 |
| ------------------- | ------------------------------ | -------------------------------------------------------- |
| `update:modelValue` | `value: string`                | 点击非禁用页签后，先于 `click`                           |
| `click`             | `item: TabItem, index: number` | 点击非禁用页签；禁用项点击无任何事件                     |
| `close`             | `item: TabItem, index: number` | 点击页签上的关闭按钮；仅非禁用且可关闭的页签显示关闭按钮 |

- `close` 只通知、不改数据：组件不会从 `items` 删除该页签，也不会更新 `modelValue`，删除与切换激活页签必须在自己的 `close` 处理函数里完成。
- 面板始终渲染在 `div.um-tabs__content` 容器内，切换时 `fade out-in` 过渡；组件未 `defineExpose` 任何方法。

标签栏滚动行为（源码 `tabs.vue` + `style.scss`）：

- 页签总宽（高）超出标签栏时，标签栏出现溢出滚动：水平布局 `overflow-x: auto` + `scroll-snap-type: x proximity`，垂直布局 `overflow-y: auto` + `scroll-snap-type: y proximity`；滚动条隐藏，页签 `scroll-snap-align: center`。
- 挂载时、`modelValue` 变化或 `items` 变化后，活动页签 `scrollIntoView` 平滑滚入视野：水平布局在滚动轴居中，垂直布局在纵向居中。
- 没有桌面端的左右导航箭头按钮，也没有鼠标滚轮转横向滚动；滚动只经触屏滑动 / 触控板（移动端无指针悬停交互）。

## 典型示例

### 可关闭的动态页签

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabs } from '@veltra/mobile'
import type { TabItem } from '@veltra/mobile'
import '@veltra/mobile/components/tabs/style'

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
  active.value = key // => 新页签创建后立即激活并滚入视野
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
  <button @click="addTab">新增页签</button>
  <u-tabs v-model="active" :items="items" closable @close="onClose">
    <template v-for="item in items" :key="item.key" #[item.key]>
      {{ item.name }} 面板
    </template>
  </u-tabs>
</template>
```

### 底部标签栏与胶囊风格

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabs } from '@veltra/mobile'
import type { TabItem } from '@veltra/mobile'
import '@veltra/mobile/components/tabs/style'

const active = ref('feed')
const items: TabItem[] = [
  { key: 'feed', name: '动态' },
  { key: 'msg', name: '消息' },
  { key: 'me', name: '我的' }
]
</script>

<template>
  <!-- position="bottom"：标签栏在内容下方；rounded block：胶囊风格铺满宽度 -->
  <u-tabs v-model="active" :items="items" position="bottom" rounded block>
    <template #feed>动态流</template>
    <template #msg>消息列表</template>
    <template #me>个人中心</template>
  </u-tabs>
</template>
```

### 竖向标签栏 + 默认插槽自定义标签项

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabs } from '@veltra/mobile'
import type { TabItem } from '@veltra/mobile'
import '@veltra/mobile/components/tabs/style'

const active = ref('home')
const items: TabItem[] = [
  { key: 'home', name: '首页' },
  { key: 'user', name: '用户管理', disabled: true },
  { key: 'order', name: '订单中心' }
]
</script>

<template>
  <div style="display: flex; gap: 12px">
    <!-- position="left"：竖向标签栏；不传面板插槽即纯标签栏 -->
    <u-tabs v-model="active" :items="items" position="left">
      <template #default="{ item, index }">
        <span>{{ index + 1 }}. {{ item.name }}</span>
      </template>
    </u-tabs>
    <p style="flex: 1">当前激活：{{ active }}</p>
  </div>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是 `UTabs` 单组件四向 `position`；桌面端的独立水平 / 垂直标签栏子组件在 `@veltra/mobile` 不存在。需要纯标签栏时不传 `key` 具名插槽即可。
> - 移动端溢出标签栏是触屏滑动滚动 + `scroll-snap` + 活动项自动滚入视野；桌面端是左右导航箭头按钮 + 鼠标滚轮横向滚动。移动端没有导航箭头。
> - 移动端标签项触控热区不小于 44×44（`min-height: max(--u-form-component-height-<size>, 44px)`、`min-width: 44px`）；关闭按钮 `closable` 时常显（移动端无 hover），宽 44px、高度随页签拉伸。
> - 移动端面板内容始终包在 `div.um-tabs__content` 中；桌面端仅在插槽内容为多个根节点时才包进滚动容器，单根不包——移动端没有该滚动包装层。
> - 移动端 `UTabs` 的默认插槽（作用域 `{ item, index }`）用于自定义标签项；桌面端 `UTabs` 的该默认插槽能力属于独立标签栏子组件，不随 `UTabs` 本体提供。
> - 页签内容面板是具名插槽（名称 = `TabItem.key`），不是 `items` 里的 `content` 字段；本库没有 `lazy` / `label` 属性，标题用 `TabItem.name`。
> - `close` 事件不会删除页签：必须在自己的处理函数里从 `items` 移除并处理 `modelValue`，否则页签仍在。
> - 禁用页签（`disabled: true`）点击无事件，且不显示关闭按钮，即使设置了 `closable`。
> - `block` 仅对水平标签栏生效，`position: left`/`right` 时设置无效。
> - 移动端 `size` 未传时固定 `'default'`，不读取全局尺寸配置。
> - 移动端按需样式路径是 `@veltra/mobile/components/tabs/style`，不是 `@veltra/desktop/components/tabs/style`。

## 常见问题

### 点击关闭按钮页签没有消失

原因：`close` 事件只通知，组件不改 `items`。修复：在处理函数里自己删除并维护激活 key：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTabs } from '@veltra/mobile'
import type { TabItem } from '@veltra/mobile'
import '@veltra/mobile/components/tabs/style'

const active = ref('a')
const items = ref<TabItem[]>([
  { key: 'a', name: 'A' },
  { key: 'b', name: 'B' }
])

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

### 溢出的页签找不到、看不到滚动条

原因：移动端滚动条是隐藏的（`scrollbar-width: none`），溢出页签需触屏滑动标签栏查看；活动页签在 `modelValue` / `items` 变化时会自动滚入视野居中。修复：在标签栏上横向（垂直布局纵向）滑动，或直接切换激活项让其自动滚入。
